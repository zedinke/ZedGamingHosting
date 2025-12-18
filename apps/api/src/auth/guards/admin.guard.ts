import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';

/**
 * Admin Guard
 * Checks if user has ADMIN role
 * Should be used after JwtAuthGuard
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request');
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role !== 'ADMIN') {
      this.logger.warn(`Non-admin user attempted access: ${user.id} (role: ${user.role})`);
      throw new ForbiddenException('Admin access required');
    }

    this.logger.debug(`Admin access granted to: ${user.id}`);
    return true;
  }
}
