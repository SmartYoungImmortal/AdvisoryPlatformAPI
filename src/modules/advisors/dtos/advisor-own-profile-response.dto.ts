import { ApiProperty } from '@nestjs/swagger';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { InferSelectModel } from 'drizzle-orm';
import type { advisorProfiles } from '@/database/schema';

type AdvisorProfile = InferSelectModel<typeof advisorProfiles>;

/**
 * Profile fields safe only for the authenticated Advisor who owns them.
 *
 * Do not reuse this for discovery or an admin list: public responses must omit email,
 * while admin responses may need their own explicitly reviewed field allowlist.
 */
export class AdvisorOwnProfileResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() displayName: string;
  @ApiProperty() email: string;
  @ApiProperty() headline!: string;
  @ApiProperty({ nullable: true }) bio!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() modifiedAt!: Date;

  constructor(user: SessionUser, advisor: AdvisorProfile) {
    this.id = user.id;
    // better-auth's TS surface always calls this field `name` — `user.fields.name` in
    // auth.config.ts only remaps which Drizzle column it reads/writes, not this type.
    this.displayName = user.name;
    this.email = user.email;
    this.headline = advisor.headline;
    this.bio = advisor.bio;
    this.createdAt = advisor.createdAt;
    this.modifiedAt = advisor.modifiedAt;
  }
}
