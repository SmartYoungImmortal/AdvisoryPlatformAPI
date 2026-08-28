import { SetMetadata } from '@nestjs/common';

/** The metadata key consumed by @thallesp/nestjs-better-auth's AuthGuard. */
export const BETTER_AUTH_PUBLIC_KEY = 'PUBLIC';

/** Opts a route out of Better Auth's global guard. Authentication remains opt-out. */
export const Public = () => SetMetadata(BETTER_AUTH_PUBLIC_KEY, true);
