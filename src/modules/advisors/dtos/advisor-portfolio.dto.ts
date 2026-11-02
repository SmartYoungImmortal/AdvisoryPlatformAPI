import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';

/** How many pieces a profile may show, and how many pictures each may carry. */
export const PORTFOLIO_ITEMS_MAX = 12;
export const PORTFOLIO_IMAGES_MAX = 4;

/* ------------------------------------------------------------------- input */

/** A piece of work: what it was, a line on it, and where it can be seen. */
export class CreatePortfolioItemDto {
  @ApiProperty({ maxLength: 120 })
  @Trim()
  @IsString()
  @Length(1, 120)
  title!: string;

  @ApiProperty({ maxLength: 1000, required: false, nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiProperty({
    maxLength: 500,
    required: false,
    nullable: true,
    description: 'Where the work lives; http or https. Blank clears it.',
  })
  @Trim()
  // Blank is allowed through as "no link", which `IsOptional` would not let pass `IsUrl`.
  @ValidateIf((dto: CreatePortfolioItemDto) => Boolean(dto.link))
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  link?: string | null;
}

export class UpdatePortfolioItemDto extends PartialType(
  CreatePortfolioItemDto,
) {}

/** Every piece's id, in the order the profile shows them. */
export class ReorderPortfolioDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMaxSize(PORTFOLIO_ITEMS_MAX)
  @IsUUID('all', { each: true })
  ids!: string[];
}

/* ---------------------------------------------------------------- response */

export class PortfolioItemResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
  @ApiProperty({ nullable: true, type: String }) link!: string | null;
  @ApiProperty({
    type: [String],
    description: 'URLs a browser can fetch, in the order they are shown.',
  })
  images!: string[];
  @ApiProperty() createdAt!: Date;
}
