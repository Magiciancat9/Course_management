"""Public deployment smoke checks for CoursePMS. Credentials/tokens are never printed.

WHAT THIS SCRIPT DOES
    Called by .github/workflows/deploy.yml after a deployment:
        python3 deploy/smoke_test.py SERVICE_URL
    It checks the live service and exits non-zero (failing the workflow) if any
    check fails. Each public check is retried up to 5 times, 3 seconds apart, to
    tolerate Cloud Run cold starts.

    Checks (in order)
      1. GET /api/health -> {"status": "ok", "service": "course-pms-api", ...}
                            (and verifies commitSha == EXPECTED_COMMIT_SHA when set)
      2. GET /api/ready  -> {"status": "ready", "db": "connected"} (proves DB works)
      3. GET /           -> HTML page (proves built React SPA is served)
      4. OPTIONAL login  -> POST /api/auth/login, GET /api/auth/me, GET /api/courses,
                            POST /api/auth/logout. Runs only if BOTH env vars
                            SMOKE_EMAIL and SMOKE_PASSWORD are set (set both or
                            neither). The session is always logged out in finally.

IMPORTANT
    Uses only the Python standard library (no pip install needed).
    Offline unit tests: deploy/tests/test_smoke.py
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request


def request(base, path, data=None, token=None):
    headers = {}
    if data is not None:
        headers['Content-Type'] = 'application/json'
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(
        base + path,
        headers=headers,
        data=json.dumps(data).encode() if data is not None else None,
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read()


def check_health(body):
    payload = json.loads(body)
    if payload.get('status') != 'ok' or payload.get('service') != 'course-pms-api':
        return False
    expected_sha = os.getenv('EXPECTED_COMMIT_SHA')
    if expected_sha and payload.get('commitSha') != expected_sha:
        return False
    return True


def check_ready(body):
    payload = json.loads(body)
    return payload.get('status') == 'ready' and payload.get('db') == 'connected'


def check(base):
    for path, predicate in (
        ('/api/health', check_health),
        ('/api/ready', check_ready),
        ('/', lambda b: b'<html' in b.lower()),
    ):
        for attempt in range(5):
            try:
                if not predicate(request(base, path)):
                    raise ValueError('Unexpected response')
                break
            except (urllib.error.URLError, TimeoutError, ValueError):
                if attempt == 4:
                    raise RuntimeError('Smoke check failed: ' + path) from None
                time.sleep(3)
        print('PASS ' + path)

    email, password = os.getenv('SMOKE_EMAIL'), os.getenv('SMOKE_PASSWORD')
    if bool(email) != bool(password):
        raise RuntimeError('Set both SMOKE_EMAIL and SMOKE_PASSWORD, or neither.')
    if not email:
        print('SKIP login: optional smoke credentials not configured')
        return
    token = None
    try:
        login = json.loads(
            request(base, '/api/auth/login', {'email': email, 'password': password})
        )
        token = login['token']
        me = json.loads(request(base, '/api/auth/me', token=token))
        if not isinstance(me.get('user'), dict):
            raise ValueError('Missing user in /api/auth/me')
        courses_payload = json.loads(request(base, '/api/courses', token=token))
        courses = courses_payload.get('courses')
        if not isinstance(courses, list) or len(courses) == 0:
            raise ValueError('Expected non-empty courses list')
        print('PASS login, authenticated /api/auth/me, and /api/courses')
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
        raise RuntimeError('Login smoke check failed') from None
    finally:
        if token:
            request(base, '/api/auth/logout', data={}, token=token)
            print('PASS logout')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Usage: python3 deploy/smoke_test.py SERVICE_URL')
    check(sys.argv[1].rstrip('/'))
