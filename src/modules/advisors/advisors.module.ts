import { Module } from '@nestjs/common';
import { AdvisorsController } from './advisors.controller';
import { AdvisorsService } from './advisors.service';
import { AdvisorsRepository } from './advisors.repository';

@Module({
  controllers: [AdvisorsController],
  providers: [AdvisorsService, AdvisorsRepository],
})
export class AdvisorsModule {}
