import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiGetOne } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { OwnIdentityVerificationResponseDto } from './dtos/own-identity-verification-response.dto';
import { IdentityVerificationService } from './identity-verification.service';

/**
 * The Advisor's own side of the queue: where their submission stands and what was
 * decided.
 *
 * The route is keyed on the session, never on a path id, so `readSelf` needs no
 * ownership check — there is no id to substitute. The path is three segments, so it
 * cannot be captured by `advisors/:advisorId`.
 */
@ApiTags('Advisors')
@Controller('advisors/me/identity-verification')
export class AdvisorIdentityVerificationController {
  constructor(
    private readonly identityVerifications: IdentityVerificationService,
  ) {}

  @UserHasPermission({ permission: { identityVerification: ['readSelf'] } })
  @Get()
  @ApiGetOne(OwnIdentityVerificationResponseDto, {
    name: 'Identity verification',
  })
  getMine(
    @CurrentUser() user: SessionUser,
  ): Promise<OwnIdentityVerificationResponseDto> {
    return this.identityVerifications.getOwn(user);
  }
}
