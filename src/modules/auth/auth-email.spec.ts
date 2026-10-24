import type { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Env } from '@/config/env.schema';
import {
  createAuthEmailSender,
  createSmtpTransport,
  type AuthMailMessage,
  type AuthMailTransport,
} from './auth-email';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(undefined),
  })),
}));

function config(values: Record<string, string | number | boolean>) {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService<Env, true>;
}

describe('createAuthEmailSender', () => {
  const messages: AuthMailMessage[] = [];
  const transport: AuthMailTransport = {
    sendMail: (message) => {
      messages.push(message);
      return Promise.resolve();
    },
  };

  beforeEach(() => {
    messages.length = 0;
  });

  it('sends a verification link in text and HTML without rendering untrusted names as markup', async () => {
    const sendEmail = createAuthEmailSender({
      from: 'Advisory Platform <no-reply@example.test>',
      transport,
    });

    await sendEmail({
      kind: 'verification',
      to: 'user@example.test',
      name: `<img src="x" onerror='alert(1)'>`,
      url: 'https://app.example.test/verify?token=secret&callbackURL=%2Fhome',
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      from: 'Advisory Platform <no-reply@example.test>',
      to: 'user@example.test',
      subject: 'Verify your Advisory Platform email',
    });
    expect(messages[0].text).toContain(
      'https://app.example.test/verify?token=secret&callbackURL=%2Fhome',
    );
    expect(messages[0].html).toContain(
      '&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;',
    );
    expect(messages[0].html).toContain('token=secret&amp;callbackURL=');
    expect(messages[0].html).not.toContain('<img');
  });

  it('sends a password-reset link and uses a safe greeting when the user has no name', async () => {
    const sendEmail = createAuthEmailSender({
      from: 'Advisory Platform <no-reply@example.test>',
      transport,
    });

    await sendEmail({
      kind: 'password-reset',
      to: 'user@example.test',
      name: '',
      url: 'https://app.example.test/reset?token=secret',
    });

    expect(messages[0]).toMatchObject({
      to: 'user@example.test',
      subject: 'Reset your Advisory Platform password',
    });
    expect(messages[0].text).toContain('Hi there');
    expect(messages[0].text).toContain('expires in one hour');
    expect(messages[0].html).toContain('Reset password');
  });

  it('sends email-change confirmation to the current address and escapes the target', async () => {
    const sendEmail = createAuthEmailSender({
      from: 'Advisory Platform <no-reply@example.test>',
      transport,
    });

    await sendEmail({
      kind: 'change-email-confirmation',
      to: 'current@example.test',
      name: 'User',
      newEmail: '<script@example.test>',
      url: 'https://app.example.test/api/auth/verify-email?token=secret',
    });

    expect(messages[0]).toMatchObject({
      to: 'current@example.test',
      subject: 'Confirm your Advisory Platform email change',
    });
    expect(messages[0].text).toContain('<script@example.test>');
    expect(messages[0].html).toContain('&lt;script@example.test&gt;');
    expect(messages[0].html).not.toContain('<script');
  });

  it('lets the caller handle a failed delivery without logging email content', async () => {
    const sendEmail = createAuthEmailSender({
      from: 'Advisory Platform <no-reply@example.test>',
      transport: {
        sendMail: () => Promise.reject(new Error('SMTP credentials rejected')),
      },
    });

    await expect(
      sendEmail({
        kind: 'verification',
        to: 'user@example.test',
        name: 'User',
        url: 'https://app.example.test/verify?token=secret',
      }),
    ).rejects.toThrow('SMTP credentials rejected');
  });
});

describe('createSmtpTransport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the local SMTP host without authentication when credentials are absent', async () => {
    const mail = createSmtpTransport(
      config({ SMTP_HOST: 'localhost', SMTP_PORT: 1025, SMTP_SECURE: false }),
    );
    const message: AuthMailMessage = {
      from: 'no-reply@example.test',
      to: 'user@example.test',
      subject: 'Subject',
      text: 'Text',
      html: '<p>Text</p>',
    };

    await expect(mail.sendMail(message)).resolves.toBeUndefined();

    expect(createTransport).toHaveBeenCalledWith({
      host: 'localhost',
      port: 1025,
      secure: false,
    });
  });

  it('configures SMTP authentication when both credentials are present', () => {
    createSmtpTransport(
      config({
        SMTP_HOST: 'smtp.example.test',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        SMTP_USER: 'mailer@example.test',
        SMTP_PASSWORD: 'smtp-password',
      }),
    );

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.test',
      port: 587,
      secure: false,
      auth: { user: 'mailer@example.test', pass: 'smtp-password' },
    });
  });
});
