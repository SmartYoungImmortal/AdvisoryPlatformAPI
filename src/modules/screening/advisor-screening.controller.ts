import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiGetMany,
  ApiGetOne,
  ApiGetPaginated,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdvisorScreeningRequestDetailResponseDto } from './dtos/advisor-screening-request-detail-response.dto';
import { AdvisorScreeningRequestResponseDto } from './dtos/advisor-screening-request-response.dto';
import { DeclineScreeningRequestDto } from './dtos/decline-screening-request.dto';
import { ReplaceScreeningQuestionsDto } from './dtos/replace-screening-questions.dto';
import { ScreeningQuestionResponseDto } from './dtos/screening-question-response.dto';
import { ScreeningRequestQueryDto } from './dtos/screening-request-query.dto';
import { SCREENING_MESSAGES } from './screening.constants';
import { ScreeningService } from './screening.service';

/**
 * The Advisor's side of screening: the questions on each of their Services, and the requests
 * that come in. Ownership is checked in the service, so another Advisor's rows are a 404.
 */
@ApiTags('Screening')
@Controller('advisors/me')
export class AdvisorScreeningController {
  constructor(private readonly screening: ScreeningService) {}

  @UserHasPermission({ permission: { advisor: ['read'] } })
  @Get('services/:serviceId/screening-questions')
  @ApiGetMany(ScreeningQuestionResponseDto, { name: 'Screening question' })
  findQuestions(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<ScreeningQuestionResponseDto[]> {
    return this.screening.findQuestions(user, serviceId);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Put('services/:serviceId/screening-questions')
  @ResponseMessage(SCREENING_MESSAGES.questionsSaved)
  @ApiGetMany(ScreeningQuestionResponseDto, { name: 'Screening question' })
  replaceQuestions(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: ReplaceScreeningQuestionsDto,
  ): Promise<ScreeningQuestionResponseDto[]> {
    return this.screening.replaceQuestions(user, serviceId, dto);
  }

  @UserHasPermission({ permission: { advisor: ['read'] } })
  @Get('screening-requests')
  @ApiGetPaginated(AdvisorScreeningRequestResponseDto, {
    name: 'Screening request',
  })
  findRequests(
    @CurrentUser() user: SessionUser,
    @Query() query: ScreeningRequestQueryDto,
  ): Promise<PaginatedResult<AdvisorScreeningRequestResponseDto>> {
    return this.screening.findRequests(user, query);
  }

  @UserHasPermission({ permission: { advisor: ['read'] } })
  @Get('screening-requests/:requestId')
  @ApiGetOne(AdvisorScreeningRequestDetailResponseDto, {
    name: 'Screening request',
  })
  findRequest(
    @CurrentUser() user: SessionUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ): Promise<AdvisorScreeningRequestDetailResponseDto> {
    return this.screening.findRequest(user, requestId);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Post('screening-requests/:requestId/accept')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(SCREENING_MESSAGES.accepted)
  @ApiUpdate(AdvisorScreeningRequestResponseDto, { name: 'Screening request' })
  accept(
    @CurrentUser() user: SessionUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ): Promise<AdvisorScreeningRequestResponseDto> {
    return this.screening.accept(user, requestId);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Post('screening-requests/:requestId/decline')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(SCREENING_MESSAGES.declined)
  @ApiUpdate(AdvisorScreeningRequestResponseDto, { name: 'Screening request' })
  decline(
    @CurrentUser() user: SessionUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: DeclineScreeningRequestDto,
  ): Promise<AdvisorScreeningRequestResponseDto> {
    return this.screening.decline(user, requestId, dto);
  }
}
