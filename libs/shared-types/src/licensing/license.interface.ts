import { LicenseStatus } from './license.dto';

/**
 * License interface (matches Prisma model)
 */
export interface SystemLicense {
  id: string;
  licenseKey: string;
  status: LicenseStatus;
  validUntil: Date;
  maxNodesAllowed: number;
  whitelabelEnabled: boolean;
  signature: string;
  gracePeriodEnds?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * License validation result
 */
export interface LicenseValidationResult {
  valid: boolean;
  status: LicenseStatus;
  validUntil?: Date;
  maxNodesAllowed?: number;
  whitelabelEnabled?: boolean;
  features?: string[];
  reason?: string;
  gracePeriodEnds?: Date;
}

