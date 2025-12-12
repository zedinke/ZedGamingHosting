# ZedHosting Szerver Beállítási Útmutató

Ez az útmutató lépésről lépésre vezet végig a szerver beállításán.

## Szerver információk
- **IP:** 116.203.226.140
- **User:** root
- **Password:** bdnXbNMmbe7q7TK7aVWu
- **OS:** Ubuntu 24.04

## 1. lépés: Kapcsolódás a szerverhez

Nyisd meg a terminált és csatlakozz SSH-val:

```powershell
ssh root@116.203.226.140
```

A jelszó: `bdnXbNMmbe7q7TK7aVWu`

## 2. lépés: Szerver előkészítése

Másold ki és futtasd a következő parancsokat a szerveren:

```bash
# Rendszer frissítése
apt-get update -y
apt-get upgrade -y

# Alapvető csomagok telepítése
apt-get install -y ca-certificates curl gnupg lsb-release git ufw

# Docker GPG kulcs hozzáadása
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Docker repository beállítása
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker telepítése
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker szolgáltatás indítása
systemctl start docker
systemctl enable docker

# Docker verzió ellenőrzése
docker --version
docker compose version

# Tűzfal beállítása
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 3000/tcp  # API
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Projekt könyvtár létrehozása
mkdir -p /opt/zedhosting
cd /opt/zedhosting
```

## 3. lépés: Projekt fájlok másolása

### Opció A: Git használata (ha a projekt Git repository-ban van)

```bash
cd /opt/zedhosting
git clone <repository-url> .
```

### Opció B: SCP használata (lokális gépről)

Lokális gépen (Windows PowerShell):

```powershell
# Tömörítés (ha van tar a gépen)
# Vagy használd a WinRAR/7-Zip-et manuálisan

# Fájlok másolása SCP-vel
scp -r . root@116.203.226.140:/opt/zedhosting/
```

### Opció C: Manuális fájlok feltöltése

Másold fel a következő fájlokat és könyvtárakat (kivéve: node_modules, .git, dist):
- `apps/`
- `libs/`
- `docker-compose.yml`
- `package.json`
- `nx.json`
- `tsconfig.base.json`
- Egyéb konfigurációs fájlok

## 4. lépés: .env fájl létrehozása

A szerveren, a `/opt/zedhosting` könyvtárban hozz létre egy `.env` fájlt:

```bash
cd /opt/zedhosting
nano .env
```

Másold be a következő tartalmat (generálj biztonságos jelszavakat!):

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
POSTGRES_DB=zedhosting

# Redis
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Security secrets (generálj újakat!)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
HASH_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Licensing (FRISSÍTSD!)
LICENSE_KEY=your_valid_license_key
LICENSE_SERVER_URL=https://license.zedhosting.com

# API Config
API_URL=https://116.203.226.140
PORT=3000
```

**VAGY** futtasd ezt a parancsot a szerveren, hogy automatikusan generálja:

```bash
cd /opt/zedhosting
cat > .env << 'EOF'
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=POSTGRES_PASSWORD_PLACEHOLDER
POSTGRES_DB=zedhosting

# Redis
REDIS_PASSWORD=REDIS_PASSWORD_PLACEHOLDER

# Security secrets
JWT_SECRET=JWT_SECRET_PLACEHOLDER
ENCRYPTION_KEY=ENCRYPTION_KEY_PLACEHOLDER
HASH_SECRET=HASH_SECRET_PLACEHOLDER

# Licensing
LICENSE_KEY=your_valid_license_key
LICENSE_SERVER_URL=https://license.zedhosting.com

# API Config
API_URL=https://116.203.226.140
PORT=3000
EOF

# Generálj biztonságos értékeket
DB_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
JWT_SEC=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
ENC_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
HASH_SEC=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Helyettesítsd a placeholder-eket
sed -i "s/POSTGRES_PASSWORD_PLACEHOLDER/$DB_PASS/g" .env
sed -i "s/REDIS_PASSWORD_PLACEHOLDER/$REDIS_PASS/g" .env
sed -i "s/JWT_SECRET_PLACEHOLDER/$JWT_SEC/g" .env
sed -i "s/ENCRYPTION_KEY_PLACEHOLDER/$ENC_KEY/g" .env
sed -i "s/HASH_SECRET_PLACEHOLDER/$HASH_SEC/g" .env

# Ellenőrzés
cat .env
```

## 5. lépés: Docker konténerek indítása

```bash
cd /opt/zedhosting
docker compose up -d --build
```

Ez eltarthat néhány percig, mert lefordítja az API-t.

## 6. lépés: Adatbázis migráció

Várj körülbelül 30 másodpercet, hogy a konténerek elinduljanak, majd futtasd:

```bash
docker compose exec api npx prisma migrate deploy
```

## 7. lépés: Ellenőrzés

```bash
# Konténerek státusza
docker compose ps

# API logok
docker compose logs -f api

# Tesztelés
curl http://localhost:3000/health
```

## Hasznos parancsok

```bash
# Logok megtekintése
docker compose logs -f api

# Újraindítás
docker compose restart

# Leállítás
docker compose down

# Teljes újraindítás (adatvesztés nélkül)
docker compose down
docker compose up -d --build
```

## Hibaelhárítás

### Docker nem indul el
```bash
systemctl status docker
journalctl -u docker
```

### Konténer nem indul el
```bash
docker compose logs api
docker compose ps
```

### Adatbázis kapcsolódási hiba
- Ellenőrizd a `.env` fájlban a `POSTGRES_PASSWORD` értékét
- Várj, amíg a postgres konténer elindul: `docker compose ps`


