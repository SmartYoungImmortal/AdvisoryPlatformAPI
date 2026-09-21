import { ApiProperty } from '@nestjs/swagger';
import type { InferSelectModel } from 'drizzle-orm';
import type { chatFiles } from '@/database/schema';

export type ChatFile = InferSelectModel<typeof chatFiles>;

/**
 * `objectKey` is deliberately absent. It is a storage-layout detail, and a client only
 * ever needs the id to ask for a fresh download URL.
 */
export class ChatFileResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) chatRoomId: string;
  @ApiProperty({ format: 'uuid' }) senderUserId: string;
  @ApiProperty() originalFileName: string;
  @ApiProperty() mimeType: string;
  @ApiProperty() fileSizeBytes: number;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  expiryDate: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;

  constructor(file: ChatFile) {
    this.id = file.id;
    this.chatRoomId = file.chatRoomId;
    this.senderUserId = file.senderUserId;
    this.originalFileName = file.originalFileName;
    this.mimeType = file.mimeType;
    this.fileSizeBytes = file.fileSizeBytes;
    this.expiryDate = file.expiryDate;
    this.createdAt = file.createdAt;
  }
}

/** Signed URLs are generated per request and never persisted. */
export class ChatFileUrlResponseDto {
  @ApiProperty() url: string;
  @ApiProperty() expiresInSeconds: number;

  constructor(url: string, expiresInSeconds: number) {
    this.url = url;
    this.expiresInSeconds = expiresInSeconds;
  }
}
