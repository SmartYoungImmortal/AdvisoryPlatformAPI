import { Injectable } from '@nestjs/common';
import { SessionUser } from '../auth/auth.config';
import { AdvisorMeResponseDto } from './dtos/advisor-me-response.dto';
import { AdvisorsRepository } from './advisors.repository';

@Injectable()
export class AdvisorsService {
  constructor(private readonly advisorsRepository: AdvisorsRepository) {}

  async getMe(user: SessionUser): Promise<AdvisorMeResponseDto> {
    const advisor = await this.advisorsRepository.findByUserId(user.id);
    return new AdvisorMeResponseDto(user, Boolean(advisor));
  }
}
