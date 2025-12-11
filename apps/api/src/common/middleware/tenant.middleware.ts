
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '@zed-hosting/db';

/**
 * Tenant Middleware
 * Resolves tenant from subdomain (e.g. client.zedhosting.com)
 * Attaches tenant to request object
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
    constructor(private readonly prisma: PrismaService) { }

    async use(req: Request, _res: Response, next: NextFunction) {
        const host = req.headers.host;
        if (!host) {
            return next();
        }

        // Extract subdomain (simplistic implementation for now)
        // Assumes host format: <subdomain>.<domain>.<tld>
        const parts = host.split('.');
        if (parts.length < 3) {
            // Not a subdomain request (e.g. localhost or plain IP)
            return next();
        }

        const subdomain = parts[0];

        // Find tenant by subdomain
        const tenant = await this.prisma.tenant.findUnique({
            where: { domain: subdomain },
        });

        if (tenant) {
            // Attach tenant to request
            // We extend the Request type in a type definition file if needed, 
            // but for now we just attach it to 'tenant' property
            (req as any).tenant = tenant;
        }

        next();
    }
}
