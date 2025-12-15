#!/bin/bash
# CMMS Backend Telepítő Script
# Non-interactive telepítés Ubuntu 22.04 szerveren
# Használat: sudo bash install_cmms_backend.sh

set -e  # Exit on error

# Színek a kimenethez
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Konstansok
INSTALL_DIR="/opt/cmms-backend"
SERVICE_USER="cmms"
SERVICE_NAME="cmms-api"
PYTHON_MIN_VERSION="3.10"
API_PORT="8000"
SOURCE_DIR="/tmp/cmms-backend"

# MySQL kapcsolódási adatok
MYSQL_HOST="${MYSQL_HOST:-116.203.226.140}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_DB="${MYSQL_DB:-zedin_cmms}"
MYSQL_USER="${MYSQL_USER:-zedin_cmms}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-Gele007ta...}"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Rendszer ellenőrzés
log_info "Rendszer ellenőrzése..."

# Ubuntu verzió ellenőrzés
if [ ! -f /etc/os-release ]; then
    log_error "Nem Ubuntu rendszer vagy nem található /etc/os-release"
    exit 1
fi

. /etc/os-release
if [ "$ID" != "ubuntu" ]; then
    log_warn "Ez nem Ubuntu rendszer, de folytatjuk..."
fi

log_info "Rendszer: $PRETTY_NAME"

# Root ellenőrzés
if [ "$EUID" -ne 0 ]; then 
    log_error "Ez a script root jogosultsággal kell futnia (sudo)"
    exit 1
fi

# 2. Python ellenőrzés és telepítés
log_info "Python ellenőrzése..."

if ! command -v python3 &> /dev/null; then
    log_info "Python3 telepítése..."
    apt-get update
    apt-get install -y python3 python3-pip python3-venv
else
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    log_info "Python verzió: $PYTHON_VERSION"
    
    # Verzió ellenőrzés (egyszerűsített)
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    REQUIRED_MAJOR=$(echo $PYTHON_MIN_VERSION | cut -d'.' -f1)
    REQUIRED_MINOR=$(echo $PYTHON_MIN_VERSION | cut -d'.' -f2)
    
    if [ "$PYTHON_MAJOR" -lt "$REQUIRED_MAJOR" ] || ([ "$PYTHON_MAJOR" -eq "$REQUIRED_MAJOR" ] && [ "$PYTHON_MINOR" -lt "$REQUIRED_MINOR" ]); then
        log_error "Python $PYTHON_MIN_VERSION+ szükséges, jelenleg: $PYTHON_VERSION"
        exit 1
    fi
fi

# Szükséges system package-ek telepítése
log_info "Szükséges system package-ek telepítése..."
apt-get update
apt-get install -y python3-venv python3-pip build-essential libmysqlclient-dev pkg-config

# 3. CMMS user létrehozása
log_info "CMMS user létrehozása..."
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$INSTALL_DIR" "$SERVICE_USER"
    log_info "User $SERVICE_USER létrehozva"
else
    log_info "User $SERVICE_USER már létezik"
fi

# 4. Install könyvtár létrehozása
log_info "Install könyvtár létrehozása: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

# 5. Forrás fájlok ellenőrzése
log_info "Forrás fájlok ellenőrzése: $SOURCE_DIR"
if [ ! -d "$SOURCE_DIR" ] || [ -z "$(ls -A $SOURCE_DIR 2>/dev/null)" ]; then
    log_warn "Forrás könyvtár nem található vagy üres: $SOURCE_DIR"
    log_info "Minimális FastAPI struktúra létrehozása..."
    
    # Minimális FastAPI struktúra létrehozása
    mkdir -p "$INSTALL_DIR/api"
    mkdir -p "$INSTALL_DIR/database"
    
    # Minimális main.py létrehozása
    cat > "$INSTALL_DIR/api/server.py" <<'PYEOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="CMMS API",
    description="CMMS Backend API for Mobile App",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "CMMS API is running", "status": "ok"}

@app.get("/api/health/")
async def health():
    return {"status": "healthy", "service": "cmms-api"}

@app.get("/health")
async def health_simple():
    return {"status": "ok"}
PYEOF

    # Minimális requirements.txt
    cat > "$INSTALL_DIR/requirements.txt" <<'REQEOF'
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
pymysql>=1.1.0
python-dotenv>=1.0.0
REQEOF

    log_info "Minimális FastAPI struktúra létrehozva"
    log_warn "Kérlek, töltsd fel a teljes CMMS projekt fájlokat ide: $INSTALL_DIR"
else
    # 6. Projekt fájlok másolása
    log_info "Projekt fájlok másolása..."
    cp -r "$SOURCE_DIR"/* "$INSTALL_DIR/" || {
        log_error "Fájlok másolása sikertelen"
        exit 1
    }
fi

chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

# 7. Python virtual environment létrehozása
log_info "Python virtual environment létrehozása..."
cd "$INSTALL_DIR"
sudo -u "$SERVICE_USER" python3 -m venv venv

# 8. Dependencies telepítése
log_info "Dependencies telepítése..."
if [ -f "$INSTALL_DIR/requirements.txt" ]; then
    sudo -u "$SERVICE_USER" "$INSTALL_DIR/venv/bin/pip" install --upgrade pip
    sudo -u "$SERVICE_USER" "$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/requirements.txt"
    
    # pymysql telepítése (ha nincs a requirements.txt-ben)
    sudo -u "$SERVICE_USER" "$INSTALL_DIR/venv/bin/pip" install pymysql || true
else
    log_warn "requirements.txt nem található, alapvető package-ek telepítése..."
    sudo -u "$SERVICE_USER" "$INSTALL_DIR/venv/bin/pip" install --upgrade pip
    sudo -u "$SERVICE_USER" "$INSTALL_DIR/venv/bin/pip" install fastapi uvicorn[standard] sqlalchemy pymysql python-dotenv
fi

# 9. .env fájl létrehozása
log_info ".env fájl létrehozása..."
ENV_FILE="$INSTALL_DIR/.env"

# MySQL connection string generálás
# Próbáljuk először a Docker network hostnévvel (mysql), ha nem működik, használjuk az IP-t
MYSQL_CONNECTION_STRING="mysql+pymysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DB}"

cat > "$ENV_FILE" <<EOF
# CMMS Backend Environment Configuration
DATABASE_URL=${MYSQL_CONNECTION_STRING}
API_PORT=${API_PORT}
API_HOST=0.0.0.0
DEBUG=false
ENVIRONMENT=production

# MySQL Configuration
MYSQL_HOST=${MYSQL_HOST}
MYSQL_PORT=${MYSQL_PORT}
MYSQL_DATABASE=${MYSQL_DB}
MYSQL_USER=${MYSQL_USER}
MYSQL_PASSWORD=${MYSQL_PASSWORD}
EOF

chmod 600 "$ENV_FILE"
chown "$SERVICE_USER:$SERVICE_USER" "$ENV_FILE"
log_info ".env fájl létrehozva: $ENV_FILE"

# 10. Adatbázis schema importálás (ha van SQL fájl)
if [ -f "$INSTALL_DIR/database/cmms_schema.sql" ] || [ -f "$INSTALL_DIR/cmms_schema.sql" ]; then
    SQL_FILE=""
    if [ -f "$INSTALL_DIR/database/cmms_schema.sql" ]; then
        SQL_FILE="$INSTALL_DIR/database/cmms_schema.sql"
    else
        SQL_FILE="$INSTALL_DIR/cmms_schema.sql"
    fi
    
    log_info "Adatbázis schema importálása: $SQL_FILE"
    
    # MySQL kapcsolódás tesztelése
    if command -v mysql &> /dev/null; then
        mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DB" < "$SQL_FILE" && {
            log_info "Schema importálás sikeres"
        } || {
            log_warn "Schema importálás sikertelen, lehet hogy már létezik"
        }
    else
        log_warn "mysql client nincs telepítve, schema importálás kihagyva"
        log_info "Telepítsd a mysql client-et: apt-get install -y mysql-client"
    fi
else
    log_info "SQL schema fájl nem található, kihagyva"
fi

# 11. Systemd service telepítése
log_info "Systemd service telepítése..."
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

if [ -f "$INSTALL_DIR/cmms-api.service" ]; then
    cp "$INSTALL_DIR/cmms-api.service" "$SERVICE_FILE"
elif [ -f "$SOURCE_DIR/cmms-api.service" ]; then
    cp "$SOURCE_DIR/cmms-api.service" "$SERVICE_FILE"
else
    log_warn "Service fájl nem található, alapértelmezett service fájl létrehozása..."
    
    # FastAPI server fájl meghatározása
    SERVER_FILE="api/server.py"
    if [ ! -f "$INSTALL_DIR/$SERVER_FILE" ]; then
        # Próbáljuk meg megtalálni a main FastAPI fájlt
        if [ -f "$INSTALL_DIR/main.py" ]; then
            SERVER_FILE="main.py"
        elif [ -f "$INSTALL_DIR/app.py" ]; then
            SERVER_FILE="app.py"
        else
            log_error "FastAPI server fájl nem található!"
            exit 1
        fi
    fi
    
    cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=CMMS REST API Backend
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}
Environment="PATH=${INSTALL_DIR}/venv/bin"
EnvironmentFile=${ENV_FILE}
ExecStart=${INSTALL_DIR}/venv/bin/python -m uvicorn ${SERVER_FILE%.py}:app --host 0.0.0.0 --port ${API_PORT}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
fi

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
log_info "Systemd service telepítve és engedélyezve"

# 12. Tűzfal konfiguráció
log_info "Tűzfal konfiguráció (UFW)..."
if command -v ufw &> /dev/null; then
    ufw allow ${API_PORT}/tcp
    log_info "UFW port ${API_PORT} megnyitva"
else
    log_warn "UFW nincs telepítve, tűzfal konfiguráció kihagyva"
fi

# 13. Service indítás
log_info "Service indítása..."
systemctl start "$SERVICE_NAME"

# 14. Service státusz ellenőrzése
sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
    log_info "Service sikeresen elindult"
    systemctl status "$SERVICE_NAME" --no-pager -l
else
    log_error "Service indítása sikertelen"
    log_info "Logok megtekintése: journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

# 15. Health check
log_info "Health check végrehajtása..."
sleep 3
if curl -f -s "http://localhost:${API_PORT}/api/health/" > /dev/null 2>&1 || \
   curl -f -s "http://localhost:${API_PORT}/health" > /dev/null 2>&1 || \
   curl -f -s "http://localhost:${API_PORT}/" > /dev/null 2>&1; then
    log_info "Health check sikeres"
else
    log_warn "Health check sikertelen, de a service fut"
    log_info "Ellenőrizd a logokat: journalctl -u $SERVICE_NAME -f"
fi

log_info "=========================================="
log_info "CMMS Backend telepítés befejezve!"
log_info "=========================================="
log_info "Install könyvtár: $INSTALL_DIR"
log_info "Service név: $SERVICE_NAME"
log_info "API URL: http://$(hostname -I | awk '{print $1}'):${API_PORT}"
log_info "API Docs: http://$(hostname -I | awk '{print $1}'):${API_PORT}/docs"
log_info ""
log_info "Hasznos parancsok:"
log_info "  Service státusz: systemctl status $SERVICE_NAME"
log_info "  Logok: journalctl -u $SERVICE_NAME -f"
log_info "  Újraindítás: systemctl restart $SERVICE_NAME"
log_info "  Leállítás: systemctl stop $SERVICE_NAME"

