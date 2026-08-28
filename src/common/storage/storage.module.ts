import { Module } from '@nestjs/common';
import { SeaweedFsStorageService } from './seaweedfs-storage.service';

@Module({
  providers: [SeaweedFsStorageService],
  exports: [SeaweedFsStorageService],
})
export class StorageModule {}
