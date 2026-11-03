import type { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Env } from '@/config/env.schema';
import { ENV_KEYS } from '@/config/env.constants';

export type AuthEmailRequest =
  | { kind: 'verification'; to: string; name: string; url: string }
  | { kind: 'password-reset'; to: string; name: string; url: string }
  | {
      kind: 'change-email-confirmation';
      to: string;
      name: string;
      newEmail: string;
      url: string;
    };

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

/**
 * The brand lockup the web app draws, from the same public bucket (its
 * `lib/assets/r2.ts`). 1700x416, so 28px tall is 114 wide.
 */
const LOGO_URL =
  'https://pub-07e53481352743c1826a900d773cb1f7.r2.dev/Logo/Advisory.png';

/** Thai first, for clients without a Thai web font; system faces everywhere else. */
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans Thai','Leelawadee UI',Tahoma,Arial,sans-serif";

/** What changes from one email to the next. Every field is plain text; `layout` escapes it. */
interface EmailParts {
  readonly subject: string;
  readonly title: string;
  readonly intro: string;
  readonly action: string;
  /** The same instruction in English, under the button, for a reader who does not read Thai. */
  readonly english: string;
  /** What to do if the reader did not ask for this, in both languages. */
  readonly note: string;
}

/**
 * One email as mail clients can draw it: tables and inline styles only, since
 * most clients drop `<style>` and ignore flex and grid. The site's look carried
 * over: the logo, a white card on a light grey ground, the title in ink, and
 * the action as the same black capsule the site uses. The address the button
 * opens is printed under it too, for a client that blocks buttons or a reader
 * who would rather paste it.
 */
function layout(
  parts: EmailParts,
  url: string,
): { html: string; text: string } {
  const e = escapeHtml;
  const href = e(url);
  const html = `<!doctype html>
<html lang="th">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(parts.title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<div style="display:none;max-height:0;overflow:hidden;">${e(parts.intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border-radius:16px;">
<tr><td style="padding:36px 36px 0;"><img src="${LOGO_URL}" width="114" height="28" alt="Advisory" style="display:block;border:0;outline:none;"></td></tr>
<tr><td style="padding:28px 36px 0;font-family:${FONT};">
<h1 style="margin:0 0 12px;font-size:22px;line-height:32px;font-weight:600;color:#18181b;">${e(parts.title)}</h1>
<p style="margin:0;font-size:15px;line-height:26px;color:#3f3f46;">${e(parts.intro)}</p>
</td></tr>
<tr><td style="padding:28px 36px 0;"><a href="${href}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-family:${FONT};font-size:15px;line-height:20px;font-weight:600;padding:14px 28px;border-radius:999px;">${e(parts.action)}</a></td></tr>
<tr><td style="padding:16px 36px 0;font-family:${FONT};font-size:13px;line-height:20px;color:#71717a;">${e(parts.english)}</td></tr>
<tr><td style="padding:28px 36px 0;"><div style="border-top:1px solid #e4e4e7;font-size:0;line-height:0;">&nbsp;</div></td></tr>
<tr><td style="padding:20px 36px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#71717a;">ปุ่มกดไม่ได้? เปิดลิงก์นี้ · Button not working? Open this link:<br><a href="${href}" style="color:#2563eb;word-break:break-all;">${href}</a></td></tr>
<tr><td style="padding:16px 36px 36px;font-family:${FONT};font-size:12px;line-height:18px;color:#71717a;">${e(parts.note)}</td></tr>
</table>
<p style="margin:20px 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:#a1a1aa;">Advisory Platform · อีเมลนี้ส่งจากระบบอัตโนมัติ ตอบกลับไม่ได้</p>
</td></tr>
</table>
</body>
</html>`;
  const text = `${parts.title}\n\n${parts.intro}\n\n${parts.action}: ${url}\n\n${parts.english}\n\n${parts.note}\n\nAdvisory Platform`;
  return { html, text };
}

function createMessageContent(request: AuthEmailRequest) {
  const name = request.name.trim();
  const hello = name ? `สวัสดี ${name}` : 'สวัสดี';

  let parts: EmailParts;
  switch (request.kind) {
    case 'verification':
      parts = {
        subject: 'ยืนยันอีเมลของคุณ | Advisory Platform',
        title: 'ยืนยันอีเมลของคุณ',
        intro: `${hello} กดปุ่มด้านล่างเพื่อยืนยันว่าอีเมลนี้เป็นของคุณ ลิงก์ใช้ได้ภายใน 1 ชั่วโมง`,
        action: 'ยืนยันอีเมล',
        english:
          'Verify your email address with the button above. The link expires in one hour.',
        note: 'ถ้าคุณไม่ได้สมัครบัญชีนี้ ไม่ต้องทำอะไร · If you did not create an account, you can ignore this email.',
      };
      break;
    case 'password-reset':
      parts = {
        subject: 'ตั้งรหัสผ่านใหม่ | Advisory Platform',
        title: 'ตั้งรหัสผ่านใหม่',
        intro: `${hello} มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีนี้ กดปุ่มด้านล่างเพื่อตั้งรหัสใหม่ ลิงก์ใช้ได้ภายใน 1 ชั่วโมง`,
        action: 'ตั้งรหัสผ่านใหม่',
        english:
          'Reset your password with the button above. The link expires in one hour.',
        note: 'ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ · If you did not ask for this, ignore this email; your password stays the same.',
      };
      break;
    case 'change-email-confirmation':
      parts = {
        subject: 'ยืนยันการเปลี่ยนอีเมล | Advisory Platform',
        title: 'ยืนยันการเปลี่ยนอีเมล',
        intro: `${hello} มีคำขอเปลี่ยนอีเมลของบัญชีนี้เป็น ${request.newEmail} กดปุ่มด้านล่างเพื่อยืนยัน ลิงก์ใช้ได้ภายใน 1 ชั่วโมง`,
        action: 'ยืนยันการเปลี่ยนอีเมล',
        english: `Confirm changing this account's email to ${request.newEmail} with the button above. The link expires in one hour.`,
        note: 'ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร อีเมลเดิมยังใช้ได้ · If you did not ask for this, ignore this email; your email stays the same.',
      };
      break;
  }
  return { subject: parts.subject, ...layout(parts, request.url) };
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
