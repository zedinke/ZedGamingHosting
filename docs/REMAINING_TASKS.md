# Hátralévő Fejlesztési Feladatok

## 1. Backend API Endpoint-ok Implementálása

### Admin Endpoint-ok
- [ ] `GET /api/admin/users` - Összes felhasználó listázása
- [ ] `GET /api/admin/users/:id` - Felhasználó részletei
- [ ] `PUT /api/admin/users/:id` - Felhasználó frissítése
- [ ] `DELETE /api/admin/users/:id` - Felhasználó törlése
- [ ] `POST /api/admin/users` - Új felhasználó létrehozása
- [ ] `POST /api/admin/users/:id/balance` - Felhasználó egyenleg módosítása
- [ ] `GET /api/admin/servers` - Összes szerver listázása (admin nézet)
- [ ] `GET /api/admin/stats` - Platform statisztikák
- [ ] `PUT /api/admin/settings` - Rendszerbeállítások mentése

### Node Endpoint-ok
- [ ] `PUT /api/nodes/:id` - Node frissítése
- [ ] `DELETE /api/nodes/:id` - Node törlése

### Szerver Endpoint-ok
- [ ] `GET /api/servers/:uuid/files` - Fájlkezelő lista
- [ ] `GET /api/servers/:uuid/console` - Konzol logok lekérése
- [ ] `POST /api/servers/:uuid/console/command` - Parancs küldése
- [ ] `GET /api/servers/:uuid/metrics` - Metrikák történet
- [ ] `PUT /api/servers/:uuid/settings` - Szerver beállítások mentése
- [ ] `PUT /api/servers/:uuid/environment` - Environment változók mentése

### Auth Endpoint-ok
- [ ] `POST /api/auth/change-password` - Jelszó változtatás

## 2. Frontend Fejlesztések

### UI/UX Fejlesztések
- [ ] Loading skeletons (Suspense boundaries)
- [ ] Error boundaries
- [ ] Pagination (nagy listákhoz)
- [ ] Infinite scroll (opcionális)
- [ ] Export funkciók (CSV, JSON)
- [ ] Print-friendly nézetek
- [ ] Keyboard shortcuts
- [ ] Drag & drop fájlkezelőben

### További Funkciók
- [ ] Szerver backup/restore
- [ ] Szerver klónozás
- [ ] Bulk műveletek (több szerver/node egyszerre)
- [ ] Szerver sablonok
- [ ] Automatikus skálázás beállítások
- [ ] Értesítések (notifications)
- [ ] Email értesítések
- [ ] Dark/Light mode toggle (jelenleg csak dark van)
- [ ] Responsive design javítások
- [ ] Accessibility fejlesztések (ARIA labels, screen reader support)

### Validációk és Biztonság
- [ ] Form validációk javítása
- [ ] Rate limiting UI feedback
- [ ] CSRF protection
- [ ] XSS protection ellenőrzés
- [ ] Input sanitization

## 3. Backend Fejlesztések

### Hiányzó Funkciók
- [ ] Admin middleware/guards
- [ ] Role-based access control (RBAC) részletesebb implementáció
- [ ] Audit log endpoint-ok
- [ ] File upload/download kezelés
- [ ] WebSocket support (real-time console, metrics)
- [ ] Server-sent events (SSE) alternatíva
- [ ] Caching stratégia (Redis)
- [ ] Rate limiting per user/endpoint
- [ ] API versioning

### Integrációk
- [ ] Email service integráció (SMTP)
- [ ] Payment gateway integráció
- [ ] Discord/Slack webhook integráció
- [ ] Monitoring integráció (Prometheus, Grafana)

## 4. Dokumentáció

- [ ] API dokumentáció (Swagger/OpenAPI)
- [ ] User guide (HU/EN)
- [ ] Admin guide (HU/EN)
- [ ] Developer documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

## 5. Tesztelés

- [ ] Unit tesztek (Backend)
- [ ] Integration tesztek
- [ ] E2E tesztek (Playwright)
- [ ] Load tesztek (k6)
- [ ] Security tesztek
- [ ] Accessibility tesztek

## 6. Optimalizálás

- [ ] Bundle size optimalizálás
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Database query optimalizálás
- [ ] Caching stratégia
- [ ] CDN beállítás

## 7. Monitoring és Logging

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] User analytics
- [ ] Log aggregation (Loki)
- [ ] Alerting rendszer

## Prioritás szerint

### Magas prioritás (Kritikus funkciók)
1. Backend API endpoint-ok implementálása
2. Error handling javítása
3. Loading states
4. Form validációk

### Közepes prioritás (Fontos funkciók)
1. Export/import funkciók
2. Pagination
3. WebSocket/SSE real-time funkciókhoz
4. Email értesítések

### Alacsony prioritás (Nice to have)
1. Dark/Light mode toggle
2. Keyboard shortcuts
3. Advanced analytics
4. Dokumentáció

