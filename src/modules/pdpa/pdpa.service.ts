import { Injectable } from '@nestjs/common';
import { CreatePdpaConsentDto } from './dtos/create-pdpa-consent.dto';
import { PdpaConsentResponseDto } from './dtos/pdpa-consent-response.dto';
import { PdpaRepository } from './pdpa.repository';

@Injectable()
export class PdpaService {
  constructor(private readonly pdpaRepository: PdpaRepository) {}

  async findMine(userId: string): Promise<PdpaConsentResponseDto[]> {
    const consents = await this.pdpaRepository.findForUser(userId);
    return consents.map((consent) => new PdpaConsentResponseDto(consent));
  }

  async recordConsent(
    userId: string,
    dto: CreatePdpaConsentDto,
  ): Promise<PdpaConsentResponseDto> {
    const consent = await this.pdpaRepository.recordConsent(
      userId,
      dto.policyVersion,
    );
    return new PdpaConsentResponseDto(consent);
  }
}
