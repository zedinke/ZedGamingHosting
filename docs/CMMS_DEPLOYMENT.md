# CMMS Backend Telepítési Dokumentáció

## Áttekintés

Ez a dokumentum leírja, hogyan telepítsük a CMMS FastAPI backend-et a GameServerHosting szerveren (`116.203.226.140`). A rendszer natív Python környezetben fut, systemd service-szel, és a meglévő MySQL adatbázist használja.

## Előfeltételek

- **Szerver:** Ubuntu 22.04 LTS (vagy újabb)
- **SSH hozzáférés:** Root vagy sudo jogosultság a szerverhez
- **Python:** 3.10 vagy újabb
- **MySQL adatbázis:** Már létezik (`zedin_cmms`)
- **CMMS projekt kód:** FastAPI backend kód megléte

## Architektúra

```
┌─────────────────────────────────────────┐
│  Ubuntu 22.04 Server (116.203.226.140)  │
│  ┌──────────────────────────────────┐   │
│  │  Docker Compose Stack            │   │
│  │  - zed-api (NestJS, port 3000)  │   │
│  │  - zed-web (Next.js, port 3000)  │   │
│  │  - mysql (MySQL 8.0)             │   │
│  │  - redis (Redis 7)               │   │
│  │  - traefik (Reverse Proxy)      │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Natív Python CMMS Backend       │   │
│  │  - /opt/cmms-backend/            │   │
│  │  - Python 3.10+ Virtual Env     │   │
│  │  - FastAPI (Port 8000)          │   │
│  │  - Systemd Service              │   │
│  └──────────────────────────────────┘   │
│           │                              │
│           ▼                              │
│  ┌──────────────────────────────────┐   │
│  │  MySQL Database (Docker)         │   │
│  │  - zedhosting (GameServerHosting)│   │
│  │  - zedin_cmms (CMMS)            │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Telepítési Módszerek

### Módszer 1: Automatikus Deployment Script (Ajánlott)

Ez a módszer automatikusan feltölti a fájlokat és futtatja a telepítő scriptet.

#### 1. Előkészítés

```bash
# Navigálj a GameServerHosting projekt könyvtárába
cd /path/to/GameServerHosting

# A deployment script futtathatóvá tétele
chmod +x scripts/deploy_cmms.sh
```

#### 2. CMMS projekt forrás könyvtár beállítása

A deployment script alapértelmezetten a `../CMMS_Project` könyvtárat keresi. Ha a CMMS projekt máshol van, állítsd be a környezeti változót:

```bash
export CMMS_SOURCE_DIR=/path/to/your/cmms/project
```

#### 3. Deployment futtatása

```bash
# Alapértelmezett beállításokkal
./scripts/deploy_cmms.sh

# Vagy egyedi beállításokkal
CMMS_SOURCE_DIR=/path/to/cmms \
CMMS_SERVER_IP=116.203.226.140 \
CMMS_SERVER_USER=root \
CMMS_SSH_KEY=~/.ssh/zedhosting_server \
./scripts/deploy_cmms.sh
```

A script:
1. Ellenőrzi az SSH kapcsolatot
2. Feltölti a telepítő scriptet és a systemd service fájlt
3. Feltölti a CMMS projekt fájlokat
4. Futtatja a telepítő scriptet
5. Ellenőrzi a telepítés sikerességét

### Módszer 2: Manuális Telepítés

Ha az automatikus deployment nem működik, vagy részletesebb kontrollt szeretnél.

#### 1. CMMS projekt fájlok feltöltése

```bash
# CMMS projekt fájlok másolása a szerverre
scp -i ~/.ssh/zedhosting_server -r /path/to/CMMS_Project root@116.203.226.140:/tmp/cmms-backend
```

#### 2. Telepítő script feltöltése

```bash
# Telepítő script másolása
scp -i ~/.ssh/zedhosting_server scripts/install_cmms_backend.sh root@116.203.226.140:/tmp/

# Systemd service fájl másolása
scp -i ~/.ssh/zedhosting_server scripts/cmms-api.service root@116.203.226.140:/tmp/
```

#### 3. Telepítés futtatása

```bash
# SSH a szerverre
ssh -i ~/.ssh/zedhosting_server root@116.203.226.140

# Telepítő script futtatása
chmod +x /tmp/install_cmms_backend.sh
sudo bash /tmp/install_cmms_backend.sh
```

## Telepítési Folyamat Részletei

A telepítő script (`install_cmms_backend.sh`) a következő lépéseket hajtja végre:

1. **Rendszer ellenőrzés**
   - Ubuntu verzió ellenőrzése
   - Python 3.10+ telepítés/ellenőrzése
   - Szükséges system package-ek telepítése

2. **CMMS user létrehozása**
   - Dedikált `cmms` user létrehozása (nem root)

3. **Python környezet**
   - Virtual environment létrehozása (`/opt/cmms-backend/venv`)
   - Python dependencies telepítése (`requirements.txt`)
   - pymysql driver telepítése

4. **Projekt fájlok**
   - Fájlok másolása `/opt/cmms-backend/`
   - Jogosultságok beállítása

5. **Konfiguráció**
   - `.env` fájl létrehozása MySQL adatokkal
   - Port konfiguráció (8000)

6. **Adatbázis inicializálás**
   - SQL schema importálás (ha van `cmms_schema.sql` fájl)

7. **Systemd service**
   - Service fájl telepítése `/etc/systemd/system/cmms-api.service`
   - Service engedélyezése és indítása

8. **Tűzfal konfiguráció**
   - UFW port 8000 megnyitása

## Konfiguráció

### MySQL Kapcsolódási Adatok

A CMMS backend a következő adatokkal csatlakozik a MySQL adatbázishoz:

- **Host:** `116.203.226.140` (külső) vagy `mysql` (Docker network)
- **Port:** `3306`
- **Database:** `zedin_cmms`
- **User:** `zedin_cmms`
- **Password:** `Gele007ta...`

**Connection String:**
```
mysql+pymysql://zedin_cmms:Gele007ta...@116.203.226.140:3306/zedin_cmms
```

### Environment Változók

A `.env` fájl a telepítés során automatikusan létrejön `/opt/cmms-backend/.env` útvonalon. A template fájl: `scripts/cmms.env.template`

Fontosabb változók:
- `DATABASE_URL`: MySQL connection string
- `API_HOST`: 0.0.0.0 (minden interfészen)
- `API_PORT`: 8000
- `ENVIRONMENT`: production
- `DEBUG`: false

### Port és Hálózat

- **CMMS API Port:** `8000`
- **Elérés:** `http://116.203.226.140:8000`
- **API Docs:** `http://116.203.226.140:8000/docs`
- **Health Check:** `http://116.203.226.140:8000/api/health/` (vagy hasonló)

## Tesztelés

### 1. Service Státusz

```bash
ssh root@116.203.226.140
systemctl status cmms-api
```

Várt kimenet: `Active: active (running)`

### 2. Logok Megtekintése

```bash
# Valós idejű logok
journalctl -u cmms-api -f

# Utolsó 50 sor
journalctl -u cmms-api -n 50

# Hibák keresése
journalctl -u cmms-api | grep -i error
```

### 3. Health Check

```bash
# Lokálisan a szerveren
curl http://localhost:8000/api/health/

# Külső elérésről
curl http://116.203.226.140:8000/api/health/
```

### 4. API Dokumentáció

Nyisd meg a böngészőben:
```
http://116.203.226.140:8000/docs
```

### 5. Port Ellenőrzés

```bash
# Port 8000 ellenőrzése
netstat -tulpn | grep 8000
# vagy
ss -tulpn | grep 8000
```

## Service Kezelés

### Service Parancsok

```bash
# Service indítása
sudo systemctl start cmms-api

# Service leállítása
sudo systemctl stop cmms-api

# Service újraindítása
sudo systemctl restart cmms-api

# Service státusz
sudo systemctl status cmms-api

# Service engedélyezése (boot után automatikus indítás)
sudo systemctl enable cmms-api

# Service letiltása (boot után ne induljon)
sudo systemctl disable cmms-api

# Service újratöltése (config változás után)
sudo systemctl daemon-reload
sudo systemctl restart cmms-api
```

### Logok Kezelése

```bash
# Valós idejű logok követése
journalctl -u cmms-api -f

# Logok időtartomány szerint
journalctl -u cmms-api --since "2024-01-01" --until "2024-01-02"

# Logok szint szerint (csak hibák)
journalctl -u cmms-api -p err

# Logok törlése (régebbi mint 7 nap)
journalctl --vacuum-time=7d
```

## Hibaelhárítás

### Service Nem Indul

**Probléma:** `systemctl status cmms-api` mutatja, hogy `failed` vagy `inactive`

**Megoldás:**
1. Ellenőrizd a logokat: `journalctl -u cmms-api -n 50`
2. Ellenőrizd a Python környezetet: `ls -la /opt/cmms-backend/venv/bin/python`
3. Ellenőrizd a `.env` fájlt: `cat /opt/cmms-backend/.env`
4. Próbáld manuálisan indítani: `sudo -u cmms /opt/cmms-backend/venv/bin/python -m uvicorn api.server:app --host 0.0.0.0 --port 8000`

### MySQL Kapcsolódási Hiba

**Probléma:** `OperationalError: (2003, "Can't connect to MySQL server")`

**Megoldás:**
1. Ellenőrizd, hogy a MySQL konténer fut: `docker ps | grep mysql`
2. Teszteld a MySQL kapcsolatot: `mysql -h 116.203.226.140 -u zedin_cmms -p'Gele007ta...' zedin_cmms`
3. Ellenőrizd a `.env` fájlban a `DATABASE_URL` értékét
4. Próbáld a `mysql` hostnevet a Docker hálózaton belül (ha a natív Python alkalmazás is a Docker hálózaton van)

### Port Foglalt

**Probléma:** `Address already in use` vagy port 8000 foglalt

**Megoldás:**
```bash
# Nézd meg, mi foglalja a portot
sudo lsof -i :8000
# vagy
sudo netstat -tulpn | grep 8000

# Állítsd le a folyamatot, vagy változtasd meg a portot a .env fájlban
```

### Python Import Hibák

**Probléma:** `ModuleNotFoundError: No module named 'xxx'`

**Megoldás:**
1. Ellenőrizd, hogy a virtual environment aktiválva van-e
2. Telepítsd újra a dependencies-t: `sudo -u cmms /opt/cmms-backend/venv/bin/pip install -r /opt/cmms-backend/requirements.txt`
3. Ellenőrizd a `requirements.txt` fájlt

### Permission Denied Hibák

**Probléma:** `Permission denied` hibák a fájlokhoz

**Megoldás:**
```bash
# Jogosultságok javítása
sudo chown -R cmms:cmms /opt/cmms-backend
sudo chmod 600 /opt/cmms-backend/.env
```

### Health Check Sikertelen

**Probléma:** Health check endpoint nem válaszol

**Megoldás:**
1. Ellenőrizd, hogy a service fut: `systemctl status cmms-api`
2. Ellenőrizd a logokat hibákért: `journalctl -u cmms-api -n 50`
3. Próbáld közvetlenül a FastAPI app-ot: `curl http://localhost:8000/`
4. Ellenőrizd, hogy a FastAPI app helyes útvonalon van-e (pl. `/api/health/` vs `/health`)

## Frissítés

### Kód Frissítése

```bash
# 1. Új fájlok feltöltése
scp -i ~/.ssh/zedhosting_server -r /path/to/CMMS_Project/* root@116.203.226.140:/tmp/cmms-backend/

# 2. SSH a szerverre
ssh -i ~/.ssh/zedhosting_server root@116.203.226.140

# 3. Fájlok másolása
sudo cp -r /tmp/cmms-backend/* /opt/cmms-backend/
sudo chown -R cmms:cmms /opt/cmms-backend

# 4. Dependencies frissítése (ha változott)
sudo -u cmms /opt/cmms-backend/venv/bin/pip install -r /opt/cmms-backend/requirements.txt

# 5. Service újraindítása
sudo systemctl restart cmms-api
```

### Konfiguráció Frissítése

```bash
# .env fájl szerkesztése
sudo nano /opt/cmms-backend/.env

# Service újraindítása (hogy az új változók betöltődjenek)
sudo systemctl restart cmms-api
```

## Biztonsági Megfontolások

1. **Dedikált User:** A service `cmms` user alatt fut, nem root
2. **File Permissions:** `.env` fájl 600 permissions (csak owner olvashatja)
3. **Tűzfal:** Csak a szükséges port (8000) van megnyitva
4. **MySQL Jogosultságok:** A `zedin_cmms` user csak a `zedin_cmms` adatbázishoz van jogosultsága
5. **SSL/TLS:** Jelenleg nincs SSL/TLS, de később hozzáadható (nginx vagy Traefik proxy)

## Eltávolítás

Ha el szeretnéd távolítani a CMMS backend-et:

```bash
# Service leállítása és letiltása
sudo systemctl stop cmms-api
sudo systemctl disable cmms-api

# Service fájl törlése
sudo rm /etc/systemd/system/cmms-api.service
sudo systemctl daemon-reload

# Install könyvtár törlése
sudo rm -rf /opt/cmms-backend

# User törlése (opcionális)
sudo userdel cmms

# Tűzfal szabály eltávolítása (opcionális)
sudo ufw delete allow 8000/tcp
```

## További Információk

- **Install könyvtár:** `/opt/cmms-backend`
- **Service név:** `cmms-api`
- **Logok:** `journalctl -u cmms-api`
- **Konfiguráció:** `/opt/cmms-backend/.env`
- **Virtual Environment:** `/opt/cmms-backend/venv`

## Kapcsolat

Ha problémáid vannak a telepítéssel vagy működéssel, ellenőrizd:
1. A service logokat: `journalctl -u cmms-api -f`
2. A MySQL kapcsolatot
3. A port elérhetőségét
4. A fájl jogosultságokat

