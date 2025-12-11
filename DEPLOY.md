# ZedHosting Central Node (Brain) Deployment

Ez a dokumentum leírja a központi vezérlő (Backkend + DB + Redis) telepítésének lépéseit.

## Előfeltételek a szerveren
- Docker telepítve
- Docker Compose telepítve
- Git (opcionális, ha repóból húzod)

## Telepítés lépései

1. **Fájlok másolása**
   Másold fel a projekt tartalmát a szerverre (vagy `git clone`).

2. **Környezeti változók beállítása**
   Hozz létre egy `.env` fájlt a gyökérkönyvtárban a következő tartalommal (töltsd ki a saját titkos kulcsaiddal):

   ```bash
   # Database
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_db_password
   POSTGRES_DB=zedhosting

   # Redis
   REDIS_PASSWORD=your_secure_redis_password

   # Security secrets (generálj újakat!)
   JWT_SECRET=changeme_long_random_string
   ENCRYPTION_KEY=32_bytes_long_random_string_exactly_32_chars
   HASH_SECRET=random_salt_string

   # Licensing
   LICENSE_KEY=your_valid_license_key
   LICENSE_SERVER_URL=https://license.zedhosting.com

   # API Config
   API_URL=https://your-api-domain.com
   PORT=3000
   ```

3. **Indítás**
   A projekt gyökerében futtasd:

   ```bash
   docker compose up -d --build
   ```

   Ez letölti a képeket, lefordítja az API-t és elindít mindent a háttérben.

4. **Adatbázis migráció**
   Az első indítás után futtatni kell a migrációkat az adatbázis sémájának létrehozásához:

   ```bash
   docker compose exec api npx prisma migrate deploy
   ```

## Karbantartás

- **Logok megtekintése:** `docker compose logs -f api`
- **Újraindítás:** `docker compose restart`
- **Leállítás:** `docker compose down`
