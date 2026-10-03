import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiCreate, ApiGetMany } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { CreatePdpaConsentDto } from './dtos/create-pdpa-consent.dto';
import { PdpaConsentResponseDto } from './dtos/pdpa-consent-response.dto';
import { PDPA_MESSAGES } from './pdpa.constants';
import { PdpaService } from './pdpa.service';

/**
 * Consent is always recorded for the session user. There is no route that reads or writes
 * another account's consent, so a consent record cannot be created on someone's behalf.
 */
@ApiTags('PDPA')
@Controller('pdpa-consents')
export class PdpaController {
  constructor(private readonly pdpaService: PdpaService) {}

  @Get()
  @ApiGetMany(PdpaConsentResponseDto, { name: 'PDPA consent' })
  findMine(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<PdpaConsentResponseDto[]> {
    return this.pdpaService.findMine(currentUser.id);
  }

  @Post()
  @ResponseMessage(PDPA_MESSAGES.created)
  @ApiCreate(PdpaConsentResponseDto, { name: 'PDPA consent' })
  recordConsent(
    @CurrentUser() currentUser: SessionUser,
    @Body() dto: CreatePdpaConsentDto,
  ): Promise<PdpaConsentResponseDto> {
    return this.pdpaService.recordConsent(currentUser.id, dto);
  }
}
