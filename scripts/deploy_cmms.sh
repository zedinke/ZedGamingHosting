#!/bin/bash
# CMMS Backend Deployment Script
# Feltölti a CMMS projekt fájlokat a szerverre és futtatja a telepítő scriptet

set -e

# Színek
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Konfiguráció
SERVER_IP="${CMMS_SERVER_IP:-116.203.226.140}"
SERVER_USER="${CMMS_SERVER_USER:-root}"
SSH_KEY="${CMMS_SSH_KEY:-$HOME/.ssh/zedhosting_server}"
SOURCE_DIR="${CMMS_SOURCE_DIR:-../CMMS_Project}"
TARGET_DIR="/tmp/cmms-backend"
INSTALL_SCRIPT="install_cmms_backend.sh"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Előfeltételek ellenőrzése
log_info "Előfeltételek ellenőrzése..."

# SSH kulcs ellenőrzés
if [ ! -f "$SSH_KEY" ]; then
    log_warn "SSH kulcs nem található: $SSH_KEY"
    log_info "Használd a CMMS_SSH_KEY változót más kulcs megadásához"
    SSH_KEY_OPT=""
else
    SSH_KEY_OPT="-i $SSH_KEY"
    log_info "SSH kulcs használata: $SSH_KEY"
fi

# Forrás könyvtár ellenőrzés
if [ ! -d "$SOURCE_DIR" ]; then
    log_error "Forrás könyvtár nem található: $SOURCE_DIR"
    log_info "Használd a CMMS_SOURCE_DIR változót a forrás könyvtár megadásához"
    log_info "Példa: CMMS_SOURCE_DIR=/path/to/cmms/project ./deploy_cmms.sh"
    exit 1
fi

log_info "Forrás könyvtár: $SOURCE_DIR"

# SSH kapcsolat tesztelése
log_info "SSH kapcsolat tesztelése..."
if ssh $SSH_KEY_OPT -o ConnectTimeout=5 -o BatchMode=yes -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" "echo 'SSH connection OK'" 2>/dev/null; then
    log_info "SSH kapcsolat sikeres"
else
    log_error "SSH kapcsolat sikertelen"
    log_info "Ellenőrizd:"
    log_info "  - SSH kulcs be van-e állítva a szerveren"
    log_info "  - IP cím helyes-e: $SERVER_IP"
    log_info "  - Felhasználó helyes-e: $SERVER_USER"
    exit 1
fi

# 2. Telepítő script másolása
log_info "Telepítő script másolása..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_SCRIPT_PATH="$SCRIPT_DIR/$INSTALL_SCRIPT"

if [ ! -f "$INSTALL_SCRIPT_PATH" ]; then
    log_error "Telepítő script nem található: $INSTALL_SCRIPT_PATH"
    exit 1
fi

scp $SSH_KEY_OPT -o StrictHostKeyChecking=no "$INSTALL_SCRIPT_PATH" "${SERVER_USER}@${SERVER_IP}:/tmp/$INSTALL_SCRIPT"

# 3. Systemd service fájl másolása (ha van)
SERVICE_FILE="$SCRIPT_DIR/cmms-api.service"
if [ -f "$SERVICE_FILE" ]; then
    log_info "Systemd service fájl másolása..."
    scp $SSH_KEY_OPT -o StrictHostKeyChecking=no "$SERVICE_FILE" "${SERVER_USER}@${SERVER_IP}:/tmp/cmms-api.service"
fi

# 4. CMMS projekt fájlok feltöltése
log_info "CMMS projekt fájlok feltöltése..."
log_info "Ez eltarthat egy ideig, függően a projekt méretétől..."

# Először töröljük a régi fájlokat a szerveren
ssh $SSH_KEY_OPT -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" "rm -rf $TARGET_DIR && mkdir -p $TARGET_DIR"

# Fájlok feltöltése (kizárva a .git, __pycache__, stb.)
rsync -avz --progress \
    --exclude='.git' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='venv' \
    --exclude='.venv' \
    --exclude='node_modules' \
    --exclude='*.log' \
    $SSH_KEY_OPT \
    -e "ssh -o StrictHostKeyChecking=no" \
    "$SOURCE_DIR/" "${SERVER_USER}@${SERVER_IP}:$TARGET_DIR/"

# Ha nincs rsync, használjunk scp-t
if [ $? -ne 0 ]; then
    log_warn "rsync nem elérhető, scp használata..."
    scp $SSH_KEY_OPT -o StrictHostKeyChecking=no -r "$SOURCE_DIR"/* "${SERVER_USER}@${SERVER_IP}:$TARGET_DIR/"
fi

# 5. Telepítő script futtatása
log_info "Telepítő script futtatása a szerveren..."
ssh $SSH_KEY_OPT -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" "chmod +x /tmp/$INSTALL_SCRIPT && sudo bash /tmp/$INSTALL_SCRIPT"

# 6. Telepítés ellenőrzése
log_info "Telepítés ellenőrzése..."
sleep 3

# Service státusz ellenőrzés
if ssh $SSH_KEY_OPT -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" "systemctl is-active --quiet cmms-api"; then
    log_info "✓ CMMS API service fut"
else
    log_warn "✗ CMMS API service nem fut"
    log_info "Logok megtekintése:"
    log_info "  ssh ${SERVER_USER}@${SERVER_IP} 'journalctl -u cmms-api -n 50'"
fi

# Health check
log_info "Health check végrehajtása..."
HEALTH_CHECK=$(ssh $SSH_KEY_OPT -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/api/health/ || curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health || echo '000'")

if [ "$HEALTH_CHECK" = "200" ] || [ "$HEALTH_CHECK" = "000" ]; then
    if [ "$HEALTH_CHECK" = "200" ]; then
        log_info "✓ Health check sikeres"
    else
        log_warn "Health check endpoint nem elérhető (lehet hogy más útvonalon van)"
    fi
else
    log_warn "Health check HTTP status: $HEALTH_CHECK"
fi

# 7. Összefoglaló
log_info "=========================================="
log_info "Deployment befejezve!"
log_info "=========================================="
log_info "Szerver: $SERVER_IP"
log_info "API URL: http://$SERVER_IP:8000"
log_info "API Docs: http://$SERVER_IP:8000/docs"
log_info ""
log_info "Hasznos parancsok:"
log_info "  SSH: ssh $SSH_KEY_OPT ${SERVER_USER}@${SERVER_IP}"
log_info "  Service státusz: ssh ${SERVER_USER}@${SERVER_IP} 'systemctl status cmms-api'"
log_info "  Logok: ssh ${SERVER_USER}@${SERVER_IP} 'journalctl -u cmms-api -f'"
log_info "  Újraindítás: ssh ${SERVER_USER}@${SERVER_IP} 'sudo systemctl restart cmms-api'"

