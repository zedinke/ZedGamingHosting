# Simple deployment script with manual SSH key setup instructions
param(
    [string]$ServerIP = "116.203.226.140",
    [string]$Username = "root"
)

$ErrorActionPreference = "Continue"

Write-Host "=== ZedHosting Deployment ===" -ForegroundColor Green
Write-Host ""

$pubKey = Get-Content "$env:USERPROFILE\.ssh\zedhosting_server.pub" -ErrorAction SilentlyContinue

if (-not $pubKey) {
    Write-Host "SSH public key not found!" -ForegroundColor Red
    exit 1
}

Write-Host "SSH Public Key:" -ForegroundColor Yellow
Write-Host $pubKey -ForegroundColor Cyan
Write-Host ""

# Step 1: Manual SSH key setup
Write-Host "=== STEP 1: SSH Key Setup ===" -ForegroundColor Yellow
Write-Host "Please run this on the server (password: bdnXbNMmbe7q7TK7aVWu):" -ForegroundColor Cyan
Write-Host ""
Write-Host "ssh $Username@$ServerIP" -ForegroundColor White
Write-Host "mkdir -p ~/.ssh && chmod 700 ~/.ssh" -ForegroundColor White
Write-Host "echo '$pubKey' >> ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "chmod 600 ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "exit" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Press Enter after you've set up the SSH key, or 'q' to quit"
if ($continue -eq 'q') { exit }

# Test SSH connection
Write-Host "`nTesting SSH connection..." -ForegroundColor Yellow
$testResult = ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes "$Username@$ServerIP" "echo 'OK'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH key authentication still not working. Please verify the key was added correctly." -ForegroundColor Red
    exit 1
}

Write-Host "SSH connection successful!`n" -ForegroundColor Green

# Step 2: Copy and run setup script
Write-Host "=== STEP 2: Server Setup ===" -ForegroundColor Yellow
Write-Host "Copying server_setup.sh..." -ForegroundColor Yellow
scp -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "server_setup.sh" "${Username}@${ServerIP}:/tmp/" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Running server setup..." -ForegroundColor Yellow
    ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "$Username@$ServerIP" "bash /tmp/server_setup.sh" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Server setup failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Failed to copy setup script!" -ForegroundColor Red
    exit 1
}

# Step 3: Copy project files
Write-Host "`n=== STEP 3: Copying Project Files ===" -ForegroundColor Yellow

Write-Host "Creating directory..." -ForegroundColor Yellow
ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "$Username@$ServerIP" "mkdir -p /opt/zedhosting" 2>&1 | Out-Null

$files = @("docker-compose.yml", "package.json", "nx.json", "tsconfig.base.json")
$dirs = @("apps", "libs")

Write-Host "Copying files..." -ForegroundColor Yellow
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  Copying $file..." -ForegroundColor Gray
        scp -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no $file "${Username}@${ServerIP}:/opt/zedhosting/" 2>&1 | Out-Null
    }
}

Write-Host "Copying directories..." -ForegroundColor Yellow
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "  Copying $dir/..." -ForegroundColor Gray
        scp -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no -r $dir "${Username}@${ServerIP}:/opt/zedhosting/" 2>&1 | Out-Null
    }
}

# Step 4: Start Docker
Write-Host "`n=== STEP 4: Starting Docker Containers ===" -ForegroundColor Yellow
ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "$Username@$ServerIP" "cd /opt/zedhosting && docker compose up -d --build" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start Docker containers!" -ForegroundColor Red
    exit 1
}

# Step 5: Wait and migrate
Write-Host "`n=== STEP 5: Database Migration ===" -ForegroundColor Yellow
Write-Host "Waiting 30 seconds for containers to start..." -ForegroundColor Gray
Start-Sleep -Seconds 30

Write-Host "Running database migration..." -ForegroundColor Yellow
ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "$Username@$ServerIP" "cd /opt/zedhosting && docker compose exec -T api npx prisma migrate deploy" 2>&1

Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "Server: $ServerIP" -ForegroundColor Cyan
Write-Host "API: http://$ServerIP`:3000" -ForegroundColor Cyan

