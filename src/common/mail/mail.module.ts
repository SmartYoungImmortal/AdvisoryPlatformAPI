import { Module } from '@nestjs/common';
import { PasswordResetMailer } from './password-reset-mailer.service';

@Module({
  providers: [PasswordResetMailer],
  exports: [PasswordResetMailer],
})
export class MailModule {}
