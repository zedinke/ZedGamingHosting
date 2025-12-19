# KIMARADT FELADATOK - Implementation Plan

**Utolsó frissítés:** 2025-01-16  
**Jelenlegi állapot:** PHASE 0-4 ✅ | PHASE 5+ ⏳ | Support System ✅

---

## ✅ BEFEJEZETT FÁZISOK

### PHASE 0: Projekt Inicializálás ✅
- ✅ Nx workspace struktúra
- ✅ TypeScript strict mode
- ✅ Environment validation (Zod)
- ✅ Alapvető projekt struktúra

### PHASE 1: Shared Libraries ✅
- ✅ `libs/shared-types` - DTO-k és interface-ek
- ✅ `libs/db` - Prisma schema és service
- ✅ `libs/utils` - Utility függvények

### PHASE 2: Backend API Core ✅
- ✅ NestJS setup (Fastify adapter)
- ✅ **Licensing Module** - Fail-closed validáció, grace period
- ✅ Database Module (Prisma)
- ✅ i18n Module (HU/EN támogatás)

### PHASE 3: Backend Modules ✅
- ✅ Nodes Module - Node kezelés
- ✅ Port Manager Service - Contiguous port allocation
- ✅ Audit Logging Module
- ✅ Provisioning Module (alapok)

### PHASE 4: Daemon Core ✅
- ✅ Daemon Application setup
- ✅ Container Manager - Docker idempotens műveletek
- ✅ Startup Guard - Startup storm protection
- ✅ Reconciliation Service
- ✅ Task Processor
- ✅ Metrics Collector
- ✅ Health Checker
- ✅ Heartbeat Client

### PHASE 4.5: User-Facing Features ✅
- ✅ User Dashboard (Orders, API Keys, Onboarding)
- ✅ Reseller Admin System
- ✅ Payment Gateway Integration (Barion, PayPal, Upay)
- ✅ Invoice Generation & PDF Delivery
- ✅ Email Notification System (9 email templates)
- ✅ Error Logging & Monitoring Dashboard

### PHASE 4.6: Support System ✅ (MOST KÉSZ!)
- ✅ Support Ticketing System (Full Implementation)
  - ✅ SupportTicket & TicketComment database models
  - ✅ Support Service (CRUD operations)
  - ✅ User-facing API endpoints
  - ✅ Admin support management endpoints
  - ✅ Email notifications (ticket creation & status changes)
  - ✅ User dashboard: support tickets list/create/detail/comments
  - ✅ Admin dashboard: support overview with statistics & filtering
  - ✅ Ticket priority levels (LOW, MEDIUM, HIGH, CRITICAL)
  - ✅ Ticket status tracking (OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED)
  - ✅ Average response time calculation
  - ✅ Fully responsive UI components

### DEVOPS/INFRA ✅
- ✅ Docker Compose setup
- ✅ Traefik reverse proxy (statikus konfig)
- ✅ Adminer database admin tool
- ✅ MySQL/PostgreSQL adatbázis
- ✅ Adatbázis migrációk futtatva
- ✅ Frontend (alap landing page)

---

## ⏳ KIMARADT FELADATOK

### 🔴 PHASE 5: Daemon Advanced Features (KRITIKUS)

#### 5.1 Update Queue System
- ⏳ **SteamService** - SteamCMD wrapper
  - `apps/daemon/src/update/steam.service.ts`
  - Update progress tracking
  - Error handling
- ⏳ **UpdateQueueService** - BullMQ queue
  - `apps/daemon/src/update/update-queue.service.ts`
  - Concurrent limit: 2 updates egyszerre
  - Priority-based processing
  - Queue state management

#### 5.2 Cache Manager
- ⏳ **CacheManager** - Host-level Steam cache
  - `apps/daemon/src/cache/cache-manager.ts`
  - Cache lookup logic
  - rsync copy from cache to server
  - Cache metadata management (timestamps, sizes)
  - Cache invalidation (30 nap cleanup policy)

#### 5.3 NFS Manager
- ⏳ **NfsManager** - Cross-node clustering (ARK/Atlas)
  - `apps/daemon/src/nfs/nfs-manager.ts`
  - NFS server setup (storage node)
  - NFS client mount (client nodes)
  - `/etc/exports` management
  - Mount health check
  - Auto-remount on failure

#### 5.4 Backup Service
- ⏳ **BackupService** - Restic wrapper
  - `apps/daemon/src/backup/backup.service.ts`
  - `apps/daemon/src/backup/restic-manager.ts`
  - Restic installation check
  - Repository initialization
  - Backup creation (snapshot)
  - Backup restore
  - Retention policy (7 daily, 4 weekly, 12 monthly)
  - Integrity checks

---

## ⏳ KIMARADT FELADATOK (Priority-based)

### 🟡 PHASE 5.1: Two-Factor Authentication (HIGH PRIORITY)
- ⏳ **2FA Service Implementation**
  - Time-based OTP (TOTP) using speakeasy
  - SMS-based 2FA (optional)
  - QR code generation for authenticator apps
  - Backup codes generation and storage
  - 2FA enforcement per user
  - Login flow with 2FA verification

- ⏳ **Frontend 2FA Integration**
  - 2FA setup page in dashboard
  - QR code display component
  - Manual key input option
  - Backup codes display and download
  - Login with 2FA verification
  - Disable 2FA option for admin

- ⏳ **API Endpoints**
  - POST /auth/2fa/setup - Generate TOTP secret
  - POST /auth/2fa/enable - Enable 2FA with verification
  - POST /auth/2fa/disable - Disable 2FA
  - POST /auth/2fa/backup-codes - Generate backup codes
  - POST /auth/verify-2fa - Verify during login
  - POST /auth/verify-backup-code - Use backup code

### 🟡 PHASE 5.2: WebSocket Real-Time Updates (HIGH PRIORITY)
- ⏳ **WebSocket Gateway Setup**
  - NestJS WebSocket gateway
  - JWT authentication for WebSocket
  - Room-based event distribution
  - User-specific notifications
  - Typing indicators
  - Online status tracking

- ⏳ **Support Ticket Real-Time Updates**
  - Real-time comment notifications
  - Status change broadcasts
  - Typing indicator for comments
  - Admin ticket assignment notifications
  - Comment count live updates

- ⏳ **Server Status Real-Time**
  - Server status change broadcasts
  - Metrics streaming (CPU, RAM, Disk)
  - Console log streaming
  - File operation progress

- ⏳ **Frontend WebSocket Integration**
  - useSocket hook implementation
  - Event subscription management
  - Auto-reconnection logic
  - Message buffering when offline
  - Visual indicators for connection status

### 🟠 PHASE 5.3: Advanced Support Features
- ⏳ **Ticket Assignment System**
  - Support staff assignment
  - Workload balancing
  - Priority escalation
  - SLA tracking and alerts
  - Ticket transfer between staff

- ⏳ **Knowledge Base Integration**
  - FAQ creation and management
  - Auto-suggest solutions
  - Article linking to tickets
  - Search functionality

- ⏳ **Ticket Templates**
  - Template creation for common issues
  - Quick response templates
  - Macro functionality

### 🟠 PHASE 6: Networking és Subdomains (RÉSZBEN KÉSZ)

#### 6.1 Subdomain Service (HIÁNYZIK)
- ⏳ **SubdomainService** - DNS kezelés
  - `apps/api/src/subdomains/subdomains.service.ts`
  - `apps/api/src/subdomains/subdomains.controller.ts`
  - Subdomain létrehozás/törlés
  - IP change handling (server migration)

#### 6.2 Cloudflare Integration (HIÁNYZIK)
- ⏳ **CloudflareClient** - Cloudflare API wrapper
  - `libs/cloudflare/src/cloudflare-client.ts`
  - DNS record management (A records)
  - Zone management
  - API authentication
  - Error handling

#### 6.3 Traefik Manager (RÉSZBEN KÉSZ)
- ✅ Traefik statikus konfig (docker-compose)
- ⏳ **TraefikManager** - Dinamikus label management
  - `apps/daemon/src/traefik/traefik-manager.ts`
  - Container label update
  - SSL certificate auto-renewal monitoring
  - Health check

---

### 🔴 PHASE 7: Frontend (ALAPOK KÉSZ, DE INCOMPLETE)

#### 7.1 Next.js Setup (RÉSZBEN KÉSZ)
- ✅ Next.js alkalmazás inicializálva
- ✅ Alapvető landing page
- ❌ **i18n hiányzik** - Hardcoded angol szövegek vannak!
- ❌ **Design System hiányzik**

#### 7.2 i18n Frontend (KRITIKUS HIÁNY)
- ⏳ **next-i18next** vagy **next-intl** telepítés
  - `apps/web/locales/hu/common.json`
  - `apps/web/locales/en/common.json`
  - `apps/web/lib/i18n.ts`
- ⏳ Minden hardcoded szöveg átírása i18n kulcsokra
  - ❌ `page.tsx`-ben hardcoded szövegek!
  - ❌ Footer dátum formázás i18n-ből

#### 7.3 Design System (HIÁNYZIK)
- ⏳ **Shadcn/UI** telepítés és konfiguráció
- ⏳ **Tailwind CSS** setup (van, de nincs design system)
- ⏳ **Framer Motion** animációk
- ⏳ **Lucide React** ikonok
- ⏳ **ui-kit** library létrehozása
  - `libs/ui-kit/src/components/`
  - Shared UI components
- ⏳ **Bento Grid** layout komponens
- ⏳ **Glassmorphism** effects
- ⏳ **Dark theme** implementáció

#### 7.4 Dashboard Komponensek (HIÁNYZIK)
- ⏳ **Dashboard Page** - `apps/web/app/dashboard/page.tsx`
  - Server list
  - Metrics cards
  - Quick actions
- ⏳ **Server Card** - `apps/web/components/server-card.tsx`
  - Server status
  - Resource usage
  - Quick controls
- ⏳ **Terminal Console** - `apps/web/components/terminal-console.tsx`
  - xterm.js integráció
  - WebSocket kapcsolat
  - Command execution
- ⏳ **File Manager** - `apps/web/components/file-manager.tsx`
  - File browser
  - Upload/Download
  - Edit functionality

#### 7.5 State Management (HIÁNYZIK)
- ⏳ **Zustand** setup
  - Store struktúra
  - Auth store
  - Server store
- ⏳ **TanStack Query** setup
  - API sync
  - Cache management
  - Auto-refetch

---

### 🟡 PHASE 8: Monitoring és Observability (RÉSZBEN KÉSZ)

#### 8.1 Metrics Collection (RÉSZBEN KÉSZ)
- ✅ Daemon metrikák gyűjtése
- ⏳ **Metrics Storage** - Backend tárolás
  - `apps/api/src/metrics/metrics.module.ts`
  - `apps/api/src/metrics/metrics.service.ts`
  - Database tárolás (Metric table)
  - Retention policy (30 nap részletes, 90 nap aggregált)

#### 8.2 Prometheus Integration (HIÁNYZIK)
- ⏳ **Prometheus Exporter** - `/metrics` endpoint
  - Prometheus formátum
  - Node metrikák
  - Server metrikák
  - System metrikák

#### 8.3 Log Aggregation (HIÁNYZIK)
- ⏳ **Structured Logging** - JSON formátum
  - `apps/api/src/logging/logger.service.ts`
  - Log levels (DEBUG, INFO, WARN, ERROR)
  - Loki integration (jövőbeli)

#### 8.4 Grafana Setup (HIÁNYZIK)
- ⏳ Grafana dashboard konfiguráció
- ⏳ Metrics visualization
- ⏳ Alerting rules

---

### 🟡 PHASE 9: Alerting System (HIÁNYZIK)

#### 9.1 Alert Service
- ⏳ **AlertsModule** - `apps/api/src/alerts/alerts.module.ts`
- ⏳ **AlertsService** - `apps/api/src/alerts/alerts.service.ts`
- ⏳ **AlertRulesService** - `apps/api/src/alerts/alert-rules.service.ts`
  - Alert típusok (CRITICAL, WARNING, INFO)
  - Condition evaluation
  - Auto-resolution logic

#### 9.2 Alert Delivery
- ⏳ **Email notifications** - Nodemailer
- ⏳ **Discord webhook** integration
- ⏳ **In-app notifications** - WebSocket
- ⏳ **Alert history** tárolás

---

### 🟡 PHASE 10: Security és Compliance (RÉSZBEN KÉSZ)

#### 10.1 Authentication & Authorization (HIÁNYZIK)
- ⏳ **AuthModule** - `apps/api/src/auth/auth.module.ts`
- ⏳ **AuthService** - JWT tokens
  - Access token (15min)
  - Refresh token (7days)
- ⏳ **2FA (TOTP)** - Two-factor authentication
- ⏳ **RBAC** - Role-based access control
- ⏳ **Password hashing** - bcrypt (cost 12)
- ⏳ **Guards** - JWT auth guard, Roles guard

#### 10.2 Rate Limiting (HIÁNYZIK)
- ⏳ **RateLimitingGuard** - `apps/api/src/rate-limiting/rate-limiting.guard.ts`
  - Public API: 100 req/min
  - Authenticated: 500 req/min
  - Admin: 1000 req/min
  - Agent: 200 req/min

#### 10.3 API Key Management (RÉSZBEN KÉSZ - Schema van)
- ✅ Database schema (ApiKey model)
- ⏳ **ApiKeysService** - `apps/api/src/api-keys/api-keys.service.ts`
  - Key generation (32 bytes, base64)
  - SHA-256 hashing
  - Revocation
  - Usage tracking

#### 10.4 GDPR Compliance (HIÁNYZIK)
- ⏳ **GdprService** - `apps/api/src/gdpr/gdpr.service.ts`
  - User data export (JSON)
  - Account deletion (cascade)
  - Data retention policy (2 év inaktív)
  - Audit trail (7 év)

---

### 🟡 PHASE 11: Testing Strategy (HIÁNYZIK)

#### 11.1 Unit Tests
- ⏳ Test fájlok létrehozása
  - `apps/api/src/**/*.spec.ts`
  - `apps/daemon/src/**/*.spec.ts`
- ⏳ **Coverage target:** 80% kritikus moduloknál
- ⏳ Fókusz:
  - Port Manager algoritmus
  - Licensing validáció
  - Resource Quota számítások

#### 11.2 Integration Tests
- ⏳ **Integration test suite**
  - `apps/api/test/integration/`
- ⏳ Supertest setup
- ⏳ CRUD műveletek tesztelése
- ⏳ Database transaction tesztek

#### 11.3 E2E Tests
- ⏳ **Playwright** setup
  - `apps/web/e2e/`
- ⏳ User flows:
  - Registration -> Email verification -> Server creation
  - Admin: Node addition -> Provisioning -> Deployment

#### 11.4 Load Testing
- ⏳ **k6** scriptek
  - `scripts/load-test/`
- ⏳ Scenarios:
  - 100 concurrent users
  - 60 server API calls
  - Daemon heartbeat storm

---

### 🟡 PHASE 12: CI/CD Pipeline (HIÁNYZIK)

#### 12.1 GitHub Actions
- ⏳ **CI Workflow** - `.github/workflows/ci.yml`
  - Lint & Format (ESLint, Prettier)
  - Type Check (TypeScript)
  - Unit Tests (Jest)
  - Build (Docker images)
  - Security Scan (Trivy)
- ⏳ **CD Workflow** - `.github/workflows/cd.yml`
  - Integration Tests
  - Deploy Staging
  - E2E Tests
  - Deploy Production (manual approval)

#### 12.2 Docker Images
- ✅ Dockerfile-ok léteznek
- ⏳ **Multi-stage build** optimalizálás
- ⏳ **Security scanning** integráció
- ⏳ **Tagging strategy** (latest, v1.2.3, commit hash)

---

### 🟡 PHASE 13: Documentation (RÉSZBEN KÉSZ)

#### 13.1 API Documentation
- ⏳ **Swagger/OpenAPI** setup
  - `apps/api/src/main.ts` - Swagger config
  - Decorator-based dokumentáció
  - `/api/docs` endpoint

#### 13.2 Architecture Documentation
- ✅ PROJECT_SPEC.md létezik
- ✅ IMPLEMENTATION_PLAN.md létezik
- ⏳ **ARCHITECTURE.md** - System architecture diagrams
- ⏳ **DATA_FLOW.md** - Data flow diagrams
- ⏳ **DEPLOYMENT.md** - Deployment guide (részben kész: DEPLOY.md)

#### 13.3 Runbooks
- ⏳ **Operational runbooks**
  - `docs/runbooks/`
  - Incident response playbook
  - Disaster recovery plan

---

## 🎯 PRIORITÁS SORREND (AJÁNLOTT)

### KRITIKUS (Következő lépések):
1. **PHASE 7.2** - Frontend i18n (hardcoded szövegek kijavítása!)
2. **PHASE 5.1** - Update Queue System (Steam updates)
3. **PHASE 5.2** - Cache Manager (performance)
4. **PHASE 10.1** - Authentication & Authorization (biztonság)
5. **PHASE 7.3** - Design System (UI polish)

### FONTOS (Közép távú):
6. **PHASE 6.1-6.2** - Subdomain Service & Cloudflare (networking)
7. **PHASE 5.3-5.4** - NFS Manager & Backup Service
8. **PHASE 8.2-8.3** - Prometheus & Log Aggregation
9. **PHASE 7.4** - Dashboard components

### JÓ LENNE (Hosszú távú):
10. **PHASE 9** - Alerting System
11. **PHASE 11** - Testing Strategy
12. **PHASE 12** - CI/CD Pipeline
13. **PHASE 13** - Teljes dokumentáció

---

## 📝 KRITIKUS HIÁNYOSSÁGOK (AZONNALI JAVÍTÁS)

1. ❌ **Frontend i18n hiányzik** - `apps/web/src/app/page.tsx` hardcoded angol szövegeket tartalmaz!
2. ❌ **Design System nincs implementálva** - Nincs Shadcn/UI, nincs ui-kit library
3. ❌ **Authentication nincs** - Nincs login/logout, nincs JWT, nincs 2FA
4. ❌ **Rate limiting nincs** - API védtelen DDoS ellen

---

## 🔍 RÉSZLETEK

### Frontend i18n probléma:
```typescript
// apps/web/src/app/page.tsx - JELENLEG (ROSSZ):
<h1>Professional Game Server Hosting</h1>
<p>Enterprise-grade performance...</p>

// KELLENE (JOBB):
<h1>{t('common.hero.title')}</h1>
<p>{t('common.hero.subtitle')}</p>
```

### Update Queue hiánya:
- Steam server frissítések nincsenek queue-ban
- Concurrent limit nincs implementálva
- Progress tracking hiányzik

### Cache Manager hiánya:
- Steam cache nincs használva
- rsync copy nincs implementálva
- Cache invalidation nincs

---

**Összesen:** ~60+ konkrét feladat maradt ki  
**Kritikus:** 4 azonnali javítás  
**Prioritásos:** 9 közép távú feature


