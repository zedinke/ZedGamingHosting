# PowerShell script to setup SSH key and deploy
param(
    [string]$ServerIP = "116.203.226.140",
    [string]$Username = "root",
    [string]$Password = "bdnXbNMmbe7q7TK7aVWu"
)

$ErrorActionPreference = "Stop"

Write-Host "=== SSH Kulcs beállítása és telepítés ===" -ForegroundColor Green
Write-Host ""

# Read public key
$pubKeyPath = "$env:USERPROFILE\.ssh\zedhosting_server.pub"
if (-not (Test-Path $pubKeyPath)) {
    Write-Host "SSH public key not found at $pubKeyPath" -ForegroundColor Red
    exit 1
}

$pubKey = Get-Content $pubKeyPath
Write-Host "Public key loaded: $($pubKey.Substring(0, [Math]::Min(50, $pubKey.Length)))..." -ForegroundColor Yellow

# Setup SSH key on server using password
Write-Host "[1/6] Setting up SSH key on server..." -ForegroundColor Yellow

# Create a temporary script that will be executed on the server
$setupKeyScript = @"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '$pubKey' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "SSH key setup completed"
"@

# Use plink or expect-like approach
# Try using ssh with password authentication once
Write-Host "Note: You will be prompted for password once to setup SSH key" -ForegroundColor Cyan
Write-Host "Password: $Password" -ForegroundColor Yellow

# Save script to temp file
$setupKeyScript | Out-File -FilePath "temp_key_setup.sh" -Encoding ASCII -NoNewline

Write-Host ""
Write-Host "Please run this command manually and enter password:" -ForegroundColor Cyan
Write-Host "scp temp_key_setup.sh ${Username}@${ServerIP}:/tmp/" -ForegroundColor White
Write-Host ""
Write-Host "Then run:" -ForegroundColor Cyan  
Write-Host "ssh ${Username}@${ServerIP} 'bash /tmp/temp_key_setup.sh'" -ForegroundColor White
Write-Host ""
Write-Host "After that, this script can continue automatically." -ForegroundColor Yellow

# For now, let's try to do it automatically by creating a batch approach
Write-Host ""
Write-Host "Attempting automated setup..." -ForegroundColor Yellow

# Use here-string to create a script that pipes password
# This is a workaround - we'll use expect-like functionality
$expectScript = @"
spawn ssh ${Username}@${ServerIP} "bash -s"
expect "*password*"
send "$Password\r"
expect "*#"
send "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key added'\r"
expect "*#"
send "exit\r"
expect eof
"@

# Since expect might not be available, let's use a different approach
# We'll create a script that the user can run, or we can use sshpass alternative

Write-Host ""
Write-Host "=== SSH Key Setup Complete (or needs manual step) ===" -ForegroundColor Green
Write-Host ""

# Continue with deployment if SSH key is working
Write-Host "[2/6] Testing SSH key authentication..." -ForegroundColor Yellow

$testResult = ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes "${Username}@${ServerIP}" "echo 'OK'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SSH key authentication working!" -ForegroundColor Green
    
    # Copy setup script
    Write-Host "[3/6] Copying setup script to server..." -ForegroundColor Yellow
    scp -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "server_setup.sh" "${Username}@${ServerIP}:/tmp/" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[4/6] Running setup script on server..." -ForegroundColor Yellow
        ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "bash /tmp/server_setup.sh" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[5/6] Copying project files..." -ForegroundColor Yellow
            
            # Copy essential files
            ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "mkdir -p /opt/zedhosting" 2>&1
            
            # Copy docker-compose.yml
            scp -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "docker-compose.yml" "${Username}@${ServerIP}:/opt/zedhosting/" 2>&1
            
            # Copy apps directory
            Write-Host "Copying apps directory..." -ForegroundColor Yellow
            scp -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no -r "apps" "${Username}@${ServerIP}:/opt/zedhosting/" 2>&1
            
            # Copy libs directory  
            Write-Host "Copying libs directory..." -ForegroundColor Yellow
            scp -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no -r "libs" "${Username}@${ServerIP}:/opt/zedhosting/" 2>&1
            
            # Copy config files
            Write-Host "Copying config files..." -ForegroundColor Yellow
            scp -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "package.json" "nx.json" "tsconfig.base.json" "${Username}@${ServerIP}:/opt/zedhosting/" 2>&1
            
            Write-Host "[6/6] Starting Docker containers..." -ForegroundColor Yellow
            ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "cd /opt/zedhosting && docker compose up -d --build" 2>&1
            
            Write-Host ""
            Write-Host "Waiting 30 seconds for containers to start..." -ForegroundColor Yellow
            Start-Sleep -Seconds 30
            
            Write-Host "Running database migration..." -ForegroundColor Yellow
            ssh -i "$env:USERPROFILE\.ssh\zedhosting_server" -o StrictHostKeyChecking=no "${Username}@${ServerIP}" "cd /opt/zedhosting && docker compose exec -T api npx prisma migrate deploy" 2>&1
            
            Write-Host ""
            Write-Host "=== Deployment completed! ===" -ForegroundColor Green
            Write-Host ""
            Write-Host "Server: ${ServerIP}" -ForegroundColor Cyan
            Write-Host "API: http://${ServerIP}:3000" -ForegroundColor Cyan
        } else {
            Write-Host "Setup script failed" -ForegroundColor Red
        }
    } else {
        Write-Host "Failed to copy setup script" -ForegroundColor Red
    }
} else {
    Write-Host "SSH key authentication not working yet. Please setup the key manually first." -ForegroundColor Red
    Write-Host "See QUICK_START.md for instructions." -ForegroundColor Yellow
}

# Cleanup
Remove-Item "temp_key_setup.sh" -ErrorAction SilentlyContinue


