"""Verifies that a commit being deployed came from a merged, reviewed PR to main.

Prevents `.github/workflows/deploy.yml` from deploying direct pushes to `main`
or commits merged without a pre-merge independent approval bound to the exact
revision that was merged.

Environment variables:
    GITHUB_REPOSITORY : '<owner>/<repo>'
    COMMIT_SHA        : full 40-character lowercase hex commit SHA
    GITHUB_TOKEN      : GitHub API token (e.g. secrets.GITHUB_TOKEN)
"""
from datetime import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.request

SHA_RE = re.compile(r'^[0-9a-f]{40}$')


def github_get(path, token):
    headers = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'course-pms-release-verifier',
        'X-GitHub-Api-Version': '2022-11-28',
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'https://api.github.com{path}', headers=headers)
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))


def parse_iso_timestamp(value):
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return None


def has_bound_pre_merge_independent_approval(reviews, pr_author, head_sha, merged_at_str):
    """Returns True if at least one non-author reviewer's latest pre-merge decisive
    review state is APPROVED and is bound to the exact merged PR head commit SHA.
    """
    merged_at = parse_iso_timestamp(merged_at_str)
    if merged_at is None or not head_sha or not SHA_RE.match(head_sha):
        return False

    latest_review_by_user = {}
    for index, review in enumerate(reviews):
        if not isinstance(review, dict):
            continue
        user = (review.get('user') or {}).get('login')
        state = review.get('state')
        if not user or user == pr_author:
            continue
        if state not in ('APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'):
            continue
        submitted_at = parse_iso_timestamp(review.get('submitted_at'))
        if submitted_at is None or submitted_at > merged_at:
            continue
        review_commit_id = review.get('commit_id')
        prev = latest_review_by_user.get(user)
        if prev is None or (submitted_at, index) >= (prev['submitted_at'], prev['index']):
            latest_review_by_user[user] = {
                'state': state,
                'commit_id': review_commit_id,
                'submitted_at': submitted_at,
                'index': index,
            }

    return any(
        info['state'] == 'APPROVED' and info['commit_id'] == head_sha
        for info in latest_review_by_user.values()
    )


def verify_reviewed_commit(repo, commit_sha, token):
    if not repo or '/' not in repo:
        raise RuntimeError('GITHUB_REPOSITORY must be set to <owner>/<repo>.')
    if not commit_sha or not SHA_RE.match(commit_sha):
        raise RuntimeError('COMMIT_SHA must be a full 40-character lowercase hex SHA.')
    if not token:
        raise RuntimeError('GITHUB_TOKEN is required to verify pull request review status.')

    try:
        pulls = github_get(f'/repos/{repo}/commits/{commit_sha}/pulls', token)
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        raise RuntimeError(f'Failed to query pull requests for commit {commit_sha}') from exc

    if not isinstance(pulls, list):
        raise RuntimeError('Unexpected response when listing pull requests for commit.')

    merged_main_prs = [
        pr
        for pr in pulls
        if isinstance(pr, dict)
        and (pr.get('base') or {}).get('ref') == 'main'
        and bool(pr.get('merged_at'))
        and commit_sha
        in (
            pr.get('merge_commit_sha'),
            (pr.get('head') or {}).get('sha'),
        )
    ]

    if not merged_main_prs:
        raise RuntimeError(
            f'Commit {commit_sha} is not the merged revision of any pull request targeting main. '
            'Direct pushes and unmerged commits cannot be deployed.'
        )

    for pr in merged_main_prs:
        pr_number = pr.get('number')
        pr_author = (pr.get('user') or {}).get('login', '')
        head_sha = (pr.get('head') or {}).get('sha', '')
        merged_at_str = pr.get('merged_at', '')
        try:
            reviews = github_get(f'/repos/{repo}/pulls/{pr_number}/reviews', token)
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            raise RuntimeError(f'Failed to query reviews for PR #{pr_number}') from exc

        if isinstance(reviews, list) and has_bound_pre_merge_independent_approval(
            reviews, pr_author, head_sha, merged_at_str
        ):
            print(
                f'PASS commit {commit_sha} verified via reviewed PR #{pr_number} '
                f'(head {head_sha}) -> main'
            )
            return pr_number

    raise RuntimeError(
        f'Commit {commit_sha} has no merged pull request targeting main with a pre-merge '
        'independent APPROVED review bound to the merged PR head revision.'
    )


if __name__ == '__main__':
    try:
        verify_reviewed_commit(
            os.getenv('GITHUB_REPOSITORY', ''),
            os.getenv('COMMIT_SHA', ''),
            os.getenv('GITHUB_TOKEN', ''),
        )
    except RuntimeError as err:
        sys.exit(f'ERROR: {err}')
