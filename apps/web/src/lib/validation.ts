/**
 * Form validation utilities
 */

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validators = {
  email: (value: string): string | null => {
    if (!value) return 'Az email cím kötelező';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Érvényes email címet adj meg';
    }
    return null;
  },

  password: (value: string, minLength: number = 8): string | null => {
    if (!value) return 'A jelszó kötelező';
    if (value.length < minLength) {
      return `A jelszónak legalább ${minLength} karakter hosszúnak kell lennie`;
    }
    return null;
  },

  passwordMatch: (value: string, matchValue: string): string | null => {
    if (!value) return 'A jelszó megerősítése kötelező';
    if (value !== matchValue) {
      return 'A jelszavak nem egyeznek';
    }
    return null;
  },

  required: (value: any, fieldName: string = 'Ez a mező'): string | null => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} kötelező`;
    }
    return null;
  },

  min: (value: number, min: number, fieldName: string = 'Az érték'): string | null => {
    if (value < min) {
      return `${fieldName} legalább ${min} kell legyen`;
    }
    return null;
  },

  max: (value: number, max: number, fieldName: string = 'Az érték'): string | null => {
    if (value > max) {
      return `${fieldName} legfeljebb ${max} lehet`;
    }
    return null;
  },

  positive: (value: number, fieldName: string = 'Az érték'): string | null => {
    if (value <= 0) {
      return `${fieldName} pozitív szám kell legyen`;
    }
    return null;
  },

  url: (value: string): string | null => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Érvényes URL-t adj meg';
    }
  },

  ipAddress: (value: string): string | null => {
    if (!value) return 'Az IP cím kötelező';
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(value)) {
      return 'Érvényes IP címet adj meg';
    }
    const parts = value.split('.').map(Number);
    if (parts.some(part => part < 0 || part > 255)) {
      return 'Érvényes IP címet adj meg (0-255)';
    }
    return null;
  },

  fqdn: (value: string): string | null => {
    if (!value) return null; // Optional field
    const fqdnRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!fqdnRegex.test(value)) {
      return 'Érvényes FQDN-t adj meg';
    }
    return null;
  },

  serverName: (value: string): string | null => {
    if (!value) return null; // Optional
    if (value.length > 100) {
      return 'A szerver név legfeljebb 100 karakter lehet';
    }
    if (!/^[a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\-_]+$/.test(value)) {
      return 'A szerver név csak betűket, számokat, szóközt és speciális karaktereket tartalmazhat (-, _)';
    }
    return null;
  },

  port: (value: number): string | null => {
    if (value < 1 || value > 65535) {
      return 'A port számnak 1 és 65535 között kell lennie';
    }
    return null;
  },
};

export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, Array<(value: any) => string | null>>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // Only show first error per field
      }
    }
  }

  return errors;
}

