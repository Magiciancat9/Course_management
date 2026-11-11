"""Verifies that a commit being deployed came from a merged, reviewed PR to main.

Prevents `.github/workflows/deploy.yml` from deploying direct pushes to `main`
or commits merged without teammate approval, even if branch ruleset settings
are misconfigured.

Environment variables:
    GITHUB_REPOSITORY : '<owner>/<repo>'
    COMMIT_SHA        : full 40-character lowercase hex commit SHA
    GITHUB_TOKEN      : GitHub API token (e.g. secrets.GITHUB_TOKEN)
"""
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


def has_independent_approval(reviews, pr_author):
    """Returns True if at least one non-author reviewer's latest decisive state is APPROVED."""
    latest_state_by_user = {}
    for review in reviews:
        if not isinstance(review, dict):
            continue
        user = (review.get('user') or {}).get('login')
        state = review.get('state')
        if not user or user == pr_author:
            continue
        if state in ('APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'):
            latest_state_by_user[user] = state
    return any(state == 'APPROVED' for state in latest_state_by_user.values())


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
    ]

    if not merged_main_prs:
        raise RuntimeError(
            f'Commit {commit_sha} is not associated with a merged pull request targeting main. '
            'Direct pushes and unmerged commits cannot be deployed.'
        )

    for pr in merged_main_prs:
        pr_number = pr.get('number')
        pr_author = (pr.get('user') or {}).get('login', '')
        try:
            reviews = github_get(f'/repos/{repo}/pulls/{pr_number}/reviews', token)
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            raise RuntimeError(f'Failed to query reviews for PR #{pr_number}') from exc

        if isinstance(reviews, list) and has_independent_approval(reviews, pr_author):
            print(f'PASS commit {commit_sha} verified via reviewed PR #{pr_number} -> main')
            return pr_number

    raise RuntimeError(
        f'Commit {commit_sha} has no merged pull request targeting main with an independent APPROVED review.'
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
