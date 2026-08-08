---
tags:
  - plan
  - kmitl
  - advisory
---

# Advisory Platform — Sprint Plan

> **มองไปข้างหน้าอย่างเดียว** — ไม่สรุปว่า sprint ที่ผ่านมาทำอะไร เริ่มจาก sprint ปัจจุบัน
> อัปเดต 6 ส.ค. 2569 · แทนฉบับ 30 ก.ค.
> อ้างอิง: [[Meeting 1-8-2569]], [[Meeting-4-8-2569]], `AdvisoryProposal` (WBS 4.x/5.x),
> `Project Orientation 2569`, ER + API spec
> Owner: Tajdang (backend)

---

## 1. กติกา

| หัวข้อ | ค่าที่ใช้ |
|---|---|
| Sprint length | 1 สัปดาห์ — **พุธ → อังคาร** |
| Sprint ceremony | **พุธ 2 ทุ่ม** — Review + Plan sprint ถัดไป (ไม่เกิน 2 ชม.) |
| Prof meeting | **อังคาร** |
| Capacity | 10 ชม./คน/สัปดาห์ × 4 คน |
| Task management | GitHub Issues (1 task ในเอกสารนี้ = 1 issue) |
| Branch | `main` (prod) ← `UAT` ← `develop` ← `feature/*` · ห้าม commit ลง `main` |
| Test policy | Unit test ทุก push, Integration test ทุก PR, coverage ≥ 80% |
| Code review | ไม่มี — CI คือด่านเดียว ห้าม merge ตอนแดง |
| Stack | NestJS + self-hosted Postgres + Drizzle + better-auth + MinIO + Jitsi + Omise |
| AI features | ยกไป Project 2 ทั้งหมด — Off-Platform Detection ใช้ regex |
| UI | **ไม่ต้องสวย ขอแบบทางการไม่น่าเกลียด** ([[Meeting-4-8-2569]]) · เปลี่ยนแค่ logo |
| ภาษา | ไทยอย่างเดียวก่อน — prof ถามแล้ว ตอบว่า target คนไทย |

**deadline ของวิชาตกวันศุกร์ = วันที่ 3 ของ sprint** (ไม่ใช่วันสุดท้ายเหมือนตอน sprint เป็น เสาร์→ศุกร์)
→ งานที่จะส่งศุกร์ **ต้องเสร็จตั้งแต่ sprint ก่อนหน้า**

---

## 2. Timeline

| Sprint | ช่วงวันที่ | Deadline วิชา | Phase |
|---|---|---|---|
| **S2** | 5–11 ส.ค. | — | **Foundation + Auth** ← *อยู่ตรงนี้* |
| **S3** | 12–18 ส.ค. | **รายงานความคืบหน้า #1** (เลื่อนมา ~14 ส.ค.) | User + Profile |
| **S4** | 19–25 ส.ค. | — | Advisor Discovery |
| **S5** | 26 ส.ค.–1 ก.ย. | **รายงาน #2** (28 ส.ค.) | Booking |
| **S6** | 2–8 ก.ย. | — | Screening + Payment |
| **S7** | 9–15 ก.ย. | — | Chat + Notification |
| **S8** | 16–22 ก.ย. | **#3 + ร่างรายงาน 30%** (18 ก.ย.) | Video Call + File |
| **S9** | 23–29 ก.ย. | — | Off-Platform + Admin + PWA |
| **S10** | 30 ก.ย.–6 ต.ค. | — | **Feature Freeze / Integration** |
| **S11** | 7–13 ต.ค. | **#4 + ร่างรายงาน 60%** (9 ต.ค.) | Functional / Load / Security Test |
| **S12** | 14–20 ต.ค. | — | UAT |
| **S13** | 21–27 ต.ค. | — | Fix + Traceability docs |
| **S14** | 28 ต.ค.–3 พ.ย. | **ส่งรายงาน + สไลด์** (30 ต.ค.) | Report + Slides |
| — | 4–9 พ.ย. | **สอบนำเสนอ** (9 พ.ย.) | ซ้อมนำเสนอ |

**Dev ต้องจบใน S9 (29 ก.ย.)** · S2–S9 = 8 sprint ตรงกับที่ตกลงวันที่ 1 ส.ค.

---

## 3. Module → Sprint (WBS)

| WBS | Module | ชม. | Sprint |
|---|---|---|---|
| 4.1 / 4.2 | Dev environment + CI/CD | 22 | S2 |
| 4.4 | Unit / Integration test setup | 14 | S2 + ทุก sprint |
| 4.6 | Authentication | 16 | S2 |
| 4.5 | User Module | 16 | S3 |
| 4.13 | Advisor Discovery | 14 | S4 |
| 4.7 | Appointment Booking | 20 | S5 |
| 4.12 | Payment | 20 | S6 |
| 4.8 / 4.11 | Chat + Notification | 30 | S7 |
| 4.9 / 4.10 | Video Call + File Storage | 40 | S8 |
| 4.14 | Off-Platform Detection | 20 | S9 |
| 5.2 / 5.3 / 5.4 | Functional / Load / Security test | 30 | S11 |
| 5.1 | UAT | 10 | S12 |
| 5.5 | เอกสาร | 12 | S13–S14 |

Dependency: Auth เป็นฐานของทุกอย่าง → Discovery ก่อน Booking → Booking ก่อน Payment →
Booking ก่อน Video Call (ห้องผูกกับ appointment) → Chat ก่อน Off-Platform Detection

---

## 4. Standing tasks (ทุก sprint)

- [ ] อังคาร — เข้าพบอาจารย์ + จดบันทึกลง vault (คะแนน A.1 ความสม่ำเสมอ 5%)
- [ ] พุธ 2 ทุ่ม — Review + Plan + ตั้ง GitHub Issues
- [ ] เขียน unit test ไปพร้อม feature ไม่ทิ้งไว้ท้าย sprint
- [ ] อัปเดตตาราง Traceability (CR → TC → QR → F → C → T)
- [ ] เก็บ screenshot / ผลทดสอบไว้ใช้ในรายงาน — อย่ารอเก็บย้อนหลัง

**Definition of Done:** merge เข้า `develop` · unit test ผ่าน · CI เขียว ·
SonarQube ไม่มี critical issue · มีหลักฐานเก็บไว้

---

## 5. S2 · 5–11 ส.ค. — Foundation + Auth ← sprint ปัจจุบัน

**Goal:** backend มีโครงที่เดินต่อได้ 8 สัปดาห์ และ login ได้จริง 1 flow

### Backend — Tajdang
- [ ] Scaffold ตาม `CLAUDE.md`: `common/` `config/` `database/` + docker compose (Postgres self-host)
- [ ] `EntityRepository` + TransformInterceptor + AllExceptionsFilter + `@ApiCrud*` + OffsetPaginationDto
- [ ] Drizzle schema จาก ER — 9 ไฟล์ + barrel + migration แรก
- [ ] better-auth: mount handler, SessionGuard, `@Roles` / `@Public` / `@CurrentUser`, **แก้ id เป็น uuid**
- [ ] CI ฝั่ง API: lint + unit test + coverage gate 80%

### Frontend — Copper / Nam / ภาค
- [ ] ขึ้น UI ตาม wireframe (ไม่ต้องสวย — ทางการพอ)
- [ ] แก้ UI library · แก้ภาษาเป็นไทย · เปลี่ยน logo
- [ ] อ่าน API spec ก่อนประชุมพุธ

### เอกสาร — ตอบคำถามอาจารย์จาก [[Meeting-4-8-2569]]
- [ ] **เขียน KYC level 1 / 2 / 3 ให้ครบ** — อาจารย์ถามตรงๆ ว่า verify advisor ยังไง
      บันทึกการประชุมค้างไว้แค่ "Level1 คือ" ยังไม่มีเนื้อ · ต้องมีก่อนรายงาน #1
- [ ] **เตรียมคำตอบ PDPA** — อาจารย์ถาม ยังไม่ได้ตอบ

### ทั้งทีม
- [ ] ประชุมพุธ: เคลียร์คำถามค้าง 3 ข้อ (ดูข้อ 7)
- [ ] สมัคร Omise merchant account
- [ ] POC 2 ชม./ตัว: Omise charge, Jitsi ห้องเดียว, better-auth signup+login

**Exit criteria:** `POST /api/auth/sign-up/email` แล้ว `GET /api/v1/advisors/me`
คืน 401 ตอนไม่มี session และคืน 200 ตอนมี — พิสูจน์ว่า guard + envelope + DB + migration ต่อกันครบ

---

## 6. S3 เป็นต้นไป

### S3 · 12–18 ส.ค. — User Module (รายงาน #1 ~14 ส.ค.)
Onboarding เลือก role · PDPA consent ก่อนสมัคร · User profile API · Advisor profile ·
RBAC + route guard · ลบบัญชีตัวเอง (right to be forgotten) · หน้า Onboarding/Profile ·
test Auth+User ผ่าน 80% · **รวบรวมรายงานความคืบหน้า #1**

### S4 · 19–25 ส.ค. — Advisor Discovery (4.13)
Service CRUD ฝั่ง advisor · Search + filter + pagination · Suggestion rule-based (ไม่ใช่ AI) ·
Home / รายการที่ปรึกษา / รายละเอียดบริการ · หน้าจัดการบริการ ·
**วัดเวลาโหลด < 3 วิ (QR) แล้วเก็บผล**

### S5 · 26 ส.ค.–1 ก.ย. — Booking (4.7) · รายงาน #2 (28 ส.ค.)
Timeslot management · `timestamptz` ทั้งหมด · **no-overlap exclusion constraint ระดับ DB** ·
Booking API + state machine · ปฏิทินเลือกเวลา ·
**Concurrency test: ยิงพร้อมกันต้องสำเร็จแค่ 1 — เก็บผลเป็นหลักฐาน Success Criteria ข้อแรก**

### S6 · 2–8 ก.ย. — Screening + Payment (4.12)
Screening (optional ต่อ service) · Omise charge + 3DS · webhook + idempotency ·
invoice/transaction + sync ภายใน 5 วิ (QR) · booking `confirmed` เมื่อจ่ายสำเร็จ + platform fee ·
test ครอบ: สำเร็จ / ไม่ผ่าน / ค้าง / webhook ช้า / webhook ซ้ำ

### S7 · 9–15 ก.ย. — Chat + Notification (4.8, 4.11)
Chat ผูกกับ appointment/trial · real-time latency < 500ms (QR) · Notification event + ประวัติ ·
หน้าแชท + badge ยังไม่อ่าน · ทางเข้า Trial ฟรีจาก Discovery · **วัด latency เก็บผล**

### S8 · 16–22 ก.ย. — Video Call + File (4.9, 4.10) · #3 + ร่างรายงาน 30%
Deploy Jitsi self-host + domain + TLS · ห้องผูกกับ appointment + JWT ·
จำกัดเวลาเข้าห้อง · File upload/download 50MB + สิทธิ์ต่อ conversation ·
test video: latency < 150ms, packet loss < 5% · **เริ่มเขียนรายงาน — ไม่ใช่เดือนตุลาคม**

### S9 · 23–29 ก.ย. — Off-Platform + Admin + PWA (4.14)
Detection แบบ regex (เบอร์โทร / email / LINE ID) · visibility penalty · Report → admin ·
Admin panel · PWA manifest + service worker · test กันการหลบเลี่ยงพื้นฐาน

**🔒 หลัง S9 = Feature freeze** ฟีเจอร์ไหนไม่เสร็จ → ย้ายไป Project 2 ทันที ไม่ยืด scope

### S10 · 30 ก.ย.–6 ต.ค. — Integration
E2E 2 เส้นทางหลัก · bug bash ทั้งทีม · ดัน coverage ≥ 80% · deploy UAT env + seed demo ·
เตรียม UAT script

### S11 · 7–13 ต.ค. — Testing (5.2–5.4) · #4 + ร่างรายงาน 60%
Functional test ทุก module · Load test 1000 concurrent · Security test (auth, encryption,
PDPA, OWASP) · แก้ตามผล

### S12 · 14–20 ต.ค. — UAT (5.1)
นัดผู้ทดสอบกลุ่มเดิมที่เคยสัมภาษณ์ · รันตาม script · ความพึงพอใจ ≥ 80% ·
flow หลักสำเร็จเองโดยไม่ใช้คู่มือ ≥ 90% · สรุปผล

### S13 · 21–27 ต.ค. — Fix + Traceability
แก้ตามผล UAT · **Traceability CR → TC → QR → F → C → T** · House of Quality ·
Spec QR 5 องค์ประกอบ · Function tree · ตรวจ ER / Use Case + Description / Sequence ·
deploy `UAT` → `main` · **bonus: ขึ้น CE Cloud (ไม่เกิน 5 คะแนน)**

### S14 · 28 ต.ค.–3 พ.ย. — Report + Slides · ส่ง 30 ต.ค.
รายงานฉบับสมบูรณ์ · **ตรวจ format: font / กระดาษ / เลขหน้า** (กระดาษผิด −5, font ผิด −10) ·
ส่งให้อาจารย์ดูก่อน · **ใช้สิทธิ์ให้ผู้ประสานงานตรวจ format ฟรี 1 รอบ** · สไลด์ · ซ้อมให้จบใน 15 นาที

### 4–9 พ.ย. — เตรียมสอบ
ซ้อม 3 รอบจับเวลา · เตรียมตอบ: ทำไมเลือก stack นี้, ER ทำไมออกแบบแบบนี้, กัน overlap ยังไง,
load test 1000 คนยังไง, PDPA จัดการยังไง, **KYC 3 level คืออะไร** ·
อัดวิดีโอ demo สำรองเผื่อเน็ตล่มในห้องสอบ

---

## 7. คำถามค้าง — ต้องเคลียร์ในประชุมพุธ

1. **Service ที่ advisor สร้าง ต้องให้ admin ตรวจก่อน publish หรือไม่** — อาจซ้ำซ้อนกับการ verify
   ตัว advisor อยู่แล้ว ถ้าตอบว่าต้อง จะมีหน้า admin review queue + status badge เพิ่ม
2. **Cloudflare vs self-host ทั้งหมด** — ตอนนี้ frontend deploy ขึ้น Cloudflare Workers
   ซึ่งขัดกับ *"self host ทั้งหมด มีแค่ omise"* · กระทบเรื่อง cookie ข้าม origin ด้วย
3. **`better-auth` branch ใน repo frontend** — DB ย้ายไป backend หมดแล้ว branch นั้นทิ้งได้หรือยัง

---

## 8. ความเสี่ยง

| ความเสี่ยง | ทางรับมือ |
|---|---|
| **POC ทั้ง 3 ยังไม่ได้ทำจริง** — ถ้า Omise/Jitsi/better-auth ตัวใดใช้ไม่ได้ จะรู้ตอน S6/S8 ซึ่งสายไป | ทำ 2 ชม./ตัว ใน S2–S3 ขอแค่คำตอบ ไม่ต้องสวย |
| Omise merchant อนุมัติช้า | สมัครสัปดาห์นี้ · dev ด้วย test key ไปก่อน |
| Jitsi self-host ต้องมี VPS + domain + TLS | ผูกกับคำถามข้อ 2 · ถ้าไม่ชัวร์ใช้ 8x8 hosted ก่อนแล้วค่อยย้าย |
| Coverage 80% ถ้าไล่เก็บย้อนหลัง | ตั้ง gate ใน CI ตั้งแต่ S2 |
| งานเขียนรายงานเลื่อนไปตุลาคม | เริ่มตั้งแต่ S8 · เก็บ screenshot ทุก sprint |
| Off-Platform Detection อยู่ sprint ท้าย ถ้าลากยาวจะกิน S10 | ทำ regex ให้พอผ่านเกณฑ์ · ที่เหลือยกไป Project 2 |

---

## 9. ตัดออกจาก Project 1 (→ Project 2)

- ฟีเจอร์ AI ทุกตัว (จับคู่ด้วย AI, สรุปการปรึกษา, chatbot)
- Off-platform detection แบบ semantic / ML
- Subscription รายเดือน (Project 1 จ่ายต่อครั้ง)
- รีวิว/เรตติ้งแบบละเอียด (มีแค่ดาวพอใช้เรียงผลค้นหา)
- Mobile app native (PWA พอตามข้อเสนอ)
- โอนเงินให้ advisor อัตโนมัติ (บันทึกยอดไว้ก่อน โอนมือ)

---

## 10. Checklist คะแนนที่มักหลุด

- [x] แจ้งหัวข้อบนเว็บไซต์ ce.kmitl.ac.th
- [ ] เข้าพบอาจารย์สม่ำเสมอ + มีบันทึกการเข้าพบ (5 คะแนน)
- [ ] ส่งรายงานความคืบหน้าครบ 4 ครั้ง (ส่งช้า = ไม่ได้คะแนนครั้งนั้นเลย) — #1 เลื่อนมา ~14 ส.ค.
- [x] ER Diagram อย่างน้อย 3NF และไม่ใช้ ID ในตารางที่ไม่ใช่ entity พื้นฐาน
- [ ] Use Case Diagram + **Description** + Sequence Diagram — sequence มีแล้ว **description ยังไม่มี**
- [ ] Traceability + House of Quality + Spec QR — ไม่มีในข้อเสนอเดิม แต่บังคับในบทที่ 3–4
- [ ] format รายงาน: font / กระดาษ / ฉันทลักษณ์
- [ ] ใช้สิทธิ์ให้ผู้ประสานงานตรวจ format ฟรี 1 รอบ
- [ ] ขึ้น CE Cloud + เข้าร่วมกิจกรรมภาควิชา (คะแนนพิเศษไม่เกิน 5)
