/**
 * Zod validation schemas for form validation
 */
import { z } from 'zod';

export const userSchema = z.object({
  email: z.string()
    .min(1, 'Email cím megadása kötelező')
    .email('Érvénytelen email cím formátum')
    .max(255, 'Az email cím túl hosszú (max. 255 karakter)'),
  password: z.string()
    .min(8, 'A jelszónak legalább 8 karakter hosszúnak kell lennie')
    .max(128, 'A jelszó túl hosszú (max. 128 karakter)')
    .regex(/[A-Z]/, 'A jelszónak tartalmaznia kell legalább egy nagybetűt')
    .regex(/[a-z]/, 'A jelszónak tartalmaznia kell legalább egy kisbetűt')
    .regex(/[0-9]/, 'A jelszónak tartalmaznia kell legalább egy számot'),
  confirmPassword: z.string().min(1, 'Jelszó megerősítés megadása kötelező'),
  role: z.enum(['USER', 'SUPPORT', 'SUPPORTER', 'RESELLER_ADMIN', 'SUPERADMIN'], {
    errorMap: () => ({ message: 'Érvénytelen szerepkör' }),
  }),
  balance: z.number()
    .min(0, 'Az egyenleg nem lehet negatív')
    .max(999999, 'Az egyenleg túl nagy (max. 999999)')
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'A jelszavak nem egyeznek',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Jelenlegi jelszó megadása kötelező'),
  newPassword: z.string()
    .min(8, 'Az új jelszónak legalább 8 karakter hosszúnak kell lennie')
    .max(128, 'A jelszó túl hosszú (max. 128 karakter)')
    .regex(/[A-Z]/, 'A jelszónak tartalmaznia kell legalább egy nagybetűt')
    .regex(/[a-z]/, 'A jelszónak tartalmaznia kell legalább egy kisbetűt')
    .regex(/[0-9]/, 'A jelszónak tartalmaznia kell legalább egy számot'),
  confirmPassword: z.string().min(1, 'Jelszó megerősítés megadása kötelező'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Az új jelszavak nem egyeznek',
  path: ['confirmPassword'],
});

export const nodeSchema = z.object({
  name: z.string()
    .min(1, 'Név megadása kötelező')
    .max(100, 'A név túl hosszú (max. 100 karakter)')
    .regex(/^[a-zA-Z0-9-_]+$/, 'A név csak betűket, számokat, kötőjelet és aláhúzást tartalmazhat'),
  ipAddress: z.string()
    .min(1, 'IP cím megadása kötelező')
    .ip({ version: 'v4', message: 'Érvénytelen IPv4 cím formátum (pl. 192.168.1.1)' }),
  publicFqdn: z.string()
    .max(255, 'Az FQDN túl hosszú (max. 255 karakter)')
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, 'Érvénytelen FQDN formátum (pl. example.com)')
    .optional()
    .or(z.literal('')),
  totalRam: z.number()
    .min(1024, 'A RAM legalább 1024 MB (1 GB) kell legyen')
    .max(1048576, 'A RAM túl nagy (max. 1048576 MB = 1 TB)')
    .int('A RAM értéknek egész számnak kell lennie'),
  totalCpu: z.number()
    .min(1, 'A CPU legalább 1 mag kell legyen')
    .max(512, 'A CPU túl nagy (max. 512 mag)')
    .int('A CPU értéknek egész számnak kell lennie'),
  diskType: z.enum(['NVME', 'SSD', 'HDD'], {
    errorMap: () => ({ message: 'Érvénytelen lemeztípus' }),
  }),
  isClusterStorage: z.boolean(),
  maxConcurrentUpdates: z.number()
    .min(1, 'Az egyidejű frissítések száma legalább 1 kell legyen')
    .max(100, 'Az egyidejű frissítések száma túl nagy (max. 100)')
    .int('Az egyidejű frissítések számának egész számnak kell lennie'),
});

export const serverCreateSchema = z.object({
  nodeId: z.string().min(1, 'Node kiválasztása kötelező'),
  gameType: z.string().min(1, 'Játék típus kiválasztása kötelező'),
  cpuLimit: z.number()
    .min(0.5, 'A CPU legalább 0.5 mag kell legyen')
    .max(128, 'A CPU túl nagy (max. 128 mag)'),
  ramLimit: z.number()
    .min(512, 'A RAM legalább 512 MB kell legyen')
    .max(1048576, 'A RAM túl nagy (max. 1048576 MB = 1 TB)')
    .int('A RAM értéknek egész számnak kell lennie'),
  diskLimit: z.number()
    .min(1, 'A lemez legalább 1 GB kell legyen')
    .max(10000, 'A lemez túl nagy (max. 10000 GB = 10 TB)')
    .int('A lemez értéknek egész számnak kell lennie'),
  name: z.string()
    .max(100, 'A szerver neve túl hosszú (max. 100 karakter)')
    .regex(/^[a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ\s\-_]*$/, 'A szerver név csak betűket, számokat, szóközt és speciális karaktereket tartalmazhat (-, _)')
    .optional(),
});
