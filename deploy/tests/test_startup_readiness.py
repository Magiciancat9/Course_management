#!/usr/bin/env python3
"""D2-SYS-T01: measure an already built CI image; no GCP or production DB."""
import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


def run(image, expected_sha, output):
    database = urllib.parse.urlparse(os.environ.get('DATABASE_URL', ''))
    if (database.scheme not in ('postgres', 'postgresql') or
            database.hostname not in ('localhost', '127.0.0.1') or
            not re.fullmatch(r'/[A-Za-z0-9_]+_test', database.path)):
        raise RuntimeError('Startup check requires the disposable local CI test database.')
    if not re.fullmatch(r'[0-9a-f]{40}', expected_sha):
        raise RuntimeError('Expected full source SHA is required.')
    if not os.environ.get('JWT_SECRET'):
        raise RuntimeError('Explicit CI JWT_SECRET is required.')

    name = f'coursepms-startup-{os.getpid()}'
    base = 'http://127.0.0.1:18080'
    image_id = subprocess.check_output(
        ['docker', 'image', 'inspect', '--format', '{{.Id}}', image], text=True
    ).strip()
    started_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    # Includes container creation/start overhead, so this is stricter than
    # process-start timing. Image download/build is excluded.
    start = time.monotonic()
    try:
        subprocess.run([
            'docker', 'run', '--detach', '--name', name, '--network', 'host',
            '--env', 'DATABASE_URL', '--env', 'JWT_SECRET',
            '--env', 'NODE_ENV=production', '--env', 'PORT=18080', image,
        ], check=True, capture_output=True, text=True)
        while True:
            remaining = 10 - (time.monotonic() - start)
            if remaining <= 0:
                raise RuntimeError('NFR-05 FAIL: first valid health response exceeded 10 seconds.')
            try:
                with urllib.request.urlopen(base + '/api/health', timeout=min(0.5, remaining)) as response:
                    health = json.load(response)
                if health.get('status') != 'ok' or health.get('commitSha') != expected_sha:
                    raise RuntimeError('Unexpected health identity/status.')
                elapsed_ms = (time.monotonic() - start) * 1000
                if elapsed_ms > 10000:
                    raise RuntimeError('NFR-05 FAIL: first valid health response exceeded 10 seconds.')
                break
            except (urllib.error.URLError, TimeoutError):
                time.sleep(0.05)

        with urllib.request.urlopen(base + '/api/ready', timeout=3) as response:
            ready = json.load(response)
        if ready != {'status': 'ready', 'db': 'connected'}:
            raise RuntimeError('Container readiness did not confirm PostgreSQL connection.')
        with urllib.request.urlopen(base + '/', timeout=3) as response:
            if b'<html' not in response.read().lower():
                raise RuntimeError('Container did not serve the built client.')
        record = {
            'testId': 'D2-SYS-T01', 'result': 'PASS', 'startedAtUtc': started_at,
            'sourceSha': expected_sha, 'imageId': image_id, 'imageTag': image,
            'host': 'GitHub Actions ubuntu-latest, host-network Docker, PostgreSQL 16 CI',
            'elapsedMs': round(elapsed_ms, 2), 'limitMs': 10000,
            'timing': 'monotonic; before docker run to first valid HTTP 200 health; excludes build/download',
            'health': health, 'readiness': ready, 'html': 'PASS',
            'operator': 'Codex-operated automated CI; synthetic configuration; not a Cloud Run timing',
        }
        Path(output).parent.mkdir(parents=True, exist_ok=True)
        Path(output).write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(record))
    finally:
        subprocess.run(['docker', 'rm', '--force', name], capture_output=True)


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.exit('Usage: test_startup_readiness.py IMAGE FULL_SHA OUTPUT_JSON')
    run(*sys.argv[1:])
