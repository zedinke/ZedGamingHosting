---
name: ZedGamingHosting Implementation Plan
overview: Részletes, lépésről lépésre implementációs terv a ZedGamingHosting Platform megépítéséhez, amely követi a PROJECT_SPEC.md-ben leírt kritikus szabályokat és architektúrát.
todos:
  - id: phase-0
    content: "PHASE 0: Projekt inicializálás - Nx workspace, TypeScript config, env validation setup"
    status: in_progress
  - id: phase-1
    content: "PHASE 1: Shared libraries - shared-types, db (Prisma), utils létrehozása"
    status: pending
    dependencies:
      - phase-0
  - id: phase-2
    content: "PHASE 2: Backend API core - NestJS setup, Licensing Module (KRITIKUS!), Database, i18n"
    status: pending
    dependencies:
      - phase-1
  - id: phase-3
    content: "PHASE 3: Backend modules - Nodes, Port Manager, Game Servers, Audit Logging"
    status: pending
    dependencies:
      - phase-2
  - id: phase-4
    content: "PHASE 4: Daemon core - Application setup, Container Manager, Startup Guard, Reconciliation"
    status: pending
    dependencies:
      - phase-1
  - id: phase-5
    content: "PHASE 5: Daemon advanced - Update Queue, Cache Manager, NFS Manager, Backup Service"
    status: pending
    dependencies:
      - phase-4
  - id: phase-6
    content: "PHASE 6: Networking - Subdomain Service, Traefik Manager, Cloudflare integration"
    status: pending
    dependencies:
      - phase-3
      - phase-5
  - id: phase-7
    content: "PHASE 7: Frontend - Next.js setup, i18n, Design System, Dashboard components"
    status: pending
    dependencies:
      - phase-3
  - id: phase-8
    content: "PHASE 8: Monitoring - Metrics Collection, Storage, Log Aggregation"
    status: pending
    dependencies:
      - phase-4
      - phase-3
  - id: phase-9
    content: "PHASE 9: Alerting - Alert Service, Rules, Delivery (Email, Discord, WebSocket)"
    status: pending
    dependencies:
      - phase-8
  - id: phase-10
    content: "PHASE 10: Security - Auth, Rate Limiting, API Keys, GDPR Compliance"
    status: pending
    dependencies:
      - phase-2
  - id: phase-11
    content: "PHASE 11: Testing - Unit tests (80% coverage), Integration tests, E2E (Playwright), Load testing (k6)"
    status: pending
    dependencies:
      - phase-3
      - phase-7
  - id: phase-12
    content: "PHASE 12: CI/CD - GitHub Actions, Docker images, Deployment pipeline"
    status: pending
    dependencies:
      - phase-11
  - id: phase-13
    content: "PHASE 13: Documentation - API docs (Swagger), Architecture docs, Runbooks"
    status: pending
    dependencies:
      - phase-12
---

# IMPLEMENTATION_PLAN.md - ZedGamingHosting Platform

**Verzió:** 1.0

**Dátum:** 2025

**Státusz:** DRAFT - Implementation Guide

---

## Áttekintés

Ez a dokumentum a [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md) specifikáció alapján készült részletes implementációs tervet tartalmazza. A terv lépésről lépésre halad, minden kritikus szabályt figyelembe véve.

## Kritikus Előfeltételek

- Node.js 20+ LTS
- Docker & Docker Compose
- MySQL 8.0+
- Redis 7+
- Nx CLI (`npm install -g nx`)

---

## PHASE 0: Projekt Inicializálás és Alapstruktúra

### 0.1 Nx Workspace Létrehozása

**Cél:** Monorepo struktúra inicializálása

**Lépések:**

1. Nx workspace létrehozása:
   ```bash
   npx create-nx-workspace@latest zed-hosting --preset=apps --nxCloud=skip
   ```

2. Workspace struktúra:
   ```
   zed-hosting/
   ├── apps/
   │   ├── api/          # NestJS Backend
   │   ├── web/          # Next.js Frontend
   │   └── daemon/       # Node.js Agent
   ├── libs/
   │   ├── shared-types/ # DTOs, Interfaces
   │   ├── db/           # Prisma schema & client
   │   ├── utils/        # Shared utilities
   │   └── ui-kit/       # Shared UI components
   ├── docs/             # Dokumentáció
   ├── scripts/          # Helper scripts
   └── nx.json
   ```


**Fájlok:**

- `nx.json` - Nx konfiguráció
- `.gitignore` - Git ignore szabályok
- `package.json` - Root package.json

### 0.2 TypeScript Konfiguráció

**Cél:** Szigorú típusosság biztosítása

**Fájlok:**

- `tsconfig.base.json` - Base TypeScript config (strict: true)
- `apps/api/tsconfig.json` - API TypeScript config
- `apps/web/tsconfig.json` - Web TypeScript config
- `apps/daemon/tsconfig.json` - Daemon TypeScript config

**Követelmények:**

- `strict: true` minden configban
- `noImplicitAny: true`
- `strictNullChecks: true`
- Tilos az `any` típus használata

### 0.3 Environment Változók Rendszer

**Cél:** Centralizált env validáció

**Fájlok:**

- `libs/utils/src/env/` - Env validation schemas (zod)
- `apps/api/src/config/env.schema.ts` - API env schema
- `apps/daemon/src/config/env.schema.ts` - Daemon env schema
- `.env.example` - Példa env fájlok

**Követelmények:**

- Zod schema minden env változóhoz
- Validáció alkalmazás induláskor
- Tilos hardcoded értékek

---

## PHASE 1: Shared Libraries és Core Types

### 1.1 Shared Types Library

**Cél:** Központi típusdefiníciók és DTO-k

**Struktúra:**

```
libs/shared-types/
├── src/
│   ├── licensing/
│   │   ├── license.dto.ts
│   │   └── license.interface.ts
│   ├── nodes/
│   │   ├── node.dto.ts
│   │   └── node.interface.ts
│   ├── servers/
│   │   ├── server.dto.ts
│   │   └── server.interface.ts
│   ├── networking/
│   │   ├── port-allocation.dto.ts
│   │   └── network.interface.ts
│   ├── common/
│   │   ├── result.ts          # Result<T> wrapper
│   │   └── errors.ts          # Standard error types
│   └── index.ts
├── tsconfig.json
└── package.json
```

**Követelmények:**

- Minden DTO `class-validator` decoratorokkal
- `Result<T>` wrapper hibakezeléshez
- Nincs `any` típus
- Export minden típus az `index.ts`-ben

### 1.2 Database Library (Prisma)

**Cél:** Prisma schema és client

**Fájlok:**

- `libs/db/prisma/schema.prisma` - Teljes Prisma schema (PROJECT_SPEC.md 2. szekció alapján)
- `libs/db/src/prisma.service.ts` - Prisma client service
- `libs/db/src/index.ts` - Exports

**Követelmények:**

- Minden modell tartalmazza: `id`, `createdAt`, `updatedAt`
- UUID mint ID típus
- Kapcsolatok definiálva
- Indexek a kritikus mezőkön

### 1.3 Utils Library

**Cél:** Megosztott utility függvények

**Struktúra:**

```
libs/utils/
├── src/
│   ├── hwid/
│   │   └── hwid.ts              # Hardware ID generálás
│   ├── license/
│   │   └── license-validator.ts # RSA signature validation
│   ├── crypto/
│   │   └── encryption.ts        # Encryption utilities
│   ├── env/
│   │   └── env-validator.ts      # Zod env validation
│   └── index.ts
```

---

## PHASE 2: Backend API - Core Infrastructure

### 2.1 NestJS Application Setup

**Cél:** NestJS backend inicializálása

**Fájlok:**

- `apps/api/src/main.ts` - Application entry point
- `apps/api/src/app.module.ts` - Root module
- `apps/api/src/config/` - Konfigurációs modulok

**Követelmények:**

- Fastify adapter (nem Express)
- Global validation pipe (class-validator)
- Global exception filter
- i18n middleware (Accept-Language header)

### 2.2 Licensing Module (KRITIKUS - Első!)

**Cél:** Fail-closed licenc validáció

**Fájlok:**

- `apps/api/src/licensing/licensing.module.ts`
- `apps/api/src/licensing/licensing.service.ts`
- `apps/api/src/licensing/licensing.controller.ts`
- `apps/api/src/licensing/dto/validate-license.dto.ts`

**Implementáció:**

1. `onModuleInit` - License validation startup-on
2. Phone Home - License server API hívás
3. RSA signature validation
4. Redis caching (24h TTL)
5. Grace period logic (72h)
6. Node limit enforcement
7. Periodic re-validation (6h cron)

**Követelmények:**

- Ha licenc invalid -> `process.exit(1)`
- Minden hibaüzenet i18n kulcs
- Environment változók validálva

### 2.3 Database Module

**Cél:** Prisma integráció

**Fájlok:**

- `apps/api/src/database/database.module.ts`
- `apps/api/src/database/database.service.ts`

**Követelmények:**

- Prisma client dependency injection
- Connection pooling konfigurálva
- Migration script setup

### 2.4 i18n Module

**Cél:** Kétnyelvűség támogatás (HU/EN)

**Fájlok:**

- `apps/api/src/i18n/i18n.module.ts`
- `apps/api/src/i18n/i18n.service.ts`
- `apps/api/src/i18n/locales/hu/messages.json`
- `apps/api/src/i18n/locales/en/messages.json`

**Követelmények:**

- Accept-Language header parsing
- Default: HU
- Minden hibaüzenet i18n kulcsból
- Tilos hardcoded szöveg

---

## PHASE 3: Backend API - Core Modules

### 3.1 Nodes Module

**Cél:** Node kezelés és provisioning

**Fájlok:**

- `apps/api/src/nodes/nodes.module.ts`
- `apps/api/src/nodes/nodes.service.ts`
- `apps/api/src/nodes/nodes.controller.ts`
- `apps/api/src/nodes/dto/create-node.dto.ts`

**Funkciók:**

- Node regisztráció
- Provisioning token generálás
- Ansible playbook generálás
- Node health check
- License limit enforcement

### 3.2 Port Manager Service

**Cél:** Contiguous port block allocation

**Fájlok:**

- `apps/api/src/networking/port-manager.service.ts`
- `apps/api/src/networking/dto/port-allocation.dto.ts`

**Algoritmus:**

1. Contiguous port block keresés (20000-30000)
2. Atomic allocation (database transaction)
3. Game-specific port requirements (ARK: 2, Rust: 3, stb.)
4. Port deallocation
5. Conflict detection

**Követelmények:**

- Serializable isolation level
- Unique constraint: `[nodeId, port, protocol]`
- Idempotens műveletek

### 3.3 Game Servers Module

**Cél:** Játékszerver kezelés

**Fájlok:**

- `apps/api/src/servers/servers.module.ts`
- `apps/api/src/servers/servers.service.ts`
- `apps/api/src/servers/servers.controller.ts`

**Funkciók:**

- Server létrehozás
- Port allocation integráció
- Server status management
- Resource quota enforcement

### 3.4 Audit Logging Module

**Cél:** Minden módosítás naplózása

**Fájlok:**

- `apps/api/src/audit/audit.module.ts`
- `apps/api/src/audit/audit.service.ts`
- `apps/api/src/audit/audit.interceptor.ts`

**Követelmények:**

- Interceptor minden POST/PUT/DELETE műveletre
- Immutable log entries
- 7 év retention policy

---

## PHASE 4: Daemon - Core Infrastructure

### 4.1 Daemon Application Setup

**Cél:** Node.js agent inicializálás

**Fájlok:**

- `apps/daemon/src/main.ts` - Entry point
- `apps/daemon/src/app.ts` - Application class
- `apps/daemon/src/config/env.schema.ts` - Env validation

**Követelmények:**

- Environment validation startup-on
- Backend API client
- Heartbeat mechanism
- Task polling

### 4.2 Container Manager

**Cél:** Docker konténer kezelés

**Fájlok:**

- `apps/daemon/src/container/container-manager.ts`
- `apps/daemon/src/container/docker.service.ts`

**Funkciók:**

- Container létrehozás (idempotens)
- Log config (10mb max-size, 3 files)
- Resource limits (CPU, RAM)
- Container lifecycle management

**Követelmények:**

- Idempotens műveletek
- Log bomb protection
- PUID/PGID 1000 (nem root)

### 4.3 Startup Guard

**Cél:** Startup storm protection

**Fájlok:**

- `apps/api/src/daemon/startup-guard.ts`

**Funkciók:**

- Priority-based startup queue
- Sequential start (5s delay)
- Resource-aware startup
- Startup reconciliation

### 4.4 Reconciliation System

**Cél:** Öngyógyítás és szinkron

**Fájlok:**

- `apps/daemon/src/reconciliation/reconciliation.service.ts`

**Funkciók:**

- Docker state vs DB state összehasonlítás
- Orphaned container detection
- Auto-recovery
- State synchronization

---

## PHASE 5: Daemon - Advanced Features

### 5.1 Update Queue System

**Cél:** Steam update queue management

**Fájlok:**

- `apps/daemon/src/update/update-queue.service.ts`
- `apps/daemon/src/update/steam.service.ts`

**Funkciók:**

- BullMQ queue setup
- Concurrent update limit (2)
- Priority-based processing
- Progress tracking

### 5.2 Cache Manager

**Cél:** Host-level Steam cache

**Fájlok:**

- `apps/daemon/src/cache/cache-manager.ts`

**Funkciók:**

- Cache lookup
- rsync copy from cache
- Cache metadata management
- Cache invalidation
- Cleanup policy (30 days)

### 5.3 NFS Manager

**Cél:** Cross-node clustering (ARK/Atlas)

**Fájlok:**

- `apps/daemon/src/nfs/nfs-manager.ts`

**Funkciók:**

- NFS server setup (storage node)
- NFS client mount (client node)
- Export management (/etc/exports)
- Mount health check
- Auto-remount on failure

### 5.4 Backup Service

**Cél:** Restic-based backups

**Fájlok:**

- `apps/daemon/src/backup/backup.service.ts`
- `apps/daemon/src/backup/restic-manager.ts`

**Funkciók:**

- Restic installation check
- Repository initialization
- Backup creation
- Backup restore
- Retention policy (7 daily, 4 weekly, 12 monthly)
- Integrity checks

---

## PHASE 6: Networking és Subdomains

### 6.1 Subdomain Service

**Cél:** DNS és Traefik integráció

**Fájlok:**

- `apps/api/src/subdomains/subdomains.service.ts`
- `apps/api/src/subdomains/subdomains.controller.ts`
- `libs/cloudflare/src/cloudflare-client.ts` - Cloudflare API client

**Funkciók:**

- Subdomain létrehozás
- Cloudflare DNS record management
- Traefik label update
- SSL certificate management (Let's Encrypt)
- IP change handling (server migration)

### 6.2 Traefik Manager (Daemon)

**Cél:** Traefik container management

**Fájlok:**

- `apps/daemon/src/traefik/traefik-manager.ts`

**Funkciók:**

- Traefik container setup
- Label-based routing
- SSL certificate auto-renewal
- Health check

---

## PHASE 7: Frontend - Next.js Setup

### 7.1 Next.js Application

**Cél:** Frontend inicializálás

**Fájlok:**

- `apps/web/next.config.js`
- `apps/web/app/` - App Router struktúra
- `apps/web/components/` - React komponensek

**Követelmények:**

- Next.js 14+ (App Router)
- Tailwind CSS
- Shadcn/UI
- Zustand (state management)
- TanStack Query (API sync)

### 7.2 i18n Setup (Frontend)

**Cél:** Kétnyelvűség támogatás

**Fájlok:**

- `apps/web/locales/hu/common.json`
- `apps/web/locales/en/common.json`
- `apps/web/lib/i18n.ts` - i18n konfiguráció

**Követelmények:**

- next-i18next vagy next-intl
- Default: HU
- Tilos hardcoded szöveg
- Minden UI elem i18n kulcsból

### 7.3 Design System

**Cél:** Modern UI komponensek

**Fájlok:**

- `libs/ui-kit/src/components/` - Shared UI components
- `apps/web/app/globals.css` - Tailwind config

**Stílus:**

- Linear.app-like design
- Bento Grid layout
- Glassmorphism effects
- Dark theme
- Framer Motion animations

### 7.4 Dashboard Komponensek

**Cél:** Főoldal és server management

**Fájlok:**

- `apps/web/app/dashboard/page.tsx` - Dashboard
- `apps/web/components/server-card.tsx` - Server card
- `apps/web/components/terminal-console.tsx` - Terminal
- `apps/web/components/file-manager.tsx` - File manager

---

## PHASE 8: Monitoring és Observability

### 8.1 Metrics Collection (Daemon)

**Cél:** Rendszer metrikák gyűjtése

**Fájlok:**

- `apps/daemon/src/metrics/metrics-collector.ts`

**Funkciók:**

- CPU, RAM, Disk, Network metrikák (15s interval)
- Per-container metrics
- Backend API küldés (`/api/agent/metrics`)

### 8.2 Metrics Storage (Backend)

**Cél:** Metrikák tárolása és aggregálása

**Fájlok:**

- `apps/api/src/metrics/metrics.module.ts`
- `apps/api/src/metrics/metrics.service.ts`

**Funkciók:**

- Metrics tárolás (Metric table)
- Retention policy (30 nap részletes, 90 nap aggregált)
- Prometheus exporter endpoint (`/metrics`)

### 8.3 Log Aggregation

**Cél:** Strukturált logok

**Fájlok:**

- `apps/api/src/logging/logger.service.ts`
- `apps/daemon/src/logging/logger.service.ts`

**Követelmények:**

- JSON formátum
- Log levels (DEBUG, INFO, WARN, ERROR)
- Loki integration (jövőbeli)

---

## PHASE 9: Alerting System

### 9.1 Alert Service

**Cél:** Proaktív problémamegelőzés

**Fájlok:**

- `apps/api/src/alerts/alerts.module.ts`
- `apps/api/src/alerts/alerts.service.ts`
- `apps/api/src/alerts/alert-rules.service.ts`

**Alert Típusok:**

- CRITICAL: Node offline, Disk full, License expired
- WARNING: Server crash loop, High CPU/RAM
- INFO: Server started, Backup completed

**Delivery:**

- Email (Nodemailer)
- Discord webhook
- In-app notifications (WebSocket)

### 9.2 Alert Resolution

**Cél:** Automatikus és manuális resolution

**Funkciók:**

- Auto-resolve on condition fix
- Manual resolution by admin
- Alert history

---

## PHASE 10: Security és Compliance

### 10.1 Authentication & Authorization

**Cél:** Biztonságos auth rendszer

**Fájlok:**

- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/guards/jwt-auth.guard.ts`
- `apps/api/src/auth/guards/roles.guard.ts`

**Funkciók:**

- JWT tokens (15min access, 7days refresh)
- 2FA (TOTP)
- RBAC (Role-based access control)
- Password hashing (bcrypt, cost 12)

### 10.2 Rate Limiting

**Cél:** DDoS protection

**Fájlok:**

- `apps/api/src/rate-limiting/rate-limiting.guard.ts`

**Limits:**

- Public API: 100 req/min
- Authenticated: 500 req/min
- Admin: 1000 req/min
- Agent: 200 req/min

### 10.3 API Key Management

**Cél:** API key kezelés

**Fájlok:**

- `apps/api/src/api-keys/api-keys.service.ts`

**Funkciók:**

- Key generation (32 bytes, base64)
- SHA-256 hashing
- Revocation
- Usage tracking

### 10.4 GDPR Compliance

**Cél:** Adatvédelmi követelmények

**Fájlok:**

- `apps/api/src/gdpr/gdpr.service.ts`

**Funkciók:**

- User data export (JSON)
- Account deletion (cascade)
- Data retention policy (2 év inaktív)
- Audit trail (7 év)

---

## PHASE 11: Testing Strategy

### 11.1 Unit Tests

**Cél:** Kritikus modulok tesztelése

**Fájlok:**

- `apps/api/src/**/*.spec.ts`
- `apps/daemon/src/**/*.spec.ts`

**Coverage Target:** 80% kritikus moduloknál

**Fókusz:**

- Port Manager algoritmus
- Licensing validáció
- Resource Quota számítások

### 11.2 Integration Tests

**Cél:** API endpoint tesztelés

**Fájlok:**

- `apps/api/test/integration/`

**Tools:** Supertest

**Funkciók:**

- CRUD műveletek
- Edge cases
- Database transactions
- Mock external services

### 11.3 E2E Tests

**Cél:** End-to-end user flows

**Fájlok:**

- `apps/web/e2e/`

**Tools:** Playwright

**Scenarios:**

- User registration -> Email verification -> Server creation
- Admin: Node addition -> Provisioning -> Server deployment

### 11.4 Load Testing

**Cél:** Performance validation

**Fájlok:**

- `scripts/load-test/`

**Tools:** k6

**Scenarios:**

- 100 concurrent users
- 60 server API calls
- Daemon heartbeat storm

---

## PHASE 12: CI/CD Pipeline

### 12.1 GitHub Actions Workflow

**Cél:** Automatizált deployment

**Fájlok:**

- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`

**Stages:**

1. Lint & Format (ESLint, Prettier)
2. Type Check (TypeScript)
3. Unit Tests (Jest)
4. Build (Docker images)
5. Integration Tests
6. Security Scan (Trivy)
7. Deploy Staging
8. E2E Tests
9. Deploy Production (manual approval)

### 12.2 Docker Images

**Cél:** Containerized applications

**Fájlok:**

- `apps/api/Dockerfile` - Multi-stage build
- `apps/web/Dockerfile` - Multi-stage build
- `apps/daemon/Dockerfile` - Multi-stage build

**Követelmények:**

- Alpine base images
- Minimal size
- Security scanning
- Tagging strategy (latest, v1.2.3, commit hash)

---

## PHASE 13: Documentation és Runbooks

### 13.1 API Documentation

**Cél:** OpenAPI/Swagger spec

**Fájlok:**

- `apps/api/src/main.ts` - Swagger setup
- Auto-generated from decorators

**Endpoint:** `/api/docs`

### 13.2 Architecture Documentation

**Cél:** Rendszer dokumentáció

**Fájlok:**

- `docs/ARCHITECTURE.md` - System architecture
- `docs/DATA_FLOW.md` - Data flow diagrams
- `docs/DEPLOYMENT.md` - Deployment guide

### 13.3 Runbooks

**Cél:** Operációs útmutatók

**Fájlok:**

- `docs/runbooks/` - Operational runbooks
- Incident response playbook
- Disaster recovery plan

---

## PHASE 14: Billing és Payments (Jövőbeli)

### 14.1 Stripe Integration

**Cél:** Fizetési rendszer

**Fájlok:**

- `apps/api/src/billing/billing.module.ts`
- `apps/api/src/billing/stripe.service.ts`

### 14.2 Credit System

**Cél:** Prepaid credits

**Fájlok:**

- `apps/api/src/billing/credits.service.ts`

---

## PHASE 15: Support System (Jövőbeli)

### 15.1 Ticket System

**Cél:** Felhasználói támogatás

**Fájlok:**

- `apps/api/src/support/tickets.service.ts`

---

## Implementációs Sorrend Összefoglaló

1. **PHASE 0-1:** Projekt setup, shared libraries
2. **PHASE 2:** Backend core (Licensing KRITIKUS!)
3. **PHASE 3:** Backend modules (Nodes, Ports, Servers)
4. **PHASE 4:** Daemon core (Container Manager)
5. **PHASE 5:** Daemon advanced (Cache, NFS, Backup)
6. **PHASE 6:** Networking (Subdomains, Traefik)
7. **PHASE 7:** Frontend (Next.js, Dashboard)
8. **PHASE 8-9:** Monitoring & Alerting
9. **PHASE 10:** Security & Compliance
10. **PHASE 11-12:** Testing & CI/CD
11. **PHASE 13:** Documentation
12. **PHASE 14-15:** Business features (jövőbeli)

---

## Kritikus Szabályok Emlékeztető

1. ✅ **TypeScript strict mode** - Nincs `any`
2. ✅ **i18n mindenhol** - Nincs hardcoded szöveg
3. ✅ **Environment validation** - Zod schemas
4. ✅ **Idempotencia** - Daemon műveletek
5. ✅ **Fail-closed licensing** - `process.exit(1)` ha invalid
6. ✅ **Audit logging** - Minden módosítás naplózva
7. ✅ **Error handling** - Result<T> wrapper
8. ✅ **Database transactions** - Atomic műveletek

---

## Következő Lépések

1. Olvasd el ezt a tervet teljes egészében
2. Kezdd a PHASE 0-val (Projekt inicializálás)
3. Kövesd a lépéseket sorban
4. Minden modulnál ellenőrizd a kritikus szabályokat
5. Dokumentáld a változásokat

**FONTOS:** Ne ugorj át lépést! Minden fázis az előzőre épül.