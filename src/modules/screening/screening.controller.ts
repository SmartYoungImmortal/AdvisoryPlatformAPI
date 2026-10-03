import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiCreate, ApiGetOne } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ScreeningRequestResponseDto } from './dtos/screening-request-response.dto';
import { ServiceScreeningResponseDto } from './dtos/service-screening-response.dto';
import { SubmitScreeningAnswersDto } from './dtos/submit-screening-answers.dto';
import { SCREENING_MESSAGES } from './screening.constants';
import { ScreeningService } from './screening.service';

/** The Advisee's side: read a Service's questions and their own status, then answer. */
@ApiTags('Screening')
@Controller('services/:serviceId')
export class ScreeningController {
  constructor(private readonly screening: ScreeningService) {}

  @Get('screening')
  @ApiGetOne(ServiceScreeningResponseDto, { name: 'Service screening' })
  findForService(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<ServiceScreeningResponseDto> {
    return this.screening.findForService(user, serviceId);
  }

  @Post('screening-requests')
  @ResponseMessage(SCREENING_MESSAGES.submitted)
  @ApiCreate(ScreeningRequestResponseDto, { name: 'Screening request' })
  submit(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: SubmitScreeningAnswersDto,
  ): Promise<ScreeningRequestResponseDto> {
    return this.screening.submit(user, serviceId, dto);
  }
}
