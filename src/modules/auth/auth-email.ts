import type { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Env } from '@/config/env.schema';
import { ENV_KEYS } from '@/config/env.constants';

export type AuthEmailRequest =
  | { kind: 'verification'; to: string; name: string; url: string }
  | { kind: 'password-reset'; to: string; name: string; url: string };

export interface AuthMailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface AuthMailTransport {
  sendMail(message: AuthMailMessage): Promise<void>;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

function createMessageContent(request: AuthEmailRequest) {
  const name = request.name.trim() || 'there';
  const url = request.url;

  switch (request.kind) {
    case 'verification':
      return {
        subject: 'Verify your Advisory Platform email',
        text: `Hi ${name},\n\nVerify your email address by opening this link. It expires in one hour.\n\n${url}\n\nIf you did not create an account, you can ignore this email.`,
        html: `<p>Hi ${escapeHtml(name)},</p><p>Verify your email address by opening the link below. It expires in one hour.</p><p><a href="${escapeHtml(url)}">Verify email address</a></p><p>If you did not create an account, you can ignore this email.</p>`,
      };
    case 'password-reset':
      return {
        subject: 'Reset your Advisory Platform password',
        text: `Hi ${name},\n\nReset your password by opening this link. It expires in one hour.\n\n${url}\n\nIf you did not request a password reset, you can ignore this email.`,
        html: `<p>Hi ${escapeHtml(name)},</p><p>Reset your password by opening the link below. It expires in one hour.</p><p><a href="${escapeHtml(url)}">Reset password</a></p><p>If you did not request a password reset, you can ignore this email.</p>`,
      };
  }
}

export function createAuthEmailSender({
  from,
  transport,
}: {
  from: string;
  transport: AuthMailTransport;
}): (request: AuthEmailRequest) => Promise<void> {
  return async (request) => {
    const content = createMessageContent(request);
    await transport.sendMail({ from, to: request.to, ...content });
  };
}

export function createSmtpTransport(
  config: ConfigService<Env, true>,
): AuthMailTransport {
  const username = config.get(ENV_KEYS.SMTP_USER, { infer: true });
  const password = config.get(ENV_KEYS.SMTP_PASSWORD, { infer: true });
  const transporter = createTransport({
    host: config.get(ENV_KEYS.SMTP_HOST, { infer: true }) ?? 'localhost',
    port: config.get(ENV_KEYS.SMTP_PORT, { infer: true }),
    secure: config.get(ENV_KEYS.SMTP_SECURE, { infer: true }),
    ...(username && password
      ? { auth: { user: username, pass: password } }
      : {}),
  });

  return {
    sendMail: async (message) => {
      await transporter.sendMail(message);
    },
  };
}
