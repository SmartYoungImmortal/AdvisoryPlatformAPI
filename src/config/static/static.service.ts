import { Injectable } from '@nestjs/common';

@Injectable()
export class StaticConfigService {
  config = {
    meetings: {
      jwt: {
        primitive: {
          iss: 'advisoryplatform.backend',
          aud: 'advisoryplatform.jitsi',
        },
        tokenExpiryGraceMs: 1000 * 60 * 10,
        algotithm: 'ES256',
      },
    },
  } as const;
}
