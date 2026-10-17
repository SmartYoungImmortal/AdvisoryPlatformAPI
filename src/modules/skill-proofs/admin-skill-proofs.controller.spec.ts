jest.mock('@thallesp/nestjs-better-auth', () => {
  // Jest hoists module factories before imports, so this shared mock must load lazily.
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return
  return require('../../../test/support/better-auth-permission-metadata.mock');
});

import { AdminSkillProofsController } from './admin-skill-proofs.controller';
import type { SkillProofsService } from './skill-proofs.service';

describe('AdminSkillProofsController', () => {
  it('delegates document URL creation and limits the route to proof readers', () => {
    const result = Promise.resolve({
      url: 'https://storage.test/signed',
      expiresInSeconds: 300,
    });
    const service = {
      createAdminDocumentDownloadUrl: jest.fn().mockReturnValue(result),
    } as unknown as jest.Mocked<SkillProofsService>;
    const controller = new AdminSkillProofsController(service);
    const proofId = '22222222-2222-4222-8222-222222222222';

    expect(controller.createDocumentDownloadUrl(proofId)).toBe(result);
    expect(service.createAdminDocumentDownloadUrl).toHaveBeenCalledWith(
      proofId,
    );
    expect(
      Reflect.getMetadata(
        'USER_HAS_PERMISSION',
        AdminSkillProofsController.prototype.createDocumentDownloadUrl,
      ),
    ).toEqual({ permission: { skillProof: ['read'] } });
  });
});
