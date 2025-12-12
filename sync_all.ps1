# Szinkronizálási script - Lokális gép ↔ GitHub ↔ Szerver
# Ez a script mindig szinkronban tartja a három helyet

param(
    [string]$ServerIP = "116.203.226.140",
    [string]$Username = "root",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Háromirányú szinkronizálás ===" -ForegroundColor Green
Write-Host "Lokális gép ↔ GitHub ↔ Szerver`n" -ForegroundColor Cyan

# 1. Lokális változások ellenőrzése
Write-Host "[1/5] Lokális változások ellenőrzése..." -ForegroundColor Yellow
$localStatus = git status --porcelain
if ($localStatus) {
    Write-Host "Lokális változások találhatók, commitálás..." -ForegroundColor Yellow
    git add -A
    $commitMessage = Read-Host "Commit üzenet (vagy Enter az automatikushoz)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "Sync: Automatikus szinkronizálás $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    git commit -m $commitMessage
} else {
    Write-Host "✓ Nincs lokális változás" -ForegroundColor Green
}

# 2. Szerver változások letöltése (mielőtt felpusholunk)
Write-Host "`n[2/5] Szerver változások ellenőrzése..." -ForegroundColor Yellow
$serverStatus = ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "cd /opt/zedhosting && git status --porcelain" 2>&1

if ($serverStatus -and -not $serverStatus.StartsWith("On branch")) {
    Write-Host "Szerveren változások találhatók, lekérem..." -ForegroundColor Yellow
    # Módosított fájlok lekérése
    $modifiedFiles = ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "cd /opt/zedhosting && git diff --name-only" 2>&1
    
    foreach ($file in $modifiedFiles) {
        if ($file -and $file -notmatch "^(On branch|Changes|Untracked)" -and $file.Trim()) {
            $file = $file.Trim()
            Write-Host "  Letöltés: $file" -ForegroundColor Gray
            $dir = Split-Path $file -Parent
            if ($dir -and $dir -ne ".") {
                New-Item -ItemType Directory -Force -Path $dir | Out-Null
            }
            scp -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "${Username}@${ServerIP}:/opt/zedhosting/$file" "$file" 2>&1 | Out-Null
        }
    }
    
    # Új fájlok lekérése
    $untrackedFiles = ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "cd /opt/zedhosting && git ls-files --others --exclude-standard" 2>&1
    
    foreach ($file in $untrackedFiles) {
        if ($file -and $file.Trim()) {
            $file = $file.Trim()
            Write-Host "  Új fájl letöltés: $file" -ForegroundColor Gray
            $dir = Split-Path $file -Parent
            if ($dir -and $dir -ne ".") {
                New-Item -ItemType Directory -Force -Path $dir | Out-Null
            }
            scp -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "${Username}@${ServerIP}:/opt/zedhosting/$file" "$file" 2>&1 | Out-Null
        }
    }
    
    # Lokálisan commitáljuk a szerverről érkezett változásokat
    $localStatusAfter = git status --porcelain
    if ($localStatusAfter) {
        git add -A
        git commit -m "Sync: Változások a szerverről $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
} else {
    Write-Host "✓ Nincs változás a szerveren" -ForegroundColor Green
}

# 3. GitHub pull (ha van remote változás)
Write-Host "`n[3/5] GitHub változások ellenőrzése..." -ForegroundColor Yellow
git fetch origin $Branch 2>&1 | Out-Null
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse "origin/$Branch"

if ($localCommit -ne $remoteCommit) {
    Write-Host "GitHub-on változások találhatók, merge..." -ForegroundColor Yellow
    git pull origin $Branch 2>&1
} else {
    Write-Host "✓ GitHub szinkronban van" -ForegroundColor Green
}

# 4. Push GitHub-ra (ha van lokális commit)
$localCommitAfter = git rev-parse HEAD
$remoteCommitAfter = git rev-parse "origin/$Branch" 2>&1

if ($localCommitAfter -ne $remoteCommitAfter) {
    Write-Host "`n[4/5] GitHub-ra feltöltés..." -ForegroundColor Yellow
    git push origin $Branch 2>&1
    Write-Host "✓ GitHub-ra feltöltve" -ForegroundColor Green
} else {
    Write-Host "`n[4/5] ✓ GitHub már naprakész" -ForegroundColor Green
}

# 5. Szerver szinkronizálása
Write-Host "`n[5/5] Szerver szinkronizálása GitHub-ról..." -ForegroundColor Yellow
$serverResult = ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "${Username}@${ServerIP}" @"
cd /opt/zedhosting
git stash 2>&1
git pull origin $Branch 2>&1
git status --short
"@

Write-Host $serverResult
Write-Host "✓ Szerver szinkronizálva" -ForegroundColor Green

Write-Host "`n=== Szinkronizálás kész! ===" -ForegroundColor Green
Write-Host "Minden három hely szinkronban van." -ForegroundColor Cyan


