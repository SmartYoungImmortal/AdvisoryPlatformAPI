import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { InferSelectModel } from 'drizzle-orm';
import { Trim } from '@/common/decorators/trim.decorator';
import type { servicePackages } from '@/database/schema';

/** The most packages one service is sold in: a choice, not a menu. */
export const MAX_SERVICE_PACKAGES = 5;

export type ServicePackage = InferSelectModel<typeof servicePackages>;

/** One package as everyone sees it: its name and line, its length and price. */
export class ServicePackageResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty() durationMinutes: number;
  @ApiProperty({ description: 'Integer satang' }) priceSatang: number;

  constructor(row: ServicePackage) {
    this.id = row.id;
    this.name = row.name;
    this.description = row.description;
    this.durationMinutes = row.durationMinutes;
    this.priceSatang = row.priceSatang;
  }
}

/**
 * One package as the advisor sets it. With `id` it is that package, changed;
 * without, a new one. Bookings already made keep the package they were made on.
 */
export class ServicePackageInputDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ maxLength: 80 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ minimum: 1, description: 'Positive number of minutes' })
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiProperty({ minimum: 0, description: 'Integer satang' })
  @IsInt()
  @Min(0)
  priceSatang!: number;
}

/**
 * A service's whole list of packages, in the order they are offered. What is
 * sent replaces what was there: a package left out is removed. An empty list
 * sells the service as itself again.
 */
export class ReplaceServicePackagesDto {
  @ApiProperty({
    type: [ServicePackageInputDto],
    maxItems: MAX_SERVICE_PACKAGES,
  })
  @IsArray()
  @ArrayMaxSize(MAX_SERVICE_PACKAGES)
  @ValidateNested({ each: true })
  @Type(() => ServicePackageInputDto)
  packages!: ServicePackageInputDto[];
}
