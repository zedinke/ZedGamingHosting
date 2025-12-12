import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Encrypts data using AES-256-GCM
 * @param data - Data to encrypt
 * @param key - Encryption key (32 bytes for AES-256)
 * @returns Encrypted data with IV and auth tag (base64 encoded)
 */
export function encrypt(data: string, key: string): string {
  const keyBuffer = createHash('sha256').update(key).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv);

  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'base64'),
  ]);

  return combined.toString('base64');
}

/**
 * Decrypts data using AES-256-GCM
 * @param encryptedData - Encrypted data (base64 encoded)
 * @param key - Decryption key (32 bytes for AES-256)
 * @returns Decrypted data
 */
export function decrypt(encryptedData: string, key: string): string {
  const keyBuffer = createHash('sha256').update(key).digest();
  const combined = Buffer.from(encryptedData, 'base64');

  const iv = combined.subarray(0, 16);
  const authTag = combined.subarray(16, 32);
  const encrypted = combined.subarray(32);

  const decipher = createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hashes data using SHA-256
 * @param data - Data to hash
 * @returns SHA-256 hash (hex encoded)
 */
export function hash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}


