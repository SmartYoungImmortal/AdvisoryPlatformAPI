import { Module } from '@nestjs/common';
import { AdvisorsController } from './advisors.controller';
import { AdvisorsService } from './advisors.service';
import { AdvisorsRepository } from './advisors.repository';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdvisorsController],
  providers: [AdvisorsService, AdvisorsRepository],
})
export class AdvisorsModule {}
