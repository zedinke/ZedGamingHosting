# ARCHITECTURE_MASTERPLAN.md - ZedGamingHosting Platform
**Verzió:** 7.1 (The Complete "God Mode" Edition with i18n)
**Dátum:** 2025
**Státusz:** ACTIVE - DO NOT MODIFY WITHOUT APPROVAL
**Cél:** Piacvezető, 60+ szervert/node kiszolgáló, Multi-Tenant Game Server Hosting Platform (SaaS) fejlesztése, amely licencelhető, bérbeadható, White-Label képes, Enterprise szintű stabilitással és teljes kétnyelvűséggel (HU/EN).

---

## 0. BEVEZETÉS ÉS AI IRÁNYELVEK (NAGYON FONTOS!)

Kedves AI (Cursor/Copilot), te most egy Senior Software Architect keze alá dolgozol. A feladatod nem ötletelés, hanem a specifikáció **precíz, mérnöki szintű végrehajtása**. Minden sor kritikus.

**Kritikus Fejlesztési Szabályok:**

1.  **Szigorú Típusosság (Strict Typing):** TypeScript `strict: true`. Tilos az `any` típus. Minden adatstruktúrához (request, response, config) hozz létre külön `Interface`-t vagy `DTO` osztályt a `libs/shared-types` könyvtárban. Használj `class-validator`-t minden DTO-n.
2.  **Monorepo Struktúra (Nx):**
    * `apps/api`: NestJS Backend (Control Plane).
    * `apps/web`: Next.js Frontend (User/Admin).
    * `apps/daemon`: Node.js Agent (Data Plane - a szervereken fut).
    * `libs/`: Minden megosztott logika (DB, DTO, Utils, Shared UI). **TILOS** kódot duplikálni.
3.  **Környezeti Változók:** Soha ne égess be (hardcode) IP címeket, jelszavakat, portokat vagy elérési utakat. Minden konfig jöjjön `process.env`-ből, és legyen validálva (`zod`/`joi`) az alkalmazás indulásakor.
4.  **Licencelés (Fail-Closed):** A rendszer **NEM INDULHAT EL** érvényes licenckulcs nélkül. Minden kritikus modulnak (Provisioning, Server Start) ellenőriznie kell a jogosultságot.
5.  **Hetzner Optimalizálás:** A rendszer Dedikált Hetzner szerverekre épül (Linux/Ubuntu). Használnod kell a ZFS-t (`lz4` tömörítéssel) és Docker-t.
6.  **Idempotencia:** A Daemon minden műveletének (pl. "Install Server", "Open Port") idempotensnek kell lennie. Ha kétszer hívjuk meg ugyanazt, másodjára ne dobjon hibát, hanem jelezze: "Már kész".
7.  **Kétnyelvűség (HU/EN First):**
    * **Hardcoding Tilos:** SOHA ne írj be égetett szöveget a kódba (pl. `return "Szerver elindult"` vagy `<div>Dashboard</div>`).
    * **Backend:** Minden hibaüzenet és válasz `i18n` kulcsokat használjon (pl. `SERVER_STARTED_SUCCESSFULLY`), a fordítást a kliens végzi, vagy a Backend a `Accept-Language` header alapján.
    * **Frontend:** Használj `next-intl` (ajánlott, App Router kompatibilis) vagy `next-i18next` library-t. Minden szövegnek (gombok, címkék, hibaüzenetek) külön JSON fájlban kell lennie (`messages/hu.json`, `messages/en.json` vagy `locales/hu/common.json`, `locales/en/common.json`).
    * **Default:** A rendszer alapértelmezetten Magyar (HU), de egyetlen kapcsolóval (vagy böngésző beállítás alapján) Angolra (EN) váltható legyen.

---

## 1. TECHNOLÓGIAI STACK (TELJES LISTA)

* **Backend (Control Plane):** NestJS (Modular Monolith) + Fastify adapter.
* **Async Jobs:** BullMQ (Redis alapú Queue rendszer).
* **Frontend:** Next.js 15+ (App Router), React 19+, **Zustand** (State Mgmt), **TanStack Query v5** (API Sync).
* **UI Framework:** Tailwind CSS v4, **Shadcn/UI v2**, **Framer Motion** (Advanced Animations), **Radix UI Primitives** (Accessible Components), **Lucide React** (Ikonok), **Variable Fonts** (Geist Sans, JetBrains Mono).
* **Adatbázis:** **MySQL 8.0+** (Fő adatbázis), Redis 7+ (Cache, Session, Queue).
* **ORM:** Prisma (Séma definíció és Type-safe DB access).
* **Daemon (Data Plane):** Node.js App + `dockerode` (Docker API) + `systeminformation` (Metrikák) + `ssh2` (SFTP szerver).
* **Infrastructure:** Ubuntu 24.04 LTS (vagy 22.04 LTS), Docker 27+, Ansible, ZFS, Traefik v3 (Reverse Proxy).
* **Backup:** Restic (Inkrementális, deduplikált mentés).
* **Monitoring:** Prometheus (Metrikák), Grafana (Vizualizáció), Loki (Log aggregáció), OpenTelemetry (Distributed Tracing).
* **Alerting:** AlertManager (Prometheus), Discord/Slack Webhooks, Email notifications.
* **Testing:** Jest (Unit), Supertest (Integration), Playwright (E2E), k6 (Load Testing).
* **CI/CD:** GitHub Actions / GitLab CI, Docker Registry, Automated Testing Pipeline.
* **Secret Management:** HashiCorp Vault vagy AWS Secrets Manager (Production).
* **Error Tracking:** Sentry (Frontend/Backend error tracking).

---

## 2. ADATBÁZIS SÉMA ÉS ADATMODELLEK

Az alábbi modelleket kell definiálnod a Prisma sémában (`schema.prisma`). Minden modellnek legyen `id` (UUID), `createdAt`, `updatedAt` mezője.

### 2.1 Core & Licensing (Bérbeadás alapjai)
* **SystemLicense:**
    * `licenseKey`: String (UUID, Unique)
    * `status`: Enum (ACTIVE, SUSPENDED, EXPIRED, GRACE_PERIOD)
    * `validUntil`: DateTime
    * `maxNodesAllowed`: Int
    * `whitelabelEnabled`: Boolean
    * `signature`: String (RSA aláírás a hamisítás ellen)
* **Tenant (Bérlő):**
    * `name`: String
    * `domain`: String (Unique, pl. "client.zedhosting.com")
    * `themeConfig`: JSON (Logo URL, Primary Color, Font Family)
    * `smtpConfig`: JSON (Host, User, Pass)
* **User:**
    * `email`: String (Unique)
    * `passwordHash`: String
    * `role`: Enum (SUPERADMIN, RESELLER_ADMIN, USER, SUPPORT)
    * `twoFactorSecret`: String?
    * `balance`: Float (Billing credit)
    * `tenantId`: Relation -> Tenant
* **AuditLog (Biztonság):**
    * `userId`: Relation -> User
    * `action`: String (pl. "DELETE_SERVER", "CHANGE_RCON_PASS")
    * `resourceId`: String (Target UUID)
    * `ipAddress`: String
    * `details`: JSON (OldValue, NewValue)

### 2.2 Infrastructure (Nodes & Network)
* **Node:**
    * `apiKey`: String (Unique, Auth token a Daemonnak)
    * `ipAddress`: String
    * `publicFqdn`: String (pl. "node-01.zedhosting.com")
    * `totalRam`: Int (MB)
    * `totalCpu`: Int (Cores)
    * `diskType`: Enum (NVMe, SSD, HDD)
    * `isClusterStorage`: Boolean (NFS export capability)
    * `maintenanceMode`: Boolean
    * `maxConcurrentUpdates`: Int (Default: 2)
* **NetworkAllocation (Port Manager):**
    * `nodeId`: Relation -> Node
    * `port`: Int (pl. 27015)
    * `protocol`: Enum (UDP, TCP)
    * `type`: Enum (GAME, RCON, QUERY, APP)
    * `serverUuid`: String (Relation -> GameServer, Nullable)
* **Subdomain:**
    * `subdomain`: String (pl. "minecraft-pvp")
    * `domain`: String (pl. "zedhosting.com")
    * `serverUuid`: Relation -> GameServer
    * `cloudflareId`: String (DNS record ID)

### 2.3 Game Logic (Servers & Clusters)
* **GameServer:**
    * `uuid`: String (Docker Container Name)
    * `gameType`: Enum (ARK, RUST, MINECRAFT, CS2, PALWORLD)
    * `status`: Enum (INSTALLING, RUNNING, STOPPED, STARTING, STOPPING, CRASHED)
    * `nodeId`: Relation -> Node
    * `ownerId`: Relation -> User
    * `startupPriority`: Int (Default: 10)
    * `resources`: JSON (CpuLimit, RamLimit, DiskLimit)
    * `envVars`: JSON (Custom Environment Variables)
    * `clusterId`: Relation -> GameCluster?
* **GameCluster (Cross-Node Logic):**
    * `gameType`: Enum (ARK, ATLAS)
    * `sharedSecret`: String (Cluster Password)
    * `storageNodeId`: Relation -> Node (NFS Host)
    * `mountPath`: String (pl. `/var/lib/zedhosting/clusters/{id}`)
* **Backup:**
    * `serverUuid`: Relation -> GameServer
    * `snapshotId`: String (Restic Snapshot ID)
    * `sizeBytes`: BigInt
    * `location`: Enum (LOCAL, S3, HETZNER_BOX)
* **Metric (Monitoring):**
    * `nodeId`: Relation -> Node
    * `serverUuid`: String? (Relation -> GameServer, Nullable)
    * `timestamp`: DateTime (Indexed)
    * `cpuUsage`: Float (0-100)
    * `ramUsage`: Float (MB)
    * `ramUsagePercent`: Float (0-100)
    * `diskUsage`: Float (GB)
    * `diskUsagePercent`: Float (0-100)
    * `networkIn`: BigInt (Bytes)
    * `networkOut`: BigInt (Bytes)
    * `uptime`: Int (Seconds)
* **Alert:**
    * `severity`: Enum (CRITICAL, WARNING, INFO)
    * `type`: String (NODE_OFFLINE, SERVER_CRASH_LOOP, DISK_FULL, LICENSE_EXPIRING, BACKUP_FAILED)
    * `message`: String (i18n key)
    * `resourceId`: String (Node/Server UUID)
    * `resourceType`: Enum (NODE, SERVER, SYSTEM)
    * `resolved`: Boolean
    * `resolvedAt`: DateTime?
    * `resolvedBy`: Relation -> User?
    * `metadata`: JSON (Additional context)
* **ResourceQuota:**
    * `userId`: Relation -> User
    * `tenantId`: Relation -> Tenant?
    * `maxServers`: Int
    * `maxRam`: Int (MB)
    * `maxDisk`: Int (GB)
    * `maxCpu`: Int (Cores)
    * `currentUsage`: JSON (Servers, Ram, Disk, Cpu)
    * `enforced`: Boolean (Default: true)
* **ApiKey:**
    * `userId`: Relation -> User
    * `keyHash`: String (SHA-256 hash)
    * `name`: String (User-friendly name)
    * `lastUsedAt`: DateTime?
    * `expiresAt`: DateTime?
    * `permissions`: JSON (Array of allowed endpoints)
    * `rateLimit`: Int (Requests per minute)
* **Incident:**
    * `title`: String
    * `description`: String
    * `severity`: Enum (P0, P1, P2, P3)
    * `status`: Enum (OPEN, INVESTIGATING, RESOLVED, CLOSED)
    * `assignedTo`: Relation -> User?
    * `resolvedAt`: DateTime?
    * `rootCause`: String?
    * `resolution`: String?
    * `affectedResources`: JSON (Array of Node/Server UUIDs)

---

## 3. RENDSZER MODULOK - RÉSZLETES MŰKÖDÉSI LOGIKA

### 3.1 Licensing & Security Module ("Phone Home")
**Cél:** A szoftver védelme a jogosulatlan használat ellen, licenc validáció, node limit enforcement.

#### 3.1.1 License Validation Flow

**1. Backend Startup Check (`onModuleInit`):**

```typescript
// apps/api/src/licensing/licensing.module.ts
@Module({})
export class LicensingModule implements OnModuleInit {
  async onModuleInit() {
    const result = await this.licenseService.validateLicense();
    if (!result.valid) {
      this.logger.error('License validation failed', result);
      process.exit(1); // Fail-closed: nem indulhat el érvénytelen licenccel
    }
  }
}
```

**2. License Validation Request:**

**Request Format:**
```typescript
POST https://license.zedhosting.com/api/validate
Headers:
  Content-Type: application/json
  X-API-Version: 1.0

Body:
{
  "licenseKey": "550e8400-e29b-41d4-a716-446655440000",
  "serverIp": "95.217.194.148",
  "hwid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // Hardware ID
  "timestamp": 1704067200000,
  "signature": "base64-encoded-rsa-signature"
}
```

**Hardware ID Generálás:**
```typescript
// libs/utils/src/hwid.ts
export function generateHWID(): string {
  // 1. MAC address összegyűjtése (első network interface)
  const macAddress = getMacAddress();
  
  // 2. CPU ID (CPU serial number vagy model)
  const cpuId = getCpuId();
  
  // 3. Disk serial number (első disk)
  const diskSerial = getDiskSerial();
  
  // 4. Kombinálás és SHA-256 hash
  const combined = `${macAddress}-${cpuId}-${diskSerial}`;
  return createHash('sha256').update(combined).digest('hex');
}
```

**3. License Server Response:**

**Valid License:**
```json
{
  "valid": true,
  "status": "ACTIVE",
  "validUntil": "2025-12-31T23:59:59Z",
  "maxNodesAllowed": 10,
  "whitelabelEnabled": true,
  "features": ["clustering", "backup", "monitoring"],
  "signature": "base64-rsa-signature"
}
```

**Invalid/Expired License:**
```json
{
  "valid": false,
  "status": "EXPIRED",
  "reason": "License expired on 2024-12-31",
  "gracePeriodEnds": null
}
```

**4. Response Validation (RSA Signature Check):**

```typescript
// libs/utils/src/license-validator.ts
export function validateLicenseResponse(
  response: LicenseResponse,
  publicKey: string
): boolean {
  // 1. Response payload hash
  const payload = JSON.stringify({
    valid: response.valid,
    status: response.status,
    validUntil: response.validUntil,
    maxNodesAllowed: response.maxNodesAllowed
  });
  const hash = createHash('sha256').update(payload).digest();
  
  // 2. RSA signature verification
  const verify = createVerify('RSA-SHA256');
  verify.update(payload);
  verify.end();
  
  return verify.verify(publicKey, response.signature, 'base64');
}
```

**5. Redis Caching:**

```typescript
// Cache key: license:validation:{licenseKey}
// TTL: 24 hours
// Value: { valid: true, status: "ACTIVE", cachedAt: timestamp }

async function validateLicenseWithCache(licenseKey: string) {
  const cacheKey = `license:validation:${licenseKey}`;
  
  // 1. Check Redis cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    // Check if cache is still fresh (within 24h)
    if (Date.now() - parsed.cachedAt < 24 * 60 * 60 * 1000) {
      return parsed;
    }
  }
  
  // 2. Validate with license server
  const result = await validateWithLicenseServer(licenseKey);
  
  // 3. Cache result
  await redis.setex(
    cacheKey,
    24 * 60 * 60, // 24 hours
    JSON.stringify({ ...result, cachedAt: Date.now() })
  );
  
  return result;
}
```

**6. Grace Period Logic:**

```typescript
// Ha a license server nem elérhető
if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
  // 1. Check if we have a cached valid license
  const cached = await redis.get(`license:validation:${licenseKey}`);
  if (cached) {
    const parsed = JSON.parse(cached);
    // Use cached result if less than 72 hours old
    if (Date.now() - parsed.cachedAt < 72 * 60 * 60 * 1000) {
      this.logger.warn('License server unreachable, using cached license (Grace Period)');
      return parsed;
    }
  }
  
  // 2. Check grace period flag in database
  const license = await prisma.systemLicense.findUnique({
    where: { licenseKey }
  });
  
  if (license?.status === 'GRACE_PERIOD') {
    const gracePeriodEnds = new Date(license.gracePeriodEnds);
    if (gracePeriodEnds > new Date()) {
      // Still in grace period
      this.logger.warn(`Grace period active until ${gracePeriodEnds}`);
      await this.sendAdminAlert('LICENSE_GRACE_PERIOD', {
        endsAt: gracePeriodEnds
      });
      return { valid: true, status: 'GRACE_PERIOD' };
    } else {
      // Grace period expired
      this.logger.error('Grace period expired, system must shutdown');
      process.exit(1);
    }
  } else {
    // First time license server unreachable
    // Enter grace period
    await prisma.systemLicense.update({
      where: { licenseKey },
      data: {
        status: 'GRACE_PERIOD',
        gracePeriodEnds: new Date(Date.now() + 72 * 60 * 60 * 1000)
      }
    });
    await this.sendAdminAlert('LICENSE_GRACE_PERIOD_STARTED');
    return { valid: true, status: 'GRACE_PERIOD' };
  }
}
```

**7. Node Limit Enforcement:**

```typescript
// apps/api/src/nodes/nodes.service.ts
async function registerNode(nodeData: CreateNodeDto): Promise<Node> {
  // 1. Get current license
  const license = await this.licenseService.getCurrentLicense();
  
  // 2. Count existing active nodes
  const activeNodeCount = await prisma.node.count({
    where: {
      status: 'ONLINE',
      deletedAt: null
    }
  });
  
  // 3. Check limit
  if (activeNodeCount >= license.maxNodesAllowed) {
    throw new ForbiddenException({
      code: 'NODE_LIMIT_EXCEEDED',
      message: `Maximum ${license.maxNodesAllowed} nodes allowed. Current: ${activeNodeCount}`,
      maxNodes: license.maxNodesAllowed,
      currentNodes: activeNodeCount
    });
  }
  
  // 4. Create node
  return await prisma.node.create({
    data: {
      ...nodeData,
      apiKey: this.generateApiKey(),
      status: 'PROVISIONING'
    }
  });
}
```

**8. Periodic License Re-validation:**

```typescript
// Cron job: Every 6 hours
@Cron('0 */6 * * *') // Every 6 hours
async function revalidateLicense() {
  const license = await prisma.systemLicense.findFirst({
    where: { status: { in: ['ACTIVE', 'GRACE_PERIOD'] } }
  });
  
  if (!license) {
    this.logger.error('No active license found');
    return;
  }
  
  const result = await this.licenseService.validateLicense(license.licenseKey);
  
  if (!result.valid) {
    // Update license status
    await prisma.systemLicense.update({
      where: { id: license.id },
      data: {
        status: result.status === 'EXPIRED' ? 'EXPIRED' : 'SUSPENDED'
      }
    });
    
    // Send alert
    await this.alertService.createAlert({
      severity: 'CRITICAL',
      type: 'LICENSE_INVALID',
      message: `License validation failed: ${result.reason}`
    });
    
    // Don't exit process, but prevent new operations
    this.licenseService.setReadOnlyMode(true);
  }
}
```

**9. License Status Monitoring:**

```typescript
// Health check endpoint
@Get('/health/license')
async checkLicenseHealth() {
  const license = await prisma.systemLicense.findFirst({
    where: { status: { in: ['ACTIVE', 'GRACE_PERIOD'] } }
  });
  
  if (!license) {
    return {
      status: 'UNHEALTHY',
      message: 'No active license'
    };
  }
  
  const daysUntilExpiry = Math.floor(
    (new Date(license.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  return {
    status: license.status === 'ACTIVE' ? 'HEALTHY' : 'WARNING',
    licenseStatus: license.status,
    validUntil: license.validUntil,
    daysUntilExpiry,
    maxNodesAllowed: license.maxNodesAllowed,
    currentNodes: await prisma.node.count({ where: { status: 'ONLINE' } })
  };
}
```

**10. Admin Alerts:**

```typescript
// Alert types:
- LICENSE_EXPIRING: 30 days before expiry
- LICENSE_EXPIRING: 7 days before expiry
- LICENSE_EXPIRING: 1 day before expiry
- LICENSE_EXPIRED: License expired
- LICENSE_GRACE_PERIOD_STARTED: Entered grace period
- LICENSE_GRACE_PERIOD_EXPIRING: Grace period ending soon (24h)
- NODE_LIMIT_WARNING: 80% of max nodes reached
- NODE_LIMIT_EXCEEDED: Max nodes exceeded (should not happen, but alert if it does)
```

**11. Environment Variables:**

```bash
# .env
LICENSE_SERVER_URL=https://license.zedhosting.com
LICENSE_KEY=550e8400-e29b-41d4-a716-446655440000
LICENSE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
LICENSE_VALIDATION_CACHE_TTL=86400 # 24 hours in seconds
LICENSE_GRACE_PERIOD_HOURS=72
LICENSE_REVALIDATION_INTERVAL=21600 # 6 hours in seconds
```

**12. Error Handling:**

```typescript
// Fail-closed strategy
try {
  const result = await validateLicense();
  if (!result.valid) {
    this.logger.fatal('License invalid, shutting down');
    // Send final alert
    await this.sendCriticalAlert('SYSTEM_SHUTDOWN_LICENSE_INVALID');
    // Graceful shutdown
    await this.shutdownGracefully();
    process.exit(1);
  }
} catch (error) {
  // Network error - enter grace period
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    await this.enterGracePeriod();
  } else {
    // Unknown error - fail closed
    this.logger.fatal('License validation error', error);
    process.exit(1);
  }
}
```

**13. Testing & Mocking:**

```typescript
// For development/testing
if (process.env.NODE_ENV === 'development') {
  // Mock license server
  const mockLicenseServer = {
    valid: true,
    status: 'ACTIVE',
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    maxNodesAllowed: 999,
    whitelabelEnabled: true
  };
  
  // Use mock if LICENSE_SERVER_URL is not set
  if (!process.env.LICENSE_SERVER_URL) {
    return mockLicenseServer;
  }
}
```

### 3.2 Provisioning Module (Ansible & ZFS)
**Cél:** "Bare Metal" szerverből Game Hosting Node varázslása automatikusan.

#### 3.2.1 Node Onboarding Folyamat (Hetzner Szerver Csatlakoztatása)

**Lépésről lépésre útmutató új Hetzner szerver hozzáadásához:**

**1. Előfeltételek:**
   * Hetzner szerver rendelve (Ubuntu 24.04 LTS vagy 22.04 LTS)
   * Root SSH hozzáférés (jelszó vagy SSH kulcs)
   * Publikus IP cím
   * Minimum 4 CPU core, 16GB RAM, 100GB SSD (ajánlott: 8 core, 32GB RAM, 500GB NVMe)

**2. Admin Felületen Node Hozzáadása:**
   * Menj az **Admin → Nodes** menüpontra (`/admin/nodes`)
   * Kattints az **"Add New Node"** gombra
   * Töltsd ki az adatokat:
     * **Name**: Node egyedi neve (pl. "Helsinki-Node-01")
     * **IP Address**: Hetzner szerver publikus IP címe
     * **Public FQDN**: Opcionális DNS név (pl. "node-01.zedhosting.com")
     * **SSH Port**: Alapértelmezett 22
     * **SSH User**: Alapértelmezett "root" (vagy sudo user)
     * **SSH Key Path**: Opcionális - SSH privát kulcs útvonala (vagy jelszó alapú auth)
     * **Total RAM (MB)**: Szerver RAM mennyisége
     * **Total CPU (Cores)**: CPU magok száma
     * **Disk Type**: NVMe / SSD / HDD
     * **Cluster Storage**: Checkbox, ha NFS export képesség kell

**3. Provisioning Token Generálás:**
   * A rendszer automatikusan generál egy egyedi `ProvisioningToken`-t (UUID)
   * Ez a token 24 óráig érvényes
   * A token biztonságos, csak az adott IP címről használható

**4. Automatikus Provisioning (Ansible Playbook):**
   * A Backend elindít egy Ansible Playbook-ot SSH-n keresztül
   * **Ansible Inventory:** Dinamikusan generált a Node IP alapján
   * **Playbook Fázisok:**
     
     **a) Rendszer Frissítés:**
     ```yaml
     - name: Update system packages
       apt: update_cache=yes upgrade=dist
     ```
     
     **b) ZFS Konfiguráció (KRITIKUS):**
     * Telepíti a `zfsutils-linux`-ot
     * Létrehozza a `/var/lib/zedhosting` ZFS pool-t
     * **Beállítja az `lz4` tömörítést:** `zfs set compression=lz4 zedhosting`
     * *Indoklás: JSON/XML alapú játékmentéseknél ez 3-szoros sebességnövekedést és 50%-os helymegtakarítást jelent.*
     * Létrehozza a szükséges dataset-eket:
       * `/var/lib/zedhosting/servers` (játékszerverek)
       * `/var/lib/zedhosting/steam_cache` (Steam cache)
       * `/var/lib/zedhosting/clusters` (cluster storage)
       * `/var/lib/zedhosting/backups` (backup staging)
     
     **c) Docker Telepítés:**
     * Telepíti a Docker Engine-t és Docker Compose-t
     * Docker daemon konfiguráció: log rotation (max-size: 10m, max-file: 3)
     * Docker user group létrehozása (`zedhosting` user)
     
     **d) Hálózati Setup:**
     * UFW Tűzfal konfiguráció:
       * SSH (22) - nyitott
       * Daemon API port (configurálható, default: 3001) - nyitott
       * Game Port Range (20000-30000 UDP/TCP) - nyitott
       * HTTP/HTTPS (80/443) - nyitott (Traefik-hez)
     * IP forwarding engedélyezése (Docker networking-hez)
     
     **e) Traefik Telepítés:**
     * Docker konténerként indítja a Traefik-et (Host Network mode)
     * Let's Encrypt SSL automatikus kezelés
     * Subdomain routing konfiguráció
     
     **f) ZedDaemon (Agent) Telepítés:**
     * Letölti a Daemon kódot a Git repository-ból (vagy Docker image-ből)
     * Létrehozza a `.env` fájlt a következő változókkal:
       * `MANAGER_URL`: Backend API URL
       * `API_KEY`: Automatikusan generált API key (Node regisztrációhoz)
       * `NODE_ID`: Node UUID (Backend-től kapott)
       * `PROVISIONING_TOKEN`: Egyedi provisioning token
     * Systemd service létrehozása: `zeddaemon.service`
     * Service elindítása és enable (auto-start on boot)

**5. Node Regisztráció:**
   * A Daemon induláskor automatikusan regisztrálja magát a Backend-hez
   * **Regisztrációs Request:**
     ```json
     POST /api/agent/register
     {
       "agentId": "generated-uuid",
       "agentIp": "node-public-ip",
       "machineId": "node-uuid-from-db",
       "version": "1.0.0",
       "capabilities": {
         "docker": true,
         "zfs": true,
         "nfs": false
       },
       "provisioningToken": "token-from-env"
     }
     ```
   * Backend validálja a `provisioningToken`-t
   * Backend létrehozza az `Agent` rekordot az adatbázisban
   * Backend visszaküldi az `apiKey`-t (permanent authentication)

**6. Heartbeat & Health Check:**
   * Daemon 30 másodpercenként küld heartbeat-et: `POST /api/agent/heartbeat`
   * Backend frissíti a Node `lastHeartbeat` mezőjét
   * Ha 2 percig nincs heartbeat -> Node `OFFLINE` státusz

**7. Ellenőrzés:**
   * Admin felületen ellenőrizd:
     * ✅ Node státusz: **ONLINE**
     * ✅ Agent státusz: **ONLINE**
     * ✅ ZFS pool: Létrehozva, `compression=lz4`
     * ✅ Docker: Fut, version check
     * ✅ Traefik: Konténer fut, port 80/443 elérhető
     * ✅ Daemon: Systemd service `active (running)`

**8. Manuális Provisioning (Ha Ansible nem elérhető):**
   
   Ha az Ansible provisioning nem működik, manuálisan is beállíthatod:
   
   ```bash
   # SSH a szerverre
   ssh root@<node-ip>
   
   # 1. Rendszer frissítés
   apt update && apt upgrade -y
   
   # 2. ZFS telepítés
   apt install -y zfsutils-linux
   
   # 3. ZFS pool létrehozás (cseréld ki /dev/sda-t a tényleges lemezre)
   zpool create -f zedhosting /dev/sda
   zfs set compression=lz4 zedhosting
   zfs create zedhosting/servers
   zfs create zedhosting/steam_cache
   zfs create zedhosting/clusters
   zfs create zedhosting/backups
   
   # 4. Docker telepítés
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # 5. UFW tűzfal
   ufw allow 22/tcp
   ufw allow 3001/tcp
   ufw allow 20000:30000/udp
   ufw allow 20000:30000/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw --force enable
   
   # 6. Daemon telepítés (példa - pontos parancs az admin felületen található)
   git clone https://github.com/your-org/zeddaemon.git /opt/zeddaemon
   cd /opt/zeddaemon
   npm install
   cp .env.example .env
   # Szerkeszd a .env fájlt: MANAGER_URL, API_KEY, stb.
   npm run build
   systemctl enable zeddaemon
   systemctl start zeddaemon
   ```

**9. Troubleshooting:**
   
   **Node nem regisztrálódik:**
   * Ellenőrizd az SSH kapcsolatot: `ssh root@<ip>`
   * Ellenőrizd a Daemon logokat: `journalctl -u zeddaemon -f`
   * Ellenőrizd a provisioning token érvényességét (24h TTL)
   
   **ZFS pool nem jön létre:**
   * Ellenőrizd a lemez elérhetőségét: `lsblk`
   * Ellenőrizd a ZFS telepítést: `which zpool`
   * Manuális pool létrehozás (lásd fent)
   
   **Docker nem működik:**
   * Docker daemon fut: `systemctl status docker`
   * Docker permissions: `usermod -aG docker zedhosting`
   
   **Traefik nem indít:**
   * Docker konténer státusz: `docker ps -a | grep traefik`
   * Port konfliktus ellenőrzés: `netstat -tulpn | grep :80`

#### 3.2.2 Provisioning Token Biztonság

**Token Generálás:**
* Backend generál egy UUID v4 token-t
* Token tárolása: `Node.provisioningToken` (hashed, SHA-256)
* Token TTL: 24 óra (utána új token generálás szükséges)

**Token Validáció:**
* Token csak az adott Node IP címről használható
* Token csak egyszer használható (one-time use)
* Token invalidálódik sikeres regisztráció után

**Token Rotation:**
* Admin újragenerálhatja a token-t az admin felületen
* Régi token azonnal invalidálódik
* Új token 24 órás TTL-lel jön létre

### 3.3 Advanced Port Manager Service
**Probléma:** ARK-nak 2 port (Game+Query), Rust-nak 3 port (Game+Rcon+App) kell. A véletlenszerű kiosztás ütközést okoz.
**Megoldás:** Contiguous port block allocation algoritmus - egymás melletti portok garantált lefoglalása.

#### 3.3.1 Port Allocation Algoritmus

**1. Input Paraméterek:**

```typescript
interface PortAllocationRequest {
  nodeId: string;
  neededPorts: number; // Pl. 3 (Rust: Game, RCON, App)
  protocol: 'UDP' | 'TCP' | 'BOTH'; // BOTH = UDP és TCP is
  gameType: GameType; // ARK, RUST, MINECRAFT, etc.
  serverUuid?: string; // Ha már létezik a szerver
}
```

**2. Port Range Konfiguráció:**

```typescript
// Environment variables
PORT_RANGE_START=20000
PORT_RANGE_END=30000
PORT_ALLOCATION_STRATEGY=CONTIGUOUS // vagy RANDOM (deprecated)

// Game-specific port requirements
const GAME_PORT_REQUIREMENTS = {
  ARK: { count: 2, types: ['GAME', 'QUERY'] },
  RUST: { count: 3, types: ['GAME', 'RCON', 'APP'] },
  MINECRAFT: { count: 1, types: ['GAME'] },
  CS2: { count: 2, types: ['GAME', 'TV'] },
  PALWORLD: { count: 2, types: ['GAME', 'QUERY'] }
};
```

**3. Find Contiguous Port Block Algoritmus:**

```typescript
// apps/api/src/networking/port-manager.service.ts
async function findContiguousPortBlock(
  nodeId: string,
  neededPorts: number,
  protocol: 'UDP' | 'TCP' | 'BOTH'
): Promise<number | null> {
  // 1. Get all existing allocations for this node
  const existingAllocations = await prisma.networkAllocation.findMany({
    where: {
      nodeId,
      OR: protocol === 'BOTH' 
        ? [{ protocol: 'UDP' }, { protocol: 'TCP' }]
        : [{ protocol }]
    },
    select: { port: true },
    orderBy: { port: 'asc' }
  });
  
  const usedPorts = new Set(existingAllocations.map(a => a.port));
  
  // 2. Iterate through port range
  const startPort = parseInt(process.env.PORT_RANGE_START || '20000');
  const endPort = parseInt(process.env.PORT_RANGE_END || '30000');
  
  for (let candidatePort = startPort; candidatePort <= endPort - neededPorts + 1; candidatePort++) {
    // 3. Check if we can fit neededPorts starting from candidatePort
    let canAllocate = true;
    const portsToCheck: number[] = [];
    
    for (let offset = 0; offset < neededPorts; offset++) {
      const portToCheck = candidatePort + offset;
      
      // Check if port is in range
      if (portToCheck > endPort) {
        canAllocate = false;
        break;
      }
      
      // Check if port is already allocated
      if (usedPorts.has(portToCheck)) {
        canAllocate = false;
        break;
      }
      
      portsToCheck.push(portToCheck);
    }
    
    // 4. If we found a contiguous block, return the start port
    if (canAllocate) {
      return candidatePort;
    }
  }
  
  // 5. No contiguous block found
  return null;
}
```

**4. Atomic Port Allocation (Database Transaction):**

```typescript
async function allocatePortBlock(
  request: PortAllocationRequest
): Promise<NetworkAllocation[]> {
  // Use database transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // 1. Re-check available ports (double-check locking pattern)
    const startPort = await this.findContiguousPortBlock(
      request.nodeId,
      request.neededPorts,
      request.protocol
    );
    
    if (!startPort) {
      throw new Error(
        `No available contiguous port block of size ${request.neededPorts} on node ${request.nodeId}`
      );
    }
    
    // 2. Get game-specific port types
    const gameRequirements = GAME_PORT_REQUIREMENTS[request.gameType];
    if (!gameRequirements) {
      throw new Error(`Unknown game type: ${request.gameType}`);
    }
    
    // 3. Create allocations atomically
    const allocations: NetworkAllocation[] = [];
    
    for (let i = 0; i < request.neededPorts; i++) {
      const port = startPort + i;
      const portType = gameRequirements.types[i] || 'GAME';
      
      // Determine protocol for this port
      let portProtocol: 'UDP' | 'TCP' = request.protocol === 'BOTH' 
        ? (portType === 'RCON' ? 'TCP' : 'UDP') // RCON is usually TCP
        : request.protocol;
      
      // Create allocation
      const allocation = await tx.networkAllocation.create({
        data: {
          nodeId: request.nodeId,
          port,
          protocol: portProtocol,
          type: portType as any,
          serverUuid: request.serverUuid || null
        }
      });
      
      allocations.push(allocation);
    }
    
    // 4. Log allocation
    await this.auditLog.create({
      action: 'PORT_ALLOCATED',
      resourceId: request.serverUuid || 'unknown',
      details: {
        nodeId: request.nodeId,
        ports: allocations.map(a => `${a.port}/${a.protocol}`),
        gameType: request.gameType
      }
    });
    
    return allocations;
  }, {
    isolationLevel: 'Serializable', // Highest isolation level
    timeout: 10000 // 10 second timeout
  });
}
```

**5. Port Deallocation:**

```typescript
async function deallocatePorts(
  serverUuid: string
): Promise<void> {
  // Find all allocations for this server
  const allocations = await prisma.networkAllocation.findMany({
    where: { serverUuid }
  });
  
  if (allocations.length === 0) {
    this.logger.warn(`No ports to deallocate for server ${serverUuid}`);
    return;
  }
  
  // Delete all allocations
  await prisma.networkAllocation.deleteMany({
    where: { serverUuid }
  });
  
  // Log deallocation
  await this.auditLog.create({
    action: 'PORT_DEALLOCATED',
    resourceId: serverUuid,
    details: {
      ports: allocations.map(a => `${a.port}/${a.protocol}`)
    }
  });
  
  this.logger.info(`Deallocated ${allocations.length} ports for server ${serverUuid}`);
}
```

**6. Port Validation & Conflict Detection:**

```typescript
async function validatePortAvailability(
  nodeId: string,
  port: number,
  protocol: 'UDP' | 'TCP'
): Promise<boolean> {
  // 1. Check database
  const existing = await prisma.networkAllocation.findFirst({
    where: {
      nodeId,
      port,
      protocol
    }
  });
  
  if (existing) {
    return false;
  }
  
  // 2. Check if port is in valid range
  const startPort = parseInt(process.env.PORT_RANGE_START || '20000');
  const endPort = parseInt(process.env.PORT_RANGE_END || '30000');
  
  if (port < startPort || port > endPort) {
    return false;
  }
  
  // 3. Optional: Check if port is actually free on the node (via Daemon)
  // This is a safety check - Daemon can verify port is not in use by system
  try {
    const daemonResponse = await this.daemonClient.checkPort(nodeId, port, protocol);
    return daemonResponse.available;
  } catch (error) {
    // If Daemon is unreachable, trust database
    this.logger.warn(`Could not verify port ${port} with Daemon, trusting database`);
    return true;
  }
}
```

**7. Port Reallocation (Server Migration):**

```typescript
async function reallocatePortsForMigration(
  serverUuid: string,
  fromNodeId: string,
  toNodeId: string
): Promise<NetworkAllocation[]> {
  // 1. Get current allocations
  const currentAllocations = await prisma.networkAllocation.findMany({
    where: { serverUuid }
  });
  
  if (currentAllocations.length === 0) {
    throw new Error(`No ports allocated for server ${serverUuid}`);
  }
  
  // 2. Deallocate from old node
  await this.deallocatePorts(serverUuid);
  
  // 3. Allocate on new node (try to get same port numbers if possible)
  const neededPorts = currentAllocations.length;
  const protocol = currentAllocations[0].protocol;
  
  // Try to allocate same ports first
  let newAllocations: NetworkAllocation[] = [];
  const preferredStartPort = currentAllocations[0].port;
  
  // Check if preferred ports are available
  const preferredAvailable = await this.checkPortBlockAvailable(
    toNodeId,
    preferredStartPort,
    neededPorts,
    protocol
  );
  
  if (preferredAvailable) {
    // Allocate preferred ports
    newAllocations = await this.allocateSpecificPorts(
      toNodeId,
      serverUuid,
      currentAllocations.map(a => ({ port: a.port, protocol: a.protocol, type: a.type }))
    );
  } else {
    // Allocate new contiguous block
    newAllocations = await this.allocatePortBlock({
      nodeId: toNodeId,
      neededPorts,
      protocol,
      gameType: currentAllocations[0].type as any,
      serverUuid
    });
  }
  
  this.logger.info(
    `Reallocated ports for server ${serverUuid}: ` +
    `${fromNodeId} -> ${toNodeId}, ` +
    `ports: ${currentAllocations.map(a => a.port).join(',')} -> ${newAllocations.map(a => a.port).join(',')}`
  );
  
  return newAllocations;
}
```

**8. Port Statistics & Reporting:**

```typescript
async function getPortStatistics(nodeId: string): Promise<PortStatistics> {
  const allocations = await prisma.networkAllocation.findMany({
    where: { nodeId }
  });
  
  const startPort = parseInt(process.env.PORT_RANGE_START || '20000');
  const endPort = parseInt(process.env.PORT_RANGE_END || '30000');
  const totalPorts = endPort - startPort + 1;
  
  const usedPorts = allocations.length;
  const availablePorts = totalPorts - usedPorts;
  const utilizationPercent = (usedPorts / totalPorts) * 100;
  
  // Find largest contiguous free block
  const largestFreeBlock = await this.findLargestContiguousFreeBlock(nodeId);
  
  // Port usage by type
  const usageByType = allocations.reduce((acc, alloc) => {
    acc[alloc.type] = (acc[alloc.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    nodeId,
    totalPorts,
    usedPorts,
    availablePorts,
    utilizationPercent,
    largestFreeBlock,
    usageByType,
    allocations: allocations.map(a => ({
      port: a.port,
      protocol: a.protocol,
      type: a.type,
      serverUuid: a.serverUuid
    }))
  };
}
```

**9. Port Cleanup (Orphaned Allocations):**

```typescript
// Cron job: Daily cleanup
@Cron('0 2 * * *') // 2 AM daily
async function cleanupOrphanedPorts() {
  // Find allocations that reference non-existent servers
  const allAllocations = await prisma.networkAllocation.findMany({
    where: {
      serverUuid: { not: null }
    },
    select: {
      id: true,
      port: true,
      serverUuid: true,
      nodeId: true
    }
  });
  
  const orphanedAllocations: NetworkAllocation[] = [];
  
  for (const allocation of allAllocations) {
    if (!allocation.serverUuid) continue;
    
    const server = await prisma.gameServer.findUnique({
      where: { uuid: allocation.serverUuid }
    });
    
    if (!server) {
      orphanedAllocations.push(allocation);
    }
  }
  
  if (orphanedAllocations.length > 0) {
    this.logger.warn(`Found ${orphanedAllocations.length} orphaned port allocations`);
    
    // Delete orphaned allocations
    await prisma.networkAllocation.deleteMany({
      where: {
        id: { in: orphanedAllocations.map(a => a.id) }
      }
    });
    
    // Log cleanup
    await this.auditLog.create({
      action: 'PORT_CLEANUP',
      details: {
        orphanedCount: orphanedAllocations.length,
        ports: orphanedAllocations.map(a => `${a.port}@${a.nodeId}`)
      }
    });
  }
}
```

**10. Error Handling & Edge Cases:**

```typescript
// Edge cases to handle:
// 1. Port range exhausted
if (startPort === null) {
  throw new InsufficientResourcesException({
    code: 'NO_PORTS_AVAILABLE',
    message: `No available port block of size ${neededPorts} on node ${nodeId}`,
    nodeId,
    neededPorts,
    suggestion: 'Consider adding more nodes or expanding port range'
  });
}

// 2. Concurrent allocation attempts
// Handled by database transaction with Serializable isolation level

// 3. Invalid port range configuration
if (PORT_RANGE_START >= PORT_RANGE_END) {
  throw new ConfigurationError('Invalid port range configuration');
}

// 4. Port already allocated (race condition)
// Handled by unique constraint in database schema:
// @@unique([nodeId, port, protocol])
```

**11. Database Schema:**

```prisma
model NetworkAllocation {
  id          String   @id @default(uuid())
  nodeId      String
  port        Int
  protocol    Protocol // UDP, TCP
  type        PortType // GAME, RCON, QUERY, APP, TV
  serverUuid  String?  // Nullable - port can be reserved but not assigned
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  node        Node     @relation(fields: [nodeId], references: [id])
  server      GameServer? @relation(fields: [serverUuid], references: [uuid])
  
  @@unique([nodeId, port, protocol]) // Prevent duplicate allocations
  @@index([nodeId, port])
  @@index([serverUuid])
}
```

**12. API Endpoints:**

```typescript
// Allocate ports for new server
POST /api/nodes/:nodeId/ports/allocate
Body: { neededPorts, protocol, gameType, serverUuid }

// Deallocate ports
DELETE /api/servers/:serverUuid/ports

// Get port statistics
GET /api/nodes/:nodeId/ports/statistics

// Check port availability
GET /api/nodes/:nodeId/ports/:port/check?protocol=UDP
```

### 3.4 Daemon Module ("ZedDaemon") - The Brain
Ez a kód fut a fizikai gépen. Ez a rendszer lelke - minden játékszerver művelet itt történik.

#### 3.4.1 Daemon Architektúra

**1. Daemon Komponensek:**

```typescript
// apps/daemon/src/main.ts
class ZedDaemon {
  private containerManager: ContainerManager;
  private taskProcessor: TaskProcessor;
  private metricsCollector: MetricsCollector;
  private healthChecker: HealthChecker;
  private heartbeatClient: HeartbeatClient;
  private startupGuard: StartupGuard;
}
```

**2. Daemon Indítási Folyamat:**

```typescript
async function main() {
  // 1. Environment validation
  validateEnvironment();
  
  // 2. Initialize components
  await daemon.initialize();
  
  // 3. Register with backend
  await daemon.register();
  
  // 4. Startup reconciliation
  await daemon.startupReconciliation();
  
  // 5. Start periodic tasks
  daemon.startPeriodicTasks();
  
  // 6. Start HTTP server (for health checks)
  daemon.startHttpServer();
  
  // 7. Start task processing loop
  daemon.startTaskProcessing();
}
```

#### 3.4.2 Startup Reconciliation (Öngyógyítás & Szinkron)

**1. Reconciliation Algoritmus:**

```typescript
// apps/daemon/src/reconciliation.ts
async function startupReconciliation() {
  this.logger.info('Starting reconciliation...');
  
  // 1. Get actual state from Docker
  const actualContainers = await this.docker.listContainers({
    all: true,
    filters: {
      label: ['com.zedhosting.managed=true']
    }
  });
  
  const actualState = new Map(
    actualContainers.map(c => [c.Names[0].replace('/', ''), c.State])
  );
  
  // 2. Get expected state from backend
  const expectedServers = await this.backendClient.getExpectedServers(this.nodeId);
  const expectedState = new Map(
    expectedServers.map(s => [s.uuid, s.status])
  );
  
  // 3. Compare and reconcile
  const reconciliationActions: ReconciliationAction[] = [];
  
  // 3a. Servers that should be running but are not
  for (const [uuid, expectedStatus] of expectedState.entries()) {
    if (expectedStatus === 'RUNNING') {
      const actualStatus = actualState.get(uuid);
      if (actualStatus !== 'running') {
        reconciliationActions.push({
          type: 'START',
          serverUuid: uuid,
          reason: `Expected RUNNING but actual state is ${actualStatus || 'not found'}`
        });
      }
    }
  }
  
  // 3b. Servers that are running but shouldn't be (orphaned)
  for (const [uuid, actualStatus] of actualState.entries()) {
    if (actualStatus === 'running') {
      const expectedStatus = expectedState.get(uuid);
      if (!expectedStatus || expectedStatus !== 'RUNNING') {
        reconciliationActions.push({
          type: 'ADOPT_OR_STOP',
          serverUuid: uuid,
          reason: 'Container running but not in expected state'
        });
      }
    }
  }
  
  // 4. Execute reconciliation actions
  for (const action of reconciliationActions) {
    try {
      await this.executeReconciliationAction(action);
    } catch (error) {
      this.logger.error(`Reconciliation action failed: ${action.type}`, error);
    }
  }
  
  this.logger.info(`Reconciliation complete. Actions: ${reconciliationActions.length}`);
}
```

**2. Adopt Orphaned Container:**

```typescript
async function adoptOrphanedContainer(containerName: string) {
  // 1. Extract server UUID from container name
  const uuid = containerName.replace('zedhosting-', '');
  
  // 2. Get container labels to determine game type
  const container = await this.docker.getContainer(containerName);
  const inspect = await container.inspect();
  const labels = inspect.Config.Labels;
  
  // 3. Report to backend
  await this.backendClient.reportOrphanedContainer({
    uuid,
    nodeId: this.nodeId,
    gameType: labels['com.zedhosting.gameType'],
    containerId: inspect.Id,
    status: 'RUNNING'
  });
  
  this.logger.info(`Adopted orphaned container: ${uuid}`);
}
```

#### 3.4.3 Startup Storm Protection (Anti-Crash)

**1. Startup Guard Implementáció:**

```typescript
// apps/daemon/src/startup-guard.ts
class StartupGuard {
  private startupQueue: StartupItem[] = [];
  private isProcessing = false;
  private delayBetweenStarts = 5000; // 5 seconds
  
  async queueServerStart(serverUuid: string, priority: number) {
    this.startupQueue.push({
      serverUuid,
      priority,
      queuedAt: Date.now()
    });
    
    // Sort by priority (lower number = higher priority)
    this.startupQueue.sort((a, b) => a.priority - b.priority);
    
    // Start processing if not already
    if (!this.isProcessing) {
      this.processStartupQueue();
    }
  }
  
  private async processStartupQueue() {
    this.isProcessing = true;
    
    while (this.startupQueue.length > 0) {
      const item = this.startupQueue.shift()!;
      
      try {
        this.logger.info(`Starting server ${item.serverUuid} (priority: ${item.priority})`);
        await this.containerManager.startContainer(item.serverUuid);
        
        // Wait before starting next server
        if (this.startupQueue.length > 0) {
          await this.sleep(this.delayBetweenStarts);
        }
      } catch (error) {
        this.logger.error(`Failed to start server ${item.serverUuid}`, error);
        // Continue with next server
      }
    }
    
    this.isProcessing = false;
  }
}
```

**2. Priority-Based Startup:**

```typescript
// Backend sets startupPriority when creating server
// Lower number = higher priority
// Default: 10
// Critical servers (VIP users): 1-5
// Normal servers: 10-20
// Low priority (idle servers): 50+

async function getStartupOrder(nodeId: string): Promise<StartupItem[]> {
  const servers = await prisma.gameServer.findMany({
    where: {
      nodeId,
      status: { in: ['STOPPED', 'CRASHED'] }
    },
    orderBy: {
      startupPriority: 'asc' // Lower priority number = start first
    }
  });
  
  return servers.map(s => ({
    serverUuid: s.uuid,
    priority: s.startupPriority,
    gameType: s.gameType
  }));
}
```

**3. Resource-Aware Startup:**

```typescript
async function canStartServer(serverUuid: string): Promise<boolean> {
  // 1. Check current system resources
  const systemInfo = await this.systemInformation.getCurrentLoad();
  const cpuUsage = systemInfo.currentLoad;
  const memUsage = systemInfo.mem.used / systemInfo.mem.total;
  
  // 2. Don't start if CPU > 80% or RAM > 85%
  if (cpuUsage > 80 || memUsage > 0.85) {
    this.logger.warn(
      `System resources high (CPU: ${cpuUsage}%, RAM: ${memUsage * 100}%), ` +
      `delaying server start: ${serverUuid}`
    );
    return false;
  }
  
  // 3. Check disk I/O
  const diskStats = await this.systemInformation.getFsStats();
  const highDiskIO = diskStats.some(fs => fs.used / fs.size > 0.90);
  if (highDiskIO) {
    this.logger.warn(`Disk usage high, delaying server start: ${serverUuid}`);
    return false;
  }
  
  return true;
}
```

#### 3.4.4 Log Bomb Protection

**1. Docker Log Configuration:**

```typescript
// apps/daemon/src/container-manager.ts
const LOG_CONFIG = {
  Type: 'json-file',
  Config: {
    'max-size': '10m',      // Maximum log file size
    'max-file': '3',        // Keep 3 log files (rotation)
    'compress': 'true'      // Compress old log files
  }
};

async function createContainer(config: ContainerConfig) {
  const containerConfig = {
    Image: config.image,
    Labels: {
      'com.zedhosting.managed': 'true',
      'com.zedhosting.serverUuid': config.serverUuid,
      'com.zedhosting.gameType': config.gameType
    },
    HostConfig: {
      LogConfig: LOG_CONFIG, // Critical: prevent log bombs
      Memory: config.memoryLimit * 1024 * 1024, // MB to bytes
      CpuShares: config.cpuShares,
      // ... other config
    },
    // ... rest of config
  };
  
  const container = await this.docker.createContainer(containerConfig);
  return container;
}
```

**2. Log Rotation Monitoring:**

```typescript
// Periodic check: every 5 minutes
@Cron('*/5 * * * *')
async function checkLogSizes() {
  const containers = await this.docker.listContainers({
    filters: {
      label: ['com.zedhosting.managed=true']
    }
  });
  
  for (const containerInfo of containers) {
    const container = await this.docker.getContainer(containerInfo.Id);
    const inspect = await container.inspect();
    
    // Check log file size
    const logPath = `/var/lib/docker/containers/${containerInfo.Id}/${containerInfo.Id}-json.log`;
    const stats = await fs.stat(logPath).catch(() => null);
    
    if (stats && stats.size > 50 * 1024 * 1024) { // 50MB
      this.logger.warn(
        `Container ${containerInfo.Names[0]} log file is ${stats.size} bytes, ` +
        `considering log rotation issue`
      );
      
      // Rotate logs manually if needed
      await this.rotateContainerLogs(containerInfo.Id);
    }
  }
}
```

#### 3.4.5 Health Check & Auto-Restart

**1. Game Query Protocol Health Check:**

```typescript
// apps/daemon/src/health-checker.ts
class HealthChecker {
  private healthCheckInterval = 30000; // 30 seconds
  private failureThreshold = 3; // 3 consecutive failures = crash
  
  async startHealthChecks() {
    setInterval(async () => {
      await this.checkAllServers();
    }, this.healthCheckInterval);
  }
  
  private async checkAllServers() {
    const runningServers = await this.getRunningServers();
    
    for (const server of runningServers) {
      await this.checkServerHealth(server);
    }
  }
  
  private async checkServerHealth(server: GameServer) {
    try {
      // 1. Check container is running
      const container = await this.docker.getContainer(`zedhosting-${server.uuid}`);
      const inspect = await container.inspect();
      
      if (inspect.State.Status !== 'running') {
        // Container not running - handle separately
        return;
      }
      
      // 2. Game Query Protocol check
      const queryResult = await this.gameQuery.query(server);
      
      if (queryResult.success) {
        // Server is healthy - reset failure count
        await this.resetFailureCount(server.uuid);
      } else {
        // Query failed - increment failure count
        await this.incrementFailureCount(server.uuid);
      }
    } catch (error) {
      this.logger.error(`Health check failed for ${server.uuid}`, error);
      await this.incrementFailureCount(server.uuid);
    }
  }
}
```

**2. Crash Detection & Auto-Restart:**

```typescript
private async incrementFailureCount(serverUuid: string) {
  const key = `health:failures:${serverUuid}`;
  const failures = await this.redis.incr(key);
  await this.redis.expire(key, 300); // 5 minute TTL
  
  if (failures >= this.failureThreshold) {
    await this.handleCrashDetected(serverUuid);
  }
}

private async handleCrashDetected(serverUuid: string) {
  this.logger.error(`CRASH DETECTED: Server ${serverUuid} failed ${this.failureThreshold} health checks`);
  
  // 1. Update server status
  await this.backendClient.updateServerStatus(serverUuid, 'CRASHED');
  
  // 2. Send alert
  await this.backendClient.sendAlert({
    severity: 'WARNING',
    type: 'SERVER_CRASH_DETECTED',
    resourceId: serverUuid,
    message: `Server ${serverUuid} failed health checks, attempting restart`
  });
  
  // 3. Auto-restart
  try {
    await this.containerManager.restartContainer(serverUuid);
    
    // Reset failure count
    await this.redis.del(`health:failures:${serverUuid}`);
    
    this.logger.info(`Auto-restarted crashed server: ${serverUuid}`);
  } catch (error) {
    this.logger.error(`Failed to restart crashed server: ${serverUuid}`, error);
    
    // If restart fails, send critical alert
    await this.backendClient.sendAlert({
      severity: 'CRITICAL',
      type: 'SERVER_RESTART_FAILED',
      resourceId: serverUuid,
      message: `Server ${serverUuid} crashed and restart failed`
    });
  }
}
```

**3. Game Query Protocol Implementáció:**

```typescript
// apps/daemon/src/game-query.ts
class GameQuery {
  async query(server: GameServer): Promise<QueryResult> {
    const timeout = 5000; // 5 second timeout
    
    try {
      switch (server.gameType) {
        case 'RUST':
          return await this.queryRust(server, timeout);
        case 'ARK':
          return await this.queryArk(server, timeout);
        case 'MINECRAFT':
          return await this.queryMinecraft(server, timeout);
        case 'CS2':
          return await this.queryCS2(server, timeout);
        default:
          // Fallback: just check if container is running
          return await this.queryContainerOnly(server);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  private async queryRust(server: GameServer, timeout: number): Promise<QueryResult> {
    // Rust uses Steam Query Protocol (A2S_INFO)
    const query = new SteamQuery(server.ipAddress, server.queryPort);
    const info = await Promise.race([
      query.getInfo(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )
    ]);
    
    return {
      success: true,
      players: info.players,
      maxPlayers: info.maxPlayers,
      map: info.map,
      timestamp: Date.now()
    };
  }
}
```

#### 3.4.6 Task Processing

**1. Task Polling:**

```typescript
// apps/daemon/src/task-processor.ts
class TaskProcessor {
  private pollingInterval = 5000; // Poll every 5 seconds
  
  async start() {
    setInterval(async () => {
      await this.pollAndProcessTasks();
    }, this.pollingInterval);
  }
  
  private async pollAndProcessTasks() {
    // 1. Get pending tasks from backend
    const tasks = await this.backendClient.getPendingTasks(this.nodeId);
    
    // 2. Process tasks sequentially (one at a time)
    for (const task of tasks) {
      await this.processTask(task);
    }
  }
  
  private async processTask(task: Task) {
    try {
      // Update task status to PROCESSING
      await this.backendClient.updateTaskStatus(task.id, 'PROCESSING');
      
      // Execute task based on type
      let result: any;
      switch (task.type) {
        case 'PROVISION':
          result = await this.executeProvision(task);
          break;
        case 'START':
          result = await this.executeStart(task);
          break;
        case 'STOP':
          result = await this.executeStop(task);
          break;
        case 'RESTART':
          result = await this.executeRestart(task);
          break;
        case 'UPDATE':
          result = await this.executeUpdate(task);
          break;
        case 'BACKUP':
          result = await this.executeBackup(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      // Mark task as completed
      await this.backendClient.completeTask(task.id, result);
      
    } catch (error) {
      // Mark task as failed
      await this.backendClient.failTask(task.id, {
        error: error.message,
        stack: error.stack
      });
    }
  }
}
```

**2. Heartbeat:**

```typescript
// apps/daemon/src/heartbeat.ts
class HeartbeatClient {
  private interval = 30000; // 30 seconds
  
  async start() {
    setInterval(async () => {
      await this.sendHeartbeat();
    }, this.interval);
  }
  
  private async sendHeartbeat() {
    try {
      const systemInfo = await this.collectSystemInfo();
      
      await this.backendClient.sendHeartbeat({
        nodeId: this.nodeId,
        timestamp: Date.now(),
        systemInfo: {
          cpu: systemInfo.cpu,
          memory: systemInfo.memory,
          disk: systemInfo.disk,
          network: systemInfo.network,
          containerCount: systemInfo.containerCount
        }
      });
    } catch (error) {
      this.logger.error('Heartbeat failed', error);
    }
  }
}
```

**3. Metrics Collection:**

```typescript
// apps/daemon/src/metrics-collector.ts
class MetricsCollector {
  private interval = 15000; // 15 seconds
  
  async start() {
    setInterval(async () => {
      await this.collectAndSendMetrics();
    }, this.interval);
  }
  
  private async collectAndSendMetrics() {
    const metrics = await this.collectMetrics();
    await this.backendClient.sendMetrics(this.nodeId, metrics);
  }
  
  private async collectMetrics() {
    // 1. System metrics
    const systemInfo = await this.systemInformation.getCurrentLoad();
    const memInfo = await this.systemInformation.getMemInfo();
    const diskInfo = await this.systemInformation.getFsSize();
    
    // 2. Per-container metrics
    const containers = await this.docker.listContainers();
    const containerMetrics = await Promise.all(
      containers.map(c => this.getContainerMetrics(c.Id))
    );
    
    return {
      timestamp: Date.now(),
      nodeId: this.nodeId,
      system: {
        cpu: systemInfo.currentLoad,
        memory: {
          used: memInfo.used,
          total: memInfo.total,
          percent: (memInfo.used / memInfo.total) * 100
        },
        disk: diskInfo.map(d => ({
          mount: d.mount,
          used: d.used,
          total: d.size,
          percent: (d.used / d.size) * 100
        }))
      },
      containers: containerMetrics
    };
  }
}
```

**4. Environment Variables:**

```bash
# .env
MANAGER_URL=https://api.zedhosting.com
API_KEY=generated-api-key-from-backend
NODE_ID=node-uuid-from-backend
LOG_LEVEL=info
METRICS_INTERVAL=15000
HEARTBEAT_INTERVAL=30000
TASK_POLL_INTERVAL=5000
HEALTH_CHECK_INTERVAL=30000
STARTUP_DELAY=5000
```

### 3.5 Scaling Logic: Update Queue & Smart Cache
**Probléma:** 60 szerver egyszerre akar frissíteni -> Hálózat és lemez halál.
**Megoldás:** Queue-based update system + host-level Steam cache.

#### 3.5.1 Update Queue System

**1. BullMQ Queue Setup:**

```typescript
// apps/daemon/src/update-queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

class UpdateQueue {
  private queue: Queue;
  private worker: Worker;
  private redis: Redis;
  
  constructor(nodeId: string) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });
    
    this.queue = new Queue(`update-queue-${nodeId}`, {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000 // 5s, 10s, 20s
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 100
        }
      }
    });
    
    this.worker = new Worker(
      `update-queue-${nodeId}`,
      async (job) => await this.processUpdateJob(job),
      {
        connection: this.redis,
        concurrency: parseInt(process.env.MAX_CONCURRENT_UPDATES || '2'), // Max 2 concurrent
        limiter: {
          max: 2,
          duration: 1000 // 2 jobs per second max
        }
      }
    );
  }
}
```

**2. Update Job Processing:**

```typescript
private async processUpdateJob(job: Job<UpdateJobData>) {
  const { serverUuid, gameType, appId } = job.data;
  
  this.logger.info(`Processing update job for server ${serverUuid} (${gameType})`);
  
  try {
    // 1. Check if cached version exists
    const cachePath = `/var/lib/zedhosting/steam_cache/${appId}`;
    const cacheExists = await fs.pathExists(cachePath);
    
    if (cacheExists) {
      // 2. Use cache - rsync copy
      await this.copyFromCache(serverUuid, cachePath);
      this.logger.info(`Used cache for ${serverUuid}, saved download time`);
    } else {
      // 3. Download via SteamCMD
      await this.downloadViaSteamCMD(serverUuid, appId, gameType);
      
      // 4. Update cache (if download successful)
      await this.updateCache(appId, cachePath);
    }
    
    // 5. Mark job as completed
    await job.updateProgress(100);
    return { success: true, usedCache: cacheExists };
    
  } catch (error) {
    this.logger.error(`Update job failed for ${serverUuid}`, error);
    throw error; // Will trigger retry
  }
}
```

**3. Queue Management:**

```typescript
async function queueUpdate(serverUuid: string, gameType: GameType, appId: number) {
  // 1. Check if update already queued
  const existingJob = await this.queue.getJob(`update-${serverUuid}`);
  if (existingJob && await existingJob.getState() !== 'completed') {
    this.logger.warn(`Update already queued for ${serverUuid}`);
    return existingJob;
  }
  
  // 2. Add to queue
  const job = await this.queue.add(
    `update-${serverUuid}`,
    {
      serverUuid,
      gameType,
      appId,
      timestamp: Date.now()
    },
    {
      jobId: `update-${serverUuid}`, // Unique job ID
      priority: this.getUpdatePriority(serverUuid) // VIP servers = higher priority
    }
  );
  
  // 3. Update server status
  await this.backendClient.updateServerStatus(serverUuid, 'UPDATING');
  
  return job;
}

async function getQueueStatus(): Promise<QueueStatus> {
  const waiting = await this.queue.getWaitingCount();
  const active = await this.queue.getActiveCount();
  const completed = await this.queue.getCompletedCount();
  const failed = await this.queue.getFailedCount();
  
  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active
  };
}
```

#### 3.5.2 Host-Level Smart Cache

**1. Cache Structure:**

```bash
/var/lib/zedhosting/steam_cache/
├── 730/          # CS2 (app ID 730)
│   ├── game/     # Game files
│   └── metadata.json
├── 239140/       # ARK (app ID 239140)
│   ├── ShooterGame/
│   └── metadata.json
├── 258550/       # Rust (app ID 258550)
│   ├── RustDedicated_Data/
│   └── metadata.json
└── cache-index.json  # Cache metadata
```

**2. Cache Metadata:**

```typescript
interface CacheMetadata {
  appId: number;
  gameType: GameType;
  version: string; // Steam build ID
  size: number; // Total size in bytes
  cachedAt: number; // Timestamp
  lastUsed: number; // Last access timestamp
  accessCount: number; // How many times used
  checksum: string; // SHA-256 checksum for integrity
}
```

**3. Cache Lookup & Copy:**

```typescript
// apps/daemon/src/cache-manager.ts
class CacheManager {
  private cacheBasePath = '/var/lib/zedhosting/steam_cache';
  
  async getCachedVersion(appId: number): Promise<CacheMetadata | null> {
    const cachePath = `${this.cacheBasePath}/${appId}`;
    const metadataPath = `${cachePath}/metadata.json`;
    
    // 1. Check if cache exists
    if (!await fs.pathExists(cachePath)) {
      return null;
    }
    
    // 2. Load metadata
    try {
      const metadata = await fs.readJson(metadataPath);
      
      // 3. Verify cache integrity
      const isValid = await this.verifyCacheIntegrity(cachePath, metadata);
      if (!isValid) {
        this.logger.warn(`Cache integrity check failed for app ${appId}, invalidating`);
        await this.invalidateCache(appId);
        return null;
      }
      
      // 4. Update last used timestamp
      metadata.lastUsed = Date.now();
      metadata.accessCount = (metadata.accessCount || 0) + 1;
      await fs.writeJson(metadataPath, metadata);
      
      return metadata;
    } catch (error) {
      this.logger.error(`Failed to read cache metadata for app ${appId}`, error);
      return null;
    }
  }
  
  async copyFromCache(
    serverUuid: string,
    appId: number,
    targetPath: string
  ): Promise<void> {
    const cachePath = `${this.cacheBasePath}/${appId}`;
    const serverPath = `${targetPath}/${serverUuid}`;
    
    this.logger.info(`Copying cache from ${cachePath} to ${serverPath}`);
    
    // 1. Create target directory
    await fs.ensureDir(serverPath);
    
    // 2. Use rsync for efficient copying (only changed files)
    const rsyncCommand = [
      'rsync',
      '-av', // Archive mode, verbose
      '--delete', // Delete files in dest that don't exist in source
      '--progress', // Show progress
      `${cachePath}/`,
      `${serverPath}/`
    ].join(' ');
    
    await this.executeCommand(rsyncCommand);
    
    this.logger.info(`Cache copy completed for ${serverUuid}`);
    
    // 3. Update cache statistics
    await this.updateCacheStats(appId, 'copy');
  }
}
```

**4. Cache Update (SteamCMD Download):**

```typescript
async function downloadViaSteamCMD(
  serverUuid: string,
  appId: number,
  gameType: GameType
): Promise<void> {
  const cachePath = `${this.cacheBasePath}/${appId}`;
  const steamCmdPath = '/opt/steamcmd/steamcmd.sh';
  
  // 1. Ensure cache directory exists
  await fs.ensureDir(cachePath);
  
  // 2. SteamCMD download command
  const downloadCommand = [
    steamCmdPath,
    '+force_install_dir', cachePath,
    '+login', 'anonymous',
    '+app_update', appId.toString(),
    'validate', // Verify files
    '+quit'
  ].join(' ');
  
  this.logger.info(`Downloading app ${appId} via SteamCMD to cache`);
  
  // 3. Execute with progress tracking
  const process = spawn('sh', ['-c', downloadCommand], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // 4. Track progress
  let lastProgress = 0;
  process.stdout.on('data', (data) => {
    const output = data.toString();
    // Parse SteamCMD progress output
    const progressMatch = output.match(/Progress: (\d+\.\d+)%/);
    if (progressMatch) {
      const progress = parseFloat(progressMatch[1]);
      if (progress - lastProgress >= 5) { // Update every 5%
        this.logger.info(`Download progress: ${progress}%`);
        lastProgress = progress;
      }
    }
  });
  
  // 5. Wait for completion
  await new Promise((resolve, reject) => {
    process.on('close', (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`SteamCMD download failed with code ${code}`));
      }
    });
  });
  
  // 6. Create metadata
  const metadata: CacheMetadata = {
    appId,
    gameType,
    version: await this.getSteamBuildId(appId),
    size: await this.getDirectorySize(cachePath),
    cachedAt: Date.now(),
    lastUsed: Date.now(),
    accessCount: 0,
    checksum: await this.calculateChecksum(cachePath)
  };
  
  await fs.writeJson(`${cachePath}/metadata.json`, metadata);
  
  this.logger.info(`Cache updated for app ${appId}, size: ${metadata.size} bytes`);
}
```

**5. Cache Invalidation & Cleanup:**

```typescript
async function invalidateCache(appId: number): Promise<void> {
  const cachePath = `${this.cacheBasePath}/${appId}`;
  
  // 1. Check if cache is in use
  const inUse = await this.isCacheInUse(appId);
  if (inUse) {
    this.logger.warn(`Cannot invalidate cache for app ${appId}, currently in use`);
    return;
  }
  
  // 2. Remove cache directory
  await fs.remove(cachePath);
  
  this.logger.info(`Cache invalidated for app ${appId}`);
}

// Cron job: Cleanup old/unused caches
@Cron('0 3 * * *') // 3 AM daily
async function cleanupCache() {
  const maxCacheAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  const minAccessCount = 2; // Keep if used at least 2 times
  
  const caches = await this.getAllCaches();
  
  for (const cache of caches) {
    const age = Date.now() - cache.cachedAt;
    const unused = Date.now() - cache.lastUsed > 7 * 24 * 60 * 60 * 1000; // 7 days unused
    
    if ((age > maxCacheAge && cache.accessCount < minAccessCount) || unused) {
      this.logger.info(`Cleaning up cache: app ${cache.appId}, age: ${age}ms, accesses: ${cache.accessCount}`);
      await this.invalidateCache(cache.appId);
    }
  }
}
```

**6. Cache Statistics:**

```typescript
async function getCacheStatistics(): Promise<CacheStatistics> {
  const caches = await this.getAllCaches();
  
  const totalSize = caches.reduce((sum, c) => sum + c.size, 0);
  const totalAccesses = caches.reduce((sum, c) => sum + c.accessCount, 0);
  const spaceSaved = this.calculateSpaceSaved(caches);
  
  return {
    cacheCount: caches.length,
    totalSize,
    totalSizeGB: totalSize / (1024 * 1024 * 1024),
    totalAccesses,
    averageAccesses: totalAccesses / caches.length,
    spaceSavedGB: spaceSaved / (1024 * 1024 * 1024),
    caches: caches.map(c => ({
      appId: c.appId,
      gameType: c.gameType,
      sizeGB: c.size / (1024 * 1024 * 1024),
      accessCount: c.accessCount,
      lastUsed: new Date(c.lastUsed)
    }))
  };
}
```

**7. Performance Metrics:**

```typescript
// Track cache hit/miss rates
interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number; // hits / (hits + misses)
  averageCopyTime: number; // ms
  averageDownloadTime: number; // ms
  timeSaved: number; // Total time saved by using cache (ms)
}

// Example: CS2 (30GB)
// Download time: ~30 minutes (100 Mbps connection)
// Cache copy time: ~30 seconds (local rsync)
// Time saved: ~29.5 minutes per server
```

**8. Environment Variables:**

```bash
# .env
MAX_CONCURRENT_UPDATES=2
CACHE_BASE_PATH=/var/lib/zedhosting/steam_cache
CACHE_MAX_AGE_DAYS=30
CACHE_CLEANUP_ENABLED=true
STEAMCMD_PATH=/opt/steamcmd/steamcmd.sh
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3.6 Cross-Node Cluster Manager (ARK/Atlas NFS)
**Probléma:** Cluster utazás két különböző fizikai gép között - ARK/Atlas cluster szervereknek közös fájlrendszerre van szükségük.
**Megoldás:** NFS (Network File System) használata cross-node fájlmegosztáshoz.

#### 3.6.1 Cluster Creation Flow

**1. Cluster Init (Backend):**

```typescript
// apps/api/src/clusters/clusters.service.ts
async function createCluster(data: CreateClusterDto): Promise<GameCluster> {
  // 1. Validate game type supports clustering
  if (!['ARK', 'ATLAS'].includes(data.gameType)) {
    throw new BadRequestException('Clustering only supported for ARK and ATLAS');
  }
  
  // 2. Find best storage node (has isClusterStorage = true)
  const storageNode = await this.findBestStorageNode();
  if (!storageNode) {
    throw new InsufficientResourcesException('No storage node available for cluster');
  }
  
  // 3. Generate cluster secret (shared password)
  const sharedSecret = this.generateClusterSecret();
  
  // 4. Create cluster record
  const cluster = await prisma.gameCluster.create({
    data: {
      gameType: data.gameType,
      sharedSecret: await this.hashSecret(sharedSecret),
      storageNodeId: storageNode.id,
      mountPath: `/var/lib/zedhosting/clusters/${uuidv4()}`
    }
  });
  
  // 5. Create cluster directory on storage node
  await this.daemonClient.createClusterDirectory(storageNode.id, cluster.id, cluster.mountPath);
  
  // 6. Return cluster with plain secret (only shown once)
  return {
    ...cluster,
    sharedSecret // Plain secret for user
  };
}
```

**2. Storage Node Selection:**

```typescript
async function findBestStorageNode(): Promise<Node | null> {
  // 1. Find nodes with cluster storage capability
  const candidates = await prisma.node.findMany({
    where: {
      isClusterStorage: true,
      status: 'ONLINE',
      maintenanceMode: false
    }
  });
  
  if (candidates.length === 0) {
    return null;
  }
  
  // 2. Select node with most available disk space
  const nodesWithSpace = await Promise.all(
    candidates.map(async (node) => {
      const metrics = await this.metricsService.getLatestMetrics(node.id);
      const diskUsage = metrics?.diskUsagePercent || 0;
      return {
        node,
        availableSpace: 100 - diskUsage
      };
    })
  );
  
  // 3. Sort by available space (descending)
  nodesWithSpace.sort((a, b) => b.availableSpace - a.availableSpace);
  
  return nodesWithSpace[0]?.node || null;
}
```

#### 3.6.2 NFS Export Setup (Storage Node)

**1. NFS Server Installation:**

```typescript
// apps/daemon/src/nfs-manager.ts
class NFSManager {
  async setupNFSServer(clusterId: string, mountPath: string, allowedIPs: string[]) {
    // 1. Install NFS server if not installed
    await this.ensureNFSInstalled();
    
    // 2. Create cluster directory
    await fs.ensureDir(mountPath);
    
    // 3. Set proper permissions
    await this.executeCommand(`chown -R 1000:1000 ${mountPath}`);
    await this.executeCommand(`chmod -R 755 ${mountPath}`);
    
    // 4. Add to /etc/exports
    await this.addExportEntry(mountPath, allowedIPs);
    
    // 5. Reload NFS exports
    await this.reloadExports();
    
    this.logger.info(`NFS export created: ${mountPath} for cluster ${clusterId}`);
  }
  
  private async ensureNFSInstalled() {
    const nfsInstalled = await this.checkPackageInstalled('nfs-kernel-server');
    if (!nfsInstalled) {
      await this.executeCommand('apt-get update && apt-get install -y nfs-kernel-server');
    }
  }
  
  private async addExportEntry(mountPath: string, allowedIPs: string[]) {
    const exportLine = `${mountPath} ${allowedIPs.map(ip => `${ip}(rw,sync,no_subtree_check,no_root_squash)`).join(' ')}\n`;
    
    // Read current exports
    let exportsContent = '';
    try {
      exportsContent = await fs.readFile('/etc/exports', 'utf-8');
    } catch (error) {
      // File doesn't exist, create it
    }
    
    // Check if entry already exists
    if (exportsContent.includes(mountPath)) {
      this.logger.warn(`Export entry already exists for ${mountPath}`);
      return;
    }
    
    // Append new entry
    await fs.appendFile('/etc/exports', exportLine);
  }
  
  private async reloadExports() {
    await this.executeCommand('exportfs -ra'); // Reload all exports
    await this.executeCommand('systemctl restart nfs-kernel-server');
  }
}
```

**2. Export Entry Format:**

```bash
# /etc/exports
/var/lib/zedhosting/clusters/abc-123-def 95.217.194.149(rw,sync,no_subtree_check,no_root_squash) 95.217.194.150(rw,sync,no_subtree_check,no_root_squash)
```

**Options explanation:**
- `rw`: Read-write access
- `sync`: Synchronous writes (data safety)
- `no_subtree_check`: Better performance
- `no_root_squash`: Allow root access (needed for Docker containers)

#### 3.6.3 NFS Mount Setup (Client Node)

**1. Mount Detection & Setup:**

```typescript
// apps/daemon/src/nfs-manager.ts
class NFSManager {
  async setupNFSClient(
    clusterId: string,
    storageNodeIP: string,
    remotePath: string,
    localMountPoint: string
  ) {
    // 1. Install NFS client if not installed
    await this.ensureNFSClientInstalled();
    
    // 2. Create local mount point
    await fs.ensureDir(localMountPoint);
    
    // 3. Check if already mounted
    const isMounted = await this.isMounted(localMountPoint);
    if (isMounted) {
      this.logger.info(`NFS already mounted at ${localMountPoint}`);
      return;
    }
    
    // 4. Mount NFS share
    const mountCommand = `mount -t nfs ${storageNodeIP}:${remotePath} ${localMountPoint}`;
    await this.executeCommand(mountCommand);
    
    // 5. Add to /etc/fstab for persistent mount
    await this.addToFstab(storageNodeIP, remotePath, localMountPoint);
    
    this.logger.info(`NFS mounted: ${storageNodeIP}:${remotePath} -> ${localMountPoint}`);
  }
  
  private async ensureNFSClientInstalled() {
    const nfsInstalled = await this.checkPackageInstalled('nfs-common');
    if (!nfsInstalled) {
      await this.executeCommand('apt-get update && apt-get install -y nfs-common');
    }
  }
  
  private async isMounted(mountPoint: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(`mountpoint -q ${mountPoint}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  private async addToFstab(serverIP: string, remotePath: string, localMount: string) {
    const fstabEntry = `${serverIP}:${remotePath} ${localMount} nfs defaults,_netdev 0 0\n`;
    
    let fstabContent = '';
    try {
      fstabContent = await fs.readFile('/etc/fstab', 'utf-8');
    } catch (error) {
      // File doesn't exist
    }
    
    // Check if entry already exists
    if (fstabContent.includes(localMount)) {
      return;
    }
    
    await fs.appendFile('/etc/fstab', fstabEntry);
  }
}
```

#### 3.6.4 Server Attachment to Cluster

**1. Server Cluster Assignment:**

```typescript
// apps/api/src/servers/servers.service.ts
async function attachServerToCluster(
  serverUuid: string,
  clusterId: string
): Promise<void> {
  // 1. Get server and cluster
  const server = await prisma.gameServer.findUnique({
    where: { uuid: serverUuid },
    include: { node: true, cluster: true }
  });
  
  const cluster = await prisma.gameCluster.findUnique({
    where: { id: clusterId },
    include: { storageNode: true }
  });
  
  if (!server || !cluster) {
    throw new NotFoundException('Server or cluster not found');
  }
  
  // 2. Validate game type matches
  if (server.gameType !== cluster.gameType) {
    throw new BadRequestException('Server game type must match cluster game type');
  }
  
  // 3. Check if server node needs NFS mount
  const needsMount = server.nodeId !== cluster.storageNodeId;
  
  if (needsMount) {
    // 4. Setup NFS mount on client node
    const localMountPoint = `/var/lib/zedhosting/clusters/${clusterId}/mounts/${serverUuid}`;
    
    await this.daemonClient.setupNFSMount(
      server.nodeId,
      {
        clusterId,
        storageNodeIP: cluster.storageNode.ipAddress,
        remotePath: cluster.mountPath,
        localMountPoint
      }
    );
    
    // 5. Update NFS export to allow client node IP
    await this.daemonClient.addNFSExportClient(
      cluster.storageNodeId,
      {
        clusterId,
        mountPath: cluster.mountPath,
        clientIP: server.node.ipAddress
      }
    );
  }
  
  // 6. Update server to use cluster
  await prisma.gameServer.update({
    where: { uuid: serverUuid },
    data: {
      clusterId,
      envVars: {
        ...(server.envVars as any),
        CLUSTER_ID: clusterId,
        CLUSTER_PASSWORD: await this.decryptClusterSecret(cluster.sharedSecret)
      }
    }
  });
  
  // 7. Restart server to apply cluster settings
  await this.daemonClient.restartServer(server.nodeId, serverUuid);
}
```

**2. Docker Volume Bind:**

```typescript
// apps/daemon/src/container-manager.ts
async function createClusterContainer(
  serverUuid: string,
  clusterMountPoint: string
): Promise<Container> {
  const containerConfig = {
    // ... other config
    HostConfig: {
      Binds: [
        // Cluster shared directory (NFS mounted)
        `${clusterMountPoint}:/cluster-data:rw`,
        // Server-specific directory (local)
        `/var/lib/zedhosting/servers/${serverUuid}:/server-data:rw`
      ],
      // ... other host config
    },
    Env: [
      `CLUSTER_DATA_PATH=/cluster-data`,
      `SERVER_DATA_PATH=/server-data`,
      // ... other env vars
    ]
  };
  
  return await this.docker.createContainer(containerConfig);
}
```

#### 3.6.5 Cluster Health Monitoring

**1. NFS Mount Health Check:**

```typescript
// Periodic check: every 5 minutes
@Cron('*/5 * * * *')
async function checkNFSMounts() {
  const clusters = await prisma.gameCluster.findMany({
    include: {
      servers: {
        include: { node: true }
      },
      storageNode: true
    }
  });
  
  for (const cluster of clusters) {
    // Check storage node NFS server
    const storageNodeHealthy = await this.checkNFSExport(cluster.storageNodeId, cluster.mountPath);
    
    if (!storageNodeHealthy) {
      await this.alertService.createAlert({
        severity: 'CRITICAL',
        type: 'NFS_EXPORT_DOWN',
        resourceId: cluster.id,
        message: `NFS export down on storage node for cluster ${cluster.id}`
      });
    }
    
    // Check client node mounts
    for (const server of cluster.servers) {
      if (server.nodeId === cluster.storageNodeId) {
        continue; // Skip storage node (local access)
      }
      
      const mountHealthy = await this.checkNFSMount(server.nodeId, server.uuid);
      
      if (!mountHealthy) {
        // Attempt remount
        await this.remountNFS(server.nodeId, server.uuid, cluster);
      }
    }
  }
}

private async checkNFSMount(nodeId: string, serverUuid: string): Promise<boolean> {
  const mountPoint = `/var/lib/zedhosting/clusters/*/mounts/${serverUuid}`;
  
  try {
    const result = await this.daemonClient.executeCommand(nodeId, `mountpoint -q ${mountPoint}`);
    return true;
  } catch (error) {
    return false;
  }
}

private async remountNFS(
  nodeId: string,
  serverUuid: string,
  cluster: GameCluster
) {
  this.logger.warn(`NFS mount lost for server ${serverUuid}, attempting remount`);
  
  await this.daemonClient.setupNFSMount(nodeId, {
    clusterId: cluster.id,
    storageNodeIP: cluster.storageNode.ipAddress,
    remotePath: cluster.mountPath,
    localMountPoint: `/var/lib/zedhosting/clusters/${cluster.id}/mounts/${serverUuid}`
  });
}
```

#### 3.6.6 Cluster Deletion & Cleanup

**1. Cluster Removal:**

```typescript
async function deleteCluster(clusterId: string): Promise<void> {
  // 1. Get cluster with all servers
  const cluster = await prisma.gameCluster.findUnique({
    where: { id: clusterId },
    include: {
      servers: true,
      storageNode: true
    }
  });
  
  if (!cluster) {
    throw new NotFoundException('Cluster not found');
  }
  
  // 2. Detach all servers from cluster
  for (const server of cluster.servers) {
    await this.detachServerFromCluster(server.uuid);
  }
  
  // 3. Remove NFS exports
  await this.daemonClient.removeNFSExport(cluster.storageNodeId, cluster.mountPath);
  
  // 4. Remove cluster directory (with backup first)
  await this.backupClusterData(cluster);
  await this.daemonClient.removeDirectory(cluster.storageNodeId, cluster.mountPath);
  
  // 5. Delete cluster record
  await prisma.gameCluster.delete({
    where: { id: clusterId }
  });
}

private async detachServerFromCluster(serverUuid: string) {
  const server = await prisma.gameServer.findUnique({
    where: { uuid: serverUuid },
    include: { node: true, cluster: true }
  });
  
  if (!server || !server.cluster) {
    return;
  }
  
  // 1. Unmount NFS if mounted
  if (server.nodeId !== server.cluster.storageNodeId) {
    const mountPoint = `/var/lib/zedhosting/clusters/${server.cluster.id}/mounts/${serverUuid}`;
    await this.daemonClient.unmountNFS(server.nodeId, mountPoint);
  }
  
  // 2. Update server
  await prisma.gameServer.update({
    where: { uuid: serverUuid },
    data: {
      clusterId: null,
      envVars: {
        ...(server.envVars as any),
        CLUSTER_ID: undefined,
        CLUSTER_PASSWORD: undefined
      }
    }
  });
  
  // 3. Restart server
  await this.daemonClient.restartServer(server.nodeId, serverUuid);
}
```

#### 3.6.7 Security Considerations

**1. NFS Security:**

```typescript
// 1. Firewall rules - only allow NFS ports between nodes
// NFS uses port 2049 (TCP/UDP) + RPC ports (111 TCP/UDP)
async function configureNFSFirewall(nodeId: string, allowedIPs: string[]) {
  for (const ip of allowedIPs) {
    // Allow NFS port
    await this.executeCommand(`ufw allow from ${ip} to any port 2049`);
    // Allow RPC port mapper
    await this.executeCommand(`ufw allow from ${ip} to any port 111`);
  }
}

// 2. NFS export restrictions - only specific IPs
// Already handled in /etc/exports with IP-based access

// 3. Encrypted cluster secret storage
async function hashClusterSecret(secret: string): Promise<string> {
  return await bcrypt.hash(secret, 12);
}

// 4. Audit logging
await this.auditLog.create({
  action: 'CLUSTER_CREATED',
  resourceId: cluster.id,
  details: {
    gameType: cluster.gameType,
    storageNode: cluster.storageNodeId,
    serverCount: cluster.servers.length
  }
});
```

#### 3.6.8 Environment Variables

```bash
# .env
NFS_SERVER_PACKAGE=nfs-kernel-server
NFS_CLIENT_PACKAGE=nfs-common
CLUSTER_MOUNT_BASE=/var/lib/zedhosting/clusters
NFS_EXPORT_FILE=/etc/exports
NFS_FSTAB_FILE=/etc/fstab
NFS_HEALTH_CHECK_INTERVAL=300000 # 5 minutes
```

### 3.7 Backup System (Enterprise Grade)
**Tech:** Restic (Go alapú, deduplikált, inkrementális backup).
**Cél:** Automatikus, deduplikált, biztonságos backup rendszer minden játékszerverhez.

#### 3.7.1 Restic Setup & Configuration

**1. Restic Installation:**

```typescript
// apps/daemon/src/backup/restic-manager.ts
class ResticManager {
  private resticPath = '/usr/local/bin/restic';
  
  async ensureResticInstalled(): Promise<void> {
    const installed = await this.checkCommandExists('restic');
    if (!installed) {
      await this.installRestic();
    }
  }
  
  private async installRestic(): Promise<void> {
    // Download latest restic binary
    const version = '0.16.4'; // Latest stable
    const arch = process.arch === 'x64' ? 'amd64' : 'arm64';
    
    const downloadUrl = `https://github.com/restic/restic/releases/download/v${version}/restic_${version}_linux_${arch}.bz2`;
    
    await this.executeCommand(`wget -q ${downloadUrl} -O /tmp/restic.bz2`);
    await this.executeCommand(`bunzip2 /tmp/restic.bz2`);
    await this.executeCommand(`chmod +x /tmp/restic`);
    await this.executeCommand(`mv /tmp/restic ${this.resticPath}`);
    
    this.logger.info('Restic installed successfully');
  }
}
```

**2. Repository Initialization:**

```typescript
async function initializeRepository(backendType: 'sftp' | 's3' | 'local'): Promise<void> {
  const repoConfig = this.getRepositoryConfig(backendType);
  
  // Check if repository already exists
  const exists = await this.repositoryExists(repoConfig);
  if (exists) {
    this.logger.info('Repository already initialized');
    return;
  }
  
  // Initialize repository
  const initCommand = [
    this.resticPath,
    'init',
    '--repo', repoConfig.path,
    '--password-file', repoConfig.passwordFile
  ];
  
  if (backendType === 'sftp') {
    initCommand.push('--repo', `sftp:${repoConfig.user}@${repoConfig.host}:${repoConfig.path}`);
  } else if (backendType === 's3') {
    initCommand.push('--repo', `s3:s3.amazonaws.com/${repoConfig.bucket}`);
  }
  
  await this.executeCommand(initCommand.join(' '));
  
  this.logger.info(`Repository initialized: ${backendType}`);
}

private getRepositoryConfig(type: 'sftp' | 's3' | 'local') {
  switch (type) {
    case 'sftp':
      return {
        type: 'sftp',
        host: process.env.BACKUP_SFTP_HOST,
        user: process.env.BACKUP_SFTP_USER,
        path: process.env.BACKUP_SFTP_PATH || '/backups',
        passwordFile: '/etc/restic/password'
      };
    case 's3':
      return {
        type: 's3',
        bucket: process.env.BACKUP_S3_BUCKET,
        region: process.env.BACKUP_S3_REGION || 'us-east-1',
        passwordFile: '/etc/restic/password'
      };
    case 'local':
      return {
        type: 'local',
        path: process.env.BACKUP_LOCAL_PATH || '/var/lib/zedhosting/backups',
        passwordFile: '/etc/restic/password'
      };
  }
}
```

#### 3.7.2 Backup Creation

**1. Backup Execution:**

```typescript
async function createBackup(
  serverUuid: string,
  options: BackupOptions = {}
): Promise<BackupResult> {
  const startTime = Date.now();
  
  // 1. Get server information
  const server = await this.getServerInfo(serverUuid);
  const serverPath = `/var/lib/zedhosting/servers/${serverUuid}`;
  
  // 2. Pre-backup checks
  await this.preBackupChecks(serverUuid, serverPath);
  
  // 3. Stop server if requested (for consistent backup)
  let wasRunning = false;
  if (options.stopServer) {
    wasRunning = await this.isServerRunning(serverUuid);
    if (wasRunning) {
      await this.containerManager.stopContainer(serverUuid);
      // Wait for graceful shutdown
      await this.sleep(5000);
    }
  }
  
  try {
    // 4. Execute restic backup
    const snapshotId = await this.executeResticBackup(serverUuid, serverPath);
    
    // 5. Get backup size
    const backupSize = await this.getBackupSize(snapshotId);
    
    // 6. Create backup record
    const backup = await this.createBackupRecord({
      serverUuid,
      snapshotId,
      sizeBytes: backupSize,
      duration: Date.now() - startTime,
      location: process.env.BACKUP_LOCATION || 'HETZNER_BOX'
    });
    
    // 7. Cleanup old backups (retention policy)
    await this.applyRetentionPolicy(serverUuid);
    
    return {
      success: true,
      backupId: backup.id,
      snapshotId,
      sizeBytes: backupSize,
      duration: Date.now() - startTime
    };
    
  } finally {
    // 8. Restart server if it was running
    if (wasRunning && options.stopServer) {
      await this.containerManager.startContainer(serverUuid);
    }
  }
}

private async executeResticBackup(
  serverUuid: string,
  sourcePath: string
): Promise<string> {
  const repoConfig = this.getRepositoryConfig(process.env.BACKUP_TYPE || 'sftp');
  
  // Build restic backup command
  const backupCommand = [
    this.resticPath,
    'backup',
    sourcePath,
    '--repo', this.getRepoPath(repoConfig),
    '--password-file', repoConfig.passwordFile,
    '--tag', `server:${serverUuid}`,
    '--tag', `node:${this.nodeId}`,
    '--exclude', '*.log', // Exclude log files
    '--exclude', '*.tmp',
    '--json' // JSON output for parsing
  ];
  
  // Execute and capture output
  const output = await this.executeCommand(backupCommand.join(' '));
  const result = JSON.parse(output);
  
  return result.message?.new_file || result.id; // Snapshot ID
}
```

**2. Pre-Backup Checks:**

```typescript
private async preBackupChecks(serverUuid: string, serverPath: string): Promise<void> {
  // 1. Check if server path exists
  if (!await fs.pathExists(serverPath)) {
    throw new Error(`Server path does not exist: ${serverPath}`);
  }
  
  // 2. Check available disk space (need at least 2x server size)
  const serverSize = await this.getDirectorySize(serverPath);
  const availableSpace = await this.getAvailableDiskSpace();
  
  if (availableSpace < serverSize * 2) {
    throw new Error(`Insufficient disk space for backup. Need: ${serverSize * 2}, Available: ${availableSpace}`);
  }
  
  // 3. Check repository connectivity
  const repoHealthy = await this.checkRepositoryHealth();
  if (!repoHealthy) {
    throw new Error('Backup repository is not accessible');
  }
}
```

**3. Backup Scheduling:**

```typescript
// Cron job: Daily backups at 3 AM
@Cron('0 3 * * *')
async function scheduledBackups() {
  // 1. Get all active servers
  const servers = await this.backendClient.getActiveServers(this.nodeId);
  
  // 2. Process backups sequentially (to avoid disk I/O overload)
  for (const server of servers) {
    try {
      // Check if backup already exists for today
      const todayBackup = await this.getTodayBackup(server.uuid);
      if (todayBackup) {
        this.logger.info(`Backup already exists for ${server.uuid} today, skipping`);
        continue;
      }
      
      // Create backup (without stopping server - faster)
      await this.createBackup(server.uuid, {
        stopServer: false,
        retention: {
          daily: 7,   // Keep 7 daily backups
          weekly: 4,  // Keep 4 weekly backups
          monthly: 12 // Keep 12 monthly backups
        }
      });
      
      // Wait between backups to avoid overload
      await this.sleep(60000); // 1 minute
      
    } catch (error) {
      this.logger.error(`Scheduled backup failed for ${server.uuid}`, error);
      // Continue with next server
    }
  }
}
```

#### 3.7.3 Backup Restore

**1. Restore Process:**

```typescript
async function restoreBackup(
  serverUuid: string,
  snapshotId: string,
  options: RestoreOptions = {}
): Promise<RestoreResult> {
  const startTime = Date.now();
  
  // 1. Get backup information
  const backup = await this.getBackupInfo(snapshotId);
  if (!backup || backup.serverUuid !== serverUuid) {
    throw new NotFoundException('Backup not found');
  }
  
  // 2. Stop server
  const wasRunning = await this.isServerRunning(serverUuid);
  if (wasRunning) {
    await this.containerManager.stopContainer(serverUuid);
    await this.sleep(5000);
  }
  
  try {
    // 3. Create temporary restore directory
    const tempRestorePath = `/var/lib/zedhosting/restore-temp/${serverUuid}-${Date.now()}`;
    await fs.ensureDir(tempRestorePath);
    
    // 4. Execute restic restore
    await this.executeResticRestore(snapshotId, tempRestorePath);
    
    // 5. Backup current server data (safety)
    const safetyBackupPath = `/var/lib/zedhosting/servers/${serverUuid}.pre-restore-${Date.now()}`;
    await fs.move(
      `/var/lib/zedhosting/servers/${serverUuid}`,
      safetyBackupPath
    );
    
    // 6. Move restored data to server path
    await fs.move(tempRestorePath, `/var/lib/zedhosting/servers/${serverUuid}`);
    
    // 7. Cleanup temp directory
    await fs.remove(tempRestorePath);
    
    // 8. Update backup record
    await this.updateBackupRecord(backup.id, {
      lastRestoredAt: new Date()
    });
    
    return {
      success: true,
      snapshotId,
      duration: Date.now() - startTime,
      safetyBackupPath // User can restore this if needed
    };
    
  } catch (error) {
    // Rollback: restore safety backup
    if (await fs.pathExists(safetyBackupPath)) {
      await fs.move(safetyBackupPath, `/var/lib/zedhosting/servers/${serverUuid}`);
    }
    throw error;
  } finally {
    // 9. Restart server if it was running
    if (wasRunning && options.autoStart) {
      await this.containerManager.startContainer(serverUuid);
    }
  }
}

private async executeResticRestore(
  snapshotId: string,
  targetPath: string
): Promise<void> {
  const repoConfig = this.getRepositoryConfig(process.env.BACKUP_TYPE || 'sftp');
  
  const restoreCommand = [
    this.resticPath,
    'restore',
    snapshotId,
    '--target', targetPath,
    '--repo', this.getRepoPath(repoConfig),
    '--password-file', repoConfig.passwordFile
  ];
  
  await this.executeCommand(restoreCommand.join(' '));
}
```

**2. Backup Listing:**

```typescript
async function listBackups(serverUuid: string): Promise<BackupInfo[]> {
  const repoConfig = this.getRepositoryConfig(process.env.BACKUP_TYPE || 'sftp');
  
  const listCommand = [
    this.resticPath,
    'snapshots',
    '--repo', this.getRepoPath(repoConfig),
    '--password-file', repoConfig.passwordFile,
    '--tag', `server:${serverUuid}`,
    '--json'
  ];
  
  const output = await this.executeCommand(listCommand.join(' '));
  const snapshots = JSON.parse(output);
  
  return snapshots.map((snapshot: any) => ({
    id: snapshot.id,
    shortId: snapshot.short_id,
    time: new Date(snapshot.time),
    hostname: snapshot.hostname,
    tags: snapshot.tags,
    paths: snapshot.paths
  }));
}
```

#### 3.7.4 Retention Policy

**1. Retention Policy Application:**

```typescript
async function applyRetentionPolicy(serverUuid: string): Promise<void> {
  const policy = {
    daily: 7,   // Keep 7 daily backups
    weekly: 4,  // Keep 4 weekly backups (one per week)
    monthly: 12 // Keep 12 monthly backups (one per month)
  };
  
  // 1. Get all backups for server
  const backups = await this.listBackups(serverUuid);
  
  // 2. Group by time period
  const now = new Date();
  const daily: BackupInfo[] = [];
  const weekly: BackupInfo[] = [];
  const monthly: BackupInfo[] = [];
  
  for (const backup of backups) {
    const age = now.getTime() - backup.time.getTime();
    const days = age / (1000 * 60 * 60 * 24);
    
    if (days <= 7) {
      daily.push(backup);
    } else if (days <= 30) {
      weekly.push(backup);
    } else {
      monthly.push(backup);
    }
  }
  
  // 3. Keep only required backups
  // Daily: keep all
  // Weekly: keep oldest of each week
  // Monthly: keep oldest of each month
  
  const toDelete: string[] = [];
  
  // Delete excess weekly backups
  if (weekly.length > policy.weekly) {
    weekly.sort((a, b) => a.time.getTime() - b.time.getTime());
    const toKeep = weekly.slice(-policy.weekly);
    const toRemove = weekly.filter(b => !toKeep.includes(b));
    toDelete.push(...toRemove.map(b => b.id));
  }
  
  // Delete excess monthly backups
  if (monthly.length > policy.monthly) {
    monthly.sort((a, b) => a.time.getTime() - b.time.getTime());
    const toKeep = monthly.slice(-policy.monthly);
    const toRemove = monthly.filter(b => !toKeep.includes(b));
    toDelete.push(...toRemove.map(b => b.id));
  }
  
  // 4. Delete old backups
  for (const snapshotId of toDelete) {
    await this.deleteBackup(snapshotId);
  }
}

private async deleteBackup(snapshotId: string): Promise<void> {
  const repoConfig = this.getRepositoryConfig(process.env.BACKUP_TYPE || 'sftp');
  
  const forgetCommand = [
    this.resticPath,
    'forget',
    snapshotId,
    '--repo', this.getRepoPath(repoConfig),
    '--password-file', repoConfig.passwordFile,
    '--prune' // Also prune repository
  ];
  
  await this.executeCommand(forgetCommand.join(' '));
  
  this.logger.info(`Backup deleted: ${snapshotId}`);
}
```

#### 3.7.5 Backup Verification

**1. Integrity Check:**

```typescript
// Cron job: Weekly integrity check
@Cron('0 4 * * 0') // Sunday 4 AM
async function verifyBackups() {
  const repoConfig = this.getRepositoryConfig(process.env.BACKUP_TYPE || 'sftp');
  
  // 1. Check repository integrity
  const checkCommand = [
    this.resticPath,
    'check',
    '--repo', this.getRepoPath(repoConfig),
    '--password-file', repoConfig.passwordFile,
    '--read-data-subset', '5%' // Check 5% of data
  ];
  
  try {
    await this.executeCommand(checkCommand.join(' '));
    this.logger.info('Backup repository integrity check passed');
  } catch (error) {
    this.logger.error('Backup repository integrity check failed', error);
    await this.alertService.createAlert({
      severity: 'CRITICAL',
      type: 'BACKUP_INTEGRITY_FAILED',
      message: 'Backup repository integrity check failed'
    });
  }
}
```

#### 3.7.6 Environment Variables

```bash
# .env
BACKUP_TYPE=sftp # or s3, local
BACKUP_SFTP_HOST=u123456.your-storagebox.de
BACKUP_SFTP_USER=u123456
BACKUP_SFTP_PATH=/backups
BACKUP_S3_BUCKET=zedhosting-backups
BACKUP_S3_REGION=eu-central-1
BACKUP_LOCAL_PATH=/var/lib/zedhosting/backups
BACKUP_PASSWORD_FILE=/etc/restic/password
BACKUP_RETENTION_DAILY=7
BACKUP_RETENTION_WEEKLY=4
BACKUP_RETENTION_MONTHLY=12
BACKUP_SCHEDULE=0 3 * * * # Daily at 3 AM
```

### 3.8 Networking & Subdomains (Traefik)
**Cél:** Automatikus subdomain kezelés, SSL tanúsítványok, reverse proxy játékszerver webes felületekhez (Dynmap, WebAdmin, stb.).

#### 3.8.1 Subdomain Creation Flow

**1. Subdomain Request (Backend):**

```typescript
// apps/api/src/subdomains/subdomains.service.ts
async function createSubdomain(
  serverUuid: string,
  subdomain: string,
  domain: string = 'zedhosting.com'
): Promise<Subdomain> {
  // 1. Validate subdomain format
  this.validateSubdomain(subdomain);
  
  // 2. Check if subdomain already exists
  const existing = await prisma.subdomain.findFirst({
    where: {
      subdomain,
      domain
    }
  });
  
  if (existing) {
    throw new ConflictException(`Subdomain ${subdomain}.${domain} already exists`);
  }
  
  // 3. Get server and node information
  const server = await prisma.gameServer.findUnique({
    where: { uuid: serverUuid },
    include: { node: true }
  });
  
  if (!server) {
    throw new NotFoundException('Server not found');
  }
  
  // 4. Create DNS record (Cloudflare)
  const dnsRecord = await this.cloudflareClient.createARecord({
    name: `${subdomain}.${domain}`,
    content: server.node.ipAddress,
    ttl: 300 // 5 minutes
  });
  
  // 5. Create subdomain record
  const subdomainRecord = await prisma.subdomain.create({
    data: {
      subdomain,
      domain,
      serverUuid,
      cloudflareId: dnsRecord.id,
      targetIP: server.node.ipAddress
    }
  });
  
  // 6. Update Traefik configuration on node
  await this.daemonClient.updateTraefikConfig(server.nodeId, {
    action: 'ADD_SUBDOMAIN',
    subdomain: `${subdomain}.${domain}`,
    serverUuid,
    containerName: `zedhosting-${serverUuid}`,
    httpPort: server.httpPort || 8080
  });
  
  return subdomainRecord;
}
```

**2. Cloudflare DNS API Integration:**

```typescript
// libs/cloudflare/src/cloudflare-client.ts
class CloudflareClient {
  private apiToken: string;
  private zoneId: string;
  
  async createARecord(data: {
    name: string;
    content: string; // IP address
    ttl?: number;
  }): Promise<DNSRecord> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'A',
          name: data.name,
          content: data.content,
          ttl: data.ttl || 300,
          proxied: false // Don't proxy through Cloudflare (direct IP)
        })
      }
    );
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Cloudflare API error: ${result.errors[0].message}`);
    }
    
    return {
      id: result.result.id,
      name: result.result.name,
      content: result.result.content,
      ttl: result.result.ttl
    };
  }
  
  async deleteARecord(recordId: string): Promise<void> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records/${recordId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      }
    );
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Failed to delete DNS record: ${result.errors[0].message}`);
    }
  }
  
  async updateARecord(recordId: string, ip: string): Promise<void> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: ip
        })
      }
    );
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Failed to update DNS record: ${result.errors[0].message}`);
    }
  }
}
```

#### 3.8.2 Traefik Configuration

**1. Traefik Docker Setup:**

```typescript
// apps/daemon/src/traefik-manager.ts
class TraefikManager {
  async ensureTraefikRunning(): Promise<void> {
    // 1. Check if Traefik container exists
    const traefikContainer = await this.getTraefikContainer();
    
    if (traefikContainer) {
      // Check if running
      const inspect = await traefikContainer.inspect();
      if (inspect.State.Running) {
        return; // Already running
      }
      // Start if stopped
      await traefikContainer.start();
      return;
    }
    
    // 2. Create Traefik container
    await this.createTraefikContainer();
  }
  
  private async createTraefikContainer(): Promise<Container> {
    const containerConfig = {
      Image: 'traefik:v2.10',
      name: 'traefik',
      RestartPolicy: { Name: 'always' },
      HostConfig: {
        NetworkMode: 'host', // Host network for direct port access
        Binds: [
          '/var/run/docker.sock:/var/run/docker.sock:ro', // Docker socket
          '/etc/traefik:/etc/traefik:ro' // Config directory
        ]
      },
      Labels: {
        'traefik.enable': 'true'
      },
      Cmd: [
        '--api.dashboard=true',
        '--api.insecure=false',
        '--providers.docker=true',
        '--providers.docker.exposedbydefault=false',
        '--entrypoints.web.address=:80',
        '--entrypoints.websecure.address=:443',
        '--certificatesresolvers.letsencrypt.acme.tlschallenge=true',
        '--certificatesresolvers.letsencrypt.acme.email=admin@zedhosting.com',
        '--certificatesresolvers.letsencrypt.acme.storage=/etc/traefik/acme.json'
      ]
    };
    
    const container = await this.docker.createContainer(containerConfig);
    await container.start();
    
    return container;
  }
}
```

**2. Container Label Configuration:**

```typescript
async function updateContainerLabels(
  serverUuid: string,
  subdomain: string
): Promise<void> {
  const containerName = `zedhosting-${serverUuid}`;
  const container = await this.docker.getContainer(containerName);
  
  // Get current config
  const inspect = await container.inspect();
  const currentLabels = inspect.Config.Labels || {};
  
  // Add Traefik labels
  const traefikLabels = {
    'traefik.enable': 'true',
    [`traefik.http.routers.${serverUuid}.rule`]: `Host(\`${subdomain}\`)`,
    [`traefik.http.routers.${serverUuid}.entrypoints`]: 'web,websecure',
    [`traefik.http.routers.${serverUuid}.tls.certresolver`]: 'letsencrypt',
    [`traefik.http.services.${serverUuid}.loadbalancer.server.port`]: '8080' // Server HTTP port
  };
  
  // Merge labels
  const newLabels = {
    ...currentLabels,
    ...traefikLabels
  };
  
  // Update container (requires container restart)
  // Note: Docker doesn't support label updates without recreation
  // So we need to recreate container with new labels
  await this.recreateContainerWithLabels(container, newLabels);
}

private async recreateContainerWithLabels(
  container: Container,
  newLabels: Record<string, string>
): Promise<void> {
  const inspect = await container.inspect();
  
  // 1. Stop container
  await container.stop();
  
  // 2. Get container config
  const config = inspect.Config;
  config.Labels = newLabels;
  
  // 3. Create new container with updated labels
  const newContainer = await this.docker.createContainer({
    ...config,
    name: inspect.Name
  });
  
  // 4. Start new container
  await newContainer.start();
  
  // 5. Remove old container
  await container.remove();
}
```

#### 3.8.3 SSL Certificate Management

**1. Let's Encrypt Integration:**

```typescript
// Traefik automatically handles Let's Encrypt via ACME
// Configuration in Traefik labels:
// - traefik.http.routers.{name}.tls.certresolver=letsencrypt
// - Traefik will automatically request and renew certificates

// Manual certificate check
async function checkCertificateStatus(subdomain: string): Promise<CertificateStatus> {
  // Check if certificate exists in Traefik
  const traefikApi = `http://localhost:8080/api/http/routers`;
  const response = await fetch(traefikApi);
  const routers = await response.json();
  
  const router = routers.find((r: any) => 
    r.rule === `Host(\`${subdomain}\`)`
  );
  
  if (!router) {
    return { status: 'NOT_CONFIGURED' };
  }
  
  // Check certificate file
  const certPath = `/etc/traefik/acme.json`;
  const certData = await this.readCertificateFile(certPath, subdomain);
  
  if (!certData) {
    return { status: 'PENDING' };
  }
  
  const expiryDate = new Date(certData.notAfter);
  const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  
  return {
    status: daysUntilExpiry > 30 ? 'VALID' : 'EXPIRING_SOON',
    expiryDate,
    daysUntilExpiry
  };
}
```

#### 3.8.4 Subdomain Deletion

**1. Cleanup Process:**

```typescript
async function deleteSubdomain(subdomainId: string): Promise<void> {
  // 1. Get subdomain record
  const subdomain = await prisma.subdomain.findUnique({
    where: { id: subdomainId },
    include: { server: { include: { node: true } } }
  });
  
  if (!subdomain) {
    throw new NotFoundException('Subdomain not found');
  }
  
  // 2. Delete DNS record
  await this.cloudflareClient.deleteARecord(subdomain.cloudflareId);
  
  // 3. Remove Traefik labels from container
  await this.daemonClient.updateTraefikConfig(subdomain.server.nodeId, {
    action: 'REMOVE_SUBDOMAIN',
    subdomain: `${subdomain.subdomain}.${subdomain.domain}`,
    serverUuid: subdomain.serverUuid
  });
  
  // 4. Delete subdomain record
  await prisma.subdomain.delete({
    where: { id: subdomainId }
  });
}
```

#### 3.8.5 IP Address Change Handling

**1. Server Migration (IP Change):**

```typescript
async function handleServerMigration(
  serverUuid: string,
  oldNodeId: string,
  newNodeId: string
): Promise<void> {
  // 1. Get all subdomains for server
  const subdomains = await prisma.subdomain.findMany({
    where: { serverUuid }
  });
  
  // 2. Get new node IP
  const newNode = await prisma.node.findUnique({
    where: { id: newNodeId }
  });
  
  // 3. Update DNS records
  for (const subdomain of subdomains) {
    await this.cloudflareClient.updateARecord(
      subdomain.cloudflareId,
      newNode.ipAddress
    );
    
    // Update subdomain record
    await prisma.subdomain.update({
      where: { id: subdomain.id },
      data: { targetIP: newNode.ipAddress }
    });
  }
}
```

#### 3.8.6 Environment Variables

```bash
# .env
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID=your-zone-id
TRAEFIK_IMAGE=traefik:v2.10
TRAEFIK_DASHBOARD_PORT=8080
TRAEFIK_ACME_EMAIL=admin@zedhosting.com
TRAEFIK_ACME_STORAGE=/etc/traefik/acme.json
DEFAULT_DOMAIN=zedhosting.com
```

### 3.9 Monitoring & Observability Module (Enterprise Grade)
**Cél:** Teljes láthatóság a rendszer működésében, proaktív problémamegelőzés.
**Komponensek:**

1. **Prometheus Metrikák:**
   * **Node Metrikák:** CPU, RAM, Disk I/O, Network (In/Out), Uptime, Container count.
   * **Server Metrikák:** Per-server CPU/RAM/Disk, Player count (ha elérhető), Query response time.
   * **System Metrikák:** API response time, Queue depth, Error rate, Active connections.
   * **Custom Metrikák:** Backup success rate, Update queue wait time, Port allocation efficiency.

2. **Metrikák Gyűjtése:**
   * Daemon 15 másodpercenként küld metrikákat a Backendnek (HTTP POST `/api/agent/metrics`).
   * Backend aggregálja és eltárolja a `Metric` táblába (time-series adatok).
   * **Retention:** 30 nap részletes, 90 nap aggregált (1 órás átlagok).

3. **Grafana Dashboards:**
   * **Node Overview:** Minden Node állapota egy nézetben (CPU, RAM, Disk heatmap).
   * **Server Performance:** Per-server metrikák, trendek, anomaly detection.
   * **System Health:** API latency, error rate, queue metrics.
   * **Business Metrics:** Active servers, revenue, user growth.

4. **Log Aggregáció (Loki):**
   * Daemon logok strukturált formátumban (JSON).
   * Backend API logok (request/response, errors).
   * Log levels: DEBUG, INFO, WARN, ERROR.
   * **Search:** LogQL queries a Grafana-ban.

5. **Distributed Tracing (OpenTelemetry):**
   * Request flow követése: Frontend -> API -> Daemon -> Docker.
   * Latency breakdown per szolgáltatás.
   * Error propagation tracking.

### 3.10 Alerting System (Proaktív Problémamegelőzés)
**Cél:** Kritikus események azonnali értesítése, mielőtt a felhasználók észreveszik.
**Alert Típusok:**

1. **CRITICAL Alerts (Azonnali akció szükséges):**
   * `NODE_OFFLINE`: Node heartbeat hiányzik 2 percnél tovább.
   * `DISK_FULL`: Disk usage > 95%.
   * `LICENSE_EXPIRED`: Licenc lejárt, rendszer leállás veszélyben.
   * `BACKUP_FAILED`: 3 egymás utáni backup sikertelen.

2. **WARNING Alerts (Figyelés szükséges):**
   * `SERVER_CRASH_LOOP`: Szerver 3+ újraindítás 10 perc alatt.
   * `HIGH_CPU`: Node CPU > 90% 5 percig.
   * `HIGH_MEMORY`: Node RAM > 90% 5 percig.
   * `LICENSE_EXPIRING`: Licenc 7 napnál kevesebb van hátra.

3. **INFO Alerts (Tájékoztató):**
   * `SERVER_STARTED`: Szerver sikeresen elindult.
   * `BACKUP_COMPLETED`: Backup sikeresen befejeződött.
   * `UPDATE_COMPLETED`: Szerver frissítés befejeződött.

**Alert Delivery:**
* **Email:** Minden kritikus és warning alert.
* **Discord Webhook:** Kritikus alertok + konfigurálható warning alertok.
* **Slack Integration:** Opcionális, tenant-specifikus.
* **In-App Notifications:** Frontend real-time értesítések (WebSocket).

**Alert Resolution:**
* Automatikus: Ha a probléma megszűnik (pl. Node újra online), az alert automatikusan `RESOLVED` státuszba kerül.
* Manuális: Admin jelöli meg `RESOLVED`-ként, opcionálisan megjegyzéssel.

### 3.11 Rate Limiting & DDoS Protection
**Cél:** API védelme túlterhelés és rosszindulatú támadások ellen.

1. **API Rate Limiting (Tiered System):**
   * **Public API:** 100 req/min per IP.
   * **Authenticated Users:** 500 req/min per user.
   * **Admin API:** 1000 req/min per admin.
   * **Agent API:** 200 req/min per API key.
   * **Implementation:** Redis-alapú sliding window algorithm.

2. **DDoS Protection:**
   * **Game Port Protection:** Cloudflare DDoS protection (ha használható) vagy UFW rate limiting.
   * **API Protection:** Automatic IP blocking after 1000 req/min threshold.
   * **Whitelist System:** Trusted IP-ek (Admin, Agent) kivételezése.

3. **Brute Force Protection:**
   * Login attempts: Max 5 per IP per 15 perc.
   * Lockout: 30 perc IP block sikertelen kísérletek után.
   * 2FA bypass attempts: Max 3 per user per óra.

### 3.12 Testing Strategy (Quality Assurance)
**Cél:** Magas kódminőség, regresszió megelőzése, biztonságos deployment.

1. **Unit Tests (Jest):**
   * **Coverage Target:** Minimum 80% kritikus moduloknál.
   * **Fókusz:** Business logic, utility functions, DTO validációk.
   * **Példák:** Port Manager algoritmus, Licensing validáció, Resource Quota számítások.

2. **Integration Tests (Supertest):**
   * **API Endpoints:** Minden CRUD művelet, edge cases.
   * **Database Operations:** Transaction rollback, constraint violations.
   * **External Services:** Mock responses (Licensing server, Cloudflare API).

3. **E2E Tests (Playwright):**
   * **Critical User Flows:**
     * User regisztráció -> Email verifikáció -> Szerver létrehozás -> Szerver indítás.
     * Admin: Node hozzáadása -> Provisioning -> Szerver deployment.
   * **Cross-browser:** Chrome, Firefox, Safari.

4. **Load Testing (k6):**
   * **Scenarios:**
     * 100 concurrent users, 60 szerver API hívások.
     * Daemon heartbeat storm (60 node egyszerre).
     * Port allocation stress test (1000 port request).
   * **SLA Targets:** P95 latency < 500ms, error rate < 0.1%.

5. **Security Testing:**
   * **OWASP Top 10:** Automated scanning (Snyk, npm audit).
   * **Penetration Testing:** Yearly external audit.
   * **Dependency Scanning:** Automated CVE detection.

### 3.13 CI/CD Pipeline (Automated Deployment)
**Cél:** Gyors, biztonságos, konzisztens deployment.

1. **Pipeline Stages:**
   * **Lint & Format:** ESLint, Prettier, TypeScript type check.
   * **Unit Tests:** Jest test suite.
   * **Build:** Docker image build (multi-stage).
   * **Integration Tests:** Supertest API tests.
   * **Security Scan:** Trivy/Docker Scout vulnerability scanning.
   * **Deploy to Staging:** Automatikus staging deployment.
   * **E2E Tests:** Playwright tests staging-en.
   * **Deploy to Production:** Manual approval required.

2. **Docker Images:**
   * **Base Images:** Official Node.js Alpine (minimal size).
   * **Multi-stage Builds:** Separate build and runtime stages.
   * **Image Registry:** Docker Hub vagy private registry (Harbor).
   * **Tagging Strategy:** `latest`, `v1.2.3`, `main-abc123` (git commit hash).

3. **Rollback Strategy:**
   * **Automatic Rollback:** Ha health check fails 3x egymás után.
   * **Manual Rollback:** Previous image tag deployment 1 kattintással.
   * **Database Migrations:** Backward-compatible migrations only, rollback script minden migration-hez.

### 3.14 Disaster Recovery (DR) & Business Continuity
**Cél:** Rendszer helyreállítás kritikus hibák után, minimális downtime.

1. **RTO/RPO Definíciók:**
   * **RTO (Recovery Time Objective):** 4 óra (Rendszer újraindítás ideje).
   * **RPO (Recovery Point Objective):** 1 óra (Max adatvesztés).

2. **Backup Stratégia:**
   * **Database:** Napi full backup + óránkénti binlog backup (MySQL).
   * **Storage:** Restic snapshots (lásd 3.7).
   * **Configuration:** Git repository (Infrastructure as Code).

3. **Failover Mechanizmus:**
   * **Database:** MySQL Master-Slave replication, automatikus failover (MHA vagy ProxySQL).
   * **Redis:** Redis Sentinel vagy Cluster mode (High Availability).
   * **Application:** Load balancer (Traefik) health check alapú routing.

4. **Recovery Playbook:**
   * **Documented Steps:** Minden kritikus komponens recovery folyamata.
   * **Runbook Automation:** Ansible playbooks a recovery-hez.
   * **Testing:** Quarterly DR drills (simulated disasters).

### 3.15 Cost Management & Resource Optimization
**Cél:** Erőforrás-használat optimalizálása, költségtranszparencia.

1. **Resource Tracking:**
   * **Per User:** RAM, CPU, Disk használat követése.
   * **Per Tenant:** Aggregált erőforrás-használat.
   * **Per Node:** Teljes kapacitás vs. használat.

2. **Cost Calculation:**
   * **Infrastructure Costs:** Node hosting costs (Hetzner pricing).
   * **Storage Costs:** Backup storage (Hetzner Storage Box).
   * **Bandwidth Costs:** Network egress (ha van limit).
   * **Per-Server Pricing:** Dynamic pricing based on actual resource usage.

3. **Quota Enforcement:**
   * **Hard Limits:** `ResourceQuota` tábla alapján automatikus blokkolás.
   * **Soft Limits:** Figyelmeztetés 80% használatnál.
   * **Auto-scaling Prevention:** Quota ellenőrzés új szerver létrehozás előtt.

4. **Optimization Recommendations:**
   * **Idle Server Detection:** Szerverek, amelyek 7 napja nem futnak -> Email javaslat törlésre.
   * **Over-provisioned Servers:** Szerverek, amelyek < 20% erőforrást használnak -> Downsize javaslat.
   * **Node Utilization:** Node-ok < 50% használat -> Consolidation javaslat.

### 3.16 API Documentation & Versioning
**Cél:** Fejlesztőbarát API, könnyű integráció.

1. **OpenAPI/Swagger Spec:**
   * **Auto-generation:** NestJS `@nestjs/swagger` decorators.
   * **Interactive Docs:** Swagger UI endpoint (`/api/docs`).
   * **Examples:** Minden endpoint-hoz request/response példák.

2. **API Versioning:**
   * **Strategy:** URL-based (`/api/v1/`, `/api/v2/`).
   * **Deprecation Policy:** Minimum 6 hónap notice deprecated endpoints-hoz.
   * **Migration Guides:** Version upgrade dokumentáció.

3. **SDK Generation:**
   * **TypeScript SDK:** Auto-generated from OpenAPI spec.
   * **Python SDK:** Opcionális, ha szükséges.
   * **Postman Collection:** Exportálható collection API testing-hez.

### 3.17 Secret Management & Security Enhancements
**Cél:** Titkos adatok biztonságos kezelése, compliance.

1. **Secret Storage:**
   * **Development:** `.env` fájlok (gitignore-d).
   * **Production:** HashiCorp Vault vagy AWS Secrets Manager.
   * **Rotation:** Automatikus secret rotation policy (90 nap).

2. **API Key Management:**
   * **Generation:** Cryptographically secure random (32 bytes, base64).
   * **Storage:** SHA-256 hash (soha plaintext).
   * **Revocation:** Instant revocation, affected sessions invalidated.
   * **Usage Tracking:** Last used timestamp, IP address logging.

3. **Session Management:**
   * **JWT Tokens:** Short-lived (15 min access, 7 days refresh).
   * **Secure Cookies:** HttpOnly, Secure, SameSite=Strict.
   * **Session Timeout:** 30 perc inaktivitás után automatikus logout.

4. **IP Whitelisting:**
   * **Admin API:** Opcionális IP whitelist (extra security layer).
   * **Agent API:** Node IP whitelist (automatic on registration).

### 3.18 Compliance & Data Protection
**Cél:** GDPR, adatvédelmi követelmények teljesítése.

1. **GDPR Compliance:**
   * **Data Minimization:** Csak szükséges adatok gyűjtése.
   * **Right to Access:** User data export funkció (JSON format).
   * **Right to Deletion:** User account + összes adat törlése (cascade delete).
   * **Data Retention:** Automatikus törlés inaktív accountoknál (2 év).

2. **Audit Trail:**
   * **Comprehensive Logging:** Minden adatmódosítás naplózva (`AuditLog`).
   * **Immutable Logs:** Logs nem módosíthatók (append-only).
   * **Retention:** 7 év audit log retention (compliance).

3. **Data Encryption:**
   * **At Rest:** Database encryption (MySQL encryption at rest).
   * **In Transit:** TLS 1.3 minden kommunikációban.
   * **Backup Encryption:** Restic backup encryption (AES-256).

### 3.19 Performance Optimization
**Cél:** Alacsony latency, magas throughput, skálázhatóság.

1. **Database Optimization:**
   * **Indexing Strategy:**
     * `Metric.timestamp` + `Metric.nodeId` (composite index).
     * `GameServer.status` + `GameServer.nodeId`.
     * `NetworkAllocation.nodeId` + `NetworkAllocation.port`.
   * **Query Optimization:** N+1 probléma elkerülése (Prisma `include`).
   * **Connection Pooling:** Prisma connection pool tuning (max 10 connections).

2. **Redis Caching:**
   * **Cache Keys:**
     * `node:{id}:status` (TTL: 30s)
     * `server:{uuid}:status` (TTL: 15s)
     * `license:validation` (TTL: 24h)
     * `user:{id}:permissions` (TTL: 5min)
   * **Cache Invalidation:** Event-based invalidation (on data change).

3. **API Response Optimization:**
   * **Pagination:** Minden list endpoint (default: 50 items/page).
   * **Field Selection:** GraphQL-style field selection (`?fields=id,name,status`).
   * **Compression:** Gzip compression (Fastify built-in).

4. **Frontend Optimization:**
   * **Code Splitting:** Next.js automatic code splitting.
   * **Image Optimization:** Next.js Image component (WebP, lazy loading).
   * **SSR/SSG:** Static generation ahol lehetséges (pricing page, docs).

### 3.20 Game-Specific Enhancements
**Cél:** Játék-specifikus optimalizálások, fejlett funkciók.

1. **Mod Marketplace Integration:**
   * **Rust Mods:** Oxide mod telepítés, auto-update.
   * **Minecraft Plugins:** Spigot/Bukkit plugin manager.
   * **ARK Mods:** Steam Workshop mod subscription.

2. **Auto-Mod Update:**
   * **Scheduled Updates:** Heti/havi mod update schedule.
   * **Version Tracking:** Mod verziók követése, changelog.
   * **Rollback:** Mod verzió visszaállítás probléma esetén.

3. **Game Config Templates:**
   * **Pre-configured Templates:** Popular server configs (PvP, PvE, Creative).
   * **Custom Templates:** User-saved config templates.
   * **Version Control:** Config változások history (git-like).

4. **Performance Tuning Guides:**
   * **Per-Game Optimization:**
     * ARK: World save optimization, dino count limits.
     * Rust: Entity limit tuning, garbage collection.
     * Minecraft: JVM arguments, chunk loading optimization.

### 3.21 Billing & Payment Integration
**Cél:** Automatikus számlázás, fizetési folyamatok.

1. **Payment Providers:**
   * **Stripe:** Credit card, SEPA (EU).
   * **PayPal:** PayPal account, credit card.
   * **Revolut:** Business payments (EU).
   * **Crypto:** Opcionális (Bitcoin, USDT) - jövőbeli feature.

2. **Invoice Generation:**
   * **Automatic:** Monthly/Yearly subscription invoices.
   * **On-Demand:** Manual invoice generation (admin).
   * **PDF Export:** Professional invoice PDF (company branding).

3. **Usage-Based Billing:**
   * **Per-Hour Pricing:** Szerver óránkénti díja (RAM/CPU alapú).
   * **Bandwidth:** Network egress pricing (ha van limit).
   * **Storage:** Backup storage pricing (GB/hó).

4. **Credit System:**
   * **Prepaid Credits:** User balance, auto-deduction.
   * **Auto-Topup:** Automatic credit purchase low balance esetén.
   * **Promotional Credits:** Admin által adható kreditek.

### 3.22 Support System & Knowledge Base
**Cél:** Felhasználói támogatás, önsegítő rendszer.

1. **Ticket System:**
   * **Priority Levels:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low).
   * **Assignment:** Auto-assignment vagy manual (support team).
   * **Status Tracking:** Open, In Progress, Waiting for User, Resolved, Closed.
   * **Attachments:** Log files, screenshots, config files.

2. **Knowledge Base:**
   * **Articles:** How-to guides, troubleshooting, FAQ.
   * **Search:** Full-text search (Algolia vagy Elasticsearch).
   * **Categories:** Getting Started, Server Management, Billing, Technical.

3. **Live Chat:**
   * **Integration:** Intercom vagy Crisp (opcionális).
   * **Business Hours:** Configurable support hours.
   * **Chatbot:** AI-powered chatbot (GPT integration) basic questions-hez.

4. **Automated Troubleshooting:**
   * **Diagnostic Scripts:** Automatic server health check, issue detection.
   * **Self-Service Fixes:** Common issues automatikus javítása (pl. port conflict).
   * **Recommendations:** Proactive suggestions (pl. "Your server is using 95% RAM, consider upgrade").

---

## 4. DESIGN SYSTEM & UI (2025 MODERN & PRÉMIUM)

**Stílusirányzat:** "Spatial Design", "Neo-Brutalism meets Minimalism", "Advanced Glassmorphism", "Micro-interactions First".
**Technológia:** Tailwind CSS v4, Shadcn/UI v2, Framer Motion, Radix UI Primitives, Variable Fonts.

### 4.1 Design Philosophy & Core Principles

**1. Spatial Design (Depth & Layering):**
* **3D Depth Perception:** Subtle shadows, elevation system (0-24dp), parallax scrolling.
* **Layering:** Z-index system (base: 0, elevated: 10, modal: 50, toast: 100).
* **Perspective:** Transform-based depth effects (`perspective-1000`, `rotateX(-2deg)`).

**2. Micro-interactions (Purposeful Motion):**
* **Button Hover:** Scale (1.0 → 1.02), shadow elevation increase, 150ms ease-out.
* **Card Hover:** Subtle lift (translateY(-2px)), border glow, 200ms ease-out.
* **Loading States:** Skeleton screens with shimmer animation, progress indicators.
* **Success/Error:** Toast notifications with slide-in animation (300ms), auto-dismiss (5s).

**3. Accessibility First (WCAG 2.1 AA+):**
* **Color Contrast:** Minimum 4.5:1 for text, 3:1 for UI components.
* **Keyboard Navigation:** Full keyboard support, visible focus indicators (2px outline).
* **Screen Reader:** ARIA labels, semantic HTML, live regions for dynamic content.
* **Reduced Motion:** Respect `prefers-reduced-motion`, disable animations if requested.

**4. Responsive & Fluid:**
* **Breakpoints:** Mobile (320px), Tablet (768px), Desktop (1024px), Wide (1440px+).
* **Fluid Typography:** Clamp-based responsive text (min, preferred, max).
* **Container Queries:** Component-level responsive design (not just viewport-based).
* **Touch Targets:** Minimum 44x44px for mobile, 32x32px for desktop.

### 4.2 Color System & Theming

**1. Color Palette (Semantic Colors):**

```typescript
// Dark Theme (Default)
const colors = {
  // Base Colors
  background: {
    primary: '#0a0a0a',      // Deep black
    secondary: '#111111',      // Slightly lighter
    tertiary: '#1a1a1a',       // Elevated surfaces
    elevated: '#222222',       // Cards, modals
  },
  
  // Semantic Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',           // Sky blue (main brand)
    600: '#0284c7',
    700: '#0369a1',
    900: '#0c4a6e',
  },
  
  success: {
    500: '#22c55e',           // Green
    600: '#16a34a',
  },
  
  warning: {
    500: '#f59e0b',           // Amber
    600: '#d97706',
  },
  
  error: {
    500: '#ef4444',           // Red
    600: '#dc2626',
  },
  
  // Text Colors
  text: {
    primary: '#ffffff',       // High contrast
    secondary: '#a3a3a3',      // Medium contrast
    tertiary: '#737373',      // Low contrast
    disabled: '#525252',       // Disabled state
  },
  
  // Border Colors
  border: {
    default: 'rgba(255, 255, 255, 0.1)',
    hover: 'rgba(255, 255, 255, 0.2)',
    focus: 'rgba(14, 165, 233, 0.5)', // Primary with opacity
  },
  
  // Glassmorphism
  glass: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.1)',
    heavy: 'rgba(255, 255, 255, 0.15)',
  },
};
```

**2. Gradient System:**

```typescript
const gradients = {
  // Background Gradients
  mesh: 'radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0%, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
  
  // Accent Gradients
  primary: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
  success: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
  
  // Glassmorphism Gradient
  glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
};
```

**3. Theme Switching:**
* **Default:** Dark theme (reduces eye strain, modern aesthetic).
* **Light Theme:** Optional, user preference stored in localStorage.
* **System Preference:** Auto-detect `prefers-color-scheme`, allow manual override.
* **Smooth Transition:** 300ms fade transition when switching themes.

### 4.3 Typography System

**1. Variable Fonts (Modern Approach):**

```typescript
const typography = {
  // Primary Font: Geist Sans (Variable)
  fontFamily: {
    sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
    mono: ['var(--font-jetbrains-mono)', 'Monaco', 'monospace'],
  },
  
  // Fluid Typography Scale
  fontSize: {
    xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',    // 12-14px
    sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',      // 14-16px
    base: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',    // 16-18px
    lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.5rem)',       // 18-24px
    xl: 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',             // 24-32px
    '2xl': 'clamp(2rem, 1.7rem + 1.5vw, 3rem)',          // 32-48px
    '3xl': 'clamp(2.5rem, 2rem + 2.5vw, 4.5rem)',        // 40-72px
  },
  
  // Font Weights (Variable Font)
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

**2. Typography Hierarchy:**

* **H1 (Page Title):** `text-3xl font-bold` - 40-72px, weight 700
* **H2 (Section Title):** `text-2xl font-semibold` - 32-48px, weight 600
* **H3 (Subsection):** `text-xl font-semibold` - 24-32px, weight 600
* **Body:** `text-base font-normal` - 16-18px, weight 400
* **Caption:** `text-sm font-normal text-text-secondary` - 14-16px, weight 400
* **Code:** `font-mono text-sm` - JetBrains Mono, 14-16px

### 4.4 Global Layout & Structure

**1. Layout Architecture:**

```typescript
// App Shell Structure
<AppShell>
  <Sidebar />           // Fixed left sidebar (collapsible)
  <MainContent>
    <Header />          // Sticky top header
    <Breadcrumbs />     // Navigation breadcrumbs
    <PageContent />      // Main content area
  </MainContent>
  <CommandPalette />     // ⌘K command palette (overlay)
  <ToastContainer />    // Toast notifications (top-right)
</AppShell>
```

**2. Sidebar (Advanced Glassmorphism):**

```css
.sidebar {
  /* Glassmorphism with depth */
  background: rgba(17, 17, 17, 0.8);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  
  /* Border with gradient */
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  
  /* Shadow for depth */
  box-shadow: 
    -2px 0 8px rgba(0, 0, 0, 0.3),
    inset 1px 0 0 rgba(255, 255, 255, 0.05);
  
  /* Smooth transitions */
  transition: transform 300ms ease-out, width 300ms ease-out;
}

.sidebar-collapsed {
  width: 64px;  /* Icon-only mode */
}

.sidebar-expanded {
  width: 256px; /* Full width */
}
```

**3. Background (Spatial Design):**

```css
.background {
  /* Base gradient mesh */
  background: 
    radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.15) 0%, transparent 50%),
    radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
    #0a0a0a;
  
  /* Subtle noise texture */
  background-image: 
    url('data:image/svg+xml;base64,...'), /* Noise SVG */
    radial-gradient(...);
  
  /* Parallax effect on scroll */
  background-attachment: fixed;
}
```

### 4.5 Component Library (Shadcn/UI Enhanced)

**1. Server Card (Bento Grid with Advanced Interactions):**

```typescript
<ServerCard>
  {/* Header with status indicator */}
  <CardHeader>
    <StatusIndicator 
      status={server.status}
      pulse={server.status === 'RUNNING'} // Pulsing animation
    />
    <ServerName>{server.name}</ServerName>
    <ServerActions menu={<DropdownMenu />} />
  </CardHeader>
  
  {/* Body with sparkline chart */}
  <CardBody>
    <SparklineChart 
      data={metrics.cpu}
      color="primary"
      height={60}
      smooth={true} // Smooth line interpolation
    />
    <ResourceBars>
      <ResourceBar type="cpu" value={server.cpuUsage} />
      <ResourceBar type="ram" value={server.ramUsage} />
      <ResourceBar type="disk" value={server.diskUsage} />
    </ResourceBars>
  </CardBody>
  
  {/* Footer with quick actions */}
  <CardFooter>
    <ButtonGroup>
      <IconButton icon="play" onClick={startServer} />
      <IconButton icon="stop" onClick={stopServer} />
      <IconButton icon="terminal" onClick={openConsole} />
      <IconButton icon="settings" onClick={openSettings} />
    </ButtonGroup>
  </CardFooter>
</ServerCard>

// Hover Effects
.card-hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 40px rgba(14, 165, 233, 0.2); // Glow effect
  transition: all 200ms ease-out;
}
```

**2. Terminal Console (Advanced):**

```typescript
<TerminalConsole>
  {/* Terminal Header */}
  <TerminalHeader>
    <TerminalTabs>
      <Tab active>Console</Tab>
      <Tab>Logs</Tab>
      <Tab>Errors</Tab>
    </TerminalTabs>
    <TerminalActions>
      <IconButton icon="clear" onClick={clearConsole} />
      <IconButton icon="download" onClick={downloadLogs} />
      <IconButton icon="fullscreen" onClick={toggleFullscreen} />
    </TerminalActions>
  </TerminalHeader>
  
  {/* Terminal Body */}
  <TerminalBody>
    <TerminalLines>
      {lines.map(line => (
        <TerminalLine 
          key={line.id}
          type={line.type} // 'info' | 'error' | 'warning' | 'success'
          timestamp={line.timestamp}
        >
          {line.content}
        </TerminalLine>
      ))}
    </TerminalLines>
    <TerminalInput 
      onSubmit={handleCommand}
      placeholder="Enter command..."
    />
  </TerminalBody>
</TerminalConsole>

// Terminal Styling
.terminal {
  background: #0d1117; // GitHub dark theme color
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  
  /* Syntax highlighting */
  .line-info { color: #58a6ff; }
  .line-error { color: #f85149; }
  .line-warning { color: #d29922; }
  .line-success { color: #3fb950; }
  
  /* Auto-scroll with smooth animation */
  scroll-behavior: smooth;
}
```

**3. File Manager (VS Code-like):**

```typescript
<FileManager>
  {/* Sidebar: File Tree */}
  <FileTree>
    <FileTreeItem 
      type="folder"
      expanded={true}
      icon="folder"
    >
      <FileTreeItem type="file" icon="file-code" />
      <FileTreeItem type="file" icon="file-config" />
    </FileTreeItem>
  </FileTree>
  
  {/* Main: Editor */}
  <Editor>
    <EditorTabs>
      <Tab active>server.properties</Tab>
      <Tab>server.cfg</Tab>
    </EditorTabs>
    <MonacoEditor
      language="properties"
      theme="vs-dark"
      value={fileContent}
      onChange={handleChange}
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        wordWrap: 'on',
        lineNumbers: 'on',
      }}
    />
  </Editor>
  
  {/* Status Bar */}
  <StatusBar>
    <StatusItem>Ln 42, Col 15</StatusItem>
    <StatusItem>UTF-8</StatusItem>
    <StatusItem>Spaces: 2</StatusItem>
  </StatusBar>
</FileManager>
```

**4. Command Palette (⌘K Pattern):**

```typescript
<CommandPalette>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandGroup heading="Navigation">
      <CommandItem icon="home" onClick={goToDashboard}>
        Go to Dashboard
      </CommandItem>
      <CommandItem icon="servers" onClick={goToServers}>
        View All Servers
      </CommandItem>
    </CommandGroup>
    <CommandGroup heading="Actions">
      <CommandItem icon="plus" onClick={createServer}>
        Create New Server
      </CommandItem>
      <CommandItem icon="backup" onClick={createBackup}>
        Create Backup
      </CommandItem>
    </CommandGroup>
    <CommandGroup heading="Settings">
      <CommandItem icon="settings" onClick={openSettings}>
        Open Settings
      </CommandItem>
      <CommandItem icon="theme" onClick={toggleTheme}>
        Toggle Theme
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandPalette>

// Keyboard Shortcut: ⌘K (Mac) / Ctrl+K (Windows/Linux)
```

### 4.6 Animation System (Framer Motion)

**1. Page Transitions:**

```typescript
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

<AnimatePresence mode="wait">
  <motion.div
    key={router.pathname}
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**2. Micro-interactions:**

```typescript
// Button Hover Animation
const buttonVariants = {
  hover: {
    scale: 1.02,
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: {
    scale: 0.98,
  },
};

// Card Hover Animation
const cardVariants = {
  hover: {
    y: -4,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// Loading Skeleton Animation
const skeletonVariants = {
  animate: {
    backgroundPosition: ['0%', '100%'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};
```

**3. Toast Notifications:**

```typescript
<Toast
  variant="success"
  title="Server Started"
  description="Your server is now running"
  duration={5000}
  position="top-right"
  animation={{
    initial: { x: 400, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 400, opacity: 0 },
  }}
/>
```

### 4.7 Responsive Design Strategy

**1. Mobile-First Approach:**

```typescript
// Breakpoints
const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
};

// Container Queries (Modern Approach)
.container {
  container-type: inline-size;
}

@container (min-width: 768px) {
  .card {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

**2. Adaptive Components:**

* **Sidebar:** Desktop: Fixed, Tablet: Collapsible, Mobile: Drawer (overlay).
* **Server Cards:** Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column.
* **Table:** Desktop: Full table, Mobile: Card-based list view.
* **Navigation:** Desktop: Horizontal tabs, Mobile: Bottom sheet.

### 4.8 Accessibility Features

**1. Keyboard Navigation:**

* **Tab Order:** Logical focus order, skip links for main content.
* **Shortcuts:** 
  * `⌘K` / `Ctrl+K`: Command palette
  * `⌘/` / `Ctrl+/`: Keyboard shortcuts help
  * `Esc`: Close modals/drawers
  * `Enter`: Activate primary action
  * `Arrow Keys`: Navigate lists/menus

**2. Screen Reader Support:**

```typescript
// ARIA Labels
<button aria-label="Start server">
  <Icon name="play" aria-hidden="true" />
</button>

// Live Regions
<div aria-live="polite" aria-atomic="true">
  {toastMessage}
</div>

// Semantic HTML
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>
```

**3. Focus Management:**

```css
/* Visible Focus Indicator */
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip Link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary-500);
  color: white;
  padding: 8px 16px;
  z-index: 1000;
}

.skip-link:focus {
  top: 0;
}
```

### 4.9 Performance Optimizations

**1. Code Splitting:**

* **Route-based:** Next.js automatic code splitting per route.
* **Component-based:** Dynamic imports for heavy components (Monaco Editor, Charts).
* **Lazy Loading:** Images with `next/image`, lazy load below-fold content.

**2. Animation Performance:**

* **GPU Acceleration:** Use `transform` and `opacity` for animations (not `width`, `height`).
* **Will-change:** Hint browser for upcoming animations: `will-change: transform`.
* **Reduced Motion:** Respect `prefers-reduced-motion`, disable animations if needed.

**3. Bundle Size:**

* **Tree Shaking:** Import only used components from libraries.
* **Font Subsetting:** Load only required font weights/glyphs.
* **Image Optimization:** WebP format, responsive images, lazy loading.

### 4.10 Design Tokens & Configuration

**1. Tailwind Config (Extended):**

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Semantic colors (from color system above)
        background: { ... },
        primary: { ... },
        text: { ... },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', ...],
        mono: ['var(--font-jetbrains-mono)', ...],
      },
      fontSize: {
        // Fluid typography scale
        ...typography.fontSize,
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(14, 165, 233, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography'),
  ],
};
```

**2. CSS Variables (Theme System):**

```css
:root {
  /* Colors */
  --color-primary-500: #0ea5e9;
  --color-background-primary: #0a0a0a;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.3);
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}
```

### 4.11 Component Examples (Implementation Reference)

**1. Modern Button Component:**

```typescript
// components/ui/button.tsx
export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <motion.button
      className={cn(
        'button',
        `button-${variant}`,
        `button-${size}`
      )}
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
    </motion.button>
  );
};
```

**2. Server Status Badge:**

```typescript
// components/server-status-badge.tsx
export const ServerStatusBadge = ({ status }: { status: ServerStatus }) => {
  const config = {
    RUNNING: { color: 'success', icon: 'check-circle', pulse: true },
    STOPPED: { color: 'text-tertiary', icon: 'stop-circle', pulse: false },
    STARTING: { color: 'warning', icon: 'loader', pulse: true, spin: true },
    CRASHED: { color: 'error', icon: 'alert-circle', pulse: false },
  };
  
  const { color, icon, pulse, spin } = config[status];
  
  return (
    <div className={cn('status-badge', `status-${color}`)}>
      <motion.div
        animate={pulse ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Icon name={icon} spin={spin} />
      </motion.div>
      <span>{t(`server.status.${status}`)}</span>
    </div>
  );
};
```

---

**Megjegyzés:** Ez a design system 2025-ös modern trendeket követ, figyelembe véve a spatial design, micro-interactions, accessibility, és performance optimalizációkat. Minden komponens teljes mértékben i18n-támogatott, és követi a WCAG 2.1 AA+ accessibility standardokat.

---

## 5. FEJLETT FEATURES ÉS JÖVŐBELI FEJLESZTÉSEK

### 5.1 Feature Flags & A/B Testing
**Cél:** Biztonságos feature rollout, gradual deployment, experimentation.

1. **Feature Flag System:**
   * **Implementation:** LaunchDarkly vagy saját megoldás (Redis-alapú).
   * **Flag Types:** Boolean, Percentage rollout, User targeting.
   * **Use Cases:**
     * New UI features gradual rollout (10% -> 50% -> 100%).
     * Experimental features (beta users only).
     * Emergency kill switch (instant feature disable).

2. **A/B Testing Framework:**
   * **Variant Assignment:** Consistent user assignment (cookie-based).
   * **Metrics Tracking:** Conversion rates, engagement metrics.
   * **Statistical Significance:** Automatic winner detection (p-value < 0.05).

### 5.2 Multi-Region Support
**Cél:** Alacsony latency globális felhasználókhoz, disaster recovery.

1. **Region Architecture:**
   * **Primary Region:** EU (Hetzner Germany).
   * **Secondary Region:** US (Hetzner US) - jövőbeli.
   * **Data Replication:** MySQL cross-region replication (async).
   * **DNS Routing:** GeoDNS (Cloudflare) - users routed to nearest region.

2. **Challenges:**
   * **Latency:** Cross-region API calls (mitigate with caching).
   * **Data Consistency:** Eventual consistency model.
   * **Cost:** 2x infrastructure costs.

### 5.3 Auto-Scaling Logic (Advanced)
**Cél:** Automatikus erőforrás-kezelés, cost optimization.

1. **Vertical Scaling:**
   * **Auto-Upgrade:** Szerver automatikus upgrade ha > 90% RAM használat 1 órán át.
   * **Auto-Downgrade:** Szerver downgrade ha < 30% erőforrás használat 7 napig.
   * **User Approval:** Email notification, 24h grace period before auto-scaling.

2. **Horizontal Scaling:**
   * **Load Balancing:** Multiple server instances same game (Minecraft proxy, CS2 load balancer).
   * **Auto-Scale Groups:** Automatic server addition/removal based on player count.

### 5.4 Analytics & Business Intelligence
**Cél:** Adatvezérelt döntéshozatal, business insights.

1. **Analytics Dashboard:**
   * **User Metrics:** DAU, MAU, retention rate, churn rate.
   * **Revenue Metrics:** MRR, ARR, LTV, CAC.
   * **Server Metrics:** Average server lifetime, popular game types.
   * **Infrastructure Metrics:** Node utilization, cost per server.

2. **Reporting:**
   * **Automated Reports:** Weekly/Monthly email reports (admin).
   * **Custom Reports:** User-defined date ranges, filters.
   * **Export:** CSV, PDF export functionality.

3. **Predictive Analytics:**
   * **Churn Prediction:** ML model (future feature) - identify at-risk users.
   * **Demand Forecasting:** Predict server demand (seasonal patterns).

### 5.5 White-Label Marketplace
**Cél:** Reseller program, partner integrációk.

1. **Reseller Portal:**
   * **Custom Branding:** Logo, colors, domain per reseller.
   * **Pricing Control:** Reseller sets own pricing (markup).
   * **User Management:** Reseller manages own users (sub-tenant).

2. **API Marketplace:**
   * **Public API:** Third-party integrációk (Discord bots, management tools).
   * **API Keys:** Per-application API keys, rate limits.
   * **Webhooks:** Event subscriptions (server started, backup completed).

### 5.6 Mobile App (Future)
**Cél:** Mobile-first experience, push notifications.

1. **React Native App:**
   * **Core Features:** Server list, start/stop, console view, notifications.
   * **Push Notifications:** Server status changes, backup completed.
   * **Offline Mode:** Cached data, sync when online.

### 5.7 Advanced Game Features
**Cél:** Játék-specifikus fejlett funkciók.

1. **Server Cloning:**
   * **One-Click Clone:** Duplicate server with all configs, mods.
   * **Template Creation:** Save server as template for future use.

2. **Scheduled Tasks:**
   * **Cron-like System:** Schedule server restarts, backups, updates.
   * **Event-based:** Trigger on player count, time of day.

3. **Server Migration:**
   * **Cross-Node Migration:** Move server to different node (zero downtime).
   * **Backup Restore:** Restore backup to new server.

4. **Performance Profiling:**
   * **Game-Specific Metrics:**
     * ARK: Dino count, structure count, save file size.
     * Rust: Entity count, FPS monitoring.
     * Minecraft: TPS (Ticks Per Second), chunk loading.

---

## 6. IMPLEMENTÁCIÓS ÜTEMTERV (AI PROMPTOK - TELJES LISTA)

Másold be ezeket a promptokat sorban a Cursornak. Ne ugorj át lépést.

### PHASE 1: Scaffolding & Shared Logic
> "Create an Nx workspace 'zed-hosting'. Apps: 'api' (NestJS), 'web' (Next.js), 'daemon' (Node.js). Libs: 'shared-types', 'db', 'utils', 'ui-kit'.
> In 'libs/shared-types', create strict DTOs/Interfaces for License, Node, Server, Allocation using `class-validator`.
> In 'libs/utils', create a `Result<T>` wrapper class for standardized error handling."

### PHASE 2: Database & Licensing Core
> "In 'libs/db', define the FULL Prisma Schema (v7.0) exactly as described in the Masterplan. Include SystemLicense, Tenant, AuditLog, etc.
> In 'apps/api', implement the `LicensingModule`. It must perform a 'Phone Home' check on startup. If license is invalid, `process.exit(1)`. Implement `TenantMiddleware` to resolve tenant from domain."

### PHASE 3: The Brain (Backend Logic)
> "In 'apps/api', create `NodesModule` and `PortManagerService`.
> Implement `findContiguousPortBlock(nodeId, count)` logic: scan DB for gaps in 20000-30000 range.
> Create `ProvisionService`: Generate Ansible inventory and playbooks dynamically based on Node IP."

### PHASE 4: The Muscle (Daemon Infrastructure)
> "In 'apps/daemon', install `dockerode`, `systeminformation`, `bullmq`.
> Implement `ContainerManager`:
> - Always set `LogConfig` (10mb).
> - Implement `Idempotency`: Check if container exists before creating.
> - Implement `StartupGuard`: Sequential start logic with 5s delay."

### PHASE 5: Advanced Features (Daemon)
> "In 'apps/daemon', implement:
> 1. `SteamService`: With Queue limit (2 concurrent).
> 2. `CacheManager`: Host-level caching + `rsync` copy.
> 3. `NfsManager`: Methods to export/mount directories for Clustering.
> 4. `BackupService`: Wrapper around `restic` CLI for snapshots."

### PHASE 6: Networking & Subdomains
> "In 'apps/api', create `SubdomainService` to handle DNS records.
> In 'apps/daemon', update container creation logic to accept `traefik` labels dynamically based on user settings."

### PHASE 7: Frontend - Enterprise Dashboard
> "In 'apps/web', setup Tailwind + Shadcn/UI.
> Build the 'Bento Grid' Dashboard.
> Implement the 'Terminal' component using `xterm.js` or similar, connected via WebSocket.
> Implement the 'File Manager' using Monaco Editor for live config editing."

### PHASE 8: Game Strategy Integration
> "In 'apps/api', create strategies:
> - `ArkStrategy`: Handle Cluster NFS logic.
> - `RustStrategy`: Handle Wipe Schedule & Oxide Mod install.
> - `MinecraftStrategy`: Java Version selector logic."

### PHASE 9: Monitoring & Observability
> "In 'apps/daemon', implement metrics collection: CPU, RAM, Disk, Network every 15 seconds. Send to Backend `/api/agent/metrics` endpoint.
> In 'apps/api', create `MetricsModule` to store metrics in `Metric` table. Implement retention policy (30 days detailed, 90 days aggregated).
> Setup Prometheus exporter endpoint `/metrics` in Backend. Create Grafana dashboards for Node/Server/System metrics.
> Implement Loki log aggregation: Structure all logs as JSON, send to Loki instance."

### PHASE 10: Alerting System
> "In 'apps/api', create `AlertModule` and `AlertService`. Implement alert rules:
> - Node offline detection (2 min heartbeat timeout).
> - Disk full detection (> 95%).
> - Server crash loop detection (3+ restarts in 10 min).
> Create alert delivery: Email (Nodemailer), Discord webhook, in-app notifications (WebSocket).
> Implement alert resolution: Auto-resolve on condition fix, manual resolution by admin."

### PHASE 11: Testing & CI/CD
> "Setup Jest for unit tests. Target 80% coverage for critical modules (PortManager, Licensing, ResourceQuota).
> Create integration tests with Supertest for all API endpoints.
> Setup Playwright for E2E tests: Critical user flows (registration -> server creation -> server start).
> Create GitHub Actions workflow: Lint -> Test -> Build -> Security Scan -> Deploy Staging -> E2E -> Deploy Production (manual approval).
> Implement Docker multi-stage builds for all apps."

### PHASE 12: Security & Compliance
> "Implement API key management: Generation, hashing (SHA-256), revocation, usage tracking.
> Add IP whitelisting for Admin API (optional, configurable).
> Implement secret management: Use environment variables for dev, plan Vault integration for production.
> Create GDPR compliance features: User data export endpoint, account deletion with cascade, data retention policy.
> Add comprehensive audit logging: All data modifications logged to `AuditLog` with immutable records."

### PHASE 13: Performance Optimization
> "Optimize database: Add composite indexes on `Metric(timestamp, nodeId)`, `GameServer(status, nodeId)`, `NetworkAllocation(nodeId, port)`.
> Implement Redis caching: Node status (30s TTL), server status (15s TTL), license validation (24h TTL).
> Add API response compression (Gzip) in Fastify.
> Implement pagination for all list endpoints (default 50 items/page).
> Optimize Prisma queries: Use `include` to prevent N+1 problems, implement connection pooling."

### PHASE 14: Billing & Payments
> "Integrate Stripe: Setup webhook handler, implement subscription management, invoice generation.
> Create `BillingModule`: Usage tracking, cost calculation, invoice generation.
> Implement credit system: User balance, auto-deduction, auto-topup on low balance.
> Create billing dashboard: Invoice list, payment history, usage statistics."

### PHASE 15: Support System
> "Create ticket system: `SupportTicket` model, priority levels, status tracking, assignment logic.
> Implement knowledge base: Article management, full-text search, categories.
> Create automated troubleshooting: Diagnostic scripts, self-service fixes, proactive recommendations."

---

## 7. BIZTONSÁG ÉS ÜZEMELTETÉS (CHECKLIST)

### 7.1 Container Security
1.  **Isolation:** Minden játékkonténer `PUID:1000` / `PGID:1000` alatt fusson (Soha ne root-ként!).
2.  **Resource Limits:** Minden konténerhez CPU/RAM limit (Docker `--cpus`, `--memory`).
3.  **Network Isolation:** Konténerek csak szükséges portokon kommunikáljanak (Docker networks).
4.  **Read-Only Root FS:** Ahol lehetséges, read-only root filesystem (security hardening).

### 7.2 API Security
1.  **mTLS/JWT:** Daemon és Backend között mTLS vagy aláírt JWT kommunikáció.
2.  **Rate Limiting:** Minden API endpoint rate limited (Redis-alapú).
3.  **Input Validation:** Minden input validálva (`class-validator`, `zod`).
4.  **SQL Injection Prevention:** Prisma ORM használata (parameterized queries).
5.  **XSS Prevention:** Frontend: React auto-escaping, Content Security Policy headers.

### 7.3 Authentication & Authorization
1.  **Password Security:** Bcrypt hashing (cost factor 12), minimum 8 karakter, complexity requirements.
2.  **2FA:** TOTP-based 2FA (Google Authenticator compatible).
3.  **Session Management:** Short-lived JWT tokens (15 min), secure cookies.
4.  **RBAC:** Role-based access control, permission checks minden kritikus műveletnél.

### 7.4 Data Protection
1.  **Encryption at Rest:** Database encryption (MySQL encryption at rest).
2.  **Encryption in Transit:** TLS 1.3 minden kommunikációban.
3.  **Backup Encryption:** Restic backup encryption (AES-256).
4.  **Secret Management:** Soha ne tárolj plaintext secrets (Vault vagy env vars).

### 7.5 Audit & Compliance
1.  **Audit Logging:** Minden módosító műveletet (POST/PUT/DELETE) naplózz az `AuditLog` táblába.
2.  **Immutable Logs:** Audit logs append-only, nem módosíthatók.
3.  **Data Retention:** 7 év audit log retention (compliance).
4.  **GDPR Compliance:** User data export, right to deletion, data minimization.

### 7.6 Backup & Disaster Recovery
1.  **Database Backup:** Napi full backup + óránkénti binlog backup.
2.  **Storage Backup:** Restic snapshots (lásd 3.7).
3.  **Configuration Backup:** Git repository (Infrastructure as Code).
4.  **Backup Testing:** Monthly backup restore tests (verify integrity).
5.  **DR Plan:** Documented disaster recovery playbook, quarterly DR drills.

### 7.7 High Availability
1.  **Database HA:** MySQL Master-Slave replication, automatic failover.
2.  **Redis HA:** Redis Sentinel vagy Cluster mode.
3.  **Application HA:** Load balancer (Traefik) health check-based routing.
4.  **Failover Strategy:** Ha a Redis leáll, a rendszer menjen "Read-Only" módba, ne omoljon össze.

### 7.8 Monitoring & Alerting
1.  **Health Checks:** Application health check endpoints (`/health`, `/ready`).
2.  **Metrics Collection:** Prometheus metrics, 15s collection interval.
3.  **Log Aggregation:** Structured logging (JSON), Loki integration.
4.  **Alerting:** Critical alerts (Node offline, Disk full, License expired).
5.  **On-Call Rotation:** 24/7 on-call rotation kritikus alertokhoz.

### 7.9 Performance & Scalability
1.  **Database Indexing:** Composite indexes on frequently queried columns.
2.  **Caching Strategy:** Redis caching for hot data (node status, server status).
3.  **Connection Pooling:** Prisma connection pool tuning.
4.  **Load Testing:** Quarterly load tests (k6), verify SLA targets.

### 7.10 Documentation & Runbooks
1.  **API Documentation:** OpenAPI/Swagger spec, interactive docs.
2.  **Architecture Documentation:** System architecture diagrams, data flow.
3.  **Runbooks:** Operational runbooks minden kritikus művelethez.
4.  **Incident Response:** Incident response playbook, post-mortem template.
5.  **Onboarding:** Developer onboarding guide, environment setup.

---

## 8. KÖVETKEZŐ LÉPÉSEK ÉS PRIORITIZÁLÁS

### Phase 1 (Critical - MVP): PHASE 1-4
Alapvető funkcionalitás: Scaffolding, Database, Licensing, Backend Logic, Daemon Infrastructure.

### Phase 2 (High Priority): PHASE 5-8
Központi funkciók: Advanced Daemon Features, Networking, Frontend, Game Strategies.

### Phase 3 (Production Ready): PHASE 9-12
Enterprise features: Monitoring, Alerting, Testing, Security, Performance.

### Phase 4 (Business Features): PHASE 13-15
Business logic: Billing, Support System, Analytics.

### Phase 5 (Future Enhancements): Section 5
Fejlett funkciók: Feature Flags, Multi-Region, Auto-Scaling, Mobile App.

---

## 9. IMPLEMENTÁCIÓS CHECKLIST - AI ÚTMUTATÓ

**FONTOS:** Ez a szekció minden modulhoz tartalmazza a konkrét implementációs lépéseket. Az AI ezt követve dolgozza fel a modulokat.

### 9.1 Modul Implementációs Sorrend

**PHASE 1 - Alapok (Kritikus):**
1. ✅ **3.1 Licensing Module** - MINDEN más előfeltétele
2. ✅ **3.2 Provisioning Module** - Node onboarding
3. ✅ **3.3 Port Manager** - Port allocation
4. ✅ **3.4 Daemon Module** - A rendszer "lelke"

**PHASE 2 - Core Features:**
5. ✅ **3.5 Scaling Logic** - Update queue, cache
6. ✅ **3.6 Cluster Manager** - NFS clustering
7. ✅ **3.7 Backup System** - Restic backups
8. ✅ **3.8 Networking** - Traefik, subdomains

**PHASE 3 - Enterprise Features:**
9. ⏳ **3.9 Monitoring** - Prometheus, Grafana
10. ⏳ **3.10 Alerting** - Alert system
11. ⏳ **3.11 Rate Limiting** - DDoS protection
12. ⏳ **3.12 Testing** - Test strategy

**PHASE 4 - Business & Security:**
13. ⏳ **3.13 CI/CD** - Deployment pipeline
14. ⏳ **3.14 Disaster Recovery** - DR plan
15. ⏳ **3.15 Cost Management** - Resource tracking
16. ⏳ **3.16 API Documentation** - OpenAPI/Swagger
17. ⏳ **3.17 Secret Management** - Vault integration
18. ⏳ **3.18 Compliance** - GDPR, audit
19. ⏳ **3.19 Performance** - Optimization
20. ⏳ **3.20 Game-Specific** - Mod marketplace
21. ⏳ **3.21 Billing** - Payment integration
22. ⏳ **3.22 Support** - Ticket system

### 9.2 Minden Modulhoz Kötelező Komponensek

**Minden modul implementálásakor KELL:**

1. **TypeScript Interfaces/DTOs:**
   ```typescript
   // libs/shared-types/src/{module}/{module}.dto.ts
   export class CreateXDto {
     @IsString()
     @IsNotEmpty()
     field: string;
   }
   ```

2. **Service Layer:**
   ```typescript
   // apps/api/src/{module}/{module}.service.ts
   @Injectable()
   export class XService {
     async create(data: CreateXDto): Promise<X> {
       // Implementation
     }
   }
   ```

3. **Controller/Route:**
   ```typescript
   // apps/api/src/{module}/{module}.controller.ts
   @Controller('api/x')
   export class XController {
     @Post()
     async create(@Body() dto: CreateXDto) {
       return this.service.create(dto);
     }
   }
   ```

4. **Database Model (Prisma):**
   ```prisma
   // prisma/schema.prisma
   model X {
     id        String   @id @default(uuid())
     // ... fields
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

5. **Error Handling:**
   ```typescript
   try {
     // Operation
   } catch (error) {
     this.logger.error('Operation failed', error);
     throw new InternalServerErrorException({
       code: 'OPERATION_FAILED',
       message: 'i18n key: OPERATION_FAILED'
     });
   }
   ```

6. **Audit Logging:**
   ```typescript
   await this.auditLog.create({
     action: 'X_CREATED',
     resourceId: x.id,
     details: { /* relevant data */ }
   });
   ```

7. **i18n Support:**
   ```typescript
   // NO hardcoded strings!
   return {
     message: 'i18n:SERVER_CREATED_SUCCESSFULLY',
     data: server
   };
   ```

8. **Environment Variables:**
   ```bash
   # .env.example
   X_ENABLED=true
   X_CONFIG_PATH=/path/to/config
   ```

9. **Unit Tests:**
   ```typescript
   // apps/api/src/{module}/{module}.service.spec.ts
   describe('XService', () => {
     it('should create X', async () => {
       // Test
     });
   });
   ```

10. **Documentation:**
    ```typescript
    /**
     * Creates a new X
     * @param data - X creation data
     * @returns Created X entity
     * @throws {BadRequestException} If data is invalid
     */
    ```

### 9.3 Modul-Specifikus Implementációs Lépések

Minden modul részletes implementációs útmutatója a **3. RENDSZER MODULOK** szekcióban található, ahol:
- ✅ **Konkrét kód példák** vannak
- ✅ **Lépésről lépésre útmutatók**
- ✅ **Environment változók listája**
- ✅ **Error handling példák**
- ✅ **Database schema definíciók**
- ✅ **API endpoint specifikációk**

**FONTOS:** Minden modul implementálásakor olvasd el a megfelelő **3.X** szekciót, és kövesd pontosan a leírt lépéseket!

---

## 10. MEGJEGYZÉSEK ÉS BEST PRACTICES

### 9.1 Code Quality
- **Code Reviews:** Minden PR-hoz minimum 1 approver.
- **Linting:** ESLint, Prettier automatikus formázás.
- **Type Safety:** TypeScript strict mode, no `any` types.
- **Documentation:** JSDoc comments minden public function-hez.

### 9.2 Git Workflow
- **Branching Strategy:** Git Flow (main, develop, feature/*, hotfix/*).
- **Commit Messages:** Conventional Commits format (`feat:`, `fix:`, `docs:`).
- **PR Template:** Standardized PR template (description, testing, checklist).

### 9.3 Deployment
- **Blue-Green Deployment:** Zero-downtime deployments.
- **Feature Flags:** Gradual rollout új features-hoz.
- **Rollback Plan:** Minden deployment-hez rollback procedure.

### 9.4 Communication
- **Status Page:** Public status page (UptimeRobot vagy saját).
- **Changelog:** Automated changelog generation (conventional commits).
- **Release Notes:** User-friendly release notes minden major release-hez.