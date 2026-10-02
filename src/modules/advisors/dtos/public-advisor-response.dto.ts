import { ApiProperty } from '@nestjs/swagger';

/**
 * An Advisor as a visitor may see them.
 *
 * A deliberate allowlist, and the counterpart `AdvisorOwnProfileResponseDto`'s own
 * comment asks for: email never appears here, and neither does `penaltyPoints`,
 * which is moderation state. `avatarKey` is a storage key rather than a URL —
 * presigning it is the avatar endpoint's job, and a key is not fetchable on its
 * own, so no private object is exposed by naming it.
 */
export class PublicAdvisorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  headline: string;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiProperty({ nullable: true })
  avatarKey: string | null;

  @ApiProperty({ type: [String] })
  skills: string[];

  @ApiProperty({
    description: 'Published services this Advisor currently offers.',
  })
  publishedServiceCount: number;

  constructor(row: {
    id: string;
    displayName: string;
    headline: string;
    bio: string | null;
    avatarKey: string | null;
    skills: string[];
    publishedServiceCount: number;
  }) {
    this.id = row.id;
    this.displayName = row.displayName;
    this.headline = row.headline;
    this.bio = row.bio;
    this.avatarKey = row.avatarKey;
    this.skills = row.skills;
    this.publishedServiceCount = row.publishedServiceCount;
  }
}
