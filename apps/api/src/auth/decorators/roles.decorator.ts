import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator - specifies required roles for route
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);


