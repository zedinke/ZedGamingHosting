import { SetMetadata } from '@nestjs/common';

/**
 * Public decorator - marks route as public (no authentication required)
 */
export const Public = () => SetMetadata('isPublic', true);

