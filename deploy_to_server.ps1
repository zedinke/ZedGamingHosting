# PowerShell script to deploy ZedHosting to Ubuntu server
param(
    [string]$ServerIP = "116.203.226.140",
    [string]$Username = "root"
)

$ErrorActionPreference = "Stop"

Write-Host "=== ZedHosting Server Deployment ===" -ForegroundColor Green
Write-Host ""

# Step 1: Test SSH connection
Write-Host "[1] Testing SSH connection..." -ForegroundColor Yellow
try {
    $result = ssh -o ConnectTimeout=5 -o BatchMode=yes -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "echo 'Connection OK'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SSH connection successful (using key-based authentication)" -ForegroundColor Green
        $usePassword = $false
    } else {
        Write-Host "SSH key authentication failed. Password authentication will be required." -ForegroundColor Yellow
        $usePassword = $true
    }
} catch {
    Write-Host "SSH connection test failed. Will use password authentication." -ForegroundColor Yellow
    $usePassword = $true
}

# Step 2: Copy setup script
Write-Host ""
Write-Host "[2] Preparing setup script..." -ForegroundColor Yellow
$setupScript = Get-Content "remote_setup.sh" -Raw

if ($usePassword) {
    Write-Host "Please run the following command manually and enter password when prompted:" -ForegroundColor Cyan
    Write-Host "scp remote_setup.sh ${Username}@${ServerIP}:/tmp/" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor Cyan
    Write-Host "ssh ${Username}@${ServerIP} 'bash /tmp/remote_setup.sh'" -ForegroundColor White
    Write-Host ""
    Write-Host "OR copy and paste the public key manually:" -ForegroundColor Cyan
    $pubKey = Get-Content "$env:USERPROFILE\.ssh\zedhosting_server.pub"
    Write-Host $pubKey -ForegroundColor White
    Write-Host ""
    Write-Host "Then run on the server:" -ForegroundColor Cyan
    Write-Host "mkdir -p ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh" -ForegroundColor White
    exit 1
}

# Step 3: Copy setup script to server
Write-Host "Copying setup script to server..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no "remote_setup.sh" "${Username}@${ServerIP}:/tmp/" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to copy setup script" -ForegroundColor Red
    exit 1
}

# Step 4: Run setup script
Write-Host ""
Write-Host "[3] Running setup script on server..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "chmod +x /tmp/remote_setup.sh && bash /tmp/remote_setup.sh" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Setup script execution failed" -ForegroundColor Red
    exit 1
}

# Step 5: Copy project files
Write-Host ""
Write-Host "[4] Copying project files to server..." -ForegroundColor Yellow
$excludePatterns = @(
    "node_modules",
    ".git",
    "dist",
    ".nx",
    "*.log"
)

# Create rsync-like exclude string
$excludeArgs = $excludePatterns | ForEach-Object { "--exclude=$_" }

# Use tar to create archive and copy
Write-Host "Creating archive of project files..." -ForegroundColor Yellow
tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.nx' --exclude='*.log' -czf project.tar.gz . 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create archive (tar might not be available on Windows)" -ForegroundColor Yellow
    Write-Host "Please manually copy project files to /opt/zedhosting on the server" -ForegroundColor Cyan
} else {
    Write-Host "Copying archive to server..." -ForegroundColor Yellow
    scp -o StrictHostKeyChecking=no "project.tar.gz" "${Username}@${ServerIP}:/tmp/" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Extracting archive on server..." -ForegroundColor Yellow
        ssh -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "cd /opt/zedhosting && tar -xzf /tmp/project.tar.gz && rm /tmp/project.tar.gz" 2>&1
        Remove-Item "project.tar.gz" -ErrorAction SilentlyContinue
    }
}

# Step 6: Generate .env file
Write-Host ""
Write-Host "[5] Generating .env file..." -ForegroundColor Yellow

# Generate secure random values
function Get-RandomString {
    param([int]$Length = 32)
    -join ((65..90) + (97..122) + (48..57) | Get-Random -Count $Length | ForEach-Object {[char]$_})
}

$dbPassword = Get-RandomString -Length 32
$redisPassword = Get-RandomString -Length 32
$jwtSecret = Get-RandomString -Length 64
$encryptionKey = Get-RandomString -Length 32
$hashSecret = Get-RandomString -Length 32

$envContent = @"
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$dbPassword
POSTGRES_DB=zedhosting

# Redis
REDIS_PASSWORD=$redisPassword

# Security secrets
JWT_SECRET=$jwtSecret
ENCRYPTION_KEY=$encryptionKey
HASH_SECRET=$hashSecret

# Licensing (UPDATE THESE!)
LICENSE_KEY=your_valid_license_key
LICENSE_SERVER_URL=https://license.zedhosting.com

# API Config
API_URL=https://${ServerIP}
PORT=3000
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
Write-Host ".env file created locally" -ForegroundColor Green

# Copy .env to server
Write-Host "Copying .env file to server..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no ".env" "${Username}@${ServerIP}:/opt/zedhosting/.env" 2>&1

# Step 7: Start Docker containers
Write-Host ""
Write-Host "[6] Starting Docker containers..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "cd /opt/zedhosting && docker compose up -d --build" 2>&1

# Step 8: Run database migration
Write-Host ""
Write-Host "[7] Running database migration..." -ForegroundColor Yellow
Start-Sleep -Seconds 10  # Wait for containers to start
ssh -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "cd /opt/zedhosting && docker compose exec -T api npx prisma migrate deploy" 2>&1

Write-Host ""
Write-Host "=== Deployment completed! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Server IP: ${ServerIP}" -ForegroundColor Cyan
Write-Host "API URL: http://${ServerIP}:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check logs with: ssh ${Username}@${ServerIP} 'cd /opt/zedhosting && docker compose logs -f api'" -ForegroundColor Yellow

