# Telepítési Összefoglaló

## Probléma
Az SSH jelszó alapú hitelesítés nem működik automatikusan a Windows környezetből. 
Ezért először be kell állítani az SSH kulcsot.

## Megoldás - 2 lehetőség:

### Opció 1: Web konzol használata (ha van)
Ha a szerverhez van webes konzol hozzáférése (pl. Hetzner, DigitalOcean, stb.),
akkor ott futtasd le ezeket a parancsokat:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIENsAAk0I57byu5LEsDbOyafq1jMA3PbX26Gd4El1cUY gelea@Zedin-PC' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Opció 2: Manuális SSH kapcsolat
Ha nincs web konzol, próbáld meg manuálisan SSH-val csatlakozni:

```powershell
ssh root@116.203.226.140
# Jelszó: bdnXbNMmbe7q7TK7aVWu
```

Majd a szerveren:
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIENsAAk0I57byu5LEsDbOyafq1jMA3PbX26Gd4El1cUY gelea@Zedin-PC' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

## Utána futtasd a telepítő scriptet:

```powershell
.\deploy.ps1
```

Ez automatikusan:
1. Teszteli az SSH kapcsolatot
2. Másolja fel a server_setup.sh-t és futtatja (telepíti a Docker-t)
3. Másolja fel a projekt fájlokat
4. Elindítja a Docker konténereket
5. Futtatja az adatbázis migrációt

## Vagy manuálisan lépésről lépésre:

Lásd: `QUICK_START.md` vagy `DEPLOYMENT_GUIDE.md`

