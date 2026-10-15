import { ApiProperty } from '@nestjs/swagger';
import { userStatusEnum } from '@/database/schema';
import { ACCOUNT_ROLES } from '../admin-accounts.constants';
import type { AdminAccountRow } from '../admin-accounts.types';

/**
 * One account row in the admin console's list.
 *
 * The allowlist is `AdminAccountRow` — see the discipline note there. `status` and `role` are
 * documented with their expected vocabulary but typed as strings, because both columns are
 * `text` and a row written before a rename would otherwise be a lie in the type.
 *
 * `banned` is normalised to a boolean: the column is nullable, and a null has always meant
 * "never banned", which is how better-auth's own sign-in check reads it too.
 */
export class AdminAccountResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() displayName: string;
  @ApiProperty({ format: 'email' }) email: string;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty() fullName: string;
  @ApiProperty({ nullable: true, type: String }) avatarKey: string | null;
  /** A drawable profile-picture URL, unlike the storage key in `avatarKey`. */
  @ApiProperty({ nullable: true, type: String, format: 'uri' }) image:
    string | null;
  @ApiProperty() timezone: string;
  @ApiProperty({ enum: userStatusEnum.enumValues }) status: string;
  @ApiProperty({ enum: ACCOUNT_ROLES, nullable: true, type: String })
  role: string | null;
  @ApiProperty() banned: boolean;
  @ApiProperty({ nullable: true, type: String }) banReason: string | null;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  banExpires: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt: Date;

  constructor(row: AdminAccountRow) {
    this.id = row.id;
    this.displayName = row.displayName;
    this.email = row.email;
    this.emailVerified = row.emailVerified;
    this.fullName = row.fullName;
    this.avatarKey = row.avatarKey;
    this.image = row.image;
    this.timezone = row.timezone;
    this.status = row.status;
    this.role = row.role;
    this.banned = row.banned ?? false;
    this.banReason = row.banReason;
    this.banExpires = row.banExpires;
    this.createdAt = row.createdAt;
    this.updatedAt = row.updatedAt;
  }
}
