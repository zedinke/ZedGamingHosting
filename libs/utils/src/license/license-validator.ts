import { createVerify } from 'crypto';

/**
 * License response structure from license server
 */
export interface LicenseResponse {
  valid: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'GRACE_PERIOD';
  validUntil?: string;
  maxNodesAllowed?: number;
  whitelabelEnabled?: boolean;
  features?: string[];
  signature: string;
  reason?: string;
  gracePeriodEnds?: string;
}

/**
 * Validates RSA signature of license response
 * @param response - License response from server
 * @param publicKey - RSA public key (PEM format)
 * @returns true if signature is valid
 */
export function validateLicenseResponse(
  response: LicenseResponse,
  publicKey: string
): boolean {
  try {
    // 1. Create payload hash (exclude signature from payload)
    const payload = JSON.stringify({
      valid: response.valid,
      status: response.status,
      validUntil: response.validUntil,
      maxNodesAllowed: response.maxNodesAllowed,
      whitelabelEnabled: response.whitelabelEnabled,
      features: response.features,
    });



    // 2. Verify RSA signature
    const verify = createVerify('RSA-SHA256');
    verify.update(payload);
    verify.end();

    return verify.verify(publicKey, response.signature, 'base64');
  } catch (error) {
    // If verification fails, return false
    return false;
  }
}

/**
 * Validates license response structure
 * @param response - Response to validate
 * @returns true if structure is valid
 */
export function isValidLicenseResponse(response: unknown): response is LicenseResponse {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const r = response as Record<string, unknown>;

  return (
    typeof r['valid'] === 'boolean' &&
    typeof r['status'] === 'string' &&
    ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'GRACE_PERIOD'].includes(r['status'] as string) &&
    typeof r['signature'] === 'string'
  );
}

