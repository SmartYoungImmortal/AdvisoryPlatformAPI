# รายงานความคืบหน้า รายวิชา Project 1 ครั้งที่ 4 (ร่าง)

Oct 6, 2026 · Taj Dangkomen · ต้นฉบับ: https://claude.ai/code/artifact/e8518411-bc83-490a-8e5b-c66927c83d21

**ภาควิชาวิศวกรรมคอมพิวเตอร์ คณะวิศวกรรมศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง**

1. หัวข้อโครงงาน (ภาษาอังกฤษ) : Micro-Consultation Platform (2)
2. การดำเนินการมีความคืบหน้า : 50% (ประเมินจากทั้งรายวิชา Project 1 และ Project 2)
3. รายงานความคืบหน้าระหว่าง : วันที่ 17/09/2026 ถึง วันที่ 07/10/2026
4. สรุปความคืบหน้า (โครงงานประเภท Software Development)

| หัวข้อ | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| 1. ศึกษาทบทวนข้อกำหนดที่ควรมีและจำเป็นต้องมี | 80% | 90% | 95% | 95% |  |
| 2. การออกแบบ UX/UI | 60% | 80% | 80% | 85% |  |
| 3. การออกแบบ Use Case Diagram / Class Diagram / Sequence Diagram หรือ Diagram แบบอื่นๆ ที่อธิบายการทำงานของระบบและโครงสร้างโปรแกรม | 30% | 30% | 35% | 35% |  |
| 4. การออกแบบโครงสร้างของระบบ Software Architecture Diagram / System Architecture Diagram | 40% | 40% | 50% | 55% |  |
| 5. ทำงานได้ตามขอกำหนด และทดสอบการทำงาน Unit Testing / Integration Testing หรืออื่นๆ ที่แสดงถึงการทำงานได้ตามขอกำหนด | 10% | 30% | 50% | 60% |  |
| 6. การ Deploy และ Integrate ให้เป็นระบบที่ทำงานได้ตามข้อกำหนด | 30% | 30% | 45% | 55% |  |

## 5. รายละเอียดความคืบหน้าที่เพิ่มเติมจากรายงานครั้งก่อน

### 5.1 การยืนยันตัวตนและการเลื่อนขั้นเป็น Advisor

#### 5.1.1 Advisor ต้องผ่านการอนุมัติจาก Admin ก่อน

ปรับขั้นตอนการเลื่อนขั้นให้ตรงตามข้อตกลงในการประชุมวันที่ 22/08/2569 ว่า Advisor ต้องผ่านการยืนยันว่าเป็นบุคคลจริง การสมัครเป็น Advisor จะสร้างเพียงใบสมัคร ผู้ใช้ยังคงเป็น Advisee จนกว่า Admin จะอนุมัติเอกสารยืนยันตัวตน การอนุมัติจะบันทึกสถานะ VERIFIED และให้สิทธิ์ Advisor ใน transaction เดียวกัน

#### 5.1.2 อัปโหลดเอกสารตาม Onboarding 3 ขั้น

พัฒนา API ให้ตรงกับหน้า Advisor Onboarding ที่ออกแบบไว้

- ขั้นที่ 1: สร้างใบสมัครและโปรไฟล์ Advisor
- ขั้นที่ 2: อัปโหลดรูปบัตรประชาชน (JPG/PNG ไม่เกิน 50 MB) เก็บบน SeaweedFS แบบ private
- ขั้นที่ 3: อัปโหลดเอกสารยืนยันทักษะ (JPG/PNG/PDF) พร้อมผูกทักษะกับ Advisor
- หน้ารอผล: API คืนสถานะ NONE / SUBMITTED / VERIFIED / REJECTED ให้ frontend เลือกหน้าที่ต้องแสดง

หากถูกปฏิเสธ ผู้สมัครส่งเอกสารใหม่ได้ และระบบลบไฟล์เก่าออกจาก storage เพื่อไม่ให้มีสำเนาบัตรประชาชนค้างอยู่ตามหลัก PDPA

#### 5.1.3 ซ่อน Advisor ที่ยังไม่ผ่านการยืนยัน

การค้นหาบริการ หน้าโปรไฟล์สาธารณะ การคำนวณ slot และการจอง แสดงเฉพาะ Advisor ที่ผ่านการยืนยันตัวตนแล้ว โดยใช้เงื่อนไขเดียวกันทุกจุด ทำให้ข้อมูลเก่าที่สร้างก่อนมีกติกานี้ก็ถูกควบคุมด้วย

### 5.2 API สำหรับผู้ดูแลระบบ (Admin Console)

พัฒนา API สำหรับคิวงานของผู้ดูแล 6 โมดูล แต่ละคิวตัดสินได้ครั้งเดียว และป้องกัน Admin สองคนตัดสินพร้อมกัน

| โมดูล | สิ่งที่ Admin ทำได้ |
| --- | --- |
| บัญชีผู้ใช้ | ค้นหา ดูรายละเอียด ระงับและคืนสถานะบัญชี |
| ยืนยันตัวตน Advisor | ดูคิว อนุมัติ หรือปฏิเสธพร้อมเหตุผล |
| เอกสารยืนยันทักษะ | ตรวจและตัดสินเอกสารทีละฉบับ |
| คำร้องคืนเงิน | ดูหลักฐาน อนุมัติหรือปฏิเสธ |
| การโอนเงินให้ Advisor | บันทึกว่าโอนสำเร็จหรือล้มเหลว |
| รายงานและ Off-platform flag | ดูบทสนทนาที่เป็นหลักฐาน และตัดสิน |

เพิ่มคอลัมน์ผู้สร้างและผู้แก้ไขในหมวดหมู่และทักษะ เพื่อให้ตรวจสอบย้อนหลังได้

### 5.3 การค้นหา Advisor สาธารณะ (Advisor Discovery)

พัฒนา API ค้นหา Advisor กรองตามทักษะและคำค้น พร้อมหน้าโปรไฟล์สาธารณะ แสดงเฉพาะ Advisor ที่มีบริการเผยแพร่แล้ว และตอบ 404 กับบัญชีที่ถูกระงับ เพื่อไม่เปิดเผยว่าบัญชีนั้นมีอยู่

### 5.4 Screening (การคัดกรองก่อนจอง)

พัฒนา API ให้ Advisor ตั้งคำถามคัดกรองต่อบริการ Advisee ส่งคำตอบ และ Advisor ตัดสินรับหรือปฏิเสธ พร้อมเชื่อมหน้า Screening ฝั่ง frontend และ dialog ปฏิเสธ งานอยู่ใน branch รอ review ก่อน merge

### 5.5 Payment และ Invoice

พัฒนาการสร้าง invoice ที่รองรับหลายนัดหมายในการชำระครั้งเดียว การเรียกดู invoice และ flow การชำระด้วยบัตรผ่าน Omise แบบ 3D Secure ที่ redirect กลับมายังแอป ทั้งฝั่ง backend และ frontend งานอยู่ใน branch ระหว่างเชื่อมกับ Booking

### 5.6 ข้อมูลตัวอย่างสำหรับ Demo (Seed)

สร้างสคริปต์ seed ที่สร้างบัญชีผ่าน Better Auth จริง และสร้างข้อมูลครบทุกคิวของ Admin เช่น การจอง invoice รีวิว คำร้องคืนเงิน การโอนเงิน รายงาน และเอกสารยืนยันตัวตน รันซ้ำได้โดยไม่เกิดข้อมูลซ้ำ

### 5.7 Performance และ Deployment

- แก้ Docker image ให้ start ได้จริง และเพิ่ม health check ที่ทดสอบการเชื่อมต่อฐานข้อมูล
- ลดการ query ฐานข้อมูลที่ไม่จำเป็นไปยัง Supabase โดยเก็บ session ไว้ใน cookie ที่ลงลายมือชื่อ 5 นาที ลดเวลาตอบกลับทุก request

### 5.8 Frontend

- ทำหน้า Desktop (1440px) ครบทุกหน้าหลัก เช่น Auth, Onboarding, ค้นหา, หน้าบริการ, Chat แบบ 2 ฝั่ง, Checkout, Availability และ Workspace ของ Advisor
- สร้าง API client กลางและเชื่อมต่อ Auth, Chat, Booking, Payment, Profile, Review และ Admin Console กับ backend จริง
- พัฒนา Admin Console ครบทุกคิว พร้อม dashboard ที่นับจาก API จริง และหน้าตรวจเอกสารที่แสดงรูปบัตร
- เพิ่มหน้าเปลี่ยนอีเมล การตอบกลับรีวิว รายการจอง และหน้าสถานะออฟไลน์ 6 หน้า

### 5.9 การทดสอบและคุณภาพซอฟต์แวร์

จำนวนกรณีทดสอบเพิ่มขึ้นทุกชุด และมี E2E Test ใหม่ที่ทดสอบการเลื่อนขั้นเป็น Advisor ตั้งแต่สมัคร อัปโหลด ถูกปฏิเสธ ส่งใหม่ จนถึงได้รับอนุมัติ ผ่าน HTTP และ PostgreSQL จริง

| ชุดทดสอบ | รายงานครั้งที่ 3 | ครั้งนี้ |
| --- | --- | --- |
| Unit Test | 297 | 447 |
| Integration Test (PostgreSQL จริง) | — | 32 |
| E2E Test | — | 51 |

## 6. ปัญหาที่พบและแนวทางแก้ไข

### 6.1 ผู้ใช้เป็น Advisor ได้ทันทีโดยไม่ต้องผ่านการตรวจสอบ

#### 6.1.1 ปัญหา

การเลื่อนขั้นเดิมให้สิทธิ์ Advisor ทันทีที่กดสมัคร ทำให้เปิดบริการและรับจองได้โดยไม่มีเอกสารยืนยันตัวตน ซึ่งขัดกับข้อตกลงของทีมและ UX ที่ออกแบบไว้

#### 6.1.2 แนวทางแก้ไข

แยก "การสมัคร" ออกจาก "การเป็น Advisor" ให้สิทธิ์ Advisor เกิดจากการอนุมัติของ Admin เท่านั้น (หัวข้อ 5.1) และเพิ่ม E2E Test ครอบคลุมทุกขั้นตอน

### 6.2 สิทธิ์อ่านข้อมูลของ Advisor กว้างเกินไป

#### 6.2.1 ปัญหา

ผู้ใช้ทั่วไป (Advisee) ได้สิทธิ์อ่านที่ตั้งใจให้สำหรับการสมัคร แต่สิทธิ์เดียวกันนี้เปิดหน้า Availability, บริการของฉัน และการจองของ Advisor ให้ด้วย นอกจากนี้บัญชี Advisor ในข้อมูลตัวอย่างไม่ได้รับ role จึงแก้ไขอะไรไม่ได้

#### 6.2.2 แนวทางแก้ไข

แยกสิทธิ์การสมัครเป็น resource ใหม่ใน Access Control ของ Better Auth ให้ Advisee ไม่มีสิทธิ์ใดๆ ในพื้นที่ทำงานของ Advisor และแก้ seed ให้กำหนด role ตามสถานะการยืนยันตัวตน

### 6.3 ชื่อไฟล์ภาษาไทยเพี้ยนหลังอัปโหลด

#### 6.3.1 ปัญหา

Library อัปโหลด (Multer) อ่านชื่อไฟล์เป็น Latin-1 ทำให้ชื่อเอกสารภาษาไทย เช่น ใบอนุญาตผู้สอบบัญชี.pdf ถูกบันทึกเป็นตัวอักษรอ่านไม่ออก

#### 6.3.2 แนวทางแก้ไข

แปลงชื่อไฟล์กลับเป็น UTF-8 ก่อนบันทึก และมี test ที่อัปโหลดชื่อไฟล์ภาษาไทยจริง ตอนนี้แก้เฉพาะเอกสารยืนยันทักษะ ไฟล์ใน Chat จะแก้ในรอบถัดไป

### 6.4 การชำระเงินยังไม่ผ่านกติกาการจอง

#### 6.4.1 ปัญหา

การสร้าง invoice สร้างนัดหมายเองโดยตรง จึงข้าม lock ต่อ Advisor การคำนวณ slot และขีดจำกัดรายวันที่โมดูล Booking มีอยู่ และยังไม่เปลี่ยนสถานะนัดหมายหลังชำระเงินสำเร็จ

#### 6.4.2 แนวทางแก้ไข

ให้ Payment เรียก Booking Service แทนการเขียนกติกาซ้ำ และยืนยันนัดหมายผ่าน webhook ของ Omise ไม่พึ่งเพียงการ redirect กลับของ browser อยู่ระหว่างดำเนินการก่อน merge

### 6.5 ยังไม่มี Mail Server และยังเข้าถึง Figma ไม่ได้

#### 6.5.1 ปัญหา

ฟีเจอร์ลืมรหัสผ่าน ยืนยันอีเมล และเปลี่ยนอีเมล ต้องส่งอีเมล แต่ยังไม่ได้ตั้ง mail server นอกจากนี้ฝั่ง backend ยังเข้าถึง Figma ไม่ได้

#### 6.5.2 แนวทางแก้ไข

เลื่อนฟีเจอร์ที่ต้องใช้อีเมลไปรอบถัดไป และใช้หน้าจอในโค้ด frontend เป็นแหล่งอ้างอิง flow แทน Figma ชั่วคราว พร้อมจดคำถามที่ต้องยืนยันกับทีมออกแบบ

## 7. สิ่งที่จะดำเนินการต่อไป (เป้าหมายในการส่งความคืบหน้าครั้งถัดไป)

### 7.1 Backend Modules

#### 7.1.1 Payment ร่วมกับ Booking

เชื่อมการชำระเงินผ่าน Booking Service รองรับการจองหลาย session ในครั้งเดียว ยืนยันนัดหมายด้วย Omise webhook และคืนเงินเมื่อยกเลิก

#### 7.1.2 Screening และ Trial

merge งาน Screening และให้การคำนวณ slot กับการจองตรวจคำตอบที่ได้รับการยอมรับ จากนั้นพัฒนาคำขอ Trial การให้สิทธิ์ Trial และการจอง Trial

#### 7.1.3 การยืนยันตัวตน Advisor ส่วนที่เหลือ

แสดงเอกสารให้ Admin ผ่าน presigned URL เพิ่มการแก้ไขทักษะทั้งชุด และตัดสินใจเรื่องการเก็บเลขบัตรประชาชนแบบเข้ารหัสเพื่อกันบัญชีซ้ำ

#### 7.1.4 Notification

แจ้งเตือนเหตุการณ์สำคัญ เช่น ผลการตรวจสอบ Advisor การจอง การชำระเงิน และคำร้องคืนเงิน

#### 7.1.5 Video Call

ผูกห้องประชุม Jitsi เข้ากับนัดหมาย ให้เข้าได้เฉพาะคู่นัดหมายในช่วงเวลาที่กำหนด

#### 7.1.6 Trust & Safety

ตรวจจับข้อความที่นัดนอกแพลตฟอร์มด้วย regex ให้สร้าง flag อัตโนมัติ และสร้างรายการโอนเงินให้ Advisor 7 วันหลังจบการให้คำปรึกษา

#### 7.1.7 ฟีเจอร์ที่ต้องใช้อีเมล

ตั้ง mail server และทำลืมรหัสผ่าน ยืนยันอีเมล และเปลี่ยนอีเมล พร้อมล็อกบัญชีเมื่อใส่รหัสผิดติดต่อกัน

### 7.2 Frontend

เชื่อมหน้า Advisor Onboarding กับ API ใหม่ และทำหน้า Desktop ของ Service Management, Availability และ Booking ที่ยังเหลือ

### 7.3 การทดสอบ

รักษา Code Coverage ไม่ต่ำกว่า 80% เพิ่ม E2E Test ของ flow จองและชำระเงิน และแก้ test ที่ล้มเหลวหลังลบบัญชี

## Notes for Taj (delete before submitting)

Everything in sections 5–7 comes from the git history of both repos from 17/09 to 06/10 (all branches) and from PR #26. The structure follows report 3.

**Check before you submit**

- [ ] **5.4 Screening and 5.5 Payment aren't merged.** Both are on branches (`feat/screening`, `phuwit/payments-invoices`). The text says so; ask Trin and Phuwit if they want more detail.
- [ ] **5.1 and 6.1–6.3 are PR #26**, which isn't merged yet. Merge it, or write "อยู่ระหว่าง review".
- [ ] **5.8 Frontend** comes from about 60 commits on 19–21/09 by `nsza5221-hub`. I couldn't tell whose account that is.
- [ ] **Test counts in 5.9.** Unit 297 is from report 3. Report 3 gave no integration or E2E count, so those cells show —. One E2E test fails on develop too (old cookie gets 403, not 401, after deleting an account); 7.3 mentions fixing it.
- [ ] **Period end date.** I wrote 07/10/2026. Change it if the course uses a different cut-off.

**Percentages are my estimates. Adjust them.**

| Row | 3 → 4 | Why |
| --- | --- | --- |
| 1 Requirements | 95 → 95 | No new requirement work found |
| 2 UX/UI | 80 → 85 | Desktop 1440 frames for almost every screen |
| 3 Diagrams | 35 → 35 | No new diagrams in either repo |
| 4 Architecture | 50 → 55 | Docker health check, session cache, permission model |
| 5 Features + tests | 50 → 60 | Admin, discovery, onboarding, screening; tests 297 → 447 unit |
| 6 Deploy + integrate | 45 → 55 | Frontend now calls the real API; no deployed environment found |
| Overall | 40 → 50 | |

**If you want more to write:** row 3 is the weakest. A sequence diagram of the advisor onboarding flow (apply → upload → admin approve) would be easy to add from section 5.1.
