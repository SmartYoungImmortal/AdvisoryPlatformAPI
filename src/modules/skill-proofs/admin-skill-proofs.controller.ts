import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiConflictResponse, ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiGetOne,
  ApiGetPaginated,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { RejectSkillProofDto } from './dtos/reject-skill-proof.dto';
import { SkillProofQueryDto } from './dtos/skill-proof-query.dto';
import { SkillProofResponseDto } from './dtos/skill-proof-response.dto';
import { SKILL_PROOF_MESSAGES } from './skill-proofs.constants';
import { SkillProofsService } from './skill-proofs.service';

/**
 * The admin skill-proof queue. `read` lists and opens a document; `decide` rules on
 * one. They are separate statements so a future role can hold "may look at the queue"
 * without holding "may rule on it".
 */
@ApiTags('Admin skill proofs')
@Controller('admin/skill-proofs')
export class AdminSkillProofsController {
  constructor(private readonly skillProofs: SkillProofsService) {}

  @UserHasPermission({ permission: { skillProof: ['read'] } })
  @Get()
  @ApiGetPaginated(SkillProofResponseDto, { name: 'Skill proof' })
  findMany(
    @Query() query: SkillProofQueryDto,
  ): Promise<PaginatedResult<SkillProofResponseDto>> {
    return this.skillProofs.findManyForAdmin(query);
  }

  @UserHasPermission({ permission: { skillProof: ['read'] } })
  @Get(':proofId')
  @ApiGetOne(SkillProofResponseDto, { name: 'Skill proof' })
  findOne(
    @Param('proofId', ParseUUIDPipe) proofId: string,
  ): Promise<SkillProofResponseDto> {
    return this.skillProofs.findOneForAdmin(proofId);
  }

  @UserHasPermission({ permission: { skillProof: ['decide'] } })
  @Post(':proofId/approve')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(SKILL_PROOF_MESSAGES.approved)
  @ApiUpdate(SkillProofResponseDto, { name: 'Skill proof' })
  @ApiConflictResponse({ description: SKILL_PROOF_MESSAGES.alreadyReviewed })
  approve(
    @CurrentUser() admin: SessionUser,
    @Param('proofId', ParseUUIDPipe) proofId: string,
  ): Promise<SkillProofResponseDto> {
    return this.skillProofs.approve(admin, proofId);
  }

  @UserHasPermission({ permission: { skillProof: ['decide'] } })
  @Post(':proofId/reject')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(SKILL_PROOF_MESSAGES.rejected)
  @ApiUpdate(SkillProofResponseDto, { name: 'Skill proof' })
  @ApiConflictResponse({ description: SKILL_PROOF_MESSAGES.alreadyReviewed })
  reject(
    @CurrentUser() admin: SessionUser,
    @Param('proofId', ParseUUIDPipe) proofId: string,
    @Body() dto: RejectSkillProofDto,
  ): Promise<SkillProofResponseDto> {
    return this.skillProofs.reject(admin, proofId, dto);
  }
}
