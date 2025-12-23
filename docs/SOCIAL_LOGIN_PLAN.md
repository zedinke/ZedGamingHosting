# Google és Discord bejelentkezés/registráció bevezetési terv

## Cél és scope
- Google és Discord OAuth2 bejelentkezés és regisztráció támogatása a web és API rétegben.
- Egységes JWT/session kezelés a meglévő auth flow-val, 2FA kompatibilitás megőrzése.
- Fiókösszekapcsolás kezelése: meglévő e-mail alapú fiókhoz későbbi social bind, illetve social-first regisztráció új fiókkal.

## Előfeltételek és konfiguráció
- Domain: https://zedhosting.hu
- Frontend origin: https://zedhosting.hu és local fejlesztés: http://localhost:3000
- API base: https://api.zedhosting.hu (vagy jelenlegi Traefik host)
- ENV változók:
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  - DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET
  - OAUTH_REDIRECT_URI_GOOGLE=https://zedhosting.hu/api/auth/google/callback (frontend vagy backend callback döntés szerint)
  - OAUTH_REDIRECT_URI_DISCORD=https://zedhosting.hu/api/auth/discord/callback
  - FRONTEND_OAUTH_SUCCESS_URL=https://zedhosting.hu/hu/dashboard
  - FRONTEND_OAUTH_ERROR_URL=https://zedhosting.hu/hu/login?error=social
- OAuth appokban redirect URL-k engedélyezése: prod + localhost (http://localhost:3000/api/auth/google/callback stb.).

## Backend (NestJS) feladatok
1) Adatmodell
- User: adjunk mezőket: provider (enum: LOCAL | GOOGLE | DISCORD | LINKED_GOOGLE | LINKED_DISCORD), providerId (string), avatarUrl (string?), emailVerified szinkron social login esetén true.
- Session/JWT logika változatlan, de social login során is generálunk jwtid egyedi tokennel.

2) DTO-k és szolgáltatás
- Új dto: SocialLoginDto (provider, code, redirectUri optional). Ha backend-hívásos kódcsere modellt választunk.
- AuthService: socialLogin(provider, profile) -> user keresés provider/providerId alapján; ha nincs user: create user (email, name, avatar, emailVerified=true), jelszó nélkül; ha van meglévő LOCAL ugyanazzal az e-maillel: opcionális account linking flow (biztonsági pin/confirm).
- SessionsService: változatlan használat.

3) OAuth stratégia
- Két út:
  a) Backend direct code exchange: API /auth/google/callback, /auth/discord/callback, Passport custom strategy (passport-google-oauth20, passport-discord). A callback JWT-t ad vissza és redirect-el a FRONTEND_OAUTH_SUCCESS_URL-re query param-mal (token, refreshToken opcionálisan state-ben). 
  b) Frontend code exchange: frontend kap code-ot, POST /auth/social/callback (body: provider, code, redirectUri) – backend kicseréli tokenre és kiad JWT-t. 
- Javaslat: Backend callback (a) egyszerűbb, kevesebb titok a FE-ben.

4) Endpointok
- GET /auth/google, GET /auth/discord -> redirect az OAuth consent-re (state tartalmaz CSRF token + intended redirect).
- GET /auth/google/callback, GET /auth/discord/callback -> profil lekérés, user lookup/create, session, JWT, redirect success/error URL-re.
- POST /auth/social/link -> authenticated user-hez provider bind (későbbi phase, feature flag). 

5) Biztonság
- State param kötelező, CSRF védelem: véletlen nonce, Redis-ben tárolt state vagy aláírt JWT state.
- Rate limit a callback/consent endpointokra.
- Email ütközés esetén explicit jóváhagyás (nincs automatikus merge pin nélkül).
- 2FA: social login esetén is tiszteljük a user 2FA beállítását (ha van, login után 2FA verification szükséges).

6) Logolás és monitoring
- Sikeres/sikertelen social login audit log (provider, userId, email, ip, ua).
- Sentry/telemetria események a callback hibákra.

## Frontend (Next.js) feladatok
1) UI
- Login/Regisztráció oldal: „Folytatás Google-lal”, „Folytatás Discorddal” gombok.
- Loading állapot, hibaüzenet paraméter alapján (error query).

2) Flow
- Gomb megnyitja /api/auth/google vagy /api/auth/discord (backend redirect út).
- Siker esetén a backend redirect a FRONTEND_OAUTH_SUCCESS_URL-re tokennel (query param vagy fragment). FE beállítja localStorage accessToken/refreshToken, majd redirect dashboard.
- Hiba esetén FRONTEND_OAUTH_ERROR_URL.

3) Token kezelés
- Közös util: parse token from URL, store, fetch profile, majd navigate.
- Account linking UI (később): „Kapcsold össze meglévő fiókoddal”.

## Tesztelés
1) Lokális
- .env.local beállítások dummy OAuth appokkal.
- `nx serve api` + `nx serve web`; `http://localhost:3000/api/auth/google` -> consent -> callback -> dashboard token.
- Egységteszt: AuthService.socialLogin (mock provider profile).
- E2E manuális: új user Google, létező user azonos email, Discord flow.

2) Staging/Prod
- Staging OAuth app külön kulcsokkal.
- Teszt user Google/Discord fiókkal: belépés, kilépés, token refresh, 2FA bekapcsolt user.
- Negatív: visszautasított consent, hibás state, lejárt code.

## Rollout és feature flag
- Feature flag: SOCIAL_LOGIN_ENABLED (separált Google/Discord toggle).
- Dokumentáció frissítése: README/DEPLOY.md + ENV változók.
- Monitorozás: callback error arány, új user regisztrációk provider szerint.

## Lépéskövetés
1) Adatmodell bővítés (prisma schema + migráció).
2) AuthService + stratégiák (Google, Discord), state kezelés, endpointok.
3) Frontend gombok, callback token mentés, hiba UI.
4) Tesztek (unit + manuális E2E lokál/staging).
5) Rollout, env frissítés, dokumentáció.
