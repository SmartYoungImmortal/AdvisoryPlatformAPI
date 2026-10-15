import { Module } from '@nestjs/common';
import { PdpaController } from './pdpa.controller';
import { PdpaRepository } from './pdpa.repository';
import { PdpaService } from './pdpa.service';

@Module({
  controllers: [PdpaController],
  providers: [PdpaService, PdpaRepository],
  exports: [PdpaRepository],
})
export class PdpaModule {}
