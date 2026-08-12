param(
    [string]$Scratch = 'C:\Users\icbag\AppData\Local\Temp\grok-goal-8de5491f20d6\implementer',
    [switch]$TscOnly
)

# Harden per strategy: always run from project root for authentic npm lifecycle output
Set-Location $PSScriptRoot/..

Write-Output "Capturing full verification evidence to $Scratch ..."

# Ensure scratch
New-Item -ItemType Directory -Force -Path $Scratch | Out-Null

function Write-Provenance {
    param([string]$Step)
    Write-Output "=== PROVENANCE for ${Step} ===" | Out-File -FilePath "$Scratch/verify-provenance.log" -Append -Encoding utf8
    Get-Location | Out-File -FilePath "$Scratch/verify-provenance.log" -Append -Encoding utf8
    Get-Date -Format o | Out-File -FilePath "$Scratch/verify-provenance.log" -Append -Encoding utf8
    node -v 2>&1 | Out-File -FilePath "$Scratch/verify-provenance.log" -Append -Encoding utf8
    npx tsc --version 2>&1 | Out-File -FilePath "$Scratch/verify-provenance.log" -Append -Encoding utf8
    Write-Output "=== END PROVENANCE ===" | Out-File -FilePath "$Scratch/verify-provenance.log" -Append -Encoding utf8
}

# tsc raw: unadorned stdout from npx tsc --noEmit per verification plan step 1 (no synthetic header, no provenance in this file, no EXIT append here)
npx tsc --noEmit 2>&1 | Out-File -FilePath "$Scratch/verify-tsc-full.log" -Encoding utf8
# EXIT observed via $LASTEXITCODE by caller; do not pollute the raw compiler log
Write-Output "tsc raw capture complete (EXIT: $LASTEXITCODE)"

if ($TscOnly) {
    Write-Output "TscOnly mode - skipping remaining steps to avoid locks/recursion."
    exit $LASTEXITCODE
}

# validate full - pure stdout/stderr (no synthetic header in the log file)
npm run validate:content 2>&1 | Out-File -FilePath "$Scratch/verify-validate-full.log" -Encoding utf8

# report full - pure stdout/stderr
npm run report:content 2>&1 | Out-File -FilePath "$Scratch/verify-report-full.log" -Encoding utf8

# depth full (tail as per plan, but full run captured) - pure
npx tsx scripts/python-depth-audit.ts 2>&1 | Select-Object -Last 30 | Out-File -FilePath "$Scratch/verify-depth-full.txt" -Encoding utf8

# scan full - pure
npm run scan:redaction 2>&1 | Out-File -FilePath "$Scratch/verify-scan-full.log" -Encoding utf8

# test full - pure
npm test 2>&1 | Out-File -FilePath "$Scratch/verify-test-full.log" -Encoding utf8

# verify full - pure
npm run verify 2>&1 | Out-File -FilePath "$Scratch/verify-verify-full.log" -Encoding utf8

Write-Output "Evidence capture complete. See $Scratch for verify-*-full.* logs."