param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{40}$')]
    [string]$ExpectedHead,
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[0-9a-f]{40}$')]
    [string]$ExpectedOriginalHead
)

$ErrorActionPreference = 'Stop'
$repository = 'Magiciancat9/Course_management'
$originalBranch = 'fix/lab6-10-l6-out-exp-001-draft-isolation'
$followupBranch = 'fix/lab6-10-session-boundary-followup'

# Run only after the original driver has personally inspected the proposal.
$developer = & gh api user --jq .login
if ($LASTEXITCODE -ne 0 -or $developer.Trim() -ne 'martinvadre') {
    throw 'Only the authenticated original implementation owner martinvadre may run this integration helper.'
}
$remote = & git remote get-url origin
if ($LASTEXITCODE -ne 0 -or $remote.Trim() -notmatch '^https://github\.com/Magiciancat9/Course_management(?:\.git)?/?$|^git@github\.com:Magiciancat9/Course_management(?:\.git)?$') {
    throw 'Run this helper in the intended Course_management checkout.'
}
$dirty = & git status --porcelain
if ($LASTEXITCODE -ne 0 -or $dirty) { throw 'The checkout must be clean before integration.' }

$followupJson = & gh pr view 73 --repo $repository --json headRefName,headRefOid,baseRefName,state,statusCheckRollup
if ($LASTEXITCODE -ne 0) { throw 'Could not read follow-up PR #73.' }
$followup = $followupJson | ConvertFrom-Json
$originalJson = & gh pr view 72 --repo $repository --json headRefName,headRefOid,baseRefName,state
if ($LASTEXITCODE -ne 0) { throw 'Could not read original PR #72.' }
$original = $originalJson | ConvertFrom-Json
if ($followup.state -ne 'OPEN' -or $followup.headRefName -ne $followupBranch -or
    $followup.baseRefName -ne $originalBranch -or $followup.headRefOid -ne $ExpectedHead -or
    $original.state -ne 'OPEN' -or $original.headRefName -ne $originalBranch -or
    $original.baseRefName -ne 'lab6-staging' -or $original.headRefOid -ne $ExpectedOriginalHead) {
    throw 'PR heads or targets changed. Inspect the new state and obtain a new exact-head integration decision.'
}
$passing = @($followup.statusCheckRollup | Where-Object {
    $_.name -eq 'test-and-docker' -and $_.status -eq 'COMPLETED' -and $_.conclusion -eq 'SUCCESS'
})
if ($passing.Count -eq 0) { throw 'The expected follow-up head must have successful full CI.' }

& git fetch origin
if ($LASTEXITCODE -ne 0) { throw 'Fetch failed.' }
$remoteOriginal = & git rev-parse "origin/$originalBranch"
if ($LASTEXITCODE -ne 0 -or $remoteOriginal.Trim() -ne $ExpectedOriginalHead) { throw 'Original remote branch moved.' }
$remoteFollowup = & git rev-parse "origin/$followupBranch"
if ($LASTEXITCODE -ne 0 -or $remoteFollowup.Trim() -ne $ExpectedHead) { throw 'Follow-up remote branch moved.' }
& git merge-base --is-ancestor $ExpectedOriginalHead $ExpectedHead
if ($LASTEXITCODE -ne 0) { throw 'The follow-up is not a fast-forward of the original correction.' }

& git switch $originalBranch
if ($LASTEXITCODE -ne 0) { throw 'Could not switch to the original correction branch.' }
& git merge --ff-only $ExpectedHead
if ($LASTEXITCODE -ne 0) { throw 'Fast-forward failed; inspect locally. No force push is permitted.' }
& git push origin "HEAD:refs/heads/$originalBranch"
if ($LASTEXITCODE -ne 0) { throw 'Feature-branch push failed; inspect remote state.' }

Write-Output 'Original correction feature branch updated. No PR approval, staging/main merge, deployment or acceptance was performed.'
Write-Output 'Wait for current-head #72 CI and substantive teammate review before any integration/release decision.'
