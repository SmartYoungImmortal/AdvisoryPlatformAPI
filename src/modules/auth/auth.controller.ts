import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { toNodeHandler } from 'better-auth/node';
import type { Request, Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import type { Auth } from './auth.config';
import { AUTH } from './auth.constants';

/**
 * Mounted, not reimplemented — better-auth owns everything under this subtree
 * (sign-up, sign-in, sign-out, session). Body-parser is disabled for this route in
 * main.ts; better-auth reads the raw request body itself, and a pre-consumed stream
 * from Nest's global parser is the failure that costs an afternoon.
 */
@ApiExcludeController()
@Public()
@Controller('api/auth')
export class AuthController {
  private readonly handler: ReturnType<typeof toNodeHandler>;

  constructor(@Inject(AUTH) auth: Auth) {
    this.handler = toNodeHandler(auth);
  }

  @All('*path')
  handleAuth(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    return this.handler(request, response);
  }
}
