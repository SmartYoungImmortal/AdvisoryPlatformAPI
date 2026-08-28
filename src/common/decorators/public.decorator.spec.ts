import { Reflector } from '@nestjs/core';
import { BETTER_AUTH_PUBLIC_KEY, Public } from './public.decorator';

describe('Public', () => {
  it('marks routes as anonymous for the Better Auth global guard', () => {
    class PublicRoute {
      @Public()
      handler(): void {}
    }

    const reflector = new Reflector();

    expect(
      reflector.get(BETTER_AUTH_PUBLIC_KEY, PublicRoute.prototype.handler),
    ).toBe(true);
  });
});
