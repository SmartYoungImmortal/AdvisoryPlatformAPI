import { StorageModule } from '@/common/storage/storage.module';
import { RefundEvidenceService } from './refund-evidence.service';
import {
  RefundEvidenceController,
  AdminRefundEvidenceController,
} from './refund-evidence.controller';
import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AdminRefundsController } from './admin-refunds.controller';
import { RefundsController } from './refunds.controller';
import { RefundsRepository } from './refunds.repository';
import { RefundsService } from './refunds.service';

@Module({
  imports: [StorageModule, NotificationsModule],
  controllers: [
    RefundsController,
    AdminRefundsController,
    RefundEvidenceController,
    AdminRefundEvidenceController,
  ],
  providers: [RefundsService, RefundsRepository, RefundEvidenceService],
})
export class RefundsModule {}
