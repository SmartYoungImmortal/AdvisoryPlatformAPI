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
import { IdentityVerificationQueryDto } from './dtos/identity-verification-query.dto';
import { IdentityVerificationResponseDto } from './dtos/identity-verification-response.dto';
import { RejectIdentityVerificationDto } from './dtos/reject-identity-verification.dto';
import { IDENTITY_VERIFICATION_MESSAGES } from './identity-verification.constants';
import { IdentityVerificationService } from './identity-verification.service';

/**
 * The admin verification queue. `read` lists and opens a record; `decide` rules on
 * one. They are separate statements so a future role can hold "may look at the queue"
 * without holding "may grant the identity badge".
 */
@ApiTags('Admin identity verifications')
@Controller('admin/identity-verifications')
export class AdminIdentityVerificationsController {
  constructor(
    private readonly identityVerifications: IdentityVerificationService,
  ) {}

  @UserHasPermission({ permission: { identityVerification: ['read'] } })
  @Get()
  @ApiGetPaginated(IdentityVerificationResponseDto, {
    name: 'Identity verification',
  })
  findMany(
    @Query() query: IdentityVerificationQueryDto,
  ): Promise<PaginatedResult<IdentityVerificationResponseDto>> {
    return this.identityVerifications.findManyForAdmin(query);
  }

  @UserHasPermission({ permission: { identityVerification: ['read'] } })
  @Get(':advisorId')
  @ApiGetOne(IdentityVerificationResponseDto, {
    name: 'Identity verification',
  })
  findOne(
    @Param('advisorId', ParseUUIDPipe) advisorId: string,
  ): Promise<IdentityVerificationResponseDto> {
    return this.identityVerifications.findOneForAdmin(advisorId);
  }

  @UserHasPermission({ permission: { identityVerification: ['decide'] } })
  @Post(':advisorId/approve')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(IDENTITY_VERIFICATION_MESSAGES.approved)
  @ApiUpdate(IdentityVerificationResponseDto, {
    name: 'Identity verification',
  })
  @ApiConflictResponse({
    description: IDENTITY_VERIFICATION_MESSAGES.alreadyDecided,
  })
  approve(
    @CurrentUser() admin: SessionUser,
    @Param('advisorId', ParseUUIDPipe) advisorId: string,
  ): Promise<IdentityVerificationResponseDto> {
    return this.identityVerifications.approve(admin, advisorId);
  }

  @UserHasPermission({ permission: { identityVerification: ['decide'] } })
  @Post(':advisorId/reject')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(IDENTITY_VERIFICATION_MESSAGES.rejected)
  @ApiUpdate(IdentityVerificationResponseDto, {
    name: 'Identity verification',
  })
  @ApiConflictResponse({
    description: IDENTITY_VERIFICATION_MESSAGES.alreadyDecided,
  })
  reject(
    @CurrentUser() admin: SessionUser,
    @Param('advisorId', ParseUUIDPipe) advisorId: string,
    @Body() dto: RejectIdentityVerificationDto,
  ): Promise<IdentityVerificationResponseDto> {
    return this.identityVerifications.reject(admin, advisorId, dto);
  }
}
