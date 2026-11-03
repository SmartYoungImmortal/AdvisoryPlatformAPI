import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import type { SessionUser } from '@/modules/auth/auth.config';
import type {
  AdvisorPortfolioRepository,
  PortfolioItemRow,
} from './advisor-portfolio.repository';
import {
  AdvisorPortfolioService,
  MAX_PORTFOLIO_IMAGE_BYTES,
} from './advisor-portfolio.service';
import type { AdvisorsRepository } from './advisors.repository';

const advisorId = '22222222-2222-2222-2222-222222222222';
const itemId = '33333333-3333-3333-3333-333333333333';
const user = { id: advisorId } as SessionUser;
const createdAt = new Date('2026-11-02T00:00:00Z');

function row(overrides: Partial<PortfolioItemRow> = {}): PortfolioItemRow {
  return {
    id: itemId,
    advisorId,
    title: 'Tax plan for a café',
    description: null,
    link: null,
    imageKeys: [],
    sortOrder: 0,
    createdAt,
    modifiedAt: createdAt,
    ...overrides,
  };
}

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);

function file(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    buffer: png,
    mimetype: 'image/png',
    size: png.length,
    ...overrides,
  } as Express.Multer.File;
}

describe('AdvisorPortfolioService', () => {
  let portfolio: jest.Mocked<AdvisorPortfolioRepository>;
  let advisors: jest.Mocked<AdvisorsRepository>;
  let storage: jest.Mocked<SeaweedFsStorageService>;
  let service: AdvisorPortfolioService;

  beforeEach(() => {
    portfolio = {
      list: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(row()),
      update: jest.fn().mockResolvedValue(row()),
      remove: jest.fn().mockResolvedValue(row()),
      appendImage: jest.fn().mockResolvedValue(row()),
      removeImage: jest.fn(),
      reorder: jest.fn().mockResolvedValue(undefined),
      findOwned: jest.fn().mockResolvedValue(row()),
    } as unknown as jest.Mocked<AdvisorPortfolioRepository>;
    advisors = {
      findDiscoverableById: jest.fn().mockResolvedValue({ id: advisorId }),
      findByUserId: jest.fn().mockResolvedValue({ userId: advisorId }),
    } as unknown as jest.Mocked<AdvisorsRepository>;
    storage = {
      putObject: jest.fn().mockResolvedValue(undefined),
      removeObject: jest.fn().mockResolvedValue(undefined),
      createDownloadUrl: jest
        .fn()
        .mockImplementation((key: string) =>
          Promise.resolve(`https://files.test/${key}?X-Amz-Signature=1`),
        ),
    } as unknown as jest.Mocked<SeaweedFsStorageService>;
    service = new AdvisorPortfolioService(portfolio, advisors, storage);
  });

  describe('findPublic', () => {
    it('answers the pieces with their pictures as URLs, demo URLs unchanged', async () => {
      portfolio.list.mockResolvedValue([
        row({ imageKeys: ['portfolio/a.png', 'https://cdn.test/b.jpg'] }),
      ]);
      const [item] = await service.findPublic(advisorId);
      expect(item.images).toEqual([
        'https://files.test/portfolio/a.png?X-Amz-Signature=1',
        'https://cdn.test/b.jpg',
      ]);
      expect(item).not.toHaveProperty('advisorId');
    });

    it('leaves out a picture that cannot be signed', async () => {
      portfolio.list.mockResolvedValue([
        row({ imageKeys: ['portfolio/a.png'] }),
      ]);
      storage.createDownloadUrl.mockRejectedValue(new Error('down'));
      const [item] = await service.findPublic(advisorId);
      expect(item.images).toEqual([]);
    });

    it('is a 404 for an advisor nobody can find, as their profile is', async () => {
      advisors.findDiscoverableById.mockResolvedValue(undefined);
      await expect(service.findPublic(advisorId)).rejects.toThrow(
        NotFoundException,
      );
      expect(portfolio.list).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('stores blank optional lines as none', async () => {
      await service.create(user, {
        title: 'Tax plan for a café',
        description: '',
        link: '',
      });
      expect(portfolio.create).toHaveBeenCalledWith(advisorId, {
        title: 'Tax plan for a café',
        description: null,
        link: null,
      });
    });

    it('is a 404 for a caller with no advisor profile', async () => {
      advisors.findByUserId.mockResolvedValue(undefined);
      await expect(service.create(user, { title: 'x' })).rejects.toThrow(
        NotFoundException,
      );
      expect(portfolio.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('writes only the fields sent', async () => {
      await service.update(user, itemId, { link: '' });
      expect(portfolio.update).toHaveBeenCalledWith(advisorId, itemId, {
        link: null,
      });
    });

    it('answers the piece unchanged when nothing was sent', async () => {
      await service.update(user, itemId, {});
      expect(portfolio.update).not.toHaveBeenCalled();
      expect(portfolio.findOwned).toHaveBeenCalledWith(advisorId, itemId);
    });
  });

  describe('remove', () => {
    it('removes its stored pictures but never a demo URL', async () => {
      portfolio.remove.mockResolvedValue(
        row({ imageKeys: ['portfolio/a.png', 'https://cdn.test/b.jpg'] }),
      );
      await service.remove(user, itemId);
      expect(storage.removeObject).toHaveBeenCalledTimes(1);
      expect(storage.removeObject).toHaveBeenCalledWith('portfolio/a.png');
    });
  });

  describe('uploadImage', () => {
    it('stores the picture under the piece and appends it', async () => {
      await service.uploadImage(user, itemId, file());
      const [{ key }] = storage.putObject.mock.calls[0];
      expect(key).toMatch(
        new RegExp(`^portfolio/${advisorId}/${itemId}/[0-9a-f-]+\\.png$`),
      );
      expect(portfolio.appendImage).toHaveBeenCalledWith(
        advisorId,
        itemId,
        key,
      );
    });

    it('refuses a file whose bytes are not the type it claims', async () => {
      await expect(
        service.uploadImage(user, itemId, file({ mimetype: 'image/jpeg' })),
      ).rejects.toThrow(BadRequestException);
      expect(storage.putObject).not.toHaveBeenCalled();
    });

    it('refuses a picture over the limit', async () => {
      await expect(
        service.uploadImage(
          user,
          itemId,
          file({ size: MAX_PORTFOLIO_IMAGE_BYTES + 1 }),
        ),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('says so when storage is down', async () => {
      storage.putObject.mockRejectedValue(new Error('down'));
      await expect(service.uploadImage(user, itemId, file())).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('takes the stored object back when the piece is already full', async () => {
      portfolio.appendImage.mockRejectedValue(new BadRequestException('full'));
      await expect(service.uploadImage(user, itemId, file())).rejects.toThrow(
        BadRequestException,
      );
      const [{ key }] = storage.putObject.mock.calls[0];
      expect(storage.removeObject).toHaveBeenCalledWith(key);
    });
  });

  describe('removeImage', () => {
    it('removes the stored object taken out', async () => {
      portfolio.removeImage.mockResolvedValue({
        row: row(),
        key: 'portfolio/a.png',
      });
      await service.removeImage(user, itemId, 0);
      expect(storage.removeObject).toHaveBeenCalledWith('portfolio/a.png');
    });
  });
});
