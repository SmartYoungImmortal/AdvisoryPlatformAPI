import { ApiProperty } from '@nestjs/swagger';
import type { AdminAccountDetailRow } from '../admin-accounts.types';
import { AdminAccountResponseDto } from './admin-account-response.dto';

/**
 * One account, plus whether it has an advisor profile.
 *
 * Only the existence of the profile is exposed, not its contents: the headline, bio and
 * penalty points belong to the advisor surfaces, and an account detail page that quietly
 * carried them would make this DTO the place every future field gets added to.
 */
export class AdminAccountDetailResponseDto extends AdminAccountResponseDto {
  @ApiProperty() hasAdvisorProfile: boolean;

  constructor(row: AdminAccountDetailRow) {
    super(row);
    this.hasAdvisorProfile = row.advisorProfileUserId !== null;
  }
}
