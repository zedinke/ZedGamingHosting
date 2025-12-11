# Gyors telepítési útmutató

## 1. SSH kulcs beállítása (ajánlott)

A szerveren (jelszó: `bdnXbNMmbe7q7TK7aVWu`):

```bash
ssh root@116.203.226.140
# Bejelentkezés után:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Másold be: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIENsAAk0I57byu5LEsDbOyafq1jMA3PbX26Gd4El1cUY gelea@Zedin-PC
chmod 600 ~/.ssh/authorized_keys
exit
```

## 2. Szerver előkészítése

Másold fel a `server_setup.sh` fájlt:

```powershell
scp server_setup.sh root@116.203.226.140:/tmp/
```

Futtasd a szerveren:

```bash
ssh root@116.203.226.140
bash /tmp/server_setup.sh
```

Ez telepíti a Docker-t, Docker Compose-t és létrehozza a `.env` fájlt.

## 3. Projekt fájlok másolása

Lokális gépen:

```powershell
# Tömörítsd a projektet (kivéve: node_modules, .git, dist)
# Használhatod a 7-Zip-et vagy WinRAR-t

# Másold fel az összes fájlt:
scp -r apps libs docker-compose.yml package.json nx.json tsconfig.base.json root@116.203.226.140:/opt/zedhosting/
```

VAGY a szerveren:

```bash
cd /opt/zedhosting
# Használj git clone-t ha van repository
# Vagy másold fel másképp a fájlokat
```

## 4. LICENSE_KEY frissítése

```bash
nano /opt/zedhosting/.env
# Frissítsd: LICENSE_KEY=your_valid_license_key
```

## 5. Docker indítása

```bash
cd /opt/zedhosting
docker compose up -d --build
```

## 6. Adatbázis migráció

```bash
# Várj ~30 másodpercet, majd:
docker compose exec api npx prisma migrate deploy
```

## 7. Ellenőrzés

```bash
docker compose ps
docker compose logs api
curl http://localhost:3000/health
```

## További információk

Részletes útmutató: `DEPLOYMENT_GUIDE.md`

