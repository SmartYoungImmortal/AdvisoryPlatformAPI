import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Opts a route out of SessionGuard. Auth is opt-out, not opt-in — a forgotten decorator fails closed. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
