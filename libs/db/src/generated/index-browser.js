
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.SystemLicenseScalarFieldEnum = {
  id: 'id',
  licenseKey: 'licenseKey',
  status: 'status',
  validUntil: 'validUntil',
  maxNodesAllowed: 'maxNodesAllowed',
  whitelabelEnabled: 'whitelabelEnabled',
  signature: 'signature',
  gracePeriodEnds: 'gracePeriodEnds',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TenantScalarFieldEnum = {
  id: 'id',
  name: 'name',
  domain: 'domain',
  themeConfig: 'themeConfig',
  smtpConfig: 'smtpConfig',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  passwordHash: 'passwordHash',
  role: 'role',
  twoFactorSecret: 'twoFactorSecret',
  balance: 'balance',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  resourceId: 'resourceId',
  ipAddress: 'ipAddress',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.NodeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  apiKey: 'apiKey',
  ipAddress: 'ipAddress',
  publicFqdn: 'publicFqdn',
  totalRam: 'totalRam',
  totalCpu: 'totalCpu',
  diskType: 'diskType',
  isClusterStorage: 'isClusterStorage',
  maintenanceMode: 'maintenanceMode',
  maxConcurrentUpdates: 'maxConcurrentUpdates',
  status: 'status',
  lastHeartbeat: 'lastHeartbeat',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TaskScalarFieldEnum = {
  id: 'id',
  nodeId: 'nodeId',
  type: 'type',
  status: 'status',
  data: 'data',
  error: 'error',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NetworkAllocationScalarFieldEnum = {
  id: 'id',
  nodeId: 'nodeId',
  port: 'port',
  protocol: 'protocol',
  type: 'type',
  serverUuid: 'serverUuid',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubdomainScalarFieldEnum = {
  id: 'id',
  subdomain: 'subdomain',
  domain: 'domain',
  serverUuid: 'serverUuid',
  cloudflareId: 'cloudflareId',
  targetIP: 'targetIP',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GameServerScalarFieldEnum = {
  id: 'id',
  uuid: 'uuid',
  gameType: 'gameType',
  status: 'status',
  nodeId: 'nodeId',
  ownerId: 'ownerId',
  planId: 'planId',
  startupPriority: 'startupPriority',
  resources: 'resources',
  envVars: 'envVars',
  clusterId: 'clusterId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GameClusterScalarFieldEnum = {
  id: 'id',
  gameType: 'gameType',
  sharedSecret: 'sharedSecret',
  storageNodeId: 'storageNodeId',
  mountPath: 'mountPath',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BackupScalarFieldEnum = {
  id: 'id',
  serverUuid: 'serverUuid',
  snapshotId: 'snapshotId',
  sizeBytes: 'sizeBytes',
  location: 'location',
  lastRestoredAt: 'lastRestoredAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MetricScalarFieldEnum = {
  id: 'id',
  nodeId: 'nodeId',
  serverUuid: 'serverUuid',
  timestamp: 'timestamp',
  cpuUsage: 'cpuUsage',
  ramUsage: 'ramUsage',
  ramUsagePercent: 'ramUsagePercent',
  diskUsage: 'diskUsage',
  diskUsagePercent: 'diskUsagePercent',
  networkIn: 'networkIn',
  networkOut: 'networkOut',
  uptime: 'uptime'
};

exports.Prisma.AlertScalarFieldEnum = {
  id: 'id',
  severity: 'severity',
  type: 'type',
  message: 'message',
  resourceId: 'resourceId',
  resourceType: 'resourceType',
  resolved: 'resolved',
  resolvedAt: 'resolvedAt',
  resolvedById: 'resolvedById',
  metadata: 'metadata',
  nodeId: 'nodeId',
  serverUuid: 'serverUuid',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResourceQuotaScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tenantId: 'tenantId',
  maxServers: 'maxServers',
  maxRam: 'maxRam',
  maxDisk: 'maxDisk',
  maxCpu: 'maxCpu',
  currentUsage: 'currentUsage',
  enforced: 'enforced',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ApiKeyScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  keyHash: 'keyHash',
  name: 'name',
  lastUsedAt: 'lastUsedAt',
  expiresAt: 'expiresAt',
  permissions: 'permissions',
  rateLimit: 'rateLimit',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.IncidentScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  severity: 'severity',
  status: 'status',
  assignedToId: 'assignedToId',
  resolvedAt: 'resolvedAt',
  rootCause: 'rootCause',
  resolution: 'resolution',
  affectedResources: 'affectedResources',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PlanScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  gameType: 'gameType',
  status: 'status',
  ramMb: 'ramMb',
  cpuCores: 'cpuCores',
  diskGb: 'diskGb',
  maxSlots: 'maxSlots',
  monthlyPrice: 'monthlyPrice',
  hourlyPrice: 'hourlyPrice',
  setupFee: 'setupFee',
  features: 'features',
  description: 'description',
  isPopular: 'isPopular',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  planId: 'planId',
  status: 'status',
  priceSnapshot: 'priceSnapshot',
  totalAmount: 'totalAmount',
  currency: 'currency',
  paymentMethod: 'paymentMethod',
  paymentId: 'paymentId',
  paidAt: 'paidAt',
  serverId: 'serverId',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.LicenseStatus = exports.$Enums.LicenseStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
  GRACE_PERIOD: 'GRACE_PERIOD'
};

exports.UserRole = exports.$Enums.UserRole = {
  SUPERADMIN: 'SUPERADMIN',
  RESELLER_ADMIN: 'RESELLER_ADMIN',
  USER: 'USER',
  SUPPORT: 'SUPPORT'
};

exports.DiskType = exports.$Enums.DiskType = {
  NVME: 'NVME',
  SSD: 'SSD',
  HDD: 'HDD'
};

exports.NodeStatus = exports.$Enums.NodeStatus = {
  PROVISIONING: 'PROVISIONING',
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  MAINTENANCE: 'MAINTENANCE'
};

exports.TaskType = exports.$Enums.TaskType = {
  PROVISION: 'PROVISION',
  START: 'START',
  STOP: 'STOP',
  RESTART: 'RESTART',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  EXECUTE_COMMAND: 'EXECUTE_COMMAND'
};

exports.TaskStatus = exports.$Enums.TaskStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.Protocol = exports.$Enums.Protocol = {
  UDP: 'UDP',
  TCP: 'TCP'
};

exports.PortType = exports.$Enums.PortType = {
  GAME: 'GAME',
  RCON: 'RCON',
  QUERY: 'QUERY',
  APP: 'APP',
  TV: 'TV'
};

exports.GameType = exports.$Enums.GameType = {
  ARK: 'ARK',
  RUST: 'RUST',
  MINECRAFT: 'MINECRAFT',
  CS2: 'CS2',
  PALWORLD: 'PALWORLD',
  ATLAS: 'ATLAS'
};

exports.ServerStatus = exports.$Enums.ServerStatus = {
  INSTALLING: 'INSTALLING',
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  STARTING: 'STARTING',
  STOPPING: 'STOPPING',
  CRASHED: 'CRASHED',
  UPDATING: 'UPDATING'
};

exports.BackupLocation = exports.$Enums.BackupLocation = {
  LOCAL: 'LOCAL',
  S3: 'S3',
  HETZNER_BOX: 'HETZNER_BOX'
};

exports.AlertSeverity = exports.$Enums.AlertSeverity = {
  CRITICAL: 'CRITICAL',
  WARNING: 'WARNING',
  INFO: 'INFO'
};

exports.ResourceType = exports.$Enums.ResourceType = {
  NODE: 'NODE',
  SERVER: 'SERVER',
  SYSTEM: 'SYSTEM'
};

exports.IncidentSeverity = exports.$Enums.IncidentSeverity = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
  P3: 'P3'
};

exports.IncidentStatus = exports.$Enums.IncidentStatus = {
  OPEN: 'OPEN',
  INVESTIGATING: 'INVESTIGATING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

exports.PlanStatus = exports.$Enums.PlanStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PENDING: 'PENDING',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAID: 'PAID',
  PROVISIONING: 'PROVISIONING',
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
};

exports.Prisma.ModelName = {
  SystemLicense: 'SystemLicense',
  Tenant: 'Tenant',
  User: 'User',
  AuditLog: 'AuditLog',
  Node: 'Node',
  Task: 'Task',
  NetworkAllocation: 'NetworkAllocation',
  Subdomain: 'Subdomain',
  GameServer: 'GameServer',
  GameCluster: 'GameCluster',
  Backup: 'Backup',
  Metric: 'Metric',
  Alert: 'Alert',
  ResourceQuota: 'ResourceQuota',
  ApiKey: 'ApiKey',
  Incident: 'Incident',
  Plan: 'Plan',
  Order: 'Order'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
