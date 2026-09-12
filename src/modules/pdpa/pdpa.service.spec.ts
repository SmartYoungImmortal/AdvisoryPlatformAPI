import type { PdpaConsent } from './dtos/pdpa-consent-response.dto';
import type { PdpaRepository } from './pdpa.repository';
import { PdpaService } from './pdpa.service';

const USER_ID = '11111111-1111-1111-1111-111111111111';

function makeConsent(overrides: Partial<PdpaConsent> = {}): PdpaConsent {
  return {
    userId: USER_ID,
    policyVersion: '2026-09-01',
    consentedAt: new Date('2026-09-01T00:00:00Z'),
    ...overrides,
  };
}

describe('PdpaService', () => {
  let service: PdpaService;
  let repository: jest.Mocked<
    Pick<PdpaRepository, 'findForUser' | 'recordConsent' | 'hasConsented'>
  >;

  beforeEach(() => {
    repository = {
      findForUser: jest.fn(),
      recordConsent: jest.fn(),
      hasConsented: jest.fn(),
    };
    service = new PdpaService(repository as unknown as PdpaRepository);
  });

  describe('findMine', () => {
    it('returns every recorded version so the consent history survives', async () => {
      repository.findForUser.mockResolvedValue([
        makeConsent({ policyVersion: '2026-09-01' }),
        makeConsent({
          policyVersion: '2026-01-01',
          consentedAt: new Date('2026-01-01T00:00:00Z'),
        }),
      ]);

      const consents = await service.findMine(USER_ID);

      expect(consents).toHaveLength(2);
      expect(consents.map((consent) => consent.policyVersion)).toEqual([
        '2026-09-01',
        '2026-01-01',
      ]);
    });

    it('returns an empty list for an account that has never consented', async () => {
      repository.findForUser.mockResolvedValue([]);

      await expect(service.findMine(USER_ID)).resolves.toEqual([]);
    });
  });

  describe('recordConsent', () => {
    it('records consent for the session user, never a user named in the body', async () => {
      repository.recordConsent.mockResolvedValue(makeConsent());

      const consent = await service.recordConsent(USER_ID, {
        policyVersion: '2026-09-01',
      });

      expect(repository.recordConsent).toHaveBeenCalledWith(
        USER_ID,
        '2026-09-01',
      );
      expect(consent).toMatchObject({
        userId: USER_ID,
        policyVersion: '2026-09-01',
      });
    });

    it('keeps the original timestamp when the same version is consented to twice', async () => {
      const first = makeConsent();
      repository.recordConsent.mockResolvedValue(first);

      const repeated = await service.recordConsent(USER_ID, {
        policyVersion: '2026-09-01',
      });

      expect(repeated.consentedAt).toEqual(first.consentedAt);
    });
  });
});
