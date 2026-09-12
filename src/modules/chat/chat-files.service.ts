import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  type CursorPaginatedResult,
} from '@/common/pagination/cursor-pagination.dto';
import { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import {
  CHAT_FILE_EXTENSIONS,
  CHAT_FILE_URL_EXPIRY_SECONDS,
  MAX_CHAT_FILE_BYTES,
  chatFileExpiryDate,
  chatFileObjectKey,
} from './chat-files.constants';
import { CHAT_MESSAGES } from './chat.constants';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import {
  ChatFileResponseDto,
  ChatFileUrlResponseDto,
} from './dtos/chat-file-response.dto';
import type { ChatFileQueryDto } from './dtos/chat-query.dto';

export interface ChatFileUpload {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

@Injectable()
export class ChatFilesService {
  private readonly logger = new Logger(ChatFilesService.name);

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly chatService: ChatService,
    private readonly storage: SeaweedFsStorageService,
  ) {}

  async findFiles(
    memberUserId: string,
    chatRoomId: string,
    query: ChatFileQueryDto,
  ): Promise<CursorPaginatedResult<ChatFileResponseDto>> {
    await this.chatService.assertMember(chatRoomId, memberUserId);
    const cursor = query.cursor ? decodeKeysetCursor(query.cursor) : undefined;
    if (query.cursor && !cursor) {
      throw new BadRequestException(CHAT_MESSAGES.invalidCursor);
    }

    const files = await this.chatRepository.findFiles(
      chatRoomId,
      query.limit + 1,
      cursor,
    );
    const hasMore = files.length > query.limit;
    const page = files.slice(0, query.limit);
    const last = page.at(-1);

    return {
      items: page.map((file) => new ChatFileResponseDto(file)),
      limit: query.limit,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ createdAt: last.createdAt, id: last.id })
          : null,
    };
  }

  /**
   * The object is written before the row so a reader can never see a row whose object is
   * missing. A failed insert removes the object again rather than leaking it.
   */
  async upload(
    memberUserId: string,
    chatRoomId: string,
    upload: ChatFileUpload | undefined,
  ): Promise<ChatFileResponseDto> {
    await this.chatService.assertMember(chatRoomId, memberUserId);
    this.validateUpload(upload);

    const objectKey = chatFileObjectKey(
      chatRoomId,
      CHAT_FILE_EXTENSIONS[upload.mimetype],
    );
    try {
      await this.storage.putObject({
        key: objectKey,
        body: upload.buffer,
        contentType: upload.mimetype,
      });
    } catch {
      throw new ServiceUnavailableException(CHAT_MESSAGES.storageUnavailable);
    }

    let created;
    try {
      created = await this.chatRepository.createFileForMember(
        chatRoomId,
        memberUserId,
        {
          objectKey,
          originalFileName: upload.originalname,
          mimeType: upload.mimetype,
          fileSizeBytes: upload.size,
          expiryDate: chatFileExpiryDate(new Date()),
        },
      );
    } catch (error: unknown) {
      await this.removeObjectAfterRecordDelete(objectKey);
      throw error;
    }

    if (!created) {
      await this.removeObjectAfterRecordDelete(objectKey);
      throw new NotFoundException(CHAT_MESSAGES.roomNotFound);
    }

    return new ChatFileResponseDto(created);
  }

  async createDownloadUrl(
    memberUserId: string,
    chatRoomId: string,
    fileId: string,
  ): Promise<ChatFileUrlResponseDto> {
    const file = await this.getFileForMember(memberUserId, chatRoomId, fileId);

    try {
      const url = await this.storage.createDownloadUrl(
        file.objectKey,
        CHAT_FILE_URL_EXPIRY_SECONDS,
      );
      return new ChatFileUrlResponseDto(url, CHAT_FILE_URL_EXPIRY_SECONDS);
    } catch {
      throw new ServiceUnavailableException(CHAT_MESSAGES.storageUnavailable);
    }
  }

  async remove(
    memberUserId: string,
    chatRoomId: string,
    fileId: string,
  ): Promise<ChatFileResponseDto> {
    const file = await this.getFileForMember(memberUserId, chatRoomId, fileId);
    // Every member can read the file, so refusing the delete is an ownership problem
    // rather than a missing resource.
    if (file.senderUserId !== memberUserId) {
      throw new ForbiddenException(CHAT_MESSAGES.fileNotSender);
    }

    const deleted = await this.chatRepository.deleteFileInRoom(
      chatRoomId,
      fileId,
    );
    if (!deleted) {
      throw new NotFoundException(CHAT_MESSAGES.fileNotFound);
    }

    await this.removeObjectAfterRecordDelete(deleted.objectKey);
    return new ChatFileResponseDto(deleted);
  }

  private async getFileForMember(
    memberUserId: string,
    chatRoomId: string,
    fileId: string,
  ) {
    await this.chatService.assertMember(chatRoomId, memberUserId);
    const file = await this.chatRepository.findFileInRoom(chatRoomId, fileId);
    if (!file) {
      throw new NotFoundException(CHAT_MESSAGES.fileNotFound);
    }
    return file;
  }

  private validateUpload(
    upload: ChatFileUpload | undefined,
  ): asserts upload is ChatFileUpload {
    if (!upload || upload.size === 0) {
      throw new BadRequestException(CHAT_MESSAGES.fileRequired);
    }
    if (!CHAT_FILE_EXTENSIONS[upload.mimetype]) {
      throw new BadRequestException(CHAT_MESSAGES.fileInvalidType);
    }
    if (upload.size > MAX_CHAT_FILE_BYTES) {
      throw new BadRequestException(CHAT_MESSAGES.fileTooLarge);
    }
  }

  private async removeObjectAfterRecordDelete(key: string): Promise<void> {
    try {
      await this.storage.removeObject(key);
    } catch (error: unknown) {
      this.logger.warn(
        `Could not remove orphaned object ${key}; it must be cleaned up separately.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
