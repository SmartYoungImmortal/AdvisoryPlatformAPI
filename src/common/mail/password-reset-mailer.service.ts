import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import { ENV_KEYS } from '@/config/env.constants';
import type { Env } from '@/config/env.schema';

@Injectable()
export class PasswordResetMailer {
  private readonly logger = new Logger(PasswordResetMailer.name);
  private readonly transporter: Transporter | undefined;
  private readonly from: string | undefined;

  constructor(config: ConfigService<Env, true>) {
    const smtpUrl = config.get(ENV_KEYS.SMTP_URL, { infer: true });
    const from = config.get(ENV_KEYS.SMTP_FROM, { infer: true });

    if (smtpUrl && from) {
      this.transporter = nodemailer.createTransport(smtpUrl);
      this.from = from;
    }
  }

  get isConfigured(): boolean {
    return this.transporter !== undefined && this.from !== undefined;
  }

  async send(recipient: string, resetUrl: string): Promise<void> {
    if (!this.transporter || !this.from) {
      throw new Error('Password reset email is not configured');
    }

    await this.transporter.sendMail({
      from: this.from,
      to: recipient,
      subject: 'Reset your Advisory Platform password',
      text: `Use this one-time link to reset your password: ${resetUrl}`,
    });
    this.logger.log('Delivered password-reset email');
  }
}
