import { Module } from '@nestjs/common';
import { AdminAccountsController } from './admin-accounts.controller';
import { AdminAccountsRepository } from './admin-accounts.repository';
import { AdminAccountsService } from './admin-accounts.service';

/**
 * The admin's view of user accounts: two reads the console's list and detail pages need, and
 * the one write better-auth's admin plugin cannot make — see the note on
 * `AdminAccountsController` for what is deliberately left to `/api/auth/admin/*`.
 */
@Module({
  controllers: [AdminAccountsController],
  providers: [AdminAccountsService, AdminAccountsRepository],
})
export class AdminAccountsModule {}
