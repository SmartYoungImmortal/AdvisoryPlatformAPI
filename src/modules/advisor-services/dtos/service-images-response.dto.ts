import { ApiProperty } from '@nestjs/swagger';

export class ServiceImagesResponseDto {
  @ApiProperty({
    type: [String],
    description: 'Download URLs in carousel order, valid for one hour',
  })
  images!: string[];
}
