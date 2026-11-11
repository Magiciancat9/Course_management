"""Offline unit tests for deploy/smoke_test.py and deploy/verify_reviewed_commit.py.

Run (repo root):  python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
CI runs it too (.github/workflows/ci-docker.yml).

Covers:
  - public checks pass + login skipped without credentials
  - EXPECTED_COMMIT_SHA verification on /api/health
  - a DB that is not ready fails even if HTTP answers
  - the session is logged out even if an authenticated check fails
  - reviewed-PR commit verification rejects:
      * direct pushes without a merged main PR
      * commits that do not match the PR's merge_commit_sha or head.sha
      * self-approvals or post-approval CHANGES_REQUESTED
      * approvals bound to an older commit_id different from the merged PR head.sha
      * approvals submitted after merged_at
    and accepts a merged main PR with a pre-merge independent APPROVED review
    bound to the exact merged PR head commit SHA.
"""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

DEPLOY_DIR = Path(__file__).parents[1]

smoke_spec = importlib.util.spec_from_file_location('smoke', DEPLOY_DIR / 'smoke_test.py')
smoke = importlib.util.module_from_spec(smoke_spec)
smoke_spec.loader.exec_module(smoke)

verify_spec = importlib.util.spec_from_file_location(
    'verify_reviewed_commit', DEPLOY_DIR / 'verify_reviewed_commit.py'
)
verify_mod = importlib.util.module_from_spec(verify_spec)
verify_spec.loader.exec_module(verify_mod)


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


class VerifyReviewedCommitTests(unittest.TestCase):
    MERGE_SHA = '1111111111111111111111111111111111111111'
    HEAD_SHA = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    STALE_SHA = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    REPO = 'Magiciancat9/Course_management'

    def make_pr(self, merge_sha=None, head_sha=None, merged_at='2026-11-11T10:00:00Z'):
        return {
            'number': 36,
            'merged_at': merged_at,
            'merge_commit_sha': merge_sha or self.MERGE_SHA,
            'head': {'sha': head_sha or self.HEAD_SHA},
            'base': {'ref': 'main'},
            'user': {'login': 'martinvadre'},
        }

    def test_direct_push_without_pr_is_rejected(self):
        with patch.object(verify_mod, 'github_get', return_value=[]):
            with self.assertRaisesRegex(RuntimeError, 'not the merged revision'):
                verify_mod.verify_reviewed_commit(self.REPO, self.MERGE_SHA, 'gh-token')

    def test_unmatched_merge_or_head_commit_is_rejected(self):
        other_sha = 'cccccccccccccccccccccccccccccccccccccccc'
        with patch.object(
            verify_mod,
            'github_get',
            return_value=[self.make_pr(merge_sha=other_sha, head_sha=self.HEAD_SHA)],
        ):
            with self.assertRaisesRegex(RuntimeError, 'not the merged revision'):
                verify_mod.verify_reviewed_commit(self.REPO, self.MERGE_SHA, 'gh-token')

    def test_merged_pr_without_independent_approval_is_rejected(self):
        def fake_api(path, _token):
            if path.endswith('/pulls'):
                return [self.make_pr()]
            return [
                {
                    'user': {'login': 'martinvadre'},
                    'state': 'APPROVED',
                    'commit_id': self.HEAD_SHA,
                    'submitted_at': '2026-11-11T09:50:00Z',
                },
                {
                    'user': {'login': 'Magiciancat9'},
                    'state': 'APPROVED',
                    'commit_id': self.HEAD_SHA,
                    'submitted_at': '2026-11-11T09:52:00Z',
                },
                {
                    'user': {'login': 'Magiciancat9'},
                    'state': 'CHANGES_REQUESTED',
                    'commit_id': self.HEAD_SHA,
                    'submitted_at': '2026-11-11T09:55:00Z',
                },
            ]

        with patch.object(verify_mod, 'github_get', side_effect=fake_api):
            with self.assertRaisesRegex(RuntimeError, 'pre-merge independent APPROVED review'):
                verify_mod.verify_reviewed_commit(self.REPO, self.MERGE_SHA, 'gh-token')

    def test_approval_for_stale_commit_before_merged_head_is_rejected(self):
        def fake_api(path, _token):
            if path.endswith('/pulls'):
                return [self.make_pr()]
            return [
                {
                    'user': {'login': 'Magiciancat9'},
                    'state': 'APPROVED',
                    'commit_id': self.STALE_SHA,
                    'submitted_at': '2026-11-11T09:50:00Z',
                }
            ]

        with patch.object(verify_mod, 'github_get', side_effect=fake_api):
            with self.assertRaisesRegex(RuntimeError, 'pre-merge independent APPROVED review'):
                verify_mod.verify_reviewed_commit(self.REPO, self.MERGE_SHA, 'gh-token')

    def test_approval_submitted_after_merge_is_rejected(self):
        def fake_api(path, _token):
            if path.endswith('/pulls'):
                return [self.make_pr(merged_at='2026-11-11T10:00:00Z')]
            return [
                {
                    'user': {'login': 'Magiciancat9'},
                    'state': 'APPROVED',
                    'commit_id': self.HEAD_SHA,
                    'submitted_at': '2026-11-11T10:00:01Z',
                }
            ]

        with patch.object(verify_mod, 'github_get', side_effect=fake_api):
            with self.assertRaisesRegex(RuntimeError, 'pre-merge independent APPROVED review'):
                verify_mod.verify_reviewed_commit(self.REPO, self.MERGE_SHA, 'gh-token')

    def test_merged_pr_with_pre_merge_approval_bound_to_head_passes(self):
        def fake_api(path, _token):
            if path.endswith('/pulls'):
                return [self.make_pr(merged_at='2026-11-11T10:00:00Z')]
            return [
                {
                    'user': {'login': 'Magiciancat9'},
                    'state': 'COMMENTED',
                    'commit_id': self.STALE_SHA,
                    'submitted_at': '2026-11-11T09:40:00Z',
                },
                {
                    'user': {'login': 'Magiciancat9'},
                    'state': 'APPROVED',
                    'commit_id': self.HEAD_SHA,
                    'submitted_at': '2026-11-11T09:58:00Z',
                },
            ]

        with patch.object(verify_mod, 'github_get', side_effect=fake_api):
            pr_num = verify_mod.verify_reviewed_commit(self.REPO, self.MERGE_SHA, 'gh-token')
            self.assertEqual(pr_num, 36)


if __name__ == '__main__':
    unittest.main()
