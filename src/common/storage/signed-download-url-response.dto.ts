import { ApiProperty } from '@nestjs/swagger';

export const SIGNED_DOWNLOAD_URL_EXPIRY_SECONDS = 5 * 60;

export class SignedDownloadUrlResponseDto {
  @ApiProperty({ format: 'uri' }) url: string;
  @ApiProperty({ example: 300 }) expiresInSeconds: number;

  constructor(url: string, expiresInSeconds: number) {
    this.url = url;
    this.expiresInSeconds = expiresInSeconds;
  }
}
