import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SessionUser } from '../auth/auth.config';
import { ADVISOR_MESSAGES } from './advisors.constants';
import { AdvisorOwnProfileResponseDto } from './dtos/advisor-own-profile-response.dto';
import { CreateAdvisorProfileDto } from './dtos/create-advisor-profile.dto';
import { UpdateAdvisorProfileDto } from './dtos/update-advisor-profile.dto';
import { AdvisorsRepository } from './advisors.repository';

@Injectable()
export class AdvisorsService {
  constructor(private readonly advisorsRepository: AdvisorsRepository) {}

  async getMe(user: SessionUser): Promise<AdvisorOwnProfileResponseDto> {
    const advisor = await this.advisorsRepository.findByUserId(user.id);
    if (!advisor) {
      throw new NotFoundException(ADVISOR_MESSAGES.notFound);
    }
    return new AdvisorOwnProfileResponseDto(user, advisor);
  }

  async upgrade(
    user: SessionUser,
    dto: CreateAdvisorProfileDto,
  ): Promise<AdvisorOwnProfileResponseDto> {
    const advisor = await this.advisorsRepository.createIfAbsent(user.id, dto);
    if (!advisor) {
      throw new ConflictException(ADVISOR_MESSAGES.alreadyExists);
    }
    return new AdvisorOwnProfileResponseDto(user, advisor);
  }

  async updateMe(
    user: SessionUser,
    dto: UpdateAdvisorProfileDto,
  ): Promise<AdvisorOwnProfileResponseDto> {
    const advisor = await this.advisorsRepository.updateByUserId(user.id, dto);
    if (!advisor) {
      throw new NotFoundException(ADVISOR_MESSAGES.notFound);
    }
    return new AdvisorOwnProfileResponseDto(user, advisor);
  }
}
