import { Module } from '@nestjs/common';
import { StorageModule } from '@/common/storage/storage.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [StorageModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}
