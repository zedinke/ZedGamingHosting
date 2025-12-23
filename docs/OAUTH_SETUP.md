# OAuth 2.0 Beállítási Útmutató - Google & Discord

## 📋 Áttekintés

Ez az útmutató leírja, hogyan kell létrehozni a Google és Discord OAuth 2.0 alkalmazásokat a szociális bejelentkezés funkciójának működtetéséhez.

---

## 1️⃣ **Google OAuth 2.0 Beállítása**

### 1.1 Google Cloud Project Létrehozása

1. Nyiss meg a [Google Cloud Console](https://console.cloud.google.com/)-t
2. Kattints a **"Select a Project"** → **"New Project"** gombra
3. Adj meg egy nevet (pl.: `ZedGamingHosting`)
4. Kattints a **Create** gombra

### 1.2 OAuth Consent Screen Konfigurálása

1. Baloldali menü: **APIs & Services** → **OAuth consent screen**
2. Válaszd az **External** lehetőséget
3. Kattints **Create**-re
4. Töltsd ki az alábbiak szerint:
   - **App name:** `ZedGamingHosting`
   - **User support email:** Az e-mail címed
   - **Developer contact:** Az e-mail címed
5. Kattints **Save and Continue**-ra
6. Az **Scopes** oldalon ne adj hozzá semmi extra scope-ot (az alapértelmezett OAuth scopes elég)
7. Kattints **Save and Continue**-ra
8. Az **Test users** oldalon add hozzá a teszteléshez használt Gmail-t
9. Kattints **Save and Continue**-ra

### 1.3 OAuth Credentials Létrehozása

1. Baloldali menü: **APIs & Services** → **Credentials**
2. Kattints **Create Credentials** → **OAuth client ID**-ra
3. Válaszd az **Web application** típust
4. **Name:** `ZedGamingHosting Web Client`
5. **Authorized JavaScript origins** (add hozzá):
   ```
   http://localhost:3000
   http://localhost:3001
   https://yourdomain.com
   ```
6. **Authorized redirect URIs** (add hozzá):
   ```
   http://localhost:3000/api/auth/google/callback
   https://yourdomain.com/api/auth/google/callback
   ```
7. Kattints **Create**-re

### 1.4 Credentials Mentése

1. A megjelent popup-ban másolja le:
   - **Client ID** → `.env.local` fájlba: `GOOGLE_CLIENT_ID`
   - **Client secret** → `.env.local` fájlba: `GOOGLE_CLIENT_SECRET`

---

## 2️⃣ **Discord OAuth 2.0 Beállítása**

### 2.1 Discord Developer Portal Megnyitása

1. Nyiss meg a [Discord Developer Portal](https://discord.com/developers/applications)-t
2. Kattints a **New Application** gombra
3. Add meg a nevet: `ZedGamingHosting`
4. Fogadd el a Terms of Service-t
5. Kattints **Create**-re

### 2.2 OAuth2 Beállítások

1. Baloldali menü: **OAuth2** → **General**
2. Másolja le a **Client ID** → `.env.local`: `DISCORD_CLIENT_ID`
3. Kattints a **Reset Secret** gombra
4. Másolja le az új secret → `.env.local`: `DISCORD_CLIENT_SECRET`

### 2.3 Redirect URIs Konfigurálása

1. Maradj az **OAuth2** → **General** oldalon
2. Görgess le a **Redirects** szekciójához
3. Kattints az **Add Another** gombra
4. Add meg az alábbi redirect URIkat:
   ```
   http://localhost:3000/api/auth/discord/callback
   https://yourdomain.com/api/auth/discord/callback
   ```
5. Kattints **Save Changes**-re

### 2.4 Bot Permissions (opcionális, csak ha szükséges)

Jelenleg nincs szükség bot permission-ökre, de ha később szeretnél Discord bot funkciókat, az **OAuth2** → **URL Generator** oldalon konfigurálható.

---

## 3️⃣ **Environment Fájl Létrehozása**

1. Másolja az `.env.local.example` fájlt az projekt gyökerében:
   ```bash
   cp .env.local.example .env.local
   ```

2. Nyisd meg a `.env.local` fájlt és töltsd ki az alábbi adatokkal:

   ```env
   GOOGLE_CLIENT_ID=<Google Cloud Console-ből kimásolt Client ID>
   GOOGLE_CLIENT_SECRET=<Google Cloud Console-ből kimásolt Client Secret>
   
   DISCORD_CLIENT_ID=<Discord Developer Portal-ből kimásolt Client ID>
   DISCORD_CLIENT_SECRET=<Discord Developer Portal-ből kimásolt Client Secret>
   
   OAUTH_REDIRECT_URI_GOOGLE=http://localhost:3000/api/auth/google/callback
   OAUTH_REDIRECT_URI_DISCORD=http://localhost:3000/api/auth/discord/callback
   
   FRONTEND_URL=http://localhost:3001
   FRONTEND_OAUTH_SUCCESS_URL=http://localhost:3001/hu/dashboard
   FRONTEND_OAUTH_ERROR_URL=http://localhost:3001/hu/login?error=oauth_failed
   ```

---

## 4️⃣ **Lokális Tesztelés**

### 4.1 Szerverek Indítása

```bash
# API szerver elindítása
npx nx serve api

# Web szerver (másik terminál)
npx nx serve web
```

### 4.2 Bejelentkezés Tesztelése

1. Nyiss meg egy böngészőt: `http://localhost:3001/hu/login`
2. Kattints a **Google-val bejelentkezés** vagy **Discord-dal bejelentkezés** gombra
3. Szükség esetén fejezd be az OAuth flow-t
4. Ellenőrizd, hogy sikeresen bejelentkeztél-e

### 4.3 2FA Tesztelése

1. Az admin dashboardban engedélyezz 2FA-t egy felhasználónak
2. Próbálj meg bejelentkezni szociális auth-val
3. Ellenőrizd, hogy a 2FA validáció még szükséges-e

---

## 5️⃣ **Staging/Production Telepítéshez**

### 5.1 Új Redirect URIk Hozzáadása

**Google Cloud Console:**
1. **APIs & Services** → **Credentials**
2. Válaszd ki az OAuth 2.0 Client ID-t
3. **Authorized JavaScript origins** - add hozzá:
   ```
   https://staging.yourdomain.com
   https://yourdomain.com
   ```
4. **Authorized redirect URIs** - add hozzá:
   ```
   https://staging.yourdomain.com/api/auth/google/callback
   https://yourdomain.com/api/auth/google/callback
   ```

**Discord Developer Portal:**
1. **OAuth2** → **General**
2. **Redirects** alatt add hozzá:
   ```
   https://staging.yourdomain.com/api/auth/discord/callback
   https://yourdomain.com/api/auth/discord/callback
   ```

### 5.2 Environment Változók a Szerveren

Az éles szerveren helyezd el az `.env.local` fájlt a projekt gyökerében vagy a Docker containerben:

```bash
docker exec zed-api cat /app/.env.local
```

---

## 🔐 **Biztonsági Megjegyzések**

1. **Soha ne commitolj .env.local fájlt** - add hozzá a `.gitignore`-hoz
2. **Client Secret titkos marad** - soha ne tüntess fel publikus forrásban
3. **State parameter** - automatikusan kezel a Passport.js
4. **HTTPS szükséges** - production-ben mindig HTTPS-t használj

---

## 🐛 **Hibaelhárítás**

### "Invalid redirect URI"
- ✅ Ellenőrizd, hogy a redirect URI pontosan megegyezik-e a Google/Discord portálban beállítottal
- ✅ Figyelj az `http://` vs `https://` és a végponti `/` karakterre

### "Client ID or Secret not found"
- ✅ Ellenőrizd, hogy az `.env.local` fájl létezik-e
- ✅ Ellenőrizd, hogy az API szerver újraindult-e az `.env.local` módosítása után

### "CORS error"
- ✅ Ellenőrizd az `FRONTEND_URL` és `FRONTEND_OAUTH_SUCCESS_URL` értékeket
- ✅ Biztosítsd, hogy a frontend szerver elérhető-e az adott URL-en

---

## 📚 **Zusätzliche Ressourcen**

- [Google OAuth 2.0 Dokumentáció](https://developers.google.com/identity/protocols/oauth2)
- [Discord OAuth 2.0 Dokumentáció](https://discord.com/developers/docs/topics/oauth2)
- [Passport.js Dokumentáció](http://www.passportjs.org/)
