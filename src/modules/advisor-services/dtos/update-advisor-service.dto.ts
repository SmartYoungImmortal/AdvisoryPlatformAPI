import { PartialType } from '@nestjs/swagger';
import { CreateAdvisorServiceDto } from './create-advisor-service.dto';

export class UpdateAdvisorServiceDto extends PartialType(
  CreateAdvisorServiceDto,
) {}
