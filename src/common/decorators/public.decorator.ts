import { SetMetadata } from '@nestjs/common';

export const BETTER_AUTH_PUBLIC_KEY = 'PUBLIC';

export const Public = () => SetMetadata(BETTER_AUTH_PUBLIC_KEY, true);
