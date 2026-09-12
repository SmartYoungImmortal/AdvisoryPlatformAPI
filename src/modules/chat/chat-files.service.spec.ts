import {
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import {
  CHAT_FILE_RETENTION_DAYS,
  MAX_CHAT_FILE_BYTES,
} from './chat-files.constants';
import { ChatFilesService, type ChatFileUpload } from './chat-files.service';
import type { ChatRepository } from './chat.repository';
import type { ChatService } from './chat.service';
import type { ChatFile } from './dtos/chat-file-response.dto';
import { ChatFileQueryDto } from './dtos/chat-query.dto';

const sender = '11111111-1111-1111-1111-111111111111';
const otherMember = '22222222-2222-2222-2222-222222222222';
const chatRoomId = '33333333-3333-3333-3333-333333333333';
const fileId = '44444444-4444-4444-4444-444444444444';

function makeFile(overrides: Partial<ChatFile> = {}): ChatFile {
  return {
    id: fileId,
    chatRoomId,
    senderUserId: sender,
    objectKey: `chat-files/${chatRoomId}/${fileId}.pdf`,
    originalFileName: 'brief.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: 1024,
    expiryDate: new Date('2027-03-11T00:00:00.000Z'),
    createdAt: new Date('2026-09-12T00:00:00.000Z'),
    ...overrides,
  };
}

function makeUpload(overrides: Partial<ChatFileUpload> = {}): ChatFileUpload {
  return {
    buffer: Buffer.from('file contents'),
    mimetype: 'application/pdf',
    size: 1024,
    originalname: 'brief.pdf',
    ...overrides,
  };
}

describe('ChatFilesService', () => {
  let service: ChatFilesService;
  let repository: jest.Mocked<
    Pick<
      ChatRepository,
      | 'createFileForMember'
      | 'findFiles'
      | 'findFileInRoom'
      | 'deleteFileInRoom'
    >
  >;
  let chat: jest.Mocked<Pick<ChatService, 'assertMember'>>;
  let storage: jest.Mocked<
    Pick<
      SeaweedFsStorageService,
      'putObject' | 'removeObject' | 'createDownloadUrl'
    >
  >;

  beforeEach(() => {
    // The orphan-cleanup paths log on purpose; keep the suite output readable.
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    repository = {
      createFileForMember: jest.fn(),
      findFiles: jest.fn(),
      findFileInRoom: jest.fn(),
      deleteFileInRoom: jest.fn(),
    };
    chat = { assertMember: jest.fn().mockResolvedValue(undefined) };
    storage = {
      putObject: jest.fn().mockResolvedValue(undefined),
      removeObject: jest.fn().mockResolvedValue(undefined),
      createDownloadUrl: jest.fn().mockResolvedValue('https://signed.test/x'),
    };
    service = new ChatFilesService(
      repository as unknown as ChatRepository,
      chat as unknown as ChatService,
      storage as unknown as SeaweedFsStorageService,
    );
  });

  describe('upload', () => {
    it('stores the object then the row, keyed by room', async () => {
      repository.createFileForMember.mockResolvedValue(makeFile());

      const file = await service.upload(sender, chatRoomId, makeUpload());

      expect(chat.assertMember).toHaveBeenCalledWith(chatRoomId, sender);
      expect(storage.putObject).toHaveBeenCalledTimes(1);
      const stored = storage.putObject.mock.calls[0][0];
      expect(stored.key).toMatch(
        new RegExp(`^chat-files/${chatRoomId}/.*\\.pdf$`),
      );
      expect(stored.contentType).toBe('application/pdf');
      expect(file.originalFileName).toBe('brief.pdf');
    });

    it('records an expiry date so the lifecycle sweep has something to read', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-09-12T00:00:00.000Z'));
      repository.createFileForMember.mockResolvedValue(makeFile());

      await service.upload(sender, chatRoomId, makeUpload());

      // 2026-09-12 plus the 180-day retention window.
      expect(repository.createFileForMember).toHaveBeenCalledWith(
        chatRoomId,
        sender,
        expect.objectContaining({
          expiryDate: new Date('2027-03-11T00:00:00.000Z'),
        }),
      );
      expect(CHAT_FILE_RETENTION_DAYS).toBe(180);
      jest.useRealTimers();
    });

    it('never stores an object key the row could not be written for', async () => {
      repository.createFileForMember.mockResolvedValue(undefined);

      await expect(
        service.upload(sender, chatRoomId, makeUpload()),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.removeObject).toHaveBeenCalledTimes(1);
    });

    it('removes the orphaned object when the insert throws', async () => {
      repository.createFileForMember.mockRejectedValue(new Error('db down'));

      await expect(
        service.upload(sender, chatRoomId, makeUpload()),
      ).rejects.toThrow('db down');
      expect(storage.removeObject).toHaveBeenCalledTimes(1);
    });

    it('refuses a non-member before touching storage', async () => {
      chat.assertMember.mockRejectedValue(new NotFoundException());

      await expect(
        service.upload(otherMember, chatRoomId, makeUpload()),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.putObject).not.toHaveBeenCalled();
    });

    it('requires a file', async () => {
      await expect(
        service.upload(sender, chatRoomId, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.putObject).not.toHaveBeenCalled();
    });

    it('rejects an empty file', async () => {
      await expect(
        service.upload(sender, chatRoomId, makeUpload({ size: 0 })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a type outside the allowlist', async () => {
      await expect(
        service.upload(
          sender,
          chatRoomId,
          makeUpload({ mimetype: 'application/x-msdownload' }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(storage.putObject).not.toHaveBeenCalled();
    });

    it('rejects a file over 50 MB', async () => {
      await expect(
        service.upload(
          sender,
          chatRoomId,
          makeUpload({ size: MAX_CHAT_FILE_BYTES + 1 }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts a file at exactly 50 MB', async () => {
      repository.createFileForMember.mockResolvedValue(
        makeFile({ fileSizeBytes: MAX_CHAT_FILE_BYTES }),
      );

      await expect(
        service.upload(
          sender,
          chatRoomId,
          makeUpload({ size: MAX_CHAT_FILE_BYTES }),
        ),
      ).resolves.toMatchObject({ fileSizeBytes: MAX_CHAT_FILE_BYTES });
    });

    it('reports storage failure rather than writing a dangling row', async () => {
      storage.putObject.mockRejectedValue(new Error('seaweed down'));

      await expect(
        service.upload(sender, chatRoomId, makeUpload()),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(repository.createFileForMember).not.toHaveBeenCalled();
    });
  });

  describe('download', () => {
    it('signs a short-lived URL for any member of the room', async () => {
      repository.findFileInRoom.mockResolvedValue(makeFile());

      const result = await service.createDownloadUrl(
        otherMember,
        chatRoomId,
        fileId,
      );

      expect(result.url).toBe('https://signed.test/x');
      expect(result.expiresInSeconds).toBeGreaterThan(0);
      expect(chat.assertMember).toHaveBeenCalledWith(chatRoomId, otherMember);
    });

    it('scopes the lookup by room so a foreign file id cannot be resolved', async () => {
      repository.findFileInRoom.mockResolvedValue(undefined);

      await expect(
        service.createDownloadUrl(sender, chatRoomId, fileId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findFileInRoom).toHaveBeenCalledWith(
        chatRoomId,
        fileId,
      );
    });

    it('refuses a non-member', async () => {
      chat.assertMember.mockRejectedValue(new NotFoundException());

      await expect(
        service.createDownloadUrl(otherMember, chatRoomId, fileId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findFileInRoom).not.toHaveBeenCalled();
    });

    it('reports storage failure when the URL cannot be signed', async () => {
      repository.findFileInRoom.mockResolvedValue(makeFile());
      storage.createDownloadUrl.mockRejectedValue(new Error('seaweed down'));

      await expect(
        service.createDownloadUrl(sender, chatRoomId, fileId),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('remove', () => {
    it('lets the sender delete and returns what went', async () => {
      repository.findFileInRoom.mockResolvedValue(makeFile());
      repository.deleteFileInRoom.mockResolvedValue(makeFile());

      const deleted = await service.remove(sender, chatRoomId, fileId);

      expect(deleted.id).toBe(fileId);
      expect(storage.removeObject).toHaveBeenCalledWith(
        `chat-files/${chatRoomId}/${fileId}.pdf`,
      );
    });

    it('refuses a member who is not the sender', async () => {
      repository.findFileInRoom.mockResolvedValue(makeFile());

      await expect(
        service.remove(otherMember, chatRoomId, fileId),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.deleteFileInRoom).not.toHaveBeenCalled();
      expect(storage.removeObject).not.toHaveBeenCalled();
    });

    it('reports a file that vanished between the read and the delete', async () => {
      repository.findFileInRoom.mockResolvedValue(makeFile());
      repository.deleteFileInRoom.mockResolvedValue(undefined);

      await expect(
        service.remove(sender, chatRoomId, fileId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('keeps the row deleted when the object cannot be removed', async () => {
      repository.findFileInRoom.mockResolvedValue(makeFile());
      repository.deleteFileInRoom.mockResolvedValue(makeFile());
      storage.removeObject.mockRejectedValue(new Error('seaweed down'));

      await expect(
        service.remove(sender, chatRoomId, fileId),
      ).resolves.toMatchObject({ id: fileId });
    });
  });

  describe('findFiles', () => {
    it('returns a cursor page and the next cursor when more remain', async () => {
      const query = Object.assign(new ChatFileQueryDto(), { limit: 1 });
      repository.findFiles.mockResolvedValue([
        makeFile(),
        makeFile({ id: '55555555-5555-5555-5555-555555555555' }),
      ]);

      const page = await service.findFiles(sender, chatRoomId, query);

      expect(page.items).toHaveLength(1);
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toEqual(expect.any(String));
      expect(repository.findFiles).toHaveBeenCalledWith(
        chatRoomId,
        2,
        undefined,
      );
    });

    it('ends the feed without a cursor', async () => {
      const query = Object.assign(new ChatFileQueryDto(), { limit: 20 });
      repository.findFiles.mockResolvedValue([makeFile()]);

      const page = await service.findFiles(sender, chatRoomId, query);

      expect(page.hasMore).toBe(false);
      expect(page.nextCursor).toBeNull();
    });

    it('rejects a malformed cursor', async () => {
      const query = Object.assign(new ChatFileQueryDto(), {
        limit: 20,
        cursor: 'not-a-cursor',
      });

      await expect(
        service.findFiles(sender, chatRoomId, query),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.findFiles).not.toHaveBeenCalled();
    });

    it('refuses a non-member', async () => {
      chat.assertMember.mockRejectedValue(new NotFoundException());

      await expect(
        service.findFiles(otherMember, chatRoomId, new ChatFileQueryDto()),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findFiles).not.toHaveBeenCalled();
    });
  });
});
