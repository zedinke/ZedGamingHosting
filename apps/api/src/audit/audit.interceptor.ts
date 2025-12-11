import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService } from './audit.service';

/**
 * Audit Interceptor - automatically logs all POST/PUT/DELETE operations
 * Immutable log entries - cannot be modified
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const ipHeader = request.headers['x-forwarded-for'];
    const ipAddress = request.ip || (Array.isArray(ipHeader) ? ipHeader[0] : ipHeader) || 'unknown';

    // Only log modifications (POST, PUT, DELETE, PATCH)
    const shouldLog = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

    if (!shouldLog) {
      return next.handle();
    }

    // Extract user ID from request (would come from JWT in production)
    const userId = (request as unknown as { user?: { id: string } }).user?.id;

    // Extract resource ID from params or body
    const resourceId = request.params?.id || request.body?.id || request.params?.uuid || request.body?.uuid || 'unknown';

    return next.handle().pipe(
      tap({
        next: async () => {
          // Log successful operation
          await this.auditService.createLog({
            action: `${method}_${this.extractAction(url)}`,
            resourceId,
            userId,
            ipAddress,
            details: {
              method,
              url,
              timestamp: new Date().toISOString(),
            },
          });
        },
        error: async (error) => {
          // Log failed operation
          await this.auditService.createLog({
            action: `${method}_${this.extractAction(url)}_FAILED`,
            resourceId,
            userId,
            ipAddress,
            details: {
              method,
              url,
              error: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        },
      })
    );
  }

  /**
   * Extracts action name from URL
   */
  private extractAction(url: string): string {
    const parts = url.split('/').filter((p) => p);
    return parts[parts.length - 1]?.toUpperCase() || 'UNKNOWN';
  }
}

