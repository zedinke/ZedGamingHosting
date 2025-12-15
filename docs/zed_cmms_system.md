# Linux Backend Server Telepítési Terv

## Cél

Ubuntu 22.04 szerveren non-interactive módon telepíteni a CMMS FastAPI backend-et MySQL adatbázissal, systemd service-szel és teljes SQL schema exporttal.

## Architektúra

```
┌─────────────────────────────────────────┐
│  Ubuntu 22.04 Server                    │
│  ┌──────────────────────────────────┐  │
│  │  Python 3.10+ Virtual Env        │  │
│  │  ┌──────────────────────────────┐ │  │
│  │  │ FastAPI Backend (Port 8000)  │ │  │
│  │  │ - api/server.py              │ │  │
│  │  │ - Systemd Service            │ │  │
│  │  └──────────────────────────────┘ │  │
│  └──────────────────────────────────┘  │
│           │                            │
│           ▼                            │
│  ┌──────────────────────────────────┐  │
│  │  MySQL Connection                │  │
│  │  Host: 116.203.226.140          │  │
│  │  DB: zedin_cmms                   │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Létrehozandó fájlok

### 1. SQL Schema Export Script

**Fájl:** `CMMS_Project/scripts/export_sql_schema.py`

- SQLAlchemy modellekből generál teljes MySQL CREATE TABLE SQL-t
- Exportálja az indexeket, foreign key-ket, constraint-eket
- Kimenet: `CMMS_Project/database/cmms_schema.sql`

### 2. Telepítő Script

**Fájl:** `CMMS_Project/install_backend.sh`

- Non-interactive bash script
- Python 3.10+ telepítés ellenőrzése
- Virtual environment létrehozása
- Dependencies telepítése (requirements.txt)
- MySQL driver telepítése (pymysql)
- Konfigurációs fájlok létrehozása
- Systemd service telepítése
- Adatbázis inicializálás

### 3. Systemd Service

**Fájl:** `CMMS_Project/cmms-api.service`

- Systemd unit fájl
- Automatikus indítás boot után
- Restart policy
- Logging konfiguráció

### 4. Environment Konfiguráció

**Fájl:** `CMMS_Project/.env.example`

- MySQL kapcsolódási adatok template
- Port konfiguráció
- Debug beállítások

### 5. Konfigurációs Módosítások

**Fájl:** `CMMS_Project/config/app_config.py`

- MySQL kapcsolódás támogatás hozzáadása
- Environment változókból olvasás
- SQLite/MySQL választás

**Fájl:** `CMMS_Project/database/connection.py`

- MySQL engine létrehozás
- Connection pooling
- Auto-reconnect logika

### 6. Telepítési Dokumentáció

**Fájl:** `CMMS_Project/BACKEND_INSTALLATION.md`

- Részletes lépésről lépésre útmutató
- Előfeltételek
- Telepítési lépések
- Tesztelés
- Hibaelhárítás

## Telepítési Lépések

### Előkészítés

1. SQL schema exportálás (lokálisan)
2. Fájlok másolása szerverre
3. Telepítő script futtatása

### Telepítő Script Műveletek

1. **Rendszer ellenőrzés**

   - Ubuntu 22.04 verzió ellenőrzése
   - Python 3.10+ telepítés/ellenőrzés
   - Szükséges system package-ek telepítése

2. **Python környezet**

   - Virtual environment létrehozása (`/opt/cmms-backend/venv`)
   - Python dependencies telepítése
   - pymysql driver telepítése

3. **Alkalmazás telepítés**

   - Projekt fájlok másolása (`/opt/cmms-backend/`)
   - Szükséges könyvtárak létrehozása
   - Jogosultságok beállítása

4. **Konfiguráció**

   - `.env` fájl létrehozása MySQL adatokkal
   - `app_config.py` MySQL módra állítása
   - Port konfiguráció (8000)

5. **Adatbázis inicializálás**

   - SQL schema importálás MySQL-be
   - Default adatok beszúrása (roles, admin user, settings)

6. **Systemd service**

   - Service fájl másolása `/etc/systemd/system/`
   - Service engedélyezése
   - Service indítása

7. **Tűzfal konfiguráció**

   - UFW port 8000 megnyitása

8. **Tesztelés**

   - Health check endpoint tesztelése
   - API dokumentáció elérése

## SQL Schema Export

A `export_sql_schema.py` script:

- Betölti az összes SQLAlchemy modellt
- MySQL dialect-re konvertálja
- Generálja a CREATE TABLE, INDEX, FOREIGN KEY statement-eket
- Default értékeket és constraint-eket tartalmaz
- Kimenet: `cmms_schema.sql` (utf-8 encoding)

## Konfigurációs Változások

### app_config.py módosítások

- `USE_MYSQL` environment változó támogatás
- MySQL connection string generálás
- Fallback SQLite-re ha nincs MySQL konfigurálva

### connection.py módosítások

- MySQL engine létrehozás pymysql driver-rel
- Connection pooling (pool_size=5, max_overflow=10)
- Auto-reconnect (pool_pre_ping=True)
- SQLite fallback megtartása

## Systemd Service Konfiguráció

```ini
[Unit]
Description=CMMS REST API Backend
After=network.target mysql.service

[Service]
Type=simple
User=cmms
WorkingDirectory=/opt/cmms-backend
Environment="PATH=/opt/cmms-backend/venv/bin"
ExecStart=/opt/cmms-backend/venv/bin/python api/server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## MySQL Kapcsolódási Adatok

```
Szerver: 116.203.226.140
Felhasználónév: zedin_cmms
Jelszó: Gele007ta...
Adatbázis: zedin_cmms
```

## Biztonsági Megfontolások

1. Dedikált user létrehozása (`cmms` user)
2. Minimális jogosultságok
3. `.env` fájl védelem (600 permissions)
4. Tűzfal konfiguráció
5. MySQL SSL kapcsolat (opcionális)

## Telepítés Végrehajtása

```bash
# 1. SQL schema exportálás (lokálisan)
cd CMMS_Project
python scripts/export_sql_schema.py

# 2. Fájlok másolása szerverre
scp -r CMMS_Project user@server:/tmp/

# 3. Telepítés (szerveren)
ssh user@server
cd /tmp/CMMS_Project
sudo bash install_backend.sh
```

## Tesztelés

1. Service státusz: `systemctl status cmms-api`
2. Logok: `journalctl -u cmms-api -f`
3. Health check: `curl http://localhost:8000/api/health/`
4. API docs: `http://SERVER_IP:8000/api/docs`

## Hibaelhárítás

- MySQL kapcsolódási hibák: `.env` fájl ellenőrzése
- Port foglalt: `netstat -tulpn | grep 8000`
- Service nem indul: `journalctl -u cmms-api -n 50`
- Python import hibák: virtual environment aktiválás ellenőrzése

## Implementációs Feladatok

1. **SQL schema export script létrehozása** (`export_sql_schema.py`)
   - SQLAlchemy modellekből MySQL CREATE TABLE SQL generálás

2. **app_config.py módosítása**
   - MySQL kapcsolódás támogatás
   - Environment változók olvasása
   - USE_MYSQL flag

3. **database/connection.py módosítása**
   - MySQL engine létrehozás pymysql driver-rel
   - Connection pooling
   - Auto-reconnect

4. **install_backend.sh telepítő script létrehozása**
   - Non-interactive telepítési folyamat automatizálása
   - Függőségek: app_config és connection módosítások

5. **cmms-api.service systemd unit fájl létrehozása**
   - Automatikus indítás
   - Restart policy
   - Logging

6. **.env.example template fájl létrehozása**
   - MySQL kapcsolódási adatok template
   - Port konfiguráció

7. **requirements.txt frissítése**
   - pymysql driver hozzáadása

8. **BACKEND_INSTALLATION.md dokumentáció létrehozása**
   - Részletes telepítési útmutató
   - Tesztelés
   - Hibaelhárítás
   - Függőségek: install script és systemd service

