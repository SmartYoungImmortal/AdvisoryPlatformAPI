# Notifications

What the API sends, to whom and when, and what the web app needs to show it. The code is the
source of truth; this page explains it. Module: `src/modules/notifications`.

## How it works

- A feature creates a notification with `NotificationsService.notify()` after its own change has
  been saved. If the notification fails, the change still stands: every sender catches the error.
- Each notification is saved in **Thai and English**. The list and detail routes return the
  language of the request's `Accept-Language`.
- A notification is sent **once**. Senders only notify from the request that won the guarded write
  (a ruling, a settled payout, the first recorded payment outcome…), so a retry or a second admin
  gets 409 and sends nothing.
- When one is created, the API also:
  - sends a **live signal** to the owner's open apps over Socket.IO: namespace `/notifications`,
    event `notification:new`. The signal carries no text; the app fetches the notification in its
    own language.
  - sends a **Web Push** to the owner's subscribed devices, when VAPID keys are set. The push is in
    Thai and opens the page in `push.constants.ts` (`PUSH_URLS`).

## Routes

All routes need a signed-in user and only ever return the caller's own notifications.

| Route | What it does |
|---|---|
| `GET /notifications?cursor=&limit=` | Newest first, cursor pages (`items`, `nextCursor`, `hasMore`). |
| `GET /notifications/unread-count` | `{ count }` for the bell. |
| `GET /notifications/upcoming-session` | The session that starts within 10 minutes or is in progress, or `null`. Used by the mobile session banner. |
| `GET /notifications/:notificationId` | One notification; 404 for someone else's. |
| `PATCH /notifications/:notificationId/read` | Marks one as read. |
| `PATCH /notifications/read-all` | Marks all as read; returns `{ count }`. |
| `GET /notifications/push/public-key` | The VAPID public key, or nothing when push is not set up. |
| `POST /notifications/push/subscriptions` | Saves this device's push subscription. |
| `DELETE /notifications/push/subscriptions` | Removes it. |

Each notification is `{ id, type, title, content, resourceId, isRead, createdAt }`. `resourceId` is
the id of the record it is about; the `type` says which table that is (see below).

## Types

"Button" is the link under the message on the notification's own page in the web app
(`components/notifications/notifications-data.ts`, `notificationAction`). "None" means the
notification only informs.

### Bookings and sessions

| Type | Who gets it | When | Thai title | Content | `resourceId` | Button |
|---|---|---|---|---|---|---|
| `BOOKING_CONFIRMED` | Advisee | The booking is paid and becomes `BOOKED` | การจองของคุณได้รับการยืนยันแล้ว | Service · date and time | Booking | The booking |
| `BOOKING_RECEIVED` | Advisor | Same moment as above | มีการจองใหม่ | Service · date and time | Booking | Calendar |
| `BOOKING_CANCELLED` | The person who did **not** cancel | A booking is cancelled | นัดหมายถูกยกเลิก | Service · date and time | Booking | None |
| `BOOKING_RESCHEDULED` | Advisor (only the advisee can reschedule) | A booking is moved | นัดหมายถูกเลื่อน | Service · new date and time | The **new** booking | Calendar |
| `SESSION_REMINDER` | Advisee and advisor | 10 minutes before a `BOOKED` session (when its call opens) | เซสชันใกล้เริ่มแล้ว | Service · time | Booking | The booking |

### Payments and money

| Type | Who gets it | When | Thai title | Content | `resourceId` | Button |
|---|---|---|---|---|---|---|
| `PAYMENT_SUCCEEDED` | Advisee | The first read that records a successful charge | ชำระเงินสำเร็จ | Amount | Invoice | Receipt |
| `PAYMENT_FAILED` | Advisee | The first read that records a failed charge: 3-D Secure or the bank app declined it, or a PromptPay QR expired unpaid | ชำระเงินไม่สำเร็จ | Amount · ลองชำระเงินอีกครั้ง | Invoice | Receipt |
| `REFUND_DECIDED` | Advisee who asked | An admin approves or rejects a refund case | คำขอคืนเงินได้รับอนุมัติ / คำขอคืนเงินถูกปฏิเสธ | Approved: the money goes back the way you paid. Rejected: the admin's reason | Invoice | Receipt |
| `PAYOUT_SENT` | Advisor | An admin marks a payout paid | เงินเข้าบัญชีแล้ว | Amount · หลังหักค่าโอน | Payout | Earnings |
| `PAYOUT_FAILED` | Advisor | An admin marks a payout failed | การโอนเงินไม่สำเร็จ | Amount · โปรดตรวจสอบบัญชีรับเงิน | Payout | Earnings |

A card declined **during checkout** does not send `PAYMENT_FAILED`: the advisee sees the error on
the checkout page at that moment, and the invoice can still be paid.

### Screening

| Type | Who gets it | When | Thai title | Content | `resourceId` | Button |
|---|---|---|---|---|---|---|
| `SCREENING_REQUESTED` | Advisor | An advisee sends screening answers | มีคำขอคัดกรองใหม่ | Name ส่งคำตอบคัดกรอง N ข้อ | Screening request | The request |
| `SCREENING_DECIDED` | Advisee | The advisor accepts or declines | อนุมัติคำขอปรึกษาแล้ว / ที่ปรึกษาคนนี้ยังไม่ว่าง | Accepted: advisor's name, "book a time now". Declined: the service name | Service | The service |
| `SCREENING_EXPIRED` | Each advisee whose acceptance expired | The advisor replaces the service's questions | คำถามคัดกรองมีการเปลี่ยนแปลง | Service · ตอบคำถามใหม่ก่อนจอง | Service | The service |

### Reviews, chat and safety

| Type | Who gets it | When | Thai title | Content | `resourceId` | Button |
|---|---|---|---|---|---|---|
| `REVIEW_RECEIVED` | Advisor | An advisee reviews a session | คุณได้รับรีวิวใหม่ | Name ให้ N ดาว | Booking | Reviews |
| `REVIEW_REPLIED` | Advisee | The advisor's **first** reply to their review (editing it sends nothing) | ที่ปรึกษาตอบกลับรีวิวของคุณ | The reply (first 140 characters) | Booking | The booking |
| `NEW_MESSAGE` | Room members who are not looking at the room | A chat message is sent | ข้อความใหม่จาก Name | The message (first 140 characters) | Chat room | The chat |
| `POLICY_WARNING` | The sender of the message | An admin confirms an off-platform flag | คำเตือนจากทีมงาน Advisory | The warning, with penalty points when there are any | None | None |
| `REPORT_RESOLVED` | The reporter | An admin resolves their report | รายงานของคุณได้รับการตรวจสอบแล้ว | Action taken, or no rule broken | Report | None |

`NEW_MESSAGE` keeps **one unread notification per room**: a new message updates it instead of
adding another.

### Accounts and advisors

| Type | Who gets it | When | Thai title | Content | `resourceId` | Button |
|---|---|---|---|---|---|---|
| `WELCOME` | New account | Sign-up (once per account; not pushed) | ยินดีต้อนรับสู่ Advisory | Start by finding an expert | None (advisee) or the advisor's own id | Search, or the advisor profile editor |
| `VERIFICATION_DECIDED` | Applicant | An admin approves or rejects their identity | ยืนยันตัวตนสำเร็จ / ยืนยันตัวตนไม่ผ่าน | Approved: profile published. Rejected: the admin's reason | None | Profile |
| `SKILL_PROOF_DECIDED` | Advisor | An admin reviews a skill document | หลักฐานความเชี่ยวชาญผ่าน / ไม่ผ่านการตรวจสอบ | Skill name (· reason when rejected) | Skill document | Profile |

## Session reminders

`SessionRemindersService` checks every 60 seconds for `BOOKED` sessions that have not started and
start within the next 10 minutes, the moment their call opens (`MEETING.opensMinutesBefore`). It
claims each session by setting
`service_appointments.session_reminder_sent_at` in one `UPDATE … RETURNING`, so a session is
reminded once even with several API instances. The timer does not run in tests
(`NODE_ENV=test`).

On Cloud Run the timer only runs while an instance is awake, so a reminder can be late or missed
when the service is idle. A Cloud Scheduler job calling the API would fix this.

## Adding a type

1. Add it to `notificationTypeEnum` (`src/database/schema/notification.ts`) and generate a
   migration.
2. Add its page to `PUSH_URLS` (`push/push.constants.ts`).
3. Put its Thai and English copy in the sending module's constants file, and call
   `NotificationsService.notify()` after the change is saved, inside `try/catch`.
4. Test that the right person is told, once, and that a failed notification does not undo the
   change.
5. In the web app, add it to `NotificationType`, `notificationAction`, the filter categories and
   the icon map (`components/notifications/notifications-live.tsx`).
6. Add a row to this page.
