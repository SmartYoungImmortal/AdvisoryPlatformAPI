jest.mock('@thallesp/nestjs-better-auth', () => {
  // Jest hoists module factories before imports, so this shared mock must load lazily.
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return
  return require('../../../test/support/better-auth-permission-metadata.mock');
});

import type { IdentityVerificationService } from './identity-verification.service';
import { AdminIdentityVerificationsController } from './admin-identity-verifications.controller';

describe('AdminIdentityVerificationsController', () => {
  it('delegates document URL creation and limits the route to identity readers', () => {
    const result = Promise.resolve({
      url: 'https://storage.test/signed',
      expiresInSeconds: 300,
    });
    const service = {
      createAdminDocumentDownloadUrl: jest.fn().mockReturnValue(result),
    } as unknown as jest.Mocked<IdentityVerificationService>;
    const controller = new AdminIdentityVerificationsController(service);
    const advisorId = '11111111-1111-4111-8111-111111111111';

    expect(controller.createDocumentDownloadUrl(advisorId)).toBe(result);
    expect(service.createAdminDocumentDownloadUrl).toHaveBeenCalledWith(
      advisorId,
    );
    expect(
      Reflect.getMetadata(
        'USER_HAS_PERMISSION',
        AdminIdentityVerificationsController.prototype
          .createDocumentDownloadUrl,
      ),
    ).toEqual({ permission: { identityVerification: ['read'] } });
  });
});
