"""Offline unit tests for deploy/smoke_test.py (the network is mocked).

Run (repo root):  python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
CI runs it too (.github/workflows/ci-docker.yml).

Covers:
  - public checks pass + login skipped without credentials
  - EXPECTED_COMMIT_SHA verification on /api/health
  - a DB that is not ready fails even if HTTP answers
  - the session is logged out even if an authenticated check fails
"""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    'smoke', Path(__file__).parents[1] / 'smoke_test.py'
)
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SmokeTests(unittest.TestCase):
    def response(self, base, path, data=None, token=None):
        return {
            '/api/health': b'{"status":"ok","service":"course-pms-api","commitSha":"1111111111111111111111111111111111111111"}',
            '/api/ready': b'{"status":"ready","db":"connected"}',
            '/': b'<!doctype html><html><body>CoursePMS</body></html>',
            '/api/auth/login': b'{"token":"test-session"}',
            '/api/auth/me': b'{"user":{"id":1,"email":"smoke@example.test"}}',
            '/api/courses': b'{"courses":[{"id":1,"code":"CPE334"}]}',
            '/api/auth/logout': b'{"message":"Logged out successfully"}',
        }[path]

    @patch.dict('os.environ', {}, clear=True)
    def test_public_checks_pass_and_skip_optional_login(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            smoke.check('https://course-pms.test')
            self.assertEqual(req.call_count, 3)

    @patch.dict(
        'os.environ',
        {'EXPECTED_COMMIT_SHA': '2222222222222222222222222222222222222222'},
        clear=True,
    )
    def test_mismatched_commit_sha_fails_health_check(self):
        with patch.object(smoke, 'request', side_effect=self.response), patch.object(
            smoke.time, 'sleep'
        ):
            with self.assertRaisesRegex(RuntimeError, '/api/health'):
                smoke.check('https://course-pms.test')

    @patch.dict('os.environ', {}, clear=True)
    def test_db_not_ready_fails_even_when_http_responds(self):
        def disconnected(base, path, **kwargs):
            if path == '/api/ready':
                return b'{"status":"not_ready","db":"disconnected"}'
            return self.response(base, path)

        with patch.object(smoke, 'request', side_effect=disconnected), patch.object(
            smoke.time, 'sleep'
        ):
            with self.assertRaisesRegex(RuntimeError, '/api/ready'):
                smoke.check('https://course-pms.test')

    @patch.dict(
        'os.environ',
        {'SMOKE_EMAIL': 'smoke@example.test', 'SMOKE_PASSWORD': 'test-only'},
        clear=True,
    )
    def test_session_is_logged_out_even_if_me_fails(self):
        def broken_me(base, path, data=None, token=None):
            if path == '/api/auth/me':
                raise ValueError('Broken response')
            return self.response(base, path, data, token)

        with patch.object(smoke, 'request', side_effect=broken_me) as req:
            with self.assertRaisesRegex(RuntimeError, 'Login smoke'):
                smoke.check('https://course-pms.test')
            self.assertEqual(req.call_args.args[1], '/api/auth/logout')


if __name__ == '__main__':
    unittest.main()
