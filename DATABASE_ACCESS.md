# Adatbázis hozzáférés útmutató

Ez a dokumentum leírja, hogyan lehet hozzáférni az adatbázishoz.

## 1. Adminer (Webes felület) - AJÁNLOTT ⭐

**Elérés:** `https://zedgaminghosting.hu/adminer` vagy `https://116.203.226.140/adminer`

**Bejelentkezés:**
- **Rendszer:** MySQL
- **Szerver:** `mysql` (vagy `zed-mysql`)
- **Felhasználónév:** `zedin` (root jogosultságokkal) vagy `root`
- **Jelszó:** 
  - `zedin` felhasználó: `Gele007ta...`
  - Root jelszó: lásd `.env` fájlban `MYSQL_ROOT_PASSWORD`
- **Adatbázis:** `zedhosting` (opcionális, üresen is hagyható, majd a bal oldali menüből választható)

**Előnyök:**
- Könnyű használat
- Modern webes felület
- Minden böngészőből elérhető
- Biztonságos HTTPS kapcsolat

## 2. Prisma Studio (Prisma-specifikus)

**SSH port forwarding:**
```bash
ssh -i ~/.ssh/zedhosting_server -L 5555:localhost:5555 root@116.203.226.140
```

**A szerveren:**
```bash
cd /opt/zedhosting
docker compose exec api npx prisma studio --port 5555 --hostname 0.0.0.0
```

**Helyi böngészőben:** `http://localhost:5555`

**Előnyök:**
- Prisma schema alapján működik
- Modern, intuitív UI
- Automatikus kapcsolatok (relations)
- Könnyű szerkesztés

## 3. MySQL CLI

**Közvetlenül a konténerből:**
```bash
ssh root@116.203.226.140
cd /opt/zedhosting
docker compose exec mysql mysql -uzedhosting -p zedhosting
```

**Vagy root felhasználóval:**
```bash
docker compose exec mysql mysql -uroot -prootpassword zedhosting
```

## Adatbázis információk

- **Típus:** MySQL 8.0
- **Adatbázis név:** `zedhosting`
- **Felhasználók:**
  - `root` - teljes jogosultságok
  - `zedhosting` - alkalmazás felhasználó
- **Jelszavak:** `.env` fájlban találhatók

## Biztonsági megjegyzések

⚠️ **Fontos:**
- Az Adminer csak belső hálózaton (Traefik mögött) érhető el
- Érdemes jelszót használni az Adminer-hez (később beállítható)
- Prisma Studio-t csak akkor indítsd, ha használod
- Ne oszd meg a jelszavakat publikus helyeken

