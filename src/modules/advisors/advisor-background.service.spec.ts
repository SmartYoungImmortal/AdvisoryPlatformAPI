import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { AdvisorBackgroundRepository } from './advisor-background.repository';
import { AdvisorBackgroundService } from './advisor-background.service';
import type { AdvisorsRepository } from './advisors.repository';
import type { ReplaceAdvisorBackgroundDto } from './dtos/advisor-background.dto';

const advisorId = '22222222-2222-2222-2222-222222222222';
const user = { id: advisorId } as SessionUser;

const empty = {
  experiences: [],
  educations: [],
  languages: [],
  credentials: [],
};

function dto(
  overrides: Partial<ReplaceAdvisorBackgroundDto> = {},
): ReplaceAdvisorBackgroundDto {
  return { ...empty, ...overrides };
}

describe('AdvisorBackgroundService', () => {
  let background: jest.Mocked<AdvisorBackgroundRepository>;
  let advisors: jest.Mocked<AdvisorsRepository>;
  let service: AdvisorBackgroundService;

  beforeEach(() => {
    background = {
      find: jest.fn().mockResolvedValue(empty),
      replace: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AdvisorBackgroundRepository>;
    advisors = {
      findDiscoverableById: jest.fn().mockResolvedValue({ id: advisorId }),
      findByUserId: jest.fn().mockResolvedValue({ userId: advisorId }),
    } as unknown as jest.Mocked<AdvisorsRepository>;
    service = new AdvisorBackgroundService(background, advisors);
  });

  describe('findPublic', () => {
    it('answers a discoverable advisor’s background', async () => {
      await expect(service.findPublic(advisorId)).resolves.toEqual(empty);
      expect(background.find).toHaveBeenCalledWith(advisorId);
    });

    it('is a 404 for an advisor nobody can find, as their profile is', async () => {
      advisors.findDiscoverableById.mockResolvedValue(undefined);
      await expect(service.findPublic(advisorId)).rejects.toThrow(
        NotFoundException,
      );
      expect(background.find).not.toHaveBeenCalled();
    });
  });

  describe('findMine', () => {
    it('answers the caller’s own background', async () => {
      await expect(service.findMine(user)).resolves.toEqual(empty);
    });

    it('is a 404 for a caller who has not applied', async () => {
      advisors.findByUserId.mockResolvedValue(undefined);
      await expect(service.findMine(user)).rejects.toThrow(NotFoundException);
    });
  });

  describe('replaceMine', () => {
    it('stores every list with blanks as nothing, then answers what was stored', async () => {
      await service.replaceMine(
        user,
        dto({
          experiences: [
            {
              title: 'Tax advisor',
              organization: 'Freelance',
              startYear: 2019,
              startMonth: 3,
              // Current work: an end month alone means nothing.
              endMonth: 5,
              description: '',
            },
          ],
          educations: [{ institution: 'Chulalongkorn University', degree: '' }],
          languages: [{ language: 'Thai', proficiency: 'NATIVE' }],
          credentials: [{ title: 'Certified Public Accountant', issuer: '' }],
        }),
      );

      expect(background.replace).toHaveBeenCalledWith(advisorId, {
        experiences: [
          {
            title: 'Tax advisor',
            organization: 'Freelance',
            startYear: 2019,
            startMonth: 3,
            endYear: null,
            endMonth: null,
            description: null,
          },
        ],
        educations: [
          {
            institution: 'Chulalongkorn University',
            degree: null,
            startYear: null,
            endYear: null,
          },
        ],
        languages: [{ language: 'Thai', proficiency: 'NATIVE' }],
        credentials: [
          { title: 'Certified Public Accountant', issuer: null, year: null },
        ],
      });
      expect(background.find).toHaveBeenCalledWith(advisorId);
    });

    it('keeps a finished job’s end', async () => {
      await service.replaceMine(
        user,
        dto({
          experiences: [
            {
              title: 'Auditor',
              organization: 'Big Four',
              startYear: 2015,
              endYear: 2019,
              endMonth: 12,
              description: 'Audits',
            },
          ],
        }),
      );
      expect(background.replace).toHaveBeenCalledWith(
        advisorId,
        expect.objectContaining({
          experiences: [
            expect.objectContaining({
              startMonth: null,
              endYear: 2019,
              endMonth: 12,
              description: 'Audits',
            }),
          ],
        }),
      );
    });

    it('refuses a job that ends in an earlier year or month than it starts', async () => {
      await expect(
        service.replaceMine(
          user,
          dto({
            experiences: [
              { title: 'A', organization: 'B', startYear: 2020, endYear: 2019 },
            ],
          }),
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.replaceMine(
          user,
          dto({
            experiences: [
              {
                title: 'A',
                organization: 'B',
                startYear: 2020,
                startMonth: 6,
                endYear: 2020,
                endMonth: 2,
              },
            ],
          }),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(background.replace).not.toHaveBeenCalled();
    });

    it('allows a job that starts and ends in the same month', async () => {
      await service.replaceMine(
        user,
        dto({
          experiences: [
            {
              title: 'A',
              organization: 'B',
              startYear: 2020,
              startMonth: 6,
              endYear: 2020,
              endMonth: 6,
            },
          ],
        }),
      );
      expect(background.replace).toHaveBeenCalled();
    });

    it('refuses a course that ends before it starts', async () => {
      await expect(
        service.replaceMine(
          user,
          dto({
            educations: [{ institution: 'X', startYear: 2012, endYear: 2010 }],
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('is a 404 for a caller who has not applied', async () => {
      advisors.findByUserId.mockResolvedValue(undefined);
      await expect(service.replaceMine(user, dto())).rejects.toThrow(
        NotFoundException,
      );
      expect(background.replace).not.toHaveBeenCalled();
    });
  });
});
