import { createHash } from 'crypto';
import { execSync } from 'child_process';
import * as os from 'os';

/**
 * Generates a unique Hardware ID (HWID) for license validation
 * Combines MAC address, CPU ID, and disk serial number
 * Returns SHA-256 hash of the combined identifiers
 */
export function generateHWID(): string {
  try {
    // 1. MAC address (first network interface)
    const macAddress = getMacAddress();

    // 2. CPU ID (CPU model or serial)
    const cpuId = getCpuId();

    // 3. Disk serial number (first disk)
    const diskSerial = getDiskSerial();

    // 4. Combine and hash
    const combined = `${macAddress}-${cpuId}-${diskSerial}`;
    return createHash('sha256').update(combined).digest('hex');
  } catch (error) {
    // Fallback: use hostname and platform info
    const fallback = `${os.hostname()}-${os.platform()}-${os.arch()}`;
    return createHash('sha256').update(fallback).digest('hex');
  }
}

/**
 * Gets MAC address from first network interface
 */
function getMacAddress(): string {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    if (!interfaces) continue;

    for (const iface of interfaces) {
      if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
        return iface.mac;
      }
    }
  }
  return 'unknown-mac';
}

/**
 * Gets CPU identifier (model or serial)
 */
function getCpuId(): string {
  try {
    const cpus = os.cpus();
    if (cpus.length > 0 && cpus[0]?.model) {
      return cpus[0].model;
    }
  } catch {
    // Ignore errors
  }

  // Fallback: use CPU count and architecture
  return `${os.cpus().length}-${os.arch()}`;
}

/**
 * Gets disk serial number (platform-specific)
 */
function getDiskSerial(): string {
  try {
    if (process.platform === 'linux') {
      // Linux: try to get disk serial from /dev/sda or first disk
      try {
        const result = execSync('lsblk -o SERIAL -n -d /dev/sda 2>/dev/null', {
          encoding: 'utf-8',
          timeout: 5000,
        });
        if (result.trim()) {
          return result.trim();
        }
      } catch {
        // Ignore errors
      }

      // Alternative: use filesystem UUID
      try {
        const result = execSync('blkid -s UUID -o value /dev/sda1 2>/dev/null', {
          encoding: 'utf-8',
          timeout: 5000,
        });
        if (result.trim()) {
          return result.trim();
        }
      } catch {
        // Ignore errors
      }
    } else if (process.platform === 'win32') {
      // Windows: use volume serial number
      try {
        const result = execSync('wmic diskdrive get serialnumber 2>nul', {
          encoding: 'utf-8',
          timeout: 5000,
        });
        const lines = result.split('\n').filter((line) => line.trim() && !line.includes('SerialNumber'));
        if (lines.length > 0 && lines[0]?.trim()) {
          return lines[0].trim();
        }
      } catch {
        // Ignore errors
      }
    }
  } catch {
    // Ignore all errors
  }

  // Fallback: use hostname
  return os.hostname();
}

