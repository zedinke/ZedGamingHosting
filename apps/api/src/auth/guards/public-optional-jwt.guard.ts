import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * Enhanced JWT Auth Guard with public route support
 * Checks @Public() decorator and skips auth for those routes
 */
@Injectable()
export class PublicOptionalJwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // For protected routes, try to authenticate
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      // If authentication fails, throw the error (route is protected)
      throw error;
    }
  }

  handleRequest(err: any, user: any, info: any) {
    // This is called after JWT strategy validation
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
