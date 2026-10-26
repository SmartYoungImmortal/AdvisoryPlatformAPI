import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { memoryStorage } from 'multer';
import {
  ApiCreate,
  ApiGetPaginated,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { OwnSkillProofResponseDto } from './dtos/own-skill-proof-response.dto';
import { SubmitSkillProofDto } from './dtos/submit-skill-proof.dto';
import {
  MAX_SKILL_PROOF_BYTES,
  SKILL_PROOF_MESSAGES,
} from './skill-proofs.constants';
import { SkillProofsService } from './skill-proofs.service';

/**
 * The applicant's own side of the queue: the documents they uploaded and what was
 * decided. An applicant is still an Advisee — the Advisor role waits for identity
 * approval — so `submitSelf` and `readSelf` are held by every Advisee.
 *
 * The route is keyed on the session, never on a path id, so it needs no ownership
 * check — there is no id to substitute. The path is three segments, so it cannot be
 * captured by `advisors/:advisorId`.
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

  @UserHasPermission({ permission: { skillProof: ['submitSelf'] } })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SKILL_PROOF_BYTES, files: 1 },
    }),
  )
  @ResponseMessage(SKILL_PROOF_MESSAGES.submitted)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['skillId', 'file'],
      properties: {
        skillId: { type: 'string', format: 'uuid' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPG, PNG or PDF, at most 50 MB.',
        },
      },
    },
  })
  @ApiCreate(OwnSkillProofResponseDto, { name: 'Skill proof' })
  submit(
    @CurrentUser() user: SessionUser,
    @Body() dto: SubmitSkillProofDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<OwnSkillProofResponseDto> {
    return this.skillProofs.submit(user, dto, file);
  }
}
