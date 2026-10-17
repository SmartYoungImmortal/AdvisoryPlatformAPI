import {
  createAuthEmailSender,
  type AuthMailMessage,
  type AuthMailTransport,
} from './auth-email';

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
      name: '<img src=x onerror=alert(1)>',
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
    expect(messages[0].html).toContain('&lt;img src=x onerror=alert(1)&gt;');
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
