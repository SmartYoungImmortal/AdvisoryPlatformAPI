import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { memoryStorage } from 'multer';
import { ApiCreate, ApiGetOne } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { IdentitySubmissionResponseDto } from './dtos/identity-submission-response.dto';
import { OwnIdentityVerificationResponseDto } from './dtos/own-identity-verification-response.dto';
import {
  IDENTITY_VERIFICATION_MESSAGES,
  MAX_IDENTITY_DOCUMENT_BYTES,
} from './identity-verification.constants';
import { IdentityVerificationService } from './identity-verification.service';

/**
 * The applicant's own side of the queue: submit the ID-card scan, then watch where it
 * stands. An applicant is still an Advisee — the Advisor role is what an approval
 * grants — so `submitSelf` and `readSelf` are held by every Advisee.
 *
 * The route is keyed on the session, never on a path id, so it needs no ownership
 * check — there is no id to substitute. The path is three segments, so it cannot be
 * captured by `advisors/:advisorId`.
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

  @UserHasPermission({ permission: { identityVerification: ['submitSelf'] } })
  @Post()
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IDENTITY_DOCUMENT_BYTES, files: 1 },
    }),
  )
  @ResponseMessage(IDENTITY_VERIFICATION_MESSAGES.submitted)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['document'],
      properties: {
        document: {
          type: 'string',
          format: 'binary',
          description: 'ID-card scan, JPG or PNG, at most 50 MB.',
        },
      },
    },
  })
  @ApiCreate(IdentitySubmissionResponseDto, { name: 'Identity submission' })
  @ApiConflictResponse({
    description: `${IDENTITY_VERIFICATION_MESSAGES.awaitingReview}, or ${IDENTITY_VERIFICATION_MESSAGES.alreadyVerified}`,
  })
  submit(
    @CurrentUser() user: SessionUser,
    @UploadedFile() document: Express.Multer.File | undefined,
  ): Promise<IdentitySubmissionResponseDto> {
    return this.identityVerifications.submit(user, document);
  }
}
