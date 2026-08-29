import { ApiProperty } from '@nestjs/swagger';
import type { InferSelectModel } from 'drizzle-orm';
import type { user } from '@/database/schema';
import { Role } from '@/common/authorization/role.enum';

type User = InferSelectModel<typeof user>;

/** Fields safe for the authenticated account owner only. */
export class UserOwnProfileResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() displayName: string;
  @ApiProperty() email: string;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty() fullName: string;
  @ApiProperty({ nullable: true }) avatarKey: string | null;
  @ApiProperty() timezone: string;
  @ApiProperty({ enum: Role, isArray: true }) roles: Role[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  constructor(profile: User, roles: Role[]) {
    this.id = profile.id;
    this.displayName = profile.displayName;
    this.email = profile.email;
    this.emailVerified = profile.emailVerified;
    this.fullName = profile.fullName;
    this.avatarKey = profile.avatarKey;
    this.timezone = profile.timezone;
    this.roles = roles;
    this.createdAt = profile.createdAt;
    this.updatedAt = profile.updatedAt;
  }
}
