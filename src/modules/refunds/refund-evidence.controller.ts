import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiProperty, ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { memoryStorage } from 'multer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import {
  ApiCreate,
  ApiGetOne,
  ApiGetMany,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { RefundEvidenceService } from './refund-evidence.service';
import { RefundCaseEvidenceResponseDto } from './dtos/refund-case-evidence-response.dto';
import { MAX_REFUND_EVIDENCE_BYTES } from './refund-evidence.constants';

class EvidenceUrlQuery {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(1024) objectKey!: string;
}
class EvidenceUrlDto {
  @ApiProperty() url!: string;
  @ApiProperty() expiresInSeconds!: number;
}

@ApiTags('Refund evidence')
@Controller('refunds/:refundCaseId')
export class RefundEvidenceController {
  constructor(private readonly evidence: RefundEvidenceService) {}
  @UserHasPermission({ permission: { refund: ['readSelf'] } })
  @Get('evidence')
  @ApiGetMany(RefundCaseEvidenceResponseDto, { name: 'Refund evidence' })
  list(
    @CurrentUser() user: SessionUser,
    @Param('refundCaseId', ParseUUIDPipe) id: string,
  ) {
    return this.evidence.list(user, id);
  }

  @UserHasPermission({ permission: { refund: ['submitSelf'] } })
  @Post('evidence')
  @ApiCreate(RefundCaseEvidenceResponseDto, { name: 'Refund evidence' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_REFUND_EVIDENCE_BYTES + 1, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  upload(
    @CurrentUser() user: SessionUser,
    @Param('refundCaseId', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.evidence.upload(user, id, file);
  }

  @UserHasPermission({ permission: { refund: ['readSelf'] } })
  @Get('evidence-url')
  @ApiGetOne(EvidenceUrlDto, { name: 'Refund evidence URL' })
  url(
    @CurrentUser() user: SessionUser,
    @Param('refundCaseId', ParseUUIDPipe) id: string,
    @Query() query: EvidenceUrlQuery,
  ) {
    return this.evidence.ownUrl(user, id, query.objectKey);
  }
}

@ApiTags('Admin refunds')
@Controller('admin/refunds/:refundCaseId/evidence-url')
export class AdminRefundEvidenceController {
  constructor(private readonly evidence: RefundEvidenceService) {}
  @UserHasPermission({ permission: { refund: ['read'] } })
  @Get()
  @ApiGetOne(EvidenceUrlDto, { name: 'Refund evidence URL' })
  url(
    @Param('refundCaseId', ParseUUIDPipe) id: string,
    @Query() query: EvidenceUrlQuery,
  ) {
    return this.evidence.adminUrl(id, query.objectKey);
  }
}
