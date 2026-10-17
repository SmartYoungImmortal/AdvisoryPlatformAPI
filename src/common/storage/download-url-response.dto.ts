import { ApiProperty } from '@nestjs/swagger';

/** A short-lived URL produced only after the owning feature authorizes the request. */
export class DownloadUrlResponseDto {
  @ApiProperty({ format: 'uri' }) url: string;
  @ApiProperty({ example: 300 }) expiresInSeconds: number;

  constructor(url: string, expiresInSeconds: number) {
    this.url = url;
    this.expiresInSeconds = expiresInSeconds;
  }
}
