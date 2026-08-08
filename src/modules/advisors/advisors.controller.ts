import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiGetOne } from '../../common/decorators/api-docs.decorator';
import type { SessionUser } from '../auth/auth.config';
import { AdvisorMeResponseDto } from './dtos/advisor-me-response.dto';
import { AdvisorsService } from './advisors.service';

/**
 * S2 proof-of-foundation stub: just enough to show session guard + envelope + DB +
 * migration are wired end to end (docs/sprint-plan.md, S2 exit criteria). The real
 * Advisors module — search, public profile, onboarding, identity/skill verification —
 * lands in S3/S4.
 */
@ApiTags('Advisors')
@Controller('api/v1/advisors')
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  @Get('me')
  @ApiGetOne(AdvisorMeResponseDto, 'Current advisor status')
  getMe(@CurrentUser() user: SessionUser): Promise<AdvisorMeResponseDto> {
    return this.advisorsService.getMe(user);
  }
}
