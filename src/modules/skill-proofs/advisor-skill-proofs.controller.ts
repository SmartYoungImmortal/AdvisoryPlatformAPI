import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiGetPaginated } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { OwnSkillProofResponseDto } from './dtos/own-skill-proof-response.dto';
import { SkillProofsService } from './skill-proofs.service';

/**
 * The Advisor's own side of the queue: the documents they uploaded and what was decided.
 *
 * The route is keyed on the session, never on a path id, so `readSelf` needs no
 * ownership check — there is no id to substitute. The path is three segments, so it
 * cannot be captured by `advisors/:advisorId`.
 */
@ApiTags('Advisors')
@Controller('advisors/me/skill-proofs')
export class AdvisorSkillProofsController {
  constructor(private readonly skillProofs: SkillProofsService) {}

  @UserHasPermission({ permission: { skillProof: ['readSelf'] } })
  @Get()
  @ApiGetPaginated(OwnSkillProofResponseDto, { name: 'Skill proof' })
  findMine(
    @CurrentUser() user: SessionUser,
    @Query() query: OffsetPaginationDto,
  ): Promise<PaginatedResult<OwnSkillProofResponseDto>> {
    return this.skillProofs.findManyForAdvisor(user, query);
  }
}
