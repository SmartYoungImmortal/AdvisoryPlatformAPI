import type { CatalogueAdvisor } from './types';

/**
 * Part C of the demo catalogue: careers, learning, wellbeing, tech and
 * creative work. Every photograph is a Pexels image checked to load and to
 * show what the service is about; no ID appears twice.
 */

const CAREERS = 'การศึกษาและอาชีพ';
const WELLBEING = 'สุขภาพใจ';
const TECH = 'เทคโนโลยีและงานดิจิทัล';
const LANGUAGES = 'ภาษาและการสอบ';
const ABROAD = 'เรียนต่อและย้ายประเทศ';
const HEALTH = 'สุขภาพและโภชนาการ';
const DESIGN = 'ออกแบบและคอนเทนต์';

/** A Pexels photograph at service-gallery width. */
const photo = (id: number): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

/** A Pexels photograph cropped square for an advisor's portrait. */
const portrait = (id: number): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;

export const PART_C: readonly CatalogueAdvisor[] = [
  // ── Careers ────────────────────────────────────────────────────────────
  {
    email: 'life.chanida.p@advisory.demo',
    displayName: 'ชนิดา พึ่งทอง',
    fullName: 'ชนิดา พึ่งทอง',
    portrait: portrait(7845470),
    headline: 'โค้ชหางานและอดีตหัวหน้าทีมสรรหาบุคลากร',
    bio: 'ทำงานสายสรรหาบุคลากรมา 12 ปี ล่าสุดเป็นหัวหน้าทีม Talent Acquisition ของบริษัทสินค้าอุปโภคบริโภคข้ามชาติ อ่านเรซูเม่มาแล้วหลายหมื่นฉบับ จึงรู้ว่าอะไรทำให้ได้รับเรียกสัมภาษณ์และอะไรทำให้ถูกข้าม ปัจจุบันช่วยคนทำงาน 3–10 ปีที่อยากขยับไปบริษัทที่ใหญ่ขึ้นหรือตำแหน่งที่สูงขึ้น โดยทำงานจากเอกสารจริงของคุณ ไม่ใช่เทมเพลตสำเร็จรูป',
    en: {
      headline: 'Job Search Coach and Former Head of Recruitment',
      bio: 'Spent 12 years in recruitment, most recently leading Talent Acquisition at a multinational consumer goods company. Having read tens of thousands of résumés, she knows what gets someone an interview and what gets them passed over. She now helps people three to ten years into their careers move to a bigger company or a more senior role, working from your real documents rather than a template.',
    },
    services: [
      {
        name: 'ปรับเรซูเม่ให้ผ่านระบบคัดกรอง ATS',
        description:
          'สำหรับคนที่ส่งใบสมัครไปหลายที่แต่ไม่มีใครติดต่อกลับ ส่งเรซูเม่และประกาศงานที่สนใจมาก่อนนัด แล้วไล่ดูกันว่าคำสำคัญ โครงสร้าง และวิธีเล่าผลงานตรงกับที่ระบบและ HR มองหาหรือยัง จบแล้วได้เรซูเม่ฉบับแก้ที่เอาไปยื่นต่อได้ทันที',
        en: {
          name: 'Get Your Résumé Past ATS Screening',
          description:
            "For anyone who has sent out applications and heard nothing back. Send your résumé and the job ads you're targeting before the session, and we check whether your keywords, structure and the way you describe results match what the system and HR look for. You leave with a revised résumé you can send straight away.",
        },
        category: CAREERS,
        priceBaht: 690,
        durationMinutes: 30,
        photos: [photo(5989941), photo(3760072)],
        packages: [
          {
            name: 'ตรวจเรซูเม่',
            description: 'ชี้จุดที่ทำให้เรซูเม่ตกรอบ พร้อมรายการสิ่งที่ต้องแก้',
            en: { name: 'Résumé Check', description: 'We find what is getting your résumé rejected and give you a list of fixes.' },
            durationMinutes: 30,
            priceBaht: 690,
          },
          {
            name: 'ปรับเรซูเม่ทั้งฉบับ',
            description: 'แก้ไปด้วยกันระหว่างนัดทีละส่วน ให้ตรงกับตำแหน่งที่จะสมัคร',
            en: { name: 'Full Résumé Rewrite', description: "We rework it together, section by section, for the role you're applying to." },
            durationMinutes: 60,
            priceBaht: 1290,
          },
          {
            name: 'เรซูเม่สองภาษาพร้อม Cover Letter',
            description: 'ทำทั้งฉบับภาษาไทยและภาษาอังกฤษ และร่างจดหมายสมัครงานหนึ่งฉบับ',
            en: { name: 'Bilingual Résumé and Cover Letter', description: 'Thai and English versions of your résumé, plus one draft cover letter.' },
            durationMinutes: 90,
            priceBaht: 1990,
          },
        ],
      },
      {
        name: 'ทำโปรไฟล์ LinkedIn ให้ recruiter ทัก',
        description:
          'ปรับหัวข้อ สรุปตัวตน และประสบการณ์บน LinkedIn ให้คนที่หาผู้สมัครค้นเจอและอยากทักมา คุยกันด้วยว่าควรโพสต์หรือคอมเมนต์แบบไหนให้โปรไฟล์ดูมีความเคลื่อนไหว โดยไม่ต้องกลายเป็นอินฟลูเอนเซอร์',
        en: {
          name: 'Get Recruiters to Message You on LinkedIn',
          description:
            'We rework your LinkedIn headline, summary and experience so the people sourcing candidates find you and want to reach out. We also cover what kind of posts or comments keep your profile active, without you having to become an influencer.',
        },
        category: CAREERS,
        priceBaht: 590,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(1083792), photo(15406295)],
        packages: [
          {
            name: 'รีวิวโปรไฟล์',
            description: 'ดูโปรไฟล์ปัจจุบันแล้วบอกว่าควรแก้ส่วนไหนก่อน',
            en: { name: 'Profile Review', description: 'We go over your current profile and tell you what to fix first.' },
            durationMinutes: 30,
            priceBaht: 590,
          },
          {
            name: 'เขียนโปรไฟล์ใหม่',
            description: 'เขียนหัวข้อและส่วน About ใหม่ด้วยกัน พร้อมคำค้นที่ควรใส่',
            en: { name: 'Profile Rewrite', description: 'We rewrite your headline and About section together, with the search terms you should include.' },
            durationMinutes: 60,
            priceBaht: 1190,
          },
        ],
      },
      {
        name: 'ต่อรองเงินเดือนก่อนรับข้อเสนองาน',
        description:
          'ได้ข้อเสนอแล้วแต่ไม่แน่ใจว่าตัวเลขสมเหตุสมผลไหม ดูฐานเงินเดือนของตำแหน่งนั้นในตลาด สวัสดิการที่ต่อรองได้ และเตรียมประโยคที่จะใช้คุยกับ HR จริง เพื่อให้กล้าขอโดยไม่เสียข้อเสนอ',
        en: {
          name: 'Negotiate Your Salary Before You Accept',
          description:
            "You have an offer but aren't sure the number is fair. We look at market pay for the role, which benefits are negotiable, and prepare the actual lines you'll use with HR, so you can ask for more without losing the offer.",
        },
        category: CAREERS,
        priceBaht: 790,
        durationMinutes: 30,
        photos: [photo(7964253), photo(4175028)],
        packages: [
          {
            name: 'เตรียมตัวเลข',
            description: 'ประเมินข้อเสนอที่ได้และกำหนดตัวเลขที่ควรขอ',
            en: { name: 'Set Your Number', description: 'We assess the offer and settle the figure you should ask for.' },
            durationMinutes: 30,
            priceBaht: 790,
          },
          {
            name: 'ซ้อมต่อรองเต็มรอบ',
            description: 'เตรียมตัวเลขแล้วซ้อมคุยจริง โดยโค้ชรับบทเป็นฝ่าย HR',
            en: { name: 'Full Negotiation Rehearsal', description: 'We set your number, then rehearse the conversation with the coach playing HR.' },
            durationMinutes: 60,
            priceBaht: 1490,
          },
        ],
      },
      {
        name: 'ซ้อมสัมภาษณ์งานรอบผู้บริหาร',
        description:
          'สำหรับคนที่ผ่านรอบแรกแล้วและกำลังจะเจอผู้บริหารหรือ Hiring Manager ซ้อมตอบคำถามเชิงพฤติกรรมและคำถามวัดวิธีคิด แล้วรับฟีดแบ็กตรงๆ ว่าคำตอบไหนยังไม่น่าเชื่อ และควรเล่าใหม่อย่างไร',
        en: {
          name: 'Practise for a Final-Round Interview',
          description:
            "For candidates who've cleared the first round and are about to meet a senior leader or the hiring manager. We practise behavioural and judgement questions, then you get straight feedback on which answers aren't convincing yet and how to tell them better.",
        },
        category: CAREERS,
        priceBaht: 990,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(5439152), photo(18848927)],
        packages: [
          {
            name: 'ซ้อมหนึ่งรอบ',
            description: 'สัมภาษณ์จำลองหนึ่งรอบพร้อมฟีดแบ็กท้ายนัด',
            en: { name: 'One Mock Round', description: 'One mock interview with feedback at the end.' },
            durationMinutes: 45,
            priceBaht: 990,
          },
          {
            name: 'ซ้อมสองรอบพร้อมแก้คำตอบ',
            description: 'ซ้อม แก้ แล้วซ้อมซ้ำ จนคำตอบหลักแน่นขึ้น',
            en: { name: 'Two Rounds With Rework', description: 'Practise, rework, and practise again until your key answers hold up.' },
            durationMinutes: 90,
            priceBaht: 1890,
          },
        ],
      },
      {
        name: 'วางแผนหางานใหม่ให้ได้ภายใน 90 วัน',
        description:
          'สำหรับคนที่อยากเปลี่ยนงานแต่หาแบบไม่มีทิศทางมาหลายเดือน กำหนดตำแหน่งและบริษัทเป้าหมาย ช่องทางที่ควรใช้ และตารางรายสัปดาห์ที่ทำได้จริงควบคู่กับงานประจำ',
        en: {
          name: 'A 90-Day Job Search Plan',
          description:
            "For people who've been job hunting without direction for months. We set your target roles and companies, the channels worth using, and a weekly schedule you can keep alongside your current job.",
        },
        category: CAREERS,
        priceBaht: 1190,
        durationMinutes: 60,
        photos: [photo(7034449), photo(32171334)],
        packages: [
          {
            name: 'วางแผนหางาน',
            description: 'ได้รายชื่อบริษัทเป้าหมายและตารางรายสัปดาห์สำหรับ 90 วัน',
            en: { name: 'Job Search Plan', description: 'A list of target companies and a weekly schedule for 90 days.' },
            durationMinutes: 60,
            priceBaht: 1190,
          },
          {
            name: 'วางแผนพร้อมปรับเรซูเม่',
            description: 'วางแผนเหมือนกัน และปรับเรซูเม่ให้ตรงกับเป้าหมายใหม่ในนัดเดียว',
            en: { name: 'Plan Plus Résumé Update', description: 'The same plan, plus a résumé update for your new targets in the same session.' },
            durationMinutes: 90,
            priceBaht: 1790,
          },
        ],
      },
    ],
  },
  {
    email: 'life.kittiphat.r@advisory.demo',
    displayName: 'กิตติพัฒน์ เรืองศรี',
    fullName: 'กิตติพัฒน์ เรืองศรี',
    portrait: portrait(7964414),
    headline: 'โค้ชอาชีพสำหรับคนทำงานวัยกลางสายงาน',
    bio: 'อดีตผู้จัดการสาขาธนาคารที่เปลี่ยนสายมาทำงานพัฒนาบุคลากรตอนอายุ 38 ปัจจุบันเป็นโค้ชที่ได้รับการรับรองจาก ICF ระดับ PCC ทำงานกับคนอายุ 35–50 ที่รู้สึกว่างานเดิมไปต่อไม่ได้ หรือกำลังจะได้เป็นหัวหน้าครั้งแรก ชวนคิดด้วยคำถามมากกว่าให้คำตอบสำเร็จรูป และจบทุกนัดด้วยก้าวถัดไปที่ทำได้จริง',
    en: {
      headline: 'Career Coach for Mid-Career Professionals',
      bio: 'A former bank branch manager who moved into people development at 38, now an ICF-certified coach at PCC level. He works with people aged 35 to 50 who feel stuck in their current job, or who are about to lead a team for the first time. He works through questions rather than ready-made answers, and every session ends with a next step you can actually take.',
    },
    services: [
      {
        name: 'เปลี่ยนสายงานหลังอายุ 35 โดยไม่เริ่มจากศูนย์',
        description:
          'ไล่ดูว่าทักษะและประสบการณ์ที่มีอยู่พาไปสายไหนได้บ้าง สายไหนต้องลงทุนเรียนเพิ่ม และสายไหนรายได้จะลดลงในช่วงแรก จบด้วยเส้นทางสองถึงสามทางที่วางเทียบกันได้ชัด',
        en: {
          name: 'Change Careers After 35 Without Starting From Zero',
          description:
            'We map where your existing skills and experience can take you, which paths need more study, and which would mean a pay cut at first. You leave with two or three routes laid out side by side.',
        },
        category: CAREERS,
        priceBaht: 1000,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(19905189), photo(733856)],
        packages: [
          {
            name: 'คุยสำรวจทางเลือก',
            description: 'คุยเพื่อแยกให้ชัดว่าอยากออกจากอะไร และอยากไปหาอะไร',
            en: { name: 'Explore Your Options', description: "A conversation to separate what you want to leave behind from what you're looking for." },
            durationMinutes: 45,
            priceBaht: 1000,
          },
          {
            name: 'วางแผนเปลี่ยนสายงาน',
            description: 'เทียบเส้นทางที่เป็นไปได้ พร้อมแผนหกเดือนแรก',
            en: { name: 'Career Change Plan', description: 'We compare the realistic routes and draw up the first six months.' },
            durationMinutes: 90,
            priceBaht: 2200,
          },
        ],
      },
      {
        name: 'เตรียมตัวเป็นหัวหน้าทีมครั้งแรก',
        description:
          'สำหรับคนที่เพิ่งได้เลื่อนตำแหน่งหรือกำลังจะได้ คุยเรื่องการวางตัวกับเพื่อนร่วมงานเก่าที่กลายเป็นลูกทีม การมอบหมายงาน และการคุยเรื่องผลงานที่ไม่ดี ให้เริ่มบทบาทใหม่ได้โดยไม่ต้องลองผิดลองถูกเองทั้งหมด',
        en: {
          name: 'Get Ready to Lead a Team for the First Time',
          description:
            'For anyone newly promoted or about to be. We talk about handling former peers who now report to you, delegating, and having conversations about poor performance, so you can start the new role without learning everything the hard way.',
        },
        category: CAREERS,
        priceBaht: 800,
        durationMinutes: 30,
        photos: [photo(7651804), photo(7988214)],
        packages: [
          {
            name: 'ปรึกษาเรื่องเร่งด่วน',
            description: 'คุยเฉพาะสถานการณ์ที่กำลังเจออยู่ตอนนี้',
            en: { name: 'Urgent Question', description: "We focus on the one situation you're facing right now." },
            durationMinutes: 30,
            priceBaht: 800,
          },
          {
            name: 'วางแนวทางการเป็นหัวหน้า',
            description: 'วางหลักการทำงานกับทีมและรูปแบบการคุยตัวต่อตัว',
            en: { name: 'Leadership Groundwork', description: 'We set how you will work with the team and how your one-to-ones will run.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'แผน 90 วันแรก',
            description: 'วางสิ่งที่ต้องทำในสามเดือนแรกของตำแหน่งใหม่',
            en: { name: 'First 90 Days Plan', description: 'We plan what to do in your first three months in the role.' },
            durationMinutes: 90,
            priceBaht: 2100,
          },
        ],
      },
      {
        name: 'กลับเข้าทำงานหลังหยุดไปดูแลครอบครัว',
        description:
          'สำหรับคนที่หยุดงานไปเลี้ยงลูกหรือดูแลพ่อแม่ตั้งแต่หนึ่งปีขึ้นไป คุยเรื่องการเล่าช่วงที่หายไปในเรซูเม่และตอนสัมภาษณ์ งานที่ยืดหยุ่นพอกับภาระที่บ้าน และวิธีเรียกความมั่นใจกลับมา',
        en: {
          name: 'Return to Work After a Family Break',
          description:
            "For people who've spent a year or more away from work raising children or caring for parents. We cover how to explain the gap on your résumé and in interviews, which jobs are flexible enough for your commitments at home, and how to get your confidence back.",
        },
        category: CAREERS,
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(4079281), photo(7282818)],
        packages: [
          {
            name: 'คุยวางทิศทาง',
            description: 'ดูว่างานแบบไหนเหมาะกับช่วงชีวิตตอนนี้',
            en: { name: 'Find Your Direction', description: 'We work out what kind of job fits this stage of your life.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'วางแผนกลับเข้างาน',
            description: 'วางแผนพร้อมเรียบเรียงวิธีเล่าช่วงที่หยุดงานไป',
            en: { name: 'Return-to-Work Plan', description: 'A full plan, including how to talk about your time away.' },
            durationMinutes: 90,
            priceBaht: 1900,
          },
        ],
      },
      {
        name: 'ตัดสินใจเลือกระหว่างสองข้อเสนองาน',
        description:
          'ได้ข้อเสนอสองที่พร้อมกัน หรือต้องเลือกระหว่างที่ใหม่กับข้อเสนอให้อยู่ต่อ วางเกณฑ์ที่สำคัญกับคุณจริง แล้วเทียบทีละข้อทั้งเงิน เนื้องาน หัวหน้า และโอกาสในอีกสามปีข้างหน้า',
        en: {
          name: 'Choose Between Two Job Offers',
          description:
            'Two offers at once, or a new job against a counter-offer to stay. We set the criteria that really matter to you, then compare each option point by point: pay, the work itself, the manager, and where it leads in three years.',
        },
        category: CAREERS,
        priceBaht: 700,
        durationMinutes: 30,
        photos: [photo(5668859), photo(7979604)],
        packages: [
          {
            name: 'เทียบเร็ว',
            description: 'เทียบสองข้อเสนอจากเกณฑ์หลักที่สำคัญที่สุด',
            en: { name: 'Quick Comparison', description: 'We compare both offers on the criteria that matter most.' },
            durationMinutes: 30,
            priceBaht: 700,
          },
          {
            name: 'ตัดสินใจอย่างละเอียด',
            description: 'เทียบรอบด้าน พร้อมคำถามที่ควรถามบริษัทก่อนตอบรับ',
            en: { name: 'Full Decision Session', description: 'A thorough comparison, plus the questions to ask each company before you say yes.' },
            durationMinutes: 60,
            priceBaht: 1300,
          },
        ],
      },
    ],
  },
  {
    email: 'life.paweena.s@advisory.demo',
    displayName: 'ปวีณา ศักดิ์ดี',
    fullName: 'ปวีณา ศักดิ์ดี',
    portrait: portrait(10228177),
    headline: 'ที่ปรึกษาเด็กจบใหม่และการเข้ามหาวิทยาลัย',
    bio: 'เคยเป็นเจ้าหน้าที่สรรหาโครงการ Management Trainee ของเครือบริษัทค้าปลีกรายใหญ่ 5 ปี และเป็นพี่เลี้ยงแนะแนวให้น้องมัธยมปลายที่ยื่น TCAS มาตั้งแต่สมัยเรียนมหาวิทยาลัย ถนัดช่วยคนที่ยังไม่รู้ว่าตัวเองเหมาะกับอะไร ให้เห็นทางเลือกชัดขึ้นจากสิ่งที่เคยทำมาจริง',
    en: {
      headline: 'Advisor for New Graduates and University Admissions',
      bio: "Spent five years recruiting for the management trainee programme of a major retail group, and has mentored high-school students through TCAS since her own university days. She's good at helping people who don't yet know what suits them see their options more clearly, based on what they have actually done.",
    },
    services: [
      {
        name: 'หางานแรกหลังเรียนจบ',
        description:
          'สำหรับน้องที่เพิ่งจบหรือกำลังจะจบ และยังไม่รู้จะเริ่มสมัครตรงไหน คุยกันว่าสายงานไหนรับเด็กจบใหม่ ควรสมัครที่ไหนก่อน และเรซูเม่ที่ยังไม่มีประสบการณ์ทำงานควรเล่าอะไร',
        en: {
          name: 'Land Your First Job After Graduation',
          description:
            "For recent or soon-to-be graduates who don't know where to start applying. We talk about which fields hire new graduates, where to apply first, and what to put on a résumé when you don't have work experience yet.",
        },
        category: CAREERS,
        priceBaht: 450,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(4458386), photo(3855619)],
        packages: [
          {
            name: 'คุยเริ่มต้น',
            description: 'ดูภาพรวมสายงานและที่ที่ควรเริ่มสมัคร',
            en: { name: 'Getting Started', description: 'An overview of the fields open to you and where to start applying.' },
            durationMinutes: 30,
            priceBaht: 450,
          },
          {
            name: 'วางแผนหางานพร้อมดูเรซูเม่',
            description: 'วางแผนการสมัครและปรับเรซูเม่ฉบับแรกไปด้วยกัน',
            en: { name: 'Plan and Résumé', description: 'We plan your applications and shape your first résumé together.' },
            durationMinutes: 60,
            priceBaht: 890,
          },
        ],
      },
      {
        name: 'เลือกคณะและมหาวิทยาลัยให้ตรงกับตัวเอง',
        description:
          'สำหรับน้องมัธยมปลายและผู้ปกครองที่ยังเลือกไม่ได้ ดูจากวิชาที่ถนัด กิจกรรมที่เคยทำ และงานที่อยากทำในอนาคต แล้วไล่ดูว่าคณะไหนเปิดรับรอบไหน จบด้วยรายชื่อคณะที่ควรยื่นเรียงตามลำดับ',
        en: {
          name: 'Choose the Right Faculty and University',
          description:
            "For high-school students and parents who can't decide. We look at the subjects you're strong in, the activities you've done and the work you'd like to do, then check which faculties admit in which TCAS round. You leave with a ranked shortlist to apply to.",
        },
        category: CAREERS,
        priceBaht: 650,
        durationMinutes: 45,
        photos: [photo(7683734), photo(31666032)],
        packages: [
          {
            name: 'คุยกับน้อง',
            description: 'คุยกับนักเรียนเพื่อหาคณะที่น่าสนใจ',
            en: { name: 'Student Session', description: 'A conversation with the student to find faculties worth considering.' },
            durationMinutes: 45,
            priceBaht: 650,
          },
          {
            name: 'คุยพร้อมผู้ปกครอง',
            description: 'คุยทั้งน้องและผู้ปกครอง และวางแผนการยื่นทุกรอบ',
            en: { name: 'Student and Parents', description: 'Student and parents together, with a plan for every admission round.' },
            durationMinutes: 90,
            priceBaht: 1200,
          },
        ],
      },
      {
        name: 'ทำพอร์ตโฟลิโอยื่น TCAS รอบ 1',
        description:
          'ส่งพอร์ตที่มีอยู่มาก่อนนัด แล้วดูว่าผลงานไหนควรขึ้นก่อน เรื่องไหนควรตัด และหน้าแนะนำตัวเล่าให้ตรงกับคณะแล้วหรือยัง ตามแนวทางพอร์ต 10 หน้าที่หลายคณะใช้',
        en: {
          name: 'Build Your Portfolio for TCAS Round 1',
          description:
            "Send your current portfolio before the session, and we decide which work goes first, what to cut, and whether your introduction page speaks to the faculty you're applying to, following the 10-page format many faculties use.",
        },
        category: CAREERS,
        priceBaht: 550,
        durationMinutes: 30,
        photos: [photo(9489771), photo(5905707)],
        packages: [
          {
            name: 'ตรวจพอร์ต',
            description: 'ชี้จุดที่ควรแก้ เรียงตามความสำคัญ',
            en: { name: 'Portfolio Check', description: 'What to fix, in order of importance.' },
            durationMinutes: 30,
            priceBaht: 550,
          },
          {
            name: 'ปรับพอร์ตทั้งเล่ม',
            description: 'จัดลำดับและเรียบเรียงพอร์ตใหม่ทั้งเล่มไปด้วยกัน',
            en: { name: 'Full Portfolio Rework', description: 'We reorder and rework the whole portfolio together.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
    ],
  },
  {
    email: 'life.natthida.l@advisory.demo',
    displayName: 'ณัฐธิดา ลิ้มสกุล',
    fullName: 'ณัฐธิดา ลิ้มสกุล',
    portrait: portrait(9304682),
    headline: 'หัวหน้าทีมวิเคราะห์ข้อมูล สายอีคอมเมิร์ซ',
    bio: 'ทำงานด้านข้อมูลมา 8 ปี ปัจจุบันเป็นหัวหน้าทีม Data Analyst ของแพลตฟอร์มอีคอมเมิร์ซ เปลี่ยนสายมาจากงานบัญชีเอง จึงเข้าใจคนที่เริ่มจากศูนย์ เคยสอน SQL และการทำ Dashboard ให้พนักงานออฟฟิศมาแล้วกว่า 300 คน เน้นฝึกจากข้อมูลงานจริงของผู้เรียน',
    en: {
      headline: 'Data Analytics Lead, E-commerce',
      bio: "Eight years in data, now leading the data analyst team at an e-commerce platform. She switched over from accounting herself, so she understands people starting from scratch. She has taught SQL and dashboard building to more than 300 office workers, always practising on the learner's own work data.",
    },
    services: [
      {
        name: 'เปลี่ยนสายงานมาเป็น Data Analyst',
        description:
          'สำหรับคนทำงานสายอื่นที่อยากย้ายมาสายข้อมูล ดูว่าพื้นฐานที่มีอยู่ใช้ต่อได้แค่ไหน ต้องเรียนอะไรเพิ่มตามลำดับ และควรเริ่มจากตำแหน่งไหน จบด้วยแผนเรียนและแผนสมัครงานหกเดือน',
        en: {
          name: 'Switch Careers Into Data Analytics',
          description:
            'For people in other fields who want to move into data. We look at how much of your background carries over, what to learn and in what order, and which role to aim for first. You leave with a six-month learning and application plan.',
        },
        category: CAREERS,
        priceBaht: 900,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(7109243), photo(3861957)],
        packages: [
          {
            name: 'ประเมินพื้นฐาน',
            description: 'ดูว่าประสบการณ์เดิมเอามาใช้กับงานข้อมูลได้แค่ไหน',
            en: { name: 'Background Check-In', description: 'How much of your current experience carries over into data work.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'แผนเปลี่ยนสายหกเดือน',
            description: 'แผนเรียนรายเดือน โปรเจกต์ที่ควรทำ และตำแหน่งที่ควรสมัคร',
            en: { name: 'Six-Month Switch Plan', description: 'A month-by-month learning plan, the projects to build, and the roles to apply for.' },
            durationMinutes: 90,
            priceBaht: 1900,
          },
        ],
      },
      {
        name: 'เริ่มต้น SQL สำหรับคนทำงานออฟฟิศ',
        description:
          'สำหรับคนที่ทำรายงานด้วย Excel จนไฟล์ช้าและอยากดึงข้อมูลเอง เรียนตั้งแต่ SELECT, WHERE, GROUP BY ไปจนถึง JOIN โดยฝึกกับตารางตัวอย่างที่หน้าตาเหมือนงานจริง จบแล้วเขียนคำสั่งดึงรายงานพื้นฐานได้เอง',
        en: {
          name: 'SQL Basics for Office Workers',
          description:
            'For people whose Excel reports have grown too slow and who want to pull data themselves. We go from SELECT, WHERE and GROUP BY through to JOIN, practising on sample tables that look like real work data. By the end you can write basic report queries on your own.',
        },
        category: TECH,
        priceBaht: 1000,
        durationMinutes: 60,
        photos: [photo(34804005), photo(8217305)],
        packages: [
          {
            name: 'บทเรียนแรก',
            description: 'พื้นฐานการดึงและกรองข้อมูลจากตารางเดียว',
            en: { name: 'First Lesson', description: 'The basics of pulling and filtering data from a single table.' },
            durationMinutes: 60,
            priceBaht: 1000,
          },
          {
            name: 'คอร์สเข้มสองชั่วโมง',
            description: 'ครบตั้งแต่พื้นฐานจนถึงการรวมหลายตาราง พร้อมแบบฝึกหัดกลับไปทำต่อ',
            en: { name: 'Two-Hour Intensive', description: 'From the basics to joining tables, with exercises to take away.' },
            durationMinutes: 120,
            priceBaht: 1800,
          },
        ],
      },
      {
        name: 'ทำ Dashboard ยอดขายด้วย Looker Studio',
        description:
          'เชื่อมข้อมูลยอดขายจาก Google Sheets หรือไฟล์ที่ดึงจากระบบร้าน มาเป็น Dashboard ที่เปิดดูได้ทุกเช้า เลือกตัวเลขที่ควรติดตาม และจัดหน้าให้คนในทีมอ่านเข้าใจภายในไม่กี่วินาที',
        en: {
          name: 'Build a Sales Dashboard in Looker Studio',
          description:
            'We connect sales data from Google Sheets or exports from your store system into a dashboard you can check every morning, pick the numbers worth tracking, and lay it out so your team can read it in seconds.',
        },
        category: TECH,
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(7109291), photo(7567486)],
        packages: [
          {
            name: 'วางโครง Dashboard',
            description: 'เลือกตัวชี้วัดและร่างหน้าตา Dashboard ให้พร้อมลงมือ',
            en: { name: 'Dashboard Outline', description: 'Choose the metrics and sketch the layout, ready to build.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'ทำให้เสร็จในนัด',
            description: 'ต่อข้อมูลจริงและสร้าง Dashboard ให้ใช้ได้ภายในนัดเดียว',
            en: { name: 'Built in One Session', description: 'We connect your real data and finish a working dashboard in one sitting.' },
            durationMinutes: 120,
            priceBaht: 2200,
          },
        ],
      },
      {
        name: 'รีวิวพอร์ตโปรเจกต์ Data ก่อนสมัครงาน',
        description:
          'ส่งลิงก์พอร์ตหรือ GitHub มาก่อนนัด แล้วดูจากมุมคนสัมภาษณ์ว่าโปรเจกต์ไหนน่าสนใจ โปรเจกต์ไหนดูเหมือนทำตามคอร์ส และควรเล่าผลลัพธ์อย่างไรให้คนอ่านเห็นว่าคุณแก้ปัญหาธุรกิจได้',
        en: {
          name: 'Data Portfolio Review Before You Apply',
          description:
            'Send your portfolio or GitHub link ahead of time, and we look at it the way an interviewer would: which projects stand out, which look like course exercises, and how to present results so the reader sees you can solve a business problem.',
        },
        category: CAREERS,
        priceBaht: 850,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(7109314), photo(25636747)],
        packages: [
          {
            name: 'รีวิวพอร์ต',
            description: 'ความเห็นทีละโปรเจกต์พร้อมสิ่งที่ควรแก้',
            en: { name: 'Portfolio Review', description: 'Project-by-project comments and what to change.' },
            durationMinutes: 45,
            priceBaht: 850,
          },
          {
            name: 'รีวิวพร้อมซ้อมเล่าโปรเจกต์',
            description: 'รีวิวพอร์ตแล้วซ้อมเล่าโปรเจกต์เหมือนอยู่ในห้องสัมภาษณ์',
            en: { name: 'Review and Presentation Practice', description: 'A review, then practice presenting your projects as you would in an interview.' },
            durationMinutes: 90,
            priceBaht: 1600,
          },
        ],
      },
    ],
  },

  // ── Wellbeing ──────────────────────────────────────────────────────────
  {
    email: 'life.siriluk.i@advisory.demo',
    displayName: 'ศิริลักษณ์ อินทรประเสริฐ',
    fullName: 'ศิริลักษณ์ อินทรประเสริฐ',
    portrait: portrait(34166623),
    headline: 'นักจิตวิทยาการปรึกษา ด้านภาวะหมดไฟและความเครียดจากงาน',
    bio: 'นักจิตวิทยาการปรึกษา จบปริญญาโทจิตวิทยาการปรึกษา เคยประจำศูนย์ให้คำปรึกษานักศึกษาของมหาวิทยาลัยรัฐ 8 ปี ก่อนออกมาทำงานกับคนวัยทำงานเป็นหลัก ใช้แนวทาง CBT ร่วมกับการรับฟังอย่างไม่ตัดสิน ช่วยให้เห็นรูปแบบความคิดที่ทำให้เหนื่อย และหาวิธีดูแลตัวเองที่ทำได้จริงในชีวิตประจำวัน',
    en: {
      headline: 'Counseling Psychologist for Burnout and Work Stress',
      bio: "A counseling psychologist with a master's in counseling psychology, who spent eight years at a public university's student counseling centre before turning mainly to working adults. She combines a CBT approach with listening without judgement, helping you see the thinking patterns that wear you down and find ways of looking after yourself that fit into everyday life.",
    },
    services: [
      {
        name: 'คุยเรื่องภาวะหมดไฟจากงาน',
        description:
          'สำหรับคนที่ตื่นมาแล้วไม่อยากไปทำงาน เหนื่อยแม้ได้พัก หรือรู้สึกว่างานที่เคยชอบไม่มีความหมายแล้ว ค่อยๆ ไล่ดูว่าความเหนื่อยมาจากปริมาณงาน ความคาดหวัง หรือความสัมพันธ์ในที่ทำงาน แล้วหาสิ่งเล็กๆ ที่เริ่มเปลี่ยนได้ในสัปดาห์นี้ บริการนี้เป็นการให้คำปรึกษา ไม่ใช่การวินิจฉัยหรือรักษา และไม่เหมาะกับภาวะฉุกเฉิน',
        en: {
          name: 'Talk Through Burnout at Work',
          description:
            "For anyone who wakes up not wanting to go to work, feels drained even after a break, or finds that work they used to enjoy no longer means much. We gently look at whether the exhaustion comes from workload, expectations or relationships at work, then find small things you can start changing this week. This is counseling, not diagnosis or treatment, and it isn't suitable for emergencies.",
        },
        category: WELLBEING,
        priceBaht: 800,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(8872802), photo(6345335)],
        packages: [
          {
            name: 'คุยครั้งแรก',
            description: 'เล่าสิ่งที่เกิดขึ้นและดูว่าความเหนื่อยมาจากไหน',
            en: { name: 'First Conversation', description: 'Talk through what has been happening and where the exhaustion comes from.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'คุยเต็มชั่วโมง',
            description: 'คุยลึกขึ้นพร้อมวางวิธีดูแลตัวเองที่ทำได้จริง',
            en: { name: 'Full Session', description: 'A deeper conversation, with self-care steps you can actually keep.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
          {
            name: 'คุยแบบยาว',
            description: 'เวลาที่มากพอสำหรับคนที่มีหลายเรื่องทับซ้อนกันอยู่',
            en: { name: 'Extended Session', description: 'A longer session for when several things are tangled together.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'รับมือความกังวลก่อนเริ่มงานใหม่',
        description:
          'เพิ่งได้งานใหม่แต่กลับนอนไม่หลับ กลัวทำไม่ได้ หรือกลัวไม่เข้ากับทีม คุยเพื่อแยกความกังวลที่มีเหตุผลออกจากความคิดที่ขยายเกินจริง และเตรียมวิธีรับมือสำหรับสองสัปดาห์แรก',
        en: {
          name: 'Handle Anxiety Before Starting a New Job',
          description:
            "You've just landed a new job but can't sleep, worry you won't cope, or fear you won't fit in. We separate the worries that make sense from the thoughts that have grown out of proportion, and prepare ways to handle your first two weeks.",
        },
        category: WELLBEING,
        priceBaht: 800,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(8636636), photo(12911963)],
        packages: [
          {
            name: 'คุยให้โล่ง',
            description: 'ระบายและจัดลำดับสิ่งที่กังวลอยู่',
            en: { name: 'Clear Your Head', description: 'Talk it out and put your worries in order.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'เตรียมรับมือสองสัปดาห์แรก',
            description: 'วางวิธีรับมือกับสถานการณ์ที่กลัวที่สุดทีละเรื่อง',
            en: { name: 'Prepare for the First Two Weeks', description: 'Plan how to handle the situations you dread most, one at a time.' },
            durationMinutes: 75,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'ปรับตัวหลังการสูญเสียคนสำคัญ',
        description:
          'พื้นที่ปลอดภัยสำหรับคนที่เพิ่งสูญเสียคนในครอบครัว คนรัก หรือเพื่อนสนิท ไม่มีการเร่งให้หายเศร้า แต่ช่วยให้เข้าใจสิ่งที่กำลังรู้สึก และหาวิธีใช้ชีวิตประจำวันต่อไปได้ทีละนิด หากมีความคิดทำร้ายตัวเอง โปรดติดต่อสายด่วนสุขภาพจิต 1323 หรือโรงพยาบาลใกล้บ้านทันที',
        en: {
          name: 'Coping After Losing Someone Close',
          description:
            "A safe space for anyone who has recently lost a family member, partner or close friend. There's no rush to stop grieving; instead we work on understanding what you're feeling and finding ways to get through daily life, a little at a time. If you are having thoughts of harming yourself, please call the mental health hotline 1323 or go to your nearest hospital straight away.",
        },
        category: WELLBEING,
        priceBaht: 1100,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(23496577), photo(3958422)],
        packages: [
          {
            name: 'คุยหนึ่งชั่วโมง',
            description: 'เล่าเรื่องราวและความรู้สึกในจังหวะของคุณเอง',
            en: { name: 'One-Hour Session', description: 'Share your story and feelings at your own pace.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
          {
            name: 'คุยแบบไม่เร่งรีบ',
            description: 'เวลาที่มากพอสำหรับวันที่มีเรื่องอยากพูดเยอะ',
            en: { name: 'Unhurried Session', description: 'Enough time for the days when there is a lot to say.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'หยุดความคิดวนซ้ำและการโทษตัวเอง',
        description:
          'สำหรับคนที่ทำพลาดนิดเดียวแล้วคิดวนทั้งคืน หรือมีเสียงในหัวคอยบอกว่าตัวเองไม่ดีพอ ใช้เทคนิคจาก CBT ฝึกจับความคิดที่เกิดขึ้น แล้วลองมองสถานการณ์จากมุมอื่น พร้อมแบบฝึกที่ทำต่อได้เองที่บ้าน',
        en: {
          name: 'Break the Cycle of Overthinking and Self-Blame',
          description:
            "For people who replay a small mistake all night, or hear a voice telling them they're never good enough. Using CBT techniques, we practise catching those thoughts as they happen and looking at the situation from another angle, with exercises you can keep doing at home.",
        },
        category: WELLBEING,
        priceBaht: 1100,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(14797769), photo(36729385)],
        packages: [
          {
            name: 'ทำความรู้จักความคิดตัวเอง',
            description: 'ฝึกจับรูปแบบความคิดที่เกิดซ้ำบ่อย',
            en: { name: 'Know Your Thought Patterns', description: 'Practise spotting the thoughts that keep coming back.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
          {
            name: 'ฝึกเต็มรูปแบบ',
            description: 'ฝึกปรับมุมมองจากเหตุการณ์จริงของคุณ พร้อมแบบฝึกกลับไปทำที่บ้าน',
            en: { name: 'Full Practice Session', description: 'Work through real situations from your life, with exercises to take home.' },
            durationMinutes: 90,
            priceBaht: 1550,
          },
        ],
      },
    ],
  },
  {
    email: 'life.theerawat.c@advisory.demo',
    displayName: 'ธีรวัฒน์ ชัยมงคล',
    fullName: 'ธีรวัฒน์ ชัยมงคล',
    portrait: portrait(4192307),
    headline: 'นักจิตวิทยาการปรึกษาด้านความเครียดในที่ทำงานและครอบครัว',
    bio: 'ทำงานในโครงการให้คำปรึกษาพนักงาน (EAP) ของบริษัทที่ปรึกษาด้านบุคคลมา 9 ปี ก่อนหน้านั้นเป็นนักจิตวิทยาประจำโรงเรียนนานาชาติ ให้คำปรึกษาหัวหน้างาน คุณพ่อคุณแม่ และผู้ชายที่ไม่ค่อยถนัดเล่าเรื่องของตัวเอง พูดตรง ใช้ภาษาง่าย และไม่ตัดสินสิ่งที่คุณเล่า',
    en: {
      headline: 'Counseling Psychologist for Workplace and Family Stress',
      bio: "Spent nine years counselling employees through an employee assistance programme (EAP) at an HR consultancy, and before that was the school psychologist at an international school. He works with managers, parents, and men who don't find it easy to talk about themselves. He speaks plainly and doesn't judge what you tell him.",
    },
    services: [
      {
        name: 'คุยเรื่องความเครียดของคนเป็นหัวหน้า',
        description:
          'เป็นหัวหน้าต้องรับแรงกดดันทั้งจากข้างบนและจากลูกทีม แต่หาคนคุยด้วยไม่ได้ ใช้เวลานี้ระบายเรื่องที่พูดกับใครในบริษัทไม่ได้ แล้วค่อยแยกว่าอะไรคือความรับผิดชอบของคุณจริงๆ และอะไรที่แบกไว้เกินจำเป็น',
        en: {
          name: 'Talk Through the Stress of Being the Boss',
          description:
            "Managers take pressure from above and from their team, often with no one to talk to. Use this time to get off your chest what you can't say to anyone at work, then sort out what is truly your responsibility and what you've been carrying unnecessarily.",
        },
        category: WELLBEING,
        priceBaht: 900,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(8867225), photo(7176321)],
        packages: [
          {
            name: 'คุยระบาย',
            description: 'พื้นที่ส่วนตัวสำหรับเรื่องที่พูดในที่ทำงานไม่ได้',
            en: { name: 'Off the Record', description: "A private space for the things you can't say at work." },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'คุยพร้อมวางขอบเขต',
            description: 'คุยลึกขึ้นและวางขอบเขตระหว่างงานกับชีวิตให้ชัด',
            en: { name: 'Set Your Boundaries', description: 'A deeper conversation, ending with clearer limits between work and life.' },
            durationMinutes: 75,
            priceBaht: 1400,
          },
        ],
      },
      {
        name: 'จัดการอารมณ์โกรธและการสื่อสารในบ้าน',
        description:
          'สำหรับคนที่รู้ตัวว่าโมโหง่ายกับคนในบ้าน แล้วรู้สึกผิดทีหลัง เรียนรู้สัญญาณเตือนก่อนอารมณ์จะพุ่ง วิธีขอเวลานอก และวิธีพูดเรื่องที่ไม่พอใจโดยไม่ทำร้ายความสัมพันธ์ บริการนี้ไม่เหมาะกับกรณีที่มีความรุนแรงในครอบครัว ซึ่งควรติดต่อหน่วยงานช่วยเหลือโดยตรง',
        en: {
          name: 'Manage Anger and Communicate Better at Home',
          description:
            "For people who know they snap at family too easily and feel guilty afterwards. Learn the warning signs before your temper rises, how to call a time-out, and how to raise what bothers you without damaging the relationship. This service isn't suitable where there is domestic violence; in that case please contact a support agency directly.",
        },
        category: WELLBEING,
        priceBaht: 1100,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(8012049), photo(8927460)],
        packages: [
          {
            name: 'ทำความเข้าใจอารมณ์',
            description: 'หาตัวกระตุ้นและสัญญาณเตือนของตัวเอง',
            en: { name: 'Understand Your Anger', description: 'Identify your triggers and early warning signs.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
          {
            name: 'ฝึกสื่อสารแบบใหม่',
            description: 'ฝึกพูดในสถานการณ์จริงที่มักทะเลาะกัน',
            en: { name: 'Practise a New Way to Talk', description: 'Rehearse the real situations where arguments usually start.' },
            durationMinutes: 90,
            priceBaht: 1600,
          },
        ],
      },
      {
        name: 'ปรึกษาเรื่องการเลี้ยงลูกวัยรุ่น',
        description:
          'ลูกไม่ยอมคุยด้วย ติดโทรศัพท์ หรือทะเลาะกันเรื่องเดิมทุกวัน คุยเพื่อเข้าใจว่าเด็กวัยนี้กำลังเจออะไร และหาวิธีตั้งกติกาที่ลูกยอมรับได้โดยความสัมพันธ์ไม่แย่ลง นัดได้ทั้งแบบคุณพ่อคุณแม่มาคนเดียวหรือมาพร้อมลูก',
        en: {
          name: 'Parenting a Teenager',
          description:
            "Your teenager won't talk to you, is glued to their phone, or you argue about the same thing every day. We look at what kids this age are going through and find ways to set rules they'll accept without the relationship getting worse. Parents can come alone or bring their teenager.",
        },
        category: WELLBEING,
        priceBaht: 1100,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(8489335), photo(23496574)],
        packages: [
          {
            name: 'คุณพ่อคุณแม่มาคุย',
            description: 'คุยกับผู้ปกครองเพื่อมองสถานการณ์ให้ครบ',
            en: { name: 'Parents Only', description: 'A session with parents to see the whole picture.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
          {
            name: 'คุยทั้งครอบครัว',
            description: 'คุยร่วมกับลูกเพื่อหาข้อตกลงที่ทุกคนรับได้',
            en: { name: 'Whole Family', description: 'A joint session with your teenager to reach an agreement everyone can live with.' },
            durationMinutes: 90,
            priceBaht: 1600,
          },
        ],
      },
      {
        name: 'ฝึกผ่อนคลายก่อนนอนสำหรับคนคิดมาก',
        description:
          'สำหรับคนที่ล้มตัวลงนอนแล้วสมองไม่ยอมหยุด ฝึกเทคนิคการหายใจ การผ่อนคลายกล้ามเนื้อ และการเขียนปลดความคิดก่อนนอน แล้วออกแบบกิจวัตรช่วงค่ำที่ทำได้จริง หากนอนไม่หลับต่อเนื่องหลายสัปดาห์ ควรพบแพทย์ร่วมด้วย',
        en: {
          name: "Wind Down at Night When Your Mind Won't Stop",
          description:
            "For people whose minds start racing as soon as they lie down. We practise breathing techniques, muscle relaxation and writing your thoughts down before bed, then design an evening routine you can actually stick to. If you've had trouble sleeping for several weeks, please see a doctor as well.",
        },
        category: WELLBEING,
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(3822622), photo(8436641)],
        packages: [
          {
            name: 'ฝึกเทคนิคพื้นฐาน',
            description: 'ลองเทคนิคผ่อนคลายสองถึงสามแบบไปด้วยกัน',
            en: { name: 'Core Techniques', description: 'Try two or three relaxation techniques together.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'ออกแบบกิจวัตรก่อนนอน',
            description: 'ฝึกเทคนิคและวางกิจวัตรช่วงค่ำที่เหมาะกับชีวิตคุณ',
            en: { name: 'Design Your Evening Routine', description: 'Practise the techniques and plan an evening routine that fits your life.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
        ],
      },
    ],
  },

  // ── Study abroad and relocation ────────────────────────────────────────
  {
    email: 'life.sunisa.k@advisory.demo',
    displayName: 'สุนิสา แก้วมณี',
    fullName: 'สุนิสา แก้วมณี',
    portrait: portrait(4350178),
    headline: 'ที่ปรึกษา Work and Holiday เรียนภาษา และย้ายไปทำงานต่างประเทศ',
    bio: 'ไปทำ Work and Holiday ที่ออสเตรเลียหนึ่งปีหลังเรียนจบ แล้วต่อด้วยอนุปริญญาด้านการโรงแรมที่เมลเบิร์น กลับมาทำงานเอเจนซีแนะแนวเรียนต่อและหางานต่างประเทศ 8 ปี ดูแลทั้งคนที่ไปเรียนภาษาและคนที่ย้ายไปทำงานในเยอรมนีและยุโรปพร้อมครอบครัว ปัจจุบันรับปรึกษาอิสระ ช่วยวางแผนไปเรียนและทำงานต่างประเทศด้วยงบที่เป็นจริง และไม่รับประกันผลการพิจารณาวีซ่า',
    en: {
      headline: 'Work and Holiday, Language Study, and Working Abroad Advisor',
      bio: 'Spent a year on a Work and Holiday visa in Australia after graduating, then did a hospitality diploma in Melbourne. After eight years at an agency for overseas study and jobs, where she looked after both language students and people moving to work in Germany and Europe with their families, she now advises independently on realistic plans and budgets for studying and working overseas. Visa outcomes cannot be guaranteed.',
    },
    services: [
      {
        name: 'วางแผนย้ายไปทำงานที่เยอรมนี',
        description:
          'ดูว่าอาชีพและวุฒิของคุณเข้าเงื่อนไขวีซ่าแบบไหน ต้องเทียบวุฒิหรือไม่ ใช้ภาษาเยอรมันระดับใด และควรเริ่มหางานจากไทยหรือไปหางานที่นั่น จบด้วยลำดับขั้นตอนและงบประมาณโดยประมาณ',
        en: {
          name: 'Plan a Move to Work in Germany',
          description:
            "We look at which visa route your profession and qualifications fit, whether your degree needs recognising, what level of German you'll need, and whether to job hunt from Thailand or on the ground. You leave with the steps in order and a rough budget.",
        },
        category: ABROAD,
        priceBaht: 1000,
        durationMinutes: 45,
        photos: [photo(18576930), photo(30368525)],
        packages: [
          {
            name: 'ประเมินความเป็นไปได้',
            description: 'ดูว่าคุณเข้าเส้นทางวีซ่าแบบไหนและต้องเตรียมอะไรเพิ่ม',
            en: { name: 'Feasibility Check', description: 'Which visa route you fit and what you still need.' },
            durationMinutes: 45,
            priceBaht: 1000,
          },
          {
            name: 'วางแผนย้ายประเทศ',
            description: 'ลำดับขั้นตอนตั้งแต่เทียบวุฒิจนถึงวันเดินทาง พร้อมงบประมาณ',
            en: { name: 'Relocation Plan', description: 'Every step from degree recognition to departure day, with a budget.' },
            durationMinutes: 90,
            priceBaht: 2200,
          },
        ],
      },
      {
        name: 'ทำ CV และจดหมายสมัครงานแบบยุโรป',
        description:
          'CV ที่ใช้ในไทยมักยาวเกินหรือขาดข้อมูลที่บริษัทยุโรปต้องการ ปรับรูปแบบ ภาษา และวิธีเล่าผลงานให้ตรงกับธรรมเนียมการสมัครงานในเยอรมนีและเนเธอร์แลนด์ พร้อมร่างจดหมายสมัครงานหนึ่งฉบับ',
        en: {
          name: 'Write a European-Style CV and Cover Letter',
          description:
            'CVs written for Thai employers are often too long or miss what European companies expect. We adapt the format, language and the way you present results to German and Dutch hiring conventions, and draft one cover letter.',
        },
        category: ABROAD,
        priceBaht: 900,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(11953671), photo(19096569)],
        packages: [
          {
            name: 'ตรวจ CV',
            description: 'ชี้จุดที่ต้องปรับให้เข้ากับการสมัครงานในยุโรป',
            en: { name: 'CV Check', description: 'What to change for European applications.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'ปรับ CV พร้อมจดหมายสมัครงาน',
            description: 'ปรับ CV ทั้งฉบับและร่างจดหมายสมัครงานไปด้วยกัน',
            en: { name: 'CV and Cover Letter', description: 'A full CV rework and a cover letter drafted together.' },
            durationMinutes: 90,
            priceBaht: 1800,
          },
        ],
      },
      {
        name: 'ย้ายไปต่างประเทศพร้อมครอบครัว',
        description:
          'สำหรับคนที่ย้ายไปพร้อมคู่สมรสและลูก คุยเรื่องวีซ่าผู้ติดตาม การหาโรงเรียน ที่พัก ประกันสุขภาพ และงบประมาณช่วงตั้งตัว จากประสบการณ์ย้ายครอบครัวไปเยอรมนีด้วยตัวเอง',
        en: {
          name: 'Move Abroad With Your Family',
          description:
            'For people relocating with a spouse and children. We cover dependant visas, finding schools, housing, health insurance and the budget for settling in, based on having moved my own family to Germany.',
        },
        category: ABROAD,
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(7365304), photo(9185883)],
        packages: [
          {
            name: 'คุยประเด็นหลัก',
            description: 'ไล่เรื่องที่ต้องตัดสินใจก่อนย้ายทั้งครอบครัว',
            en: { name: 'Key Decisions', description: 'The decisions to make before the whole family moves.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'วางแผนย้ายทั้งครอบครัว',
            description: 'วางไทม์ไลน์ งบประมาณ และรายการเอกสารของทุกคนในบ้าน',
            en: { name: 'Family Relocation Plan', description: 'Timeline, budget and a document list for everyone in the household.' },
            durationMinutes: 120,
            priceBaht: 2600,
          },
        ],
      },
      {
        name: 'วางแผนเรียนภาษาเยอรมันให้ถึง B1',
        description:
          'หลายเส้นทางวีซ่าต้องใช้ภาษาเยอรมันระดับ A2 ถึง B1 วางแผนเรียนจากศูนย์ให้ถึงระดับที่ต้องใช้ เลือกสถาบันและการสอบ Goethe หรือ telc ที่เหมาะ และจัดตารางที่ทำได้ควบคู่กับงานประจำ',
        en: {
          name: 'Plan Your Way to B1 German',
          description:
            'Many visa routes require German at A2 to B1. We plan your path from zero to the level you need, choose a school and the right Goethe or telc exam, and build a schedule you can keep alongside full-time work.',
        },
        category: LANGUAGES,
        priceBaht: 800,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(30419563), photo(6073465)],
        packages: [
          {
            name: 'วางเส้นทางเรียน',
            description: 'ดูระดับที่ต้องใช้และเวลาที่ต้องเผื่อไว้',
            en: { name: 'Learning Route', description: 'The level you need and how much time to allow.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'วางแผนเรียนและสอบครบ',
            description: 'เลือกสถาบัน สนามสอบ และทำตารางเรียนรายสัปดาห์',
            en: { name: 'Study and Exam Plan', description: 'Pick a school and exam centre, and build a weekly study schedule.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
      {
        name: 'วางแผนไป Work and Holiday ออสเตรเลีย',
        description:
          'โควตาวีซ่า Work and Holiday สำหรับคนไทยมีจำกัดและเปิดรับเป็นช่วง วางแผนตั้งแต่เตรียมคุณสมบัติ เอกสาร และเงินที่ต้องมี ไปจนถึงงานที่หาได้จริงในปีแรก ไม่สามารถรับประกันผลการพิจารณาวีซ่าได้',
        en: {
          name: 'Plan a Work and Holiday Year in Australia',
          description:
            "Work and Holiday visa places for Thais are limited and open in windows. We plan everything from meeting the requirements, documents and the funds you need, to the jobs you can realistically get in your first year. Visa outcomes can't be guaranteed.",
        },
        category: ABROAD,
        priceBaht: 500,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(4606721), photo(8276910)],
        packages: [
          {
            name: 'เช็กคุณสมบัติ',
            description: 'ดูว่าคุณพร้อมยื่นรอบถัดไปหรือยัง',
            en: { name: 'Eligibility Check', description: "Whether you're ready for the next application window." },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'วางแผนทั้งปี',
            description: 'วางแผนตั้งแต่ยื่นวีซ่าจนถึงเมืองและงานที่จะไปเริ่ม',
            en: { name: 'Whole-Year Plan', description: 'From the visa application to the city and the job you start with.' },
            durationMinutes: 60,
            priceBaht: 990,
          },
        ],
      },
      {
        name: 'เลือกโรงเรียนสอนภาษาที่ออสเตรเลียหรือนิวซีแลนด์',
        description:
          'เทียบโรงเรียนสอนภาษาในเมืองต่างๆ ทั้งค่าเรียน ค่าครองชีพ สัดส่วนนักเรียนต่างชาติ และสิทธิทำงานระหว่างเรียน แล้วเลือกที่ที่เหมาะกับงบและเป้าหมายของคุณ',
        en: {
          name: 'Choose a Language School in Australia or New Zealand',
          description:
            'We compare language schools across cities on fees, cost of living, the mix of nationalities and work rights while studying, then pick the one that fits your budget and goals.',
        },
        category: ABROAD,
        priceBaht: 700,
        durationMinutes: 45,
        photos: [photo(7683910), photo(4622108)],
        packages: [
          {
            name: 'เทียบโรงเรียน',
            description: 'เทียบโรงเรียนสามถึงห้าแห่งที่เข้าเงื่อนไขของคุณ',
            en: { name: 'School Comparison', description: 'Three to five schools that match your criteria, side by side.' },
            durationMinutes: 45,
            priceBaht: 700,
          },
          {
            name: 'เลือกโรงเรียนพร้อมวางงบ',
            description: 'เลือกโรงเรียนและวางงบค่าเรียนกับค่าครองชีพตลอดหลักสูตร',
            en: { name: 'Choose and Budget', description: 'Choose a school and budget fees and living costs for the whole course.' },
            durationMinutes: 90,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'เตรียมเอกสารวีซ่านักเรียนออสเตรเลีย',
        description:
          'ไล่รายการเอกสารที่ต้องใช้ การเขียนคำชี้แจงความเป็นนักเรียนจริง (Genuine Student) และหลักฐานทางการเงิน พร้อมดูจุดที่มักทำให้ใบสมัครมีปัญหา เป็นคำแนะนำในการเตรียมตัว ไม่ใช่การยื่นแทนหรือรับประกันผล',
        en: {
          name: 'Prepare Your Australian Student Visa Documents',
          description:
            'We go through the documents required, the Genuine Student statement and your financial evidence, and look at the common problems in applications. This is preparation advice, not lodging on your behalf or a guarantee of the outcome.',
        },
        category: ABROAD,
        priceBaht: 800,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(32176062), photo(12094375)],
        packages: [
          {
            name: 'เช็กเอกสาร',
            description: 'ไล่รายการเอกสารและหลักฐานการเงินที่ต้องเตรียม',
            en: { name: 'Document Check', description: 'The documents and financial evidence you need.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'ตรวจเอกสารพร้อมคำชี้แจง',
            description: 'ตรวจชุดเอกสารและแก้ร่างคำชี้แจง Genuine Student ไปด้วยกัน',
            en: { name: 'Documents and Statement Review', description: 'Review your documents and edit the Genuine Student statement together.' },
            durationMinutes: 90,
            priceBaht: 1600,
          },
        ],
      },
      {
        name: 'วางงบและหาที่พักเดือนแรกในต่างประเทศ',
        description:
          'สำหรับคนที่กำลังจะไปเรียนหรือทำงานต่างประเทศครั้งแรก คำนวณเงินที่ต้องเตรียมสำหรับสามเดือนแรก เทียบที่พักแบบโฮมสเตย์ แชร์บ้าน และหอพัก และรู้ทันมิจฉาชีพที่หลอกให้เช่าห้อง',
        en: {
          name: 'Budget and Find a Place for Your First Month Abroad',
          description:
            'For anyone heading overseas to study or work for the first time. We work out how much money you need for the first three months, compare homestays, house shares and student halls, and go over the rental scams to watch for.',
        },
        category: ABROAD,
        priceBaht: 450,
        durationMinutes: 30,
        photos: [photo(8212229), photo(7365311)],
        packages: [
          {
            name: 'วางงบสามเดือน',
            description: 'คำนวณเงินที่ต้องเตรียมสำหรับช่วงตั้งตัว',
            en: { name: 'Three-Month Budget', description: 'How much money to set aside for settling in.' },
            durationMinutes: 30,
            priceBaht: 450,
          },
          {
            name: 'วางงบพร้อมเลือกที่พัก',
            description: 'วางงบและเทียบที่พักที่หาไว้ทีละที่',
            en: { name: 'Budget and Housing', description: "A budget, plus a look at each place you're considering." },
            durationMinutes: 60,
            priceBaht: 850,
          },
        ],
      },
    ],
  },
  {
    email: 'life.yanisa.t@advisory.demo',
    displayName: 'ญาณิศา ทองประเสริฐ',
    fullName: 'ญาณิศา ทองประเสริฐ',
    portrait: portrait(22885538),
    headline: 'ครูภาษาญี่ปุ่นและที่ปรึกษาทุนเรียนต่อญี่ปุ่น (JLPT N1)',
    bio: 'ได้ทุนรัฐบาลญี่ปุ่น (MEXT) ไปเรียนปริญญาโทที่โอซาก้า สอบผ่าน JLPT N1 และทำงานเป็นล่ามในบริษัทญี่ปุ่นที่นิคมอุตสาหกรรมภาคตะวันออก 4 ปี ปัจจุบันสอนภาษาญี่ปุ่นตัวต่อตัวและช่วยวางแผนยื่นทุน เน้นการใช้ภาษาในงานจริงมากกว่าการท่องจำ',
    en: {
      headline: 'Japanese Teacher and Japan Scholarship Advisor (JLPT N1)',
      bio: "Studied for a master's in Osaka on a Japanese government (MEXT) scholarship, holds JLPT N1, and spent four years as an interpreter at a Japanese company in an industrial estate in the East. She now teaches Japanese one-to-one and helps people plan scholarship applications, focusing on the language you'll actually use rather than rote memorising.",
    },
    services: [
      {
        name: 'เตรียมสอบ JLPT N3 ภายใน 6 เดือน',
        description:
          'สำหรับคนที่อ่านฮิรางานะและคาตาคานะได้แล้ว และอยากได้ใบรับรองไปใช้สมัครงาน วางแผนคันจิ คำศัพท์ ไวยากรณ์ และการฟังแบบรายสัปดาห์ ทำข้อสอบเก่าเพื่อหาจุดอ่อน แล้วปรับแผนให้ทันสอบรอบถัดไป',
        en: {
          name: 'Pass JLPT N3 in Six Months',
          description:
            'For learners who can already read hiragana and katakana and want a certificate for job applications. We plan kanji, vocabulary, grammar and listening week by week, use past papers to find weak spots, and adjust the plan to be ready for the next sitting.',
        },
        category: LANGUAGES,
        priceBaht: 700,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(33661215), photo(15641532)],
        packages: [
          {
            name: 'วัดระดับและวางแผน',
            description: 'ทดสอบระดับปัจจุบันและวางแผนอ่านหกเดือน',
            en: { name: 'Level Check and Plan', description: 'Test where you are now and plan six months of study.' },
            durationMinutes: 45,
            priceBaht: 700,
          },
          {
            name: 'วางแผนพร้อมติวจุดอ่อน',
            description: 'วางแผนแล้วติวส่วนที่ทำข้อสอบเก่าได้น้อยที่สุดทันที',
            en: { name: 'Plan Plus Weak-Spot Tutoring', description: 'Make the plan, then tutor the section you scored lowest on right away.' },
            durationMinutes: 90,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'ภาษาญี่ปุ่นสำหรับทำงานกับบริษัทญี่ปุ่น',
        description:
          'ฝึกคำสุภาพ (เคโกะ) การรายงานหัวหน้า การเขียนอีเมล และการประชุมแบบที่บริษัทญี่ปุ่นคาดหวัง พร้อมเล่าธรรมเนียมในที่ทำงานที่คนไทยมักพลาด',
        en: {
          name: 'Japanese for Working at a Japanese Company',
          description:
            'Practise keigo, reporting to your manager, writing emails and taking part in meetings the way Japanese companies expect, plus the workplace customs Thai staff most often get wrong.',
        },
        category: LANGUAGES,
        priceBaht: 900,
        durationMinutes: 60,
        photos: [photo(34546272), photo(17393523)],
        packages: [
          {
            name: 'ฝึกหนึ่งสถานการณ์',
            description: 'เลือกสถานการณ์ที่ใช้บ่อยที่สุดแล้วฝึกจนคล่อง',
            en: { name: 'One Situation', description: 'Pick the situation you face most and practise until it feels natural.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
          {
            name: 'ฝึกเข้ม',
            description: 'ฝึกหลายสถานการณ์ต่อเนื่อง ทั้งพูด เขียนอีเมล และรายงาน',
            en: { name: 'Intensive', description: 'Several situations back to back: speaking, emails and reporting.' },
            durationMinutes: 90,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'วางแผนยื่นทุนเรียนต่อปริญญาโทที่ญี่ปุ่น',
        description:
          'เทียบทุนรัฐบาลญี่ปุ่น (MEXT) ทั้งแบบสถานทูตและแบบมหาวิทยาลัยแนะนำ กับทุนอื่นที่เปิดให้คนไทย ดูคุณสมบัติ วิธีติดต่ออาจารย์ที่ปรึกษา และไทม์ไลน์ตลอดปี ไม่สามารถรับประกันผลการคัดเลือกได้',
        en: {
          name: "Plan a Scholarship for a Master's in Japan",
          description:
            "We compare the MEXT scholarship, both the embassy and university-recommendation tracks, with other awards open to Thais, and check eligibility, how to approach a supervisor, and the timeline across the year. Selection can't be guaranteed.",
        },
        category: ABROAD,
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(7210060), photo(28608383), photo(31028690)],
        packages: [
          {
            name: 'เลือกทุนที่เหมาะ',
            description: 'เทียบทุนที่เข้าเงื่อนไขและเลือกทางที่มีโอกาสที่สุด',
            en: { name: 'Choose a Scholarship', description: 'Compare the awards you qualify for and pick your best route.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'วางแผนยื่นทุนทั้งปี',
            description: 'ไทม์ไลน์รายเดือนตั้งแต่เตรียมเอกสารจนถึงวันสัมภาษณ์',
            en: { name: 'Full-Year Scholarship Plan', description: 'A month-by-month timeline from documents to interview day.' },
            durationMinutes: 90,
            priceBaht: 1800,
          },
        ],
      },
      {
        name: 'เตรียมสัมภาษณ์ทุน MEXT',
        description:
          'ซ้อมสัมภาษณ์ทั้งภาษาไทย อังกฤษ และญี่ปุ่นตามรูปแบบที่ใช้จริง ตรวจแผนการวิจัยให้ตอบคำถามกรรมการได้ชัด และรับฟีดแบ็กเรื่องการวางตัว',
        en: {
          name: 'Prepare for Your MEXT Interview',
          description:
            "Practise the interview in Thai, English and Japanese in the format actually used, check that your research plan answers the panel's questions clearly, and get feedback on how you come across.",
        },
        category: ABROAD,
        priceBaht: 1000,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(6673989), photo(34438872)],
        packages: [
          {
            name: 'ซ้อมหนึ่งรอบ',
            description: 'สัมภาษณ์จำลองหนึ่งรอบพร้อมฟีดแบ็ก',
            en: { name: 'One Mock Round', description: 'One mock interview with feedback.' },
            durationMinutes: 45,
            priceBaht: 1000,
          },
          {
            name: 'ซ้อมพร้อมตรวจแผนวิจัย',
            description: 'ตรวจแผนการวิจัยก่อน แล้วซ้อมสัมภาษณ์ด้วยคำถามที่เจาะจากแผนนั้น',
            en: { name: 'Research Plan and Interview', description: 'Review your research plan, then practise with questions drawn from it.' },
            durationMinutes: 90,
            priceBaht: 1900,
          },
        ],
      },
      {
        name: 'เลือกโรงเรียนสอนภาษาที่ญี่ปุ่น',
        description:
          'สำหรับคนที่อยากไปเรียนภาษาที่ญี่ปุ่นหกเดือนถึงสองปี เทียบโรงเรียนในโตเกียว โอซาก้า และฟุกุโอกะ ทั้งค่าเรียน ค่าที่พัก และเส้นทางต่อมหาวิทยาลัยหรือหางานหลังเรียนจบ',
        en: {
          name: 'Choose a Language School in Japan',
          description:
            'For anyone planning six months to two years of language study in Japan. We compare schools in Tokyo, Osaka and Fukuoka on fees, housing and the path on to university or work afterwards.',
        },
        category: ABROAD,
        priceBaht: 800,
        durationMinutes: 45,
        photos: [photo(3532924), photo(14430790)],
        packages: [
          {
            name: 'เทียบโรงเรียน',
            description: 'เทียบโรงเรียนที่ตรงกับเป้าหมายและงบของคุณ',
            en: { name: 'School Comparison', description: 'Compare schools that match your goals and budget.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'เลือกโรงเรียนพร้อมวางงบ',
            description: 'เลือกโรงเรียน เมือง และที่พัก พร้อมงบตลอดหลักสูตร',
            en: { name: 'Choose and Budget', description: 'Choose a school, city and housing, with a budget for the whole course.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
    ],
  },

  // ── Health and nutrition ───────────────────────────────────────────────
  {
    email: 'life.piyanuch.s@advisory.demo',
    displayName: 'ปิยนุช สุขเจริญ',
    fullName: 'ปิยนุช สุขเจริญ',
    portrait: portrait(8376198),
    headline: 'นักกำหนดอาหารวิชาชีพ',
    bio: 'นักกำหนดอาหารวิชาชีพ จบโภชนาการและการกำหนดอาหาร ทำงานในแผนกโภชนบำบัดของโรงพยาบาลเอกชน 7 ปี ก่อนออกมาให้คำปรึกษาด้านอาหารสำหรับคนทั่วไป วางแผนจากอาหารที่คุณกินอยู่จริง ทั้งข้าวแกงหน้าออฟฟิศและร้านสะดวกซื้อ ไม่ใช่เมนูที่ทำตามไม่ได้ และทำงานควบคู่กับคำแนะนำของแพทย์เสมอ',
    en: {
      headline: 'Registered Dietitian',
      bio: "A registered dietitian with a degree in nutrition and dietetics, who spent seven years in the clinical nutrition department of a private hospital before turning to advising the general public. She plans around what you really eat, from curry-and-rice stalls near the office to convenience stores, rather than menus you can't follow, and always works alongside your doctor's advice.",
    },
    services: [
      {
        name: 'จัดอาหารสำหรับคนทำงานที่อยากลดน้ำหนัก',
        description:
          'สำหรับคนที่กินข้าวนอกบ้านเกือบทุกมื้อและอยากลดน้ำหนักแบบไม่อดอาหาร ดูสิ่งที่กินจริงในหนึ่งสัปดาห์ แล้วปรับเป็นแผนอาหารที่สั่งได้จากร้านแถวที่ทำงาน คำนวณพลังงานและโปรตีนให้พอดีกับเป้าหมาย',
        en: {
          name: 'Meal Plan for Office Workers Who Want to Lose Weight',
          description:
            'For people who eat out for almost every meal and want to lose weight without starving. We look at what you actually ate over a week, then turn it into a plan you can order from places near work, with calories and protein set for your goal.',
        },
        category: HEALTH,
        priceBaht: 600,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(1640775), photo(9213859)],
        packages: [
          {
            name: 'ประเมินการกิน',
            description: 'ดูบันทึกอาหารหนึ่งสัปดาห์และชี้จุดที่ควรปรับก่อน',
            en: { name: 'Eating Review', description: 'We go through a week of your food diary and pick out what to change first.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'วางแผนอาหารหนึ่งเดือน',
            description: 'แผนอาหารรายวันพร้อมตัวเลือกจากร้านใกล้ที่ทำงาน',
            en: { name: 'One-Month Meal Plan', description: 'A daily eating plan with options from places near your work.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
        ],
      },
      {
        name: 'วางเมนูสำหรับคนที่น้ำตาลในเลือดเริ่มสูง',
        description:
          'ตรวจสุขภาพแล้วพบว่าน้ำตาลในเลือดเริ่มสูงหรืออยู่ในกลุ่มเสี่ยงเบาหวาน เรียนรู้การเลือกแป้ง การจัดจานอาหาร และขนมที่ยังกินได้ ให้คุมน้ำตาลได้ในชีวิตประจำวัน เป็นคำแนะนำด้านอาหารที่ใช้ควบคู่กับการดูแลของแพทย์ ไม่ใช่การรักษา',
        en: {
          name: 'Eating Plan for Rising Blood Sugar',
          description:
            "Your check-up showed rising blood sugar, or you're in the at-risk group for diabetes. Learn how to choose carbohydrates, build your plate and pick snacks you can still enjoy, so you can manage blood sugar day to day. This is dietary advice to use alongside your doctor's care, not treatment.",
        },
        category: HEALTH,
        priceBaht: 900,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(936611), photo(1640777)],
        packages: [
          {
            name: 'เริ่มต้นจัดจาน',
            description: 'หลักการจัดจานและเลือกแป้งที่ใช้ได้ทันที',
            en: { name: 'Build Your Plate', description: 'How to build a plate and choose carbohydrates, ready to use straight away.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'วางเมนูสองสัปดาห์',
            description: 'วางเมนูทุกมื้อสองสัปดาห์จากผลตรวจเลือดของคุณ',
            en: { name: 'Two-Week Menu', description: 'Every meal for two weeks, planned from your blood test results.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
      {
        name: 'อ่านฉลากโภชนาการและเลือกซื้อของให้เป็น',
        description:
          'ฉลากด้านหลังซองบอกอะไรมากกว่าที่คิด ฝึกอ่านหนึ่งหน่วยบริโภค น้ำตาล โซเดียม และไขมัน รู้จักสัญลักษณ์ทางเลือกสุขภาพ และคำโฆษณาบนหน้าห่อที่ชวนให้เข้าใจผิด จบแล้วเลือกซื้อของในซูเปอร์มาร์เก็ตได้มั่นใจขึ้น',
        en: {
          name: 'Read Nutrition Labels and Shop Smarter',
          description:
            'The back of the pack says more than you think. Practise reading serving sizes, sugar, sodium and fat, learn what the Healthier Choice symbol means, and spot the claims on the front that mislead. You leave able to shop the supermarket with more confidence.',
        },
        category: HEALTH,
        priceBaht: 450,
        durationMinutes: 30,
        photos: [photo(8422704), photo(16211537)],
        packages: [
          {
            name: 'ฝึกอ่านฉลาก',
            description: 'อ่านฉลากจากสินค้าที่คุณซื้อเป็นประจำ',
            en: { name: 'Label Practice', description: 'Read the labels on the products you buy regularly.' },
            durationMinutes: 30,
            priceBaht: 450,
          },
          {
            name: 'จัดรายการซื้อของใหม่',
            description: 'อ่านฉลากแล้วจัดรายการของที่ควรซื้อแทนของเดิม',
            en: { name: 'New Shopping List', description: 'Read the labels, then build a list of better swaps for what you buy now.' },
            durationMinutes: 60,
            priceBaht: 850,
          },
        ],
      },
      {
        name: 'อาหารสำหรับคุณแม่ตั้งครรภ์',
        description:
          'สำหรับคุณแม่ที่อยากกินให้พอทั้งตัวเองและลูก โดยน้ำหนักไม่ขึ้นเกินเกณฑ์ ดูสารอาหารที่ต้องการเพิ่มในแต่ละไตรมาส อาหารที่ควรเลี่ยง และวิธีกินให้ได้ในช่วงที่แพ้ท้อง ใช้ควบคู่กับคำแนะนำของแพทย์ที่ฝากครรภ์',
        en: {
          name: 'Eating Well During Pregnancy',
          description:
            'For mothers-to-be who want to eat enough for themselves and the baby without gaining more weight than they should. We cover the extra nutrients needed in each trimester, foods to avoid, and how to keep eating through morning sickness, alongside the advice of your antenatal doctor.',
        },
        category: HEALTH,
        priceBaht: 800,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(7485098), photo(5424676)],
        packages: [
          {
            name: 'วางหลักการกิน',
            description: 'สารอาหารสำคัญและอาหารที่ควรเลี่ยงในไตรมาสที่อยู่',
            en: { name: 'Eating Essentials', description: "The key nutrients and the foods to avoid in the trimester you're in." },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'วางเมนูรายสัปดาห์',
            description: 'เมนูหนึ่งสัปดาห์ที่ปรับตามอาการและน้ำหนักของคุณ',
            en: { name: 'Weekly Menu', description: 'A week of meals adjusted to your symptoms and weight.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'อาหารหลังคลอดและช่วงให้นมลูก',
        description:
          'สำหรับคุณแม่หลังคลอดที่อยากฟื้นตัวและมีน้ำนมพอ โดยค่อยๆ ลดน้ำหนักที่เพิ่มขึ้นช่วงตั้งครรภ์ ดูพลังงานและโปรตีนที่ต้องได้ต่อวัน อาหารที่ช่วยให้อิ่มนานในวันที่เวลาน้อย และเมนูที่ทำง่ายระหว่างเลี้ยงลูก ใช้ควบคู่กับคำแนะนำของแพทย์',
        en: {
          name: 'Eating After Birth and While Breastfeeding',
          description:
            "For new mothers who want to recover well and keep up their milk supply while gradually losing the weight gained in pregnancy. We work out the energy and protein you need each day, foods that keep you full on days with no time, and easy meals to make around a baby, alongside your doctor's advice.",
        },
        category: HEALTH,
        priceBaht: 800,
        durationMinutes: 45,
        photos: [photo(7484673), photo(7660426)],
        packages: [
          {
            name: 'วางหลักการกินหลังคลอด',
            description: 'สารอาหารที่ต้องได้และอาหารที่ควรเลี่ยงช่วงให้นม',
            en: { name: 'Postnatal Eating Basics', description: 'The nutrients you need and the foods to limit while breastfeeding.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'วางเมนูสองสัปดาห์',
            description: 'เมนูสองสัปดาห์ที่ทำได้เร็วและปรับตามน้ำหนักของคุณ',
            en: { name: 'Two-Week Menu', description: 'Two weeks of quick meals, adjusted to your weight.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
    ],
  },
  {
    email: 'life.apichat.b@advisory.demo',
    displayName: 'อภิชาติ บุญมา',
    fullName: 'อภิชาติ บุญมา',
    portrait: portrait(19746166),
    headline: 'นักวิทยาศาสตร์การกีฬาและโค้ชออกกำลังกาย',
    bio: 'จบปริญญาโทวิทยาศาสตร์การกีฬา ได้ใบรับรองผู้ฝึกสอนความแข็งแรง CSCS เคยดูแลโปรแกรมสุขภาพพนักงานของบริษัทประกันชีวิต 6 ปี ถนัดวางโปรแกรมให้คนทำงานที่มีเวลาน้อย เริ่มจากศูนย์ได้ และค่อยๆ เพิ่มความหนักอย่างปลอดภัย',
    en: {
      headline: 'Sports Scientist and Exercise Coach',
      bio: "Holds a master's in sports science and the CSCS strength and conditioning certification, and spent six years running the employee health programme at a life insurance company. He specialises in programmes for busy working people starting from zero, building up the load safely over time.",
    },
    services: [
      {
        name: 'วางโปรแกรมออกกำลังกายที่บ้านสำหรับมือใหม่',
        description:
          'ไม่ต้องมีฟิตเนส ใช้แค่เสื่อกับดัมเบลคู่เดียว วางโปรแกรมสัปดาห์ละสามวัน วันละ 30 นาที เริ่มจากท่าพื้นฐาน แล้วสอนวิธีเพิ่มความยากเมื่อร่างกายพร้อม',
        en: {
          name: 'Home Workout Plan for Beginners',
          description:
            'No gym needed, just a mat and a pair of dumbbells. We build a programme of three 30-minute sessions a week starting from basic movements, and show you how to make it harder when your body is ready.',
        },
        category: HEALTH,
        priceBaht: 800,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(4807549), photo(6193550)],
        packages: [
          {
            name: 'วางโปรแกรม',
            description: 'ได้โปรแกรมสี่สัปดาห์แรกพร้อมคลิปท่าอ้างอิง',
            en: { name: 'Programme Only', description: 'Your first four weeks, with reference clips for each move.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'วางโปรแกรมพร้อมฝึกท่า',
            description: 'วางโปรแกรมแล้วฝึกทุกท่าผ่านวิดีโอคอลจนทำถูก',
            en: { name: 'Programme and Coaching', description: 'Your programme, then every move practised over video until you get it right.' },
            durationMinutes: 75,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'ซ้อมวิ่งจนจบ 10 กิโลเมตรแรก',
        description:
          'สำหรับคนที่วิ่งได้ 2–3 กิโลเมตรแล้วและอยากลงงานวิ่ง 10K วางตารางซ้อม 8–10 สัปดาห์ ทั้งวันวิ่งเบา วันเพิ่มระยะ และวันพัก พร้อมวิธีป้องกันอาการบาดเจ็บที่นักวิ่งมือใหม่เจอบ่อย',
        en: {
          name: 'Train for Your First 10K',
          description:
            'For people who can already run two or three kilometres and want to enter a 10K. We set an eight- to ten-week schedule of easy runs, long runs and rest days, plus how to avoid the injuries new runners most often get.',
        },
        category: HEALTH,
        priceBaht: 750,
        durationMinutes: 45,
        photos: [photo(8985622), photo(8454941)],
        packages: [
          {
            name: 'วางตารางซ้อม',
            description: 'ตารางซ้อมรายสัปดาห์จนถึงวันแข่ง',
            en: { name: 'Training Schedule', description: 'A week-by-week schedule up to race day.' },
            durationMinutes: 45,
            priceBaht: 750,
          },
          {
            name: 'ตารางซ้อมพร้อมดูท่าวิ่ง',
            description: 'วางตารางและดูคลิปท่าวิ่งของคุณเพื่อปรับให้ถูก',
            en: { name: 'Schedule and Running Form', description: 'Your schedule, plus a look at a clip of your running form to correct it.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
      {
        name: 'เพิ่มกล้ามเนื้อสำหรับคนผอม',
        description:
          'กินเท่าไรก็ไม่ขึ้น หรือเล่นเวทแล้วไม่เห็นผล ดูทั้งโปรแกรมเวทที่เน้นท่าหลัก และปริมาณอาหารกับโปรตีนที่ต้องได้ต่อวัน ให้น้ำหนักที่เพิ่มเป็นกล้ามเนื้อมากกว่าไขมัน',
        en: {
          name: "Build Muscle If You're Naturally Skinny",
          description:
            "You eat plenty but can't gain weight, or you lift without seeing results. We look at both a weights programme built on the main lifts and how much food and protein you need each day, so the weight you gain is mostly muscle rather than fat.",
        },
        category: HEALTH,
        priceBaht: 800,
        durationMinutes: 45,
        photos: [photo(4164756), photo(18060021)],
        packages: [
          {
            name: 'ตรวจโปรแกรมเดิม',
            description: 'ดูโปรแกรมและการกินตอนนี้ แล้วบอกว่าติดอยู่ตรงไหน',
            en: { name: 'Current Routine Check', description: "We look at your current training and eating and find where you're stuck." },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'วางโปรแกรมเวทและอาหาร',
            description: 'โปรแกรมเวทสามเดือนพร้อมเป้าหมายอาหารและโปรตีนต่อวัน',
            en: { name: 'Training and Eating Plan', description: 'A three-month weights programme with daily food and protein targets.' },
            durationMinutes: 90,
            priceBaht: 1600,
          },
        ],
      },
      {
        name: 'ส่งคลิปให้ช่วยดูท่าออกกำลังกาย',
        description:
          'อัดคลิปท่าสควอท เดดลิฟต์ หรือท่าที่เล่นประจำส่งมาก่อนนัด แล้วดูทีละท่าว่าจุดไหนเสี่ยงบาดเจ็บ ควรปรับมุมหรือน้ำหนักอย่างไร พร้อมท่าเสริมที่ช่วยให้ทำท่าหลักได้ดีขึ้น',
        en: {
          name: 'Send a Clip for a Form Check',
          description:
            'Record your squat, deadlift or any regular exercise and send it before the session. We go through each movement for injury risks, how to adjust the angle or the load, and supporting exercises that improve your main lifts.',
        },
        category: HEALTH,
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(6246392), photo(6870416)],
        packages: [
          {
            name: 'ดูสามท่า',
            description: 'ดูคลิปสามท่าพร้อมจุดที่ต้องแก้',
            en: { name: 'Three Movements', description: 'Three clips reviewed, with what to fix in each.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'ดูท่าพร้อมวางโปรแกรมแก้',
            description: 'ดูท่าทั้งหมดแล้ววางท่าเสริมสำหรับจุดอ่อนที่เจอ',
            en: { name: 'Form Check and Fix Plan', description: 'A full review, plus supporting exercises for the weaknesses found.' },
            durationMinutes: 60,
            priceBaht: 950,
          },
        ],
      },
      {
        name: 'ยืดเหยียดแก้ปวดหลังจากการนั่งทำงาน',
        description:
          'สำหรับคนที่นั่งหน้าคอมทั้งวันจนปวดคอ บ่า และหลังล่าง ฝึกชุดท่ายืดเหยียดและเสริมความแข็งแรงสั้นๆ ที่ทำได้ที่โต๊ะทำงานและที่บ้าน วันละไม่เกิน 15 นาที หากปวดรุนแรงหรือมีอาการชา ควรพบแพทย์ก่อน',
        en: {
          name: 'Stretch Away Back Pain From Desk Work',
          description:
            'For people who sit at a computer all day and end up with sore necks, shoulders and lower backs. We practise short stretching and strengthening routines you can do at your desk and at home in 15 minutes a day. If the pain is severe or you have numbness, see a doctor first.',
        },
        category: HEALTH,
        priceBaht: 450,
        durationMinutes: 30,
        photos: [photo(6802944), photo(3822227)],
        packages: [
          {
            name: 'ชุดท่าพื้นฐาน',
            description: 'ฝึกชุดท่ายืดเหยียดสำหรับคนนั่งทำงาน',
            en: { name: 'Core Routine', description: 'A stretching routine for people who sit all day.' },
            durationMinutes: 30,
            priceBaht: 450,
          },
          {
            name: 'ชุดท่าเฉพาะตัว',
            description: 'ประเมินท่านั่งและจุดที่ปวด แล้ววางชุดท่าเฉพาะสำหรับคุณ',
            en: { name: 'Personal Routine', description: 'We assess how you sit and where it hurts, then build a routine just for you.' },
            durationMinutes: 60,
            priceBaht: 850,
          },
        ],
      },
    ],
  },
  {
    email: 'life.wanpen.j@advisory.demo',
    displayName: 'วันเพ็ญ จิตรภักดี',
    fullName: 'วันเพ็ญ จิตรภักดี',
    portrait: portrait(4473280),
    headline: 'โค้ชอาหารสุขภาพสำหรับครอบครัว',
    bio: 'จบวิทยาศาสตร์การอาหาร เปิดร้านอาหารสุขภาพในเชียงใหม่มา 10 ปี และผ่านหลักสูตรผู้ให้คำแนะนำด้านโภชนาการ ช่วยคนที่ต้องทำอาหารให้ทั้งบ้าน ตั้งแต่เด็กเล็กจนถึงผู้สูงอายุ ให้กินดีขึ้นด้วยวัตถุดิบจากตลาดใกล้บ้านโดยไม่ต้องเพิ่มงบ',
    en: {
      headline: 'Family Healthy Eating Coach',
      bio: 'A food science graduate who has run a healthy-food restaurant in Chiang Mai for ten years and completed a nutrition advisor course. She helps the people who cook for the whole household, from small children to grandparents, eat better with ingredients from the local market and without spending more.',
    },
    services: [
      {
        name: 'วางเมนูสุขภาพสำหรับทั้งบ้านหนึ่งสัปดาห์',
        description:
          'วางเมนูเช้า กลางวัน เย็นที่ทุกคนในบ้านกินด้วยกันได้ ใช้วัตถุดิบซ้ำกันให้คุ้ม ลดของทอดและเพิ่มผักแบบที่เด็กยังยอมกิน พร้อมรายการซื้อของสำหรับไปตลาดสัปดาห์ละครั้ง',
        en: {
          name: 'A Week of Healthy Meals for the Whole Family',
          description:
            'We plan breakfasts, lunches and dinners everyone at home can share, reuse ingredients so nothing is wasted, and cut back on fried food while adding vegetables in ways children will still eat, with a shopping list for one market trip a week.',
        },
        category: HEALTH,
        priceBaht: 650,
        durationMinutes: 45,
        photos: [photo(406152), photo(1640770)],
        packages: [
          {
            name: 'วางเมนูหนึ่งสัปดาห์',
            description: 'เมนูครบทุกมื้อพร้อมรายการซื้อของ',
            en: { name: 'One-Week Menu', description: 'Every meal planned, with a shopping list.' },
            durationMinutes: 45,
            priceBaht: 650,
          },
          {
            name: 'เมนูพร้อมสูตรทำล่วงหน้า',
            description: 'เมนูหนึ่งสัปดาห์พร้อมวิธีเตรียมวัตถุดิบล่วงหน้าในวันหยุด',
            en: { name: 'Menu and Weekend Prep', description: 'A week of meals, plus how to prep ingredients ahead on your day off.' },
            durationMinutes: 90,
            priceBaht: 1200,
          },
        ],
      },
      {
        name: 'ชวนลูกกินผักและจัดกล่องข้าวไปโรงเรียน',
        description:
          'ลูกเขี่ยผักทิ้งทุกมื้อ หรือกล่องข้าวกลับมาเหลือครึ่งกล่อง คุยเรื่องวิธีค่อยๆ ให้เด็กคุ้นกับผัก การจัดจานให้น่ากิน และไอเดียกล่องข้าวที่เตรียมเสร็จได้ใน 15 นาทีตอนเช้า',
        en: {
          name: 'Get Your Kids Eating Vegetables, and Pack Better School Lunches',
          description:
            'Your child pushes vegetables aside every meal, or the lunchbox comes home half full. We talk about getting children used to vegetables gradually, making plates look appealing, and lunchbox ideas you can put together in 15 minutes in the morning.',
        },
        category: HEALTH,
        priceBaht: 450,
        durationMinutes: 30,
        photos: [photo(6970103), photo(5852324)],
        packages: [
          {
            name: 'คุยเรื่องลูกกินยาก',
            description: 'หาวิธีที่เหมาะกับนิสัยการกินของลูกคุณ',
            en: { name: 'Picky Eater Talk', description: "Find approaches that suit your child's eating habits." },
            durationMinutes: 30,
            priceBaht: 450,
          },
          {
            name: 'วางเมนูกล่องข้าวสองสัปดาห์',
            description: 'ไอเดียกล่องข้าวสิบวันเรียนพร้อมวิธีเตรียมตอนเช้า',
            en: { name: 'Two Weeks of Lunchboxes', description: 'Ten school days of lunchbox ideas, with a quick morning routine.' },
            durationMinutes: 60,
            priceBaht: 850,
          },
        ],
      },
      {
        name: 'ลดหวานมันเค็มในอาหารของพ่อแม่สูงวัย',
        description:
          'สำหรับคนที่ทำอาหารให้พ่อแม่ที่เริ่มมีความดันหรือไขมันสูง ปรับสูตรอาหารที่ท่านชอบให้เค็มน้อยลงโดยรสชาติยังคุ้นเคย เลือกเนื้อสัตว์และวิธีปรุงที่เคี้ยวง่าย และจัดมื้อให้ได้โปรตีนพอ ใช้ควบคู่กับคำแนะนำของแพทย์ประจำตัวท่าน',
        en: {
          name: "Less Sugar, Fat and Salt in Your Parents' Meals",
          description:
            "For people cooking for parents who have started to have high blood pressure or cholesterol. We adapt the dishes they love to be less salty while still tasting familiar, choose meats and cooking methods that are easy to chew, and make sure meals have enough protein, alongside their own doctor's advice.",
        },
        category: HEALTH,
        priceBaht: 700,
        durationMinutes: 45,
        photos: [photo(4869356), photo(1059905)],
        packages: [
          {
            name: 'ปรับสูตรอาหารประจำบ้าน',
            description: 'ปรับเมนูที่ทำบ่อยที่สุดห้าเมนูให้เหมาะกับสุขภาพท่าน',
            en: { name: 'Adapt Your Family Recipes', description: 'Rework the five dishes you cook most to suit their health.' },
            durationMinutes: 45,
            priceBaht: 700,
          },
          {
            name: 'วางเมนูผู้สูงวัยหนึ่งสัปดาห์',
            description: 'เมนูหนึ่งสัปดาห์ที่คุมเกลือ น้ำตาล และไขมัน พร้อมรายการซื้อของ',
            en: { name: 'One-Week Menu for Older Parents', description: 'A week of meals with controlled salt, sugar and fat, plus a shopping list.' },
            durationMinutes: 90,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'จ่ายตลาดให้ได้ของดีในงบจำกัด',
        description:
          'วางงบค่ากับข้าวรายสัปดาห์ เลือกผักผลไม้ตามฤดู เทียบโปรตีนราคาประหยัดอย่างไข่ เต้าหู้ และปลา และเก็บวัตถุดิบให้อยู่ได้นาน ให้กินดีขึ้นโดยไม่ต้องจ่ายเพิ่ม',
        en: {
          name: 'Shop for Good Food on a Tight Budget',
          description:
            'We set a weekly grocery budget, choose fruit and vegetables in season, compare low-cost proteins like eggs, tofu and fish, and store ingredients so they last, so you eat better without paying more.',
        },
        category: HEALTH,
        priceBaht: 400,
        durationMinutes: 30,
        photos: [photo(9811625), photo(7990381), photo(27175522)],
        packages: [
          {
            name: 'วางงบค่ากับข้าว',
            description: 'ดูค่าใช้จ่ายตอนนี้และตั้งงบรายสัปดาห์ที่ทำได้',
            en: { name: 'Set a Food Budget', description: 'Review current spending and set a weekly budget you can keep.' },
            durationMinutes: 30,
            priceBaht: 400,
          },
          {
            name: 'วางงบพร้อมรายการซื้อของ',
            description: 'ตั้งงบ วางรายการซื้อของ และวิธีเก็บวัตถุดิบให้อยู่ได้ทั้งสัปดาห์',
            en: { name: 'Budget and Shopping List', description: 'A budget, a shopping list, and how to store food so it lasts the week.' },
            durationMinutes: 60,
            priceBaht: 750,
          },
        ],
      },
    ],
  },
  {
    email: 'life.thanyaporn.r@advisory.demo',
    displayName: 'ธันยพร รุ่งโรจน์',
    fullName: 'ธันยพร รุ่งโรจน์',
    portrait: portrait(2709388),
    headline: 'นักกำหนดอาหารด้านกีฬาและอาหารแพลนต์เบส',
    bio: 'นักกำหนดอาหารวิชาชีพที่ดูแลนักกีฬาของสโมสรวิ่งและไตรกีฬามา 4 ปี และกินแพลนต์เบสเองมา 6 ปี ช่วยคนที่ออกกำลังกายสม่ำเสมอให้กินพอกับการซ้อม และช่วยคนที่อยากลดเนื้อสัตว์ให้ได้สารอาหารครบ โดยไม่ต้องพึ่งอาหารเสริมเกินจำเป็น',
    en: {
      headline: 'Sports and Plant-Based Dietitian',
      bio: 'A registered dietitian who has worked with running and triathlon club athletes for four years, and has eaten plant-based herself for six. She helps people who train regularly eat enough to support their training, and helps those cutting back on meat get complete nutrition without relying on unnecessary supplements.',
    },
    services: [
      {
        name: 'เปลี่ยนมากินแพลนต์เบสให้ได้สารอาหารครบ',
        description:
          'สำหรับคนที่อยากลดหรือเลิกกินเนื้อสัตว์ ดูว่าจะได้โปรตีน ธาตุเหล็ก แคลเซียม และวิตามินบี 12 จากไหน จัดมื้อจากอาหารไทยที่หาง่าย และวางแผนเปลี่ยนแบบค่อยเป็นค่อยไป',
        en: {
          name: 'Go Plant-Based Without Missing Nutrients',
          description:
            'For anyone cutting down on or giving up meat. We work out where your protein, iron, calcium and vitamin B12 will come from, build meals from easy-to-find Thai food, and plan a gradual switch.',
        },
        category: HEALTH,
        priceBaht: 750,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(28618632), photo(36904790)],
        packages: [
          {
            name: 'เริ่มต้นแพลนต์เบส',
            description: 'แหล่งสารอาหารสำคัญและเมนูไทยที่เริ่มได้ทันที',
            en: { name: 'Plant-Based Basics', description: 'Where the key nutrients come from, and Thai dishes to start with.' },
            durationMinutes: 45,
            priceBaht: 750,
          },
          {
            name: 'แผนเปลี่ยนสี่สัปดาห์',
            description: 'แผนลดเนื้อสัตว์ทีละขั้นพร้อมเมนูรายสัปดาห์',
            en: { name: 'Four-Week Switch Plan', description: 'A step-by-step plan for cutting out meat, with weekly menus.' },
            durationMinutes: 90,
            priceBaht: 1400,
          },
        ],
      },
      {
        name: 'กินให้พอกับการซ้อมสำหรับนักวิ่ง',
        description:
          'ซ้อมหนักแต่เหนื่อยเร็วหรือฟื้นตัวช้า ดูว่ากินพลังงานและคาร์โบไฮเดรตพอไหม วางมื้อก่อนและหลังซ้อม และแผนกินดื่มในวันแข่งฮาล์ฟมาราธอนหรือมาราธอน',
        en: {
          name: 'Fuel Your Running Properly',
          description:
            "You train hard but tire quickly or recover slowly. We check whether you're getting enough energy and carbohydrate, plan meals before and after training, and set an eating and drinking plan for half-marathon or marathon race day.",
        },
        category: HEALTH,
        priceBaht: 800,
        durationMinutes: 45,
        photos: [photo(3764154), photo(3021839)],
        packages: [
          {
            name: 'ตรวจการกินช่วงซ้อม',
            description: 'ดูว่ากินพอกับปริมาณการซ้อมตอนนี้หรือไม่',
            en: { name: 'Training Diet Check', description: "Whether you're eating enough for the training you do now." },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'แผนกินถึงวันแข่ง',
            description: 'แผนกินช่วงซ้อมจนถึงแผนกินดื่มระหว่างวันแข่ง',
            en: { name: 'Race-Day Fuelling Plan', description: 'From training-block meals to what to eat and drink during the race.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'ลดน้ำตาลในชีวิตประจำวันโดยไม่หักดิบ',
        description:
          'ติดชานมไข่มุก กาแฟเย็น หรือขนมหลังมื้อ ดูว่าน้ำตาลแฝงมาจากไหนบ้างในหนึ่งวัน แล้ววางแผนลดทีละขั้นที่ทำได้จริง พร้อมของว่างทดแทนที่ยังอร่อย',
        en: {
          name: 'Cut Down on Sugar Without Going Cold Turkey',
          description:
            'Hooked on bubble tea, iced coffee or dessert after meals? We find where the hidden sugar in your day comes from, then plan a step-by-step reduction you can stick to, with snacks that still taste good.',
        },
        category: HEALTH,
        priceBaht: 450,
        durationMinutes: 30,
        photos: [photo(17292508), photo(9004736)],
        packages: [
          {
            name: 'หาน้ำตาลแฝง',
            description: 'ไล่ดูเครื่องดื่มและของว่างที่กินในหนึ่งวัน',
            en: { name: 'Find the Hidden Sugar', description: 'Go through the drinks and snacks in a typical day.' },
            durationMinutes: 30,
            priceBaht: 450,
          },
          {
            name: 'แผนลดน้ำตาลหกสัปดาห์',
            description: 'แผนลดทีละขั้นพร้อมรายการของว่างทดแทน',
            en: { name: 'Six-Week Sugar Plan', description: 'A gradual reduction plan with a list of swap snacks.' },
            durationMinutes: 60,
            priceBaht: 850,
          },
        ],
      },
      {
        name: 'เตรียมอาหารแพลนต์เบสล่วงหน้าทั้งสัปดาห์',
        description:
          'ใช้เวลาวันหยุดสองชั่วโมงเตรียมธัญพืช ถั่ว เต้าหู้ และผักไว้ใช้ทั้งสัปดาห์ วางเมนูที่สลับวัตถุดิบชุดเดียวกันได้หลายแบบ เก็บให้อยู่ได้นานโดยไม่เสียรส และยังได้โปรตีนครบทุกมื้อ',
        en: {
          name: 'Prep a Week of Plant-Based Meals Ahead',
          description:
            'Spend two hours on your day off preparing grains, beans, tofu and vegetables for the whole week. We plan menus that mix the same ingredients in different ways, store them so they keep their flavour, and still get enough protein at every meal.',
        },
        category: HEALTH,
        priceBaht: 650,
        durationMinutes: 45,
        photos: [photo(5842504), photo(5842509)],
        packages: [
          {
            name: 'วางเมนูเตรียมล่วงหน้า',
            description: 'เมนูหนึ่งสัปดาห์พร้อมรายการวัตถุดิบที่ต้องเตรียม',
            en: { name: 'Prep Menu', description: 'A week of meals, plus the list of ingredients to prepare.' },
            durationMinutes: 45,
            priceBaht: 650,
          },
          {
            name: 'วางเมนูพร้อมขั้นตอนเตรียม',
            description: 'เมนู ลำดับการเตรียมในวันหยุด และวิธีเก็บแต่ละอย่าง',
            en: { name: 'Menu and Prep Order', description: 'The menu, the order to prepare things on your day off, and how to store each one.' },
            durationMinutes: 90,
            priceBaht: 1200,
          },
        ],
      },
    ],
  },

  // ── Design and content ─────────────────────────────────────────────────
  {
    email: 'life.suttipong.c@advisory.demo',
    displayName: 'สุทธิพงษ์ ช่างประดิษฐ์',
    fullName: 'สุทธิพงษ์ ช่างประดิษฐ์',
    portrait: portrait(6204853),
    headline: 'นักออกแบบแบรนด์และอัตลักษณ์องค์กร',
    bio: 'ออกแบบแบรนด์มา 15 ปี เริ่มจากเอเจนซีออกแบบในกรุงเทพฯ ก่อนเปิดสตูดิโอเล็กของตัวเอง ทำอัตลักษณ์ให้ร้านกาแฟ แบรนด์สินค้าชุมชน และธุรกิจครอบครัวมาแล้วกว่า 120 แบรนด์ ถนัดทำแบรนด์ให้ดูดีในงบของธุรกิจเล็ก และอธิบายเหตุผลของการออกแบบให้เจ้าของเข้าใจ',
    en: {
      headline: 'Brand and Identity Designer',
      bio: 'Fifteen years in brand design, starting at a Bangkok design agency before opening his own small studio. He has created identities for more than 120 brands, from coffee shops and community products to family businesses, and specialises in making small businesses look good on a small-business budget, explaining the reasoning so owners understand it.',
    },
    services: [
      {
        name: 'ออกแบบโลโก้และ CI ร้านเล็ก',
        description:
          'สำหรับร้านที่เพิ่งเปิดหรือใช้โลโก้ที่ทำเองมานาน คุยเรื่องลูกค้า บุคลิกร้าน และคู่แข่ง แล้ววางทิศทางโลโก้ สี และฟอนต์ที่ใช้ได้ทั้งป้ายร้าน แก้ว และโพสต์ออนไลน์ จบด้วยบรีฟที่ใช้ออกแบบต่อได้ทันที',
        en: {
          name: 'Logo and Corporate Identity for a Small Shop',
          description:
            "For new shops, or ones still using a logo they made themselves. We talk about your customers, the shop's personality and competitors, then set a direction for the logo, colours and fonts that works on signs, cups and social posts. You leave with a brief ready for the design work.",
        },
        category: DESIGN,
        priceBaht: 1500,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(7598018), photo(6583367)],
        packages: [
          {
            name: 'วางทิศทางแบรนด์',
            description: 'คุยและสรุปทิศทางพร้อมภาพอ้างอิง',
            en: { name: 'Brand Direction', description: 'Talk it through and agree a direction, with reference images.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'ร่างโลโก้พร้อมชุดสี',
            description: 'ร่างแนวทางโลโก้สองแบบพร้อมชุดสีและฟอนต์',
            en: { name: 'Logo Sketches and Palette', description: 'Two logo directions sketched, with a colour palette and fonts.' },
            durationMinutes: 120,
            priceBaht: 3500,
          },
          {
            name: 'คู่มือ CI ฉบับย่อ',
            description: 'สรุปการใช้โลโก้ สี และฟอนต์เป็นคู่มือสั้นสำหรับทีม',
            en: { name: 'Short CI Guide', description: 'A short guide for your team on using the logo, colours and fonts.' },
            durationMinutes: 180,
            priceBaht: 6500,
          },
        ],
      },
      {
        name: 'ตั้งชื่อแบรนด์และวางบุคลิกแบรนด์',
        description:
          'ระดมชื่อที่จำง่าย ออกเสียงได้ทั้งไทยและอังกฤษ และยังไม่ซ้ำกับใคร พร้อมวางน้ำเสียงและบุคลิกที่แบรนด์จะใช้สื่อสาร ก่อนลงทุนออกแบบหรือจดทะเบียนเครื่องหมายการค้า',
        en: {
          name: 'Name Your Brand and Define Its Personality',
          description:
            "We brainstorm names that are easy to remember, work in both Thai and English and aren't already taken, and set the tone and personality the brand will speak with, before you invest in design or a trademark.",
        },
        category: DESIGN,
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(7598020), photo(6475578)],
        packages: [
          {
            name: 'ระดมชื่อ',
            description: 'ได้รายชื่อที่คัดแล้วห้าถึงสิบชื่อพร้อมเหตุผล',
            en: { name: 'Name Brainstorm', description: 'A shortlist of five to ten names, with the reasoning for each.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'ชื่อพร้อมบุคลิกแบรนด์',
            description: 'เลือกชื่อสุดท้ายและเขียนบุคลิกกับน้ำเสียงของแบรนด์',
            en: { name: 'Name and Personality', description: "Pick the final name and write down the brand's personality and tone." },
            durationMinutes: 90,
            priceBaht: 1800,
          },
        ],
      },
      {
        name: 'ออกแบบบรรจุภัณฑ์สินค้าชุมชนและของฝาก',
        description:
          'สำหรับผู้ผลิตสินค้าชุมชนหรือของฝากที่อยากขึ้นห้างหรือขายออนไลน์ เลือกวัสดุ ขนาด และข้อมูลที่ต้องมีบนฉลาก วางหน้าตาให้เด่นบนชั้นวาง และคุมต้นทุนต่อชิ้นให้ยังมีกำไร',
        en: {
          name: 'Packaging for Community Products and Souvenirs',
          description:
            'For makers of community products or local souvenirs who want to get into stores or sell online. We choose materials, sizes and the information the label must carry, design a look that stands out on the shelf, and keep the cost per unit low enough to stay profitable.',
        },
        category: DESIGN,
        priceBaht: 1500,
        durationMinutes: 60,
        photos: [photo(31438304), photo(15764763)],
        packages: [
          {
            name: 'วางแนวทางบรรจุภัณฑ์',
            description: 'เลือกวัสดุ ขนาด และข้อมูลบนฉลากที่ต้องมี',
            en: { name: 'Packaging Direction', description: 'Choose materials, sizes and the label information required.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'ร่างแบบพร้อมคุมต้นทุน',
            description: 'ร่างหน้าตาบรรจุภัณฑ์และเทียบราคาโรงพิมพ์ให้ได้ต้นทุนที่ตั้งไว้',
            en: { name: 'Design Draft and Costing', description: 'Draft the look and compare printer quotes to hit your target cost.' },
            durationMinutes: 120,
            priceBaht: 3200,
          },
        ],
      },
      {
        name: 'รีวิวพอร์ตกราฟิกดีไซเนอร์ก่อนสมัครงาน',
        description:
          'ส่งพอร์ตมาก่อนนัด ดูจากมุมคนจ้างว่าควรเลือกงานไหนขึ้นก่อน งานไหนควรตัด และควรเล่ากระบวนการคิดเบื้องหลังงานอย่างไร ให้เอเจนซีหรือบริษัทเห็นว่าคุณแก้โจทย์ได้ ไม่ใช่แค่ทำงานสวย',
        en: {
          name: 'Graphic Design Portfolio Review Before You Apply',
          description:
            'Send your portfolio ahead of the session. Looking at it as an employer would, we decide which work to lead with, what to cut, and how to explain the thinking behind each piece, so agencies and companies see you solve briefs rather than just make things look nice.',
        },
        category: DESIGN,
        priceBaht: 800,
        durationMinutes: 45,
        photos: [photo(5582592), photo(4378648)],
        packages: [
          {
            name: 'รีวิวพอร์ต',
            description: 'ความเห็นทีละงานพร้อมลำดับที่ควรจัดใหม่',
            en: { name: 'Portfolio Review', description: 'Comments on each piece and a better running order.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'รีวิวพร้อมซ้อมนำเสนอ',
            description: 'รีวิวพอร์ตแล้วซ้อมเล่างานเหมือนอยู่ในห้องสัมภาษณ์',
            en: { name: 'Review and Presentation Practice', description: 'A review, then practice presenting your work as in an interview.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
    ],
  },
  {
    email: 'life.penpitcha.n@advisory.demo',
    displayName: 'เพ็ญพิชชา นาคสวัสดิ์',
    fullName: 'เพ็ญพิชชา นาคสวัสดิ์',
    portrait: portrait(1660696),
    headline: 'นักวางแผนคอนเทนต์ TikTok และโซเชียลสำหรับร้านค้า',
    bio: 'ทำคอนเทนต์ให้แบรนด์ความงามและร้านค้าออนไลน์มา 7 ปี เคยเป็นหัวหน้าทีมคอนเทนต์ของแบรนด์เครื่องสำอางไทยที่เติบโตจาก TikTok ช่วยเจ้าของร้านที่ไม่มีทีม ให้วางแผนและถ่ายคอนเทนต์เองได้ด้วยมือถือเครื่องเดียว โดยวัดผลจากยอดขาย ไม่ใช่แค่ยอดวิว',
    en: {
      headline: 'TikTok and Social Content Planner for Shops',
      bio: 'Seven years making content for beauty brands and online stores, including leading the content team at a Thai cosmetics brand that grew on TikTok. She helps shop owners without a team plan and shoot their own content on a single phone, measuring results in sales rather than just views.',
    },
    services: [
      {
        name: 'วางแผนคอนเทนต์ TikTok ให้ร้าน 30 วัน',
        description:
          'ดูสินค้า ลูกค้า และคู่แข่ง แล้ววางหัวข้อคลิป 30 วัน แบ่งเป็นคลิปขายของ คลิปให้ความรู้ และคลิปเบื้องหลัง พร้อมฮุกสามวินาทีแรกของแต่ละคลิปและเวลาที่ควรโพสต์',
        en: {
          name: 'A 30-Day TikTok Content Plan for Your Shop',
          description:
            'We look at your products, customers and competitors, then plan 30 days of video topics split between selling, educational and behind-the-scenes clips, with an opening three-second hook for each and the best times to post.',
        },
        category: DESIGN,
        priceBaht: 600,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(12673988), photo(6333681)],
        packages: [
          {
            name: 'รีวิวช่องเดิม',
            description: 'ดูคลิปที่ลงไปแล้วและบอกว่าควรปรับอะไร',
            en: { name: 'Channel Review', description: "A look at what you've posted so far and what to change." },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'วางแผน 30 วัน',
            description: 'หัวข้อคลิปครบ 30 วันพร้อมฮุกเปิดคลิป',
            en: { name: '30-Day Plan', description: 'Thirty days of video topics, each with an opening hook.' },
            durationMinutes: 90,
            priceBaht: 1800,
          },
          {
            name: 'วางแผนพร้อมสคริปต์ 10 คลิป',
            description: 'แผน 30 วันและเขียนสคริปต์คลิปแรกสิบคลิปไปด้วยกัน',
            en: { name: 'Plan and 10 Scripts', description: 'The 30-day plan, plus the first ten scripts written together.' },
            durationMinutes: 120,
            priceBaht: 2800,
          },
        ],
      },
      {
        name: 'เริ่มทำช่อง YouTube ให้มีคนดูประจำ',
        description:
          'เลือกหัวข้อช่องที่ทำต่อเนื่องได้จริง วางรูปแบบคลิป หน้าปก และชื่อคลิปที่คนอยากกดดู พร้อมตารางลงคลิปที่ทำไหวควบคู่กับงานหลัก',
        en: {
          name: 'Start a YouTube Channel People Come Back To',
          description:
            'We choose a channel topic you can keep up, set a video format, thumbnails and titles people want to click, and a posting schedule you can manage alongside your main work.',
        },
        category: DESIGN,
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(8303436), photo(7383648)],
        packages: [
          {
            name: 'วางคอนเซปต์ช่อง',
            description: 'เลือกหัวข้อช่องและรูปแบบคลิปหลัก',
            en: { name: 'Channel Concept', description: 'Choose the channel topic and main video format.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'วางช่องพร้อมแผนสามเดือน',
            description: 'คอนเซปต์ หน้าปก ชื่อคลิป และตารางลงคลิปสามเดือน',
            en: { name: 'Channel and Three-Month Plan', description: 'Concept, thumbnails, titles and a three-month posting schedule.' },
            durationMinutes: 90,
            priceBaht: 1600,
          },
        ],
      },
      {
        name: 'ไลฟ์ขายของให้คนดูอยู่นานและกดสั่ง',
        description:
          'วางโครงไลฟ์หนึ่งชั่วโมง ตั้งแต่ช่วงเปิด การเล่าสินค้า โปรโมชันที่กระตุ้นให้สั่ง และการตอบคอมเมนต์ พร้อมจัดมุมกล้องและไฟที่บ้านให้ภาพดูน่าเชื่อถือ',
        en: {
          name: 'Live-Stream Selling That Keeps Viewers and Gets Orders',
          description:
            'We structure a one-hour live, from the opening and presenting products to promotions that prompt orders and handling comments, and set up your camera angle and lighting at home so the stream looks trustworthy.',
        },
        category: DESIGN,
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(12433017), photo(28772534)],
        packages: [
          {
            name: 'วางโครงไลฟ์',
            description: 'โครงไลฟ์หนึ่งชั่วโมงพร้อมการจัดมุมกล้อง',
            en: { name: 'Live Structure', description: 'A one-hour live outline plus camera set-up.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'วางโครงพร้อมซ้อมไลฟ์',
            description: 'วางโครงแล้วซ้อมไลฟ์สั้นๆ พร้อมฟีดแบ็ก',
            en: { name: 'Structure and Rehearsal', description: 'The outline, then a short practice live with feedback.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
      {
        name: 'เขียนแคปชันขายของให้คนกดสั่ง',
        description:
          'ปรับแคปชันโพสต์ขายของให้สั้น ชัด และพูดถึงสิ่งที่ลูกค้าได้ ไม่ใช่แค่สเปกสินค้า ฝึกเขียนจากสินค้าจริงของคุณ พร้อมแม่แบบที่ใช้ต่อได้ทุกโพสต์',
        en: {
          name: 'Write Captions That Make People Order',
          description:
            'We make your sales captions short, clear and focused on what the customer gets rather than just product specs, practising on your real products, with templates you can reuse for every post.',
        },
        category: DESIGN,
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(3278757), photo(9052143)],
        packages: [
          {
            name: 'แก้แคปชันเดิม',
            description: 'ปรับแคปชันที่ใช้อยู่ห้าโพสต์',
            en: { name: 'Caption Fix', description: 'Rework five captions you already use.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'ฝึกเขียนพร้อมแม่แบบ',
            description: 'ฝึกเขียนจากสินค้าจริงและได้แม่แบบแคปชันสามแบบ',
            en: { name: 'Practice and Templates', description: 'Practise on your real products and leave with three caption templates.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
        ],
      },
    ],
  },
  {
    email: 'life.jirayu.p@advisory.demo',
    displayName: 'จิรายุ พงษ์ไพบูลย์',
    fullName: 'จิรายุ พงษ์ไพบูลย์',
    portrait: portrait(10696927),
    headline: 'ช่างภาพสินค้าและผู้กำกับวิดีโอโฆษณา',
    bio: 'ช่างภาพและผู้กำกับวิดีโอโฆษณามา 10 ปี ถ่ายงานให้แบรนด์อาหาร สกินแคร์ และร้านค้าออนไลน์ เคยสอนเวิร์กช็อปถ่ายภาพสินค้าด้วยมือถือให้ผู้ประกอบการรายย่อยมาแล้วกว่า 40 รุ่น เน้นวิธีที่ใช้อุปกรณ์น้อยแต่ได้ภาพที่ช่วยขายของได้จริง',
    en: {
      headline: 'Product Photographer and Video Director',
      bio: 'Ten years as a photographer and commercial video director for food, skincare and online retail brands. He has run more than 40 rounds of phone product photography workshops for small business owners, focusing on methods that need little equipment but produce images that actually help sell.',
    },
    services: [
      {
        name: 'ถ่ายรูปสินค้าด้วยมือถือให้ดูน่าซื้อ',
        description:
          'ใช้แค่มือถือ แสงจากหน้าต่าง และของรอบบ้าน ฝึกจัดองค์ประกอบ มุมกล้อง และฉากหลังสำหรับรูปสินค้าบนหน้าร้านออนไลน์และโซเชียล พร้อมแต่งภาพในแอปให้สีตรงกับของจริง',
        en: {
          name: 'Take Product Photos on Your Phone That Sell',
          description:
            'With just a phone, window light and things around the house, we practise composition, camera angles and backdrops for online store and social media product shots, and edit in an app so the colours match the real product.',
        },
        category: DESIGN,
        priceBaht: 900,
        durationMinutes: 60,
        trialMinutes: 15,
        photos: [photo(593319), photo(370474), photo(821652)],
        packages: [
          {
            name: 'ฝึกพื้นฐาน',
            description: 'แสง มุมกล้อง และฉากหลังจากของที่มีในบ้าน',
            en: { name: 'The Basics', description: 'Light, angles and backdrops from things you have at home.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
          {
            name: 'ถ่ายสินค้าจริงครบชุด',
            description: 'ฝึกถ่ายสินค้าจริงของคุณครบทุกมุมที่หน้าร้านต้องใช้',
            en: { name: 'Full Product Set', description: 'Shoot your real products from every angle your store page needs.' },
            durationMinutes: 120,
            priceBaht: 1700,
          },
        ],
      },
      {
        name: 'ตัดต่อวิดีโอสั้นด้วย CapCut ให้ดูมืออาชีพ',
        description:
          'ฝึกตัดต่อคลิปสั้นตั้งแต่เรียงช็อต ใส่ซับไตเติล เลือกเพลง จนถึงจังหวะตัดที่ทำให้คนดูไม่ปัดทิ้ง ฝึกจากฟุตเทจของคุณเองจนได้คลิปพร้อมโพสต์หนึ่งคลิป',
        en: {
          name: 'Edit Short Videos in CapCut Like a Pro',
          description:
            'We practise short-video editing from ordering shots, adding subtitles and choosing music to the cutting rhythm that stops viewers swiping away, working on your own footage until you have one clip ready to post.',
        },
        category: DESIGN,
        priceBaht: 900,
        durationMinutes: 60,
        photos: [photo(7679465), photo(29505140)],
        packages: [
          {
            name: 'ตัดต่อคลิปแรก',
            description: 'ตัดต่อคลิปสั้นหนึ่งคลิปจากฟุตเทจของคุณ',
            en: { name: 'Your First Edit', description: 'Edit one short clip from your own footage.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
          {
            name: 'ตัดต่อพร้อมทำเทมเพลต',
            description: 'ตัดต่อคลิปและตั้งเทมเพลตไว้ใช้กับคลิปต่อไป',
            en: { name: 'Edit and Template', description: 'Edit a clip and set up a template for the next ones.' },
            durationMinutes: 90,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'จัดมุมถ่ายวิดีโอและไฟที่บ้านในงบไม่เกินหมื่น',
        description:
          'เลือกไฟ ขาตั้ง ไมค์ และฉากหลังให้คุ้มงบ จัดตำแหน่งไฟให้หน้าและสินค้าดูสว่างเป็นธรรมชาติ และตั้งค่ากล้องหรือมือถือให้ภาพคมชัดเท่ากันทุกครั้งที่ถ่าย',
        en: {
          name: 'Set Up a Home Video Corner and Lighting for Under 10,000 Baht',
          description:
            'We choose lights, stands, a mic and a backdrop that give the most for your budget, position the lights so faces and products look naturally bright, and set up your camera or phone so every shoot looks equally sharp.',
        },
        category: DESIGN,
        priceBaht: 800,
        durationMinutes: 45,
        photos: [photo(29877910), photo(25526512), photo(12616007)],
        packages: [
          {
            name: 'เลือกอุปกรณ์',
            description: 'รายการอุปกรณ์ที่ควรซื้อตามงบของคุณ',
            en: { name: 'Gear List', description: 'A list of what to buy for your budget.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'จัดมุมผ่านวิดีโอคอล',
            description: 'จัดไฟและตั้งค่ากล้องในพื้นที่จริงของคุณผ่านวิดีโอคอล',
            en: { name: 'Live Set-Up Over Video', description: 'Arrange the lights and camera settings in your actual space over a video call.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'เริ่มรับงานช่างภาพฟรีแลนซ์',
        description:
          'สำหรับคนที่ถ่ายภาพเป็นแล้วและอยากเริ่มรับงานจริง วางแนวงานที่จะรับ ตั้งราคาแพ็กเกจ ทำพอร์ตชุดแรก และเตรียมข้อตกลงง่ายๆ กับลูกค้า เพื่อไม่ให้ต้องแก้งานไม่จบ',
        en: {
          name: 'Start Taking Freelance Photography Jobs',
          description:
            "For people who can already shoot and want to start taking paid work. We decide what kind of jobs to take, price your packages, put together a first portfolio, and prepare a simple client agreement so revisions don't go on forever.",
        },
        category: DESIGN,
        priceBaht: 800,
        durationMinutes: 45,
        photos: [photo(9396401), photo(7383646), photo(1932666)],
        packages: [
          {
            name: 'วางแนวงานและราคา',
            description: 'เลือกประเภทงานที่จะรับและตั้งราคาแพ็กเกจ',
            en: { name: 'Niche and Pricing', description: 'Choose the work you will take on and price your packages.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'เริ่มรับงานครบชุด',
            description: 'ราคา พอร์ตชุดแรก และข้อตกลงกับลูกค้าในนัดเดียว',
            en: { name: 'Ready to Take Bookings', description: 'Pricing, a first portfolio and a client agreement in one session.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'ปรับสีวิดีโอให้เป็นโทนเดียวกับแบรนด์',
        description:
          'ฝึกแก้สีพื้นฐาน ทั้งไวต์บาลานซ์ แสง และคอนทราสต์ แล้วทำโทนสีประจำแบรนด์ที่เซฟไว้ใช้ซ้ำได้ ให้คลิปทุกตัวดูเป็นชุดเดียวกันแม้ถ่ายคนละวัน',
        en: {
          name: 'Colour Grade Your Videos to Match Your Brand',
          description:
            'We practise basic colour correction, white balance, exposure and contrast, then build a brand colour look you can save and reuse, so every clip looks like part of the same set even when shot on different days.',
        },
        category: DESIGN,
        priceBaht: 1000,
        durationMinutes: 60,
        photos: [photo(32774292), photo(30229850)],
        packages: [
          {
            name: 'แก้สีพื้นฐาน',
            description: 'ฝึกแก้ไวต์บาลานซ์ แสง และคอนทราสต์',
            en: { name: 'Colour Correction Basics', description: 'Practise fixing white balance, exposure and contrast.' },
            durationMinutes: 60,
            priceBaht: 1000,
          },
          {
            name: 'ทำโทนสีประจำแบรนด์',
            description: 'แก้สีพื้นฐานแล้วสร้างโทนสีของแบรนด์ที่เซฟใช้ซ้ำได้',
            en: { name: 'Brand Colour Look', description: 'Correction basics, then a reusable colour look for your brand.' },
            durationMinutes: 120,
            priceBaht: 1800,
          },
        ],
      },
    ],
  },
  {
    email: 'life.orawan.s@advisory.demo',
    displayName: 'อรวรรณ ศรีบุญเรือง',
    fullName: 'อรวรรณ ศรีบุญเรือง',
    portrait: portrait(4965002),
    headline: 'หัวหน้าทีมออกแบบ UX/UI',
    bio: 'ออกแบบแอปและเว็บไซต์มา 10 ปี ปัจจุบันเป็นหัวหน้าทีมออกแบบ UX/UI ของบริษัทฟินเทคในกรุงเทพฯ เคยสัมภาษณ์และรับนักออกแบบเข้าทีมมากว่า 30 คน ช่วยทั้งคนที่อยากเข้าสายงานนี้ และเจ้าของธุรกิจที่อยากให้หน้าเว็บหรือแอปใช้งานง่ายขึ้น',
    en: {
      headline: 'UX/UI Design Lead',
      bio: 'Ten years designing apps and websites, now leading the UX/UI design team at a Bangkok fintech company. She has interviewed and hired more than 30 designers, and helps both people trying to break into the field and business owners who want their website or app to be easier to use.',
    },
    services: [
      {
        name: 'รีวิวพอร์ต UX/UI ก่อนสมัครงาน',
        description:
          'ดูพอร์ตจากมุมคนสัมภาษณ์ ว่าเคสสตัดีเล่าปัญหา การตัดสินใจ และผลลัพธ์ชัดแค่ไหน ควรเลือกงานไหนขึ้นก่อน และตัดอะไรออก พร้อมคำถามที่มักโดนถามจากพอร์ตแบบนี้',
        en: {
          name: 'UX/UI Portfolio Review Before You Apply',
          description:
            "We look at your portfolio from the interviewer's side: how clearly each case study explains the problem, your decisions and the results, which work to lead with and what to cut, plus the questions a portfolio like yours usually prompts.",
        },
        category: DESIGN,
        priceBaht: 900,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(12453596), photo(29542363)],
        packages: [
          {
            name: 'รีวิวพอร์ต',
            description: 'ความเห็นทีละเคสสตัดีพร้อมสิ่งที่ควรแก้',
            en: { name: 'Portfolio Review', description: 'Comments on each case study and what to change.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'รีวิวพร้อมสัมภาษณ์จำลอง',
            description: 'รีวิวพอร์ตแล้วสัมภาษณ์จำลองแบบเล่าเคสสตัดี',
            en: { name: 'Review and Mock Interview', description: 'A review, then a mock interview where you walk through a case study.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
      {
        name: 'ออกแบบโพสต์และสื่อร้านด้วย Canva',
        description:
          'สำหรับเจ้าของร้านที่ทำกราฟิกเอง ตั้งเทมเพลตโพสต์ สตอรี่ และเมนูใน Canva ให้ใช้สีและฟอนต์ชุดเดียวกันทั้งร้าน แล้วฝึกปรับเทมเพลตให้ได้โพสต์ใหม่ภายในสิบนาที',
        en: {
          name: "Design Your Shop's Posts and Materials in Canva",
          description:
            'For shop owners who make their own graphics. We set up Canva templates for posts, stories and menus in one consistent set of colours and fonts, then practise adapting them so a new post takes ten minutes.',
        },
        category: DESIGN,
        priceBaht: 800,
        durationMinutes: 60,
        photos: [photo(17771096), photo(13929374)],
        packages: [
          {
            name: 'ตั้งเทมเพลตโพสต์',
            description: 'ตั้งเทมเพลตโพสต์และสตอรี่ที่ใช้บ่อยที่สุด',
            en: { name: 'Post Templates', description: 'Set up the post and story templates you use most.' },
            durationMinutes: 60,
            priceBaht: 800,
          },
          {
            name: 'ตั้งชุดสื่อทั้งร้าน',
            description: 'เทมเพลตโพสต์ สตอรี่ เมนู และป้ายโปรโมชันในชุดเดียวกัน',
            en: { name: 'Full Shop Kit', description: 'Matching templates for posts, stories, menus and promotion signs.' },
            durationMinutes: 120,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'ทำ Usability Test แอปหรือเว็บก่อนเปิดตัว',
        description:
          'วางสถานการณ์ทดสอบ หาผู้ทดสอบห้าคน และสังเกตว่าผู้ใช้ติดขัดตรงไหน โดยไม่ต้องจ้างบริษัทวิจัย จบด้วยรายการปัญหาที่ควรแก้ก่อนเปิดตัว เรียงตามความรุนแรง',
        en: {
          name: 'Usability Test Your App or Website Before Launch',
          description:
            'We write test scenarios, recruit five testers and watch where users get stuck, without hiring a research agency. You leave with a list of issues to fix before launch, ranked by severity.',
        },
        category: TECH,
        priceBaht: 1500,
        durationMinutes: 60,
        photos: [photo(7283717), photo(10352379)],
        packages: [
          {
            name: 'วางแผนการทดสอบ',
            description: 'เขียนสถานการณ์ทดสอบและวิธีหาผู้ทดสอบ',
            en: { name: 'Test Plan', description: 'Write the test scenarios and how to recruit testers.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'ทดสอบและสรุปผลด้วยกัน',
            description: 'นั่งดูการทดสอบจริงด้วยกันแล้วสรุปรายการปัญหา',
            en: { name: 'Run and Review Together', description: 'Watch real test sessions together, then list the issues.' },
            durationMinutes: 120,
            priceBaht: 2800,
          },
        ],
      },
    ],
  },

  // ── Tech and digital work ──────────────────────────────────────────────
  {
    email: 'life.pakorn.t@advisory.demo',
    displayName: 'ปกรณ์ ธนวัฒน์',
    fullName: 'ปกรณ์ ธนวัฒน์',
    portrait: portrait(31268612),
    headline: 'Senior Software Engineer บริษัทเทคในสิงคโปร์',
    bio: 'ทำงานเป็น Senior Software Engineer ที่บริษัทเทคในสิงคโปร์ 6 ปี ดูแลระบบหลังบ้านที่มีผู้ใช้หลายล้านคน ก่อนหน้านั้นเป็นนักพัฒนาที่สตาร์ตอัปในกรุงเทพฯ เคยเป็นกรรมการสัมภาษณ์วิศวกรมากกว่า 150 รอบ ช่วยนักพัฒนาไทยเตรียมสัมภาษณ์บริษัทต่างประเทศและวางเส้นทางเติบโตในสายงาน',
    en: {
      headline: 'Senior Software Engineer at a Singapore Tech Company',
      bio: 'Six years as a senior software engineer at a tech company in Singapore, looking after back-end systems with millions of users, and before that a developer at a Bangkok startup. He has sat on more than 150 engineering interview panels, and helps Thai developers prepare for interviews abroad and plan how to grow in their careers.',
    },
    services: [
      {
        name: 'เตรียม Coding Interview บริษัทต่างประเทศ',
        description:
          'สำหรับนักพัฒนาที่จะสัมภาษณ์บริษัทเทคในสิงคโปร์ ยุโรป หรือบริษัทต่างชาติในไทย ซ้อมแก้โจทย์อัลกอริทึมแบบพูดความคิดออกมาเป็นภาษาอังกฤษ ฝึกวิเคราะห์ความซับซ้อน และรับฟีดแบ็กแบบเดียวกับที่กรรมการให้คะแนนจริง',
        en: {
          name: 'Prepare for Coding Interviews at International Companies',
          description:
            'For developers interviewing with tech companies in Singapore, Europe or international firms in Thailand. We practise algorithm problems while thinking aloud in English, work on complexity analysis, and you get feedback the way real interviewers score it.',
        },
        category: TECH,
        priceBaht: 1500,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(6424590), photo(4383298)],
        packages: [
          {
            name: 'ซ้อมหนึ่งโจทย์',
            description: 'สัมภาษณ์จำลองหนึ่งรอบพร้อมฟีดแบ็กละเอียด',
            en: { name: 'One Mock Problem', description: 'One mock interview with detailed feedback.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'ซ้อมสองรอบพร้อมแผนเตรียมตัว',
            description: 'ซ้อมสองโจทย์และวางแผนเตรียมตัวสี่สัปดาห์',
            en: { name: 'Two Rounds and a Prep Plan', description: 'Two mock problems and a four-week preparation plan.' },
            durationMinutes: 90,
            priceBaht: 2200,
          },
        ],
      },
      {
        name: 'ออกแบบระบบ Backend ให้รองรับคนใช้เยอะ',
        description:
          'ระบบเริ่มช้าเมื่อผู้ใช้เพิ่มขึ้น หรือกำลังจะเปิดตัวและไม่แน่ใจว่าจะรับไหว ไล่ดูสถาปัตยกรรม ฐานข้อมูล แคช และคิวงาน แล้วจัดลำดับสิ่งที่ควรแก้ก่อนตามผลกระทบและแรงที่ต้องใช้',
        en: {
          name: 'Design a Back End That Handles Heavy Traffic',
          description:
            "Your system slows down as users grow, or you're about to launch and aren't sure it will cope. We go through the architecture, database, caching and job queues, then rank what to fix first by impact and effort.",
        },
        category: TECH,
        priceBaht: 1800,
        durationMinutes: 60,
        photos: [photo(34212916), photo(16592498)],
        packages: [
          {
            name: 'ทบทวนสถาปัตยกรรม',
            description: 'ดูโครงสร้างระบบปัจจุบันและจุดที่น่าจะเป็นคอขวด',
            en: { name: 'Architecture Review', description: 'Your current design and where the bottlenecks are likely to be.' },
            durationMinutes: 60,
            priceBaht: 1800,
          },
          {
            name: 'ทบทวนพร้อมแผนปรับปรุง',
            description: 'ทบทวนระบบแล้ววางแผนปรับปรุงเป็นขั้นตอนพร้อมลำดับความสำคัญ',
            en: { name: 'Review and Improvement Plan', description: 'A review, then a step-by-step improvement plan in priority order.' },
            durationMinutes: 120,
            priceBaht: 3200,
          },
        ],
      },
      {
        name: 'วางแผนขยับจาก Junior เป็น Senior Engineer',
        description:
          'ดูว่างานที่ทำอยู่ตอนนี้ยังขาดอะไรสำหรับตำแหน่งถัดไป ทั้งทักษะเทคนิค การรีวิวโค้ด การออกแบบระบบ และการสื่อสารกับทีม แล้ววางแผนพัฒนาตัวเองหกเดือนที่เอาไปคุยกับหัวหน้าได้',
        en: {
          name: 'Plan Your Path From Junior to Senior Engineer',
          description:
            'We look at what your current work is missing for the next level, from technical skills and code review to system design and communicating with your team, then build a six-month development plan you can take to your manager.',
        },
        category: TECH,
        priceBaht: 1000,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(1181359), photo(270360)],
        packages: [
          {
            name: 'ประเมินช่องว่าง',
            description: 'เทียบงานปัจจุบันกับสิ่งที่ตำแหน่ง Senior ต้องทำ',
            en: { name: 'Gap Assessment', description: 'Your current work compared with what a senior role requires.' },
            durationMinutes: 45,
            priceBaht: 1000,
          },
          {
            name: 'แผนพัฒนาหกเดือน',
            description: 'แผนรายเดือนพร้อมงานที่ควรขอรับผิดชอบเพื่อพิสูจน์ตัวเอง',
            en: { name: 'Six-Month Growth Plan', description: 'A monthly plan, plus the work to volunteer for to prove yourself.' },
            durationMinutes: 90,
            priceBaht: 1800,
          },
        ],
      },
      {
        name: 'ซ้อมสัมภาษณ์ System Design',
        description:
          'สำหรับตำแหน่งระดับกลางขึ้นไปที่มีรอบสัมภาษณ์ออกแบบระบบ ฝึกตั้งคำถามเก็บความต้องการ ประมาณขนาดระบบ วาดโครงสร้าง และอธิบายข้อแลกเปลี่ยนของแต่ละทางเลือกภายในเวลาที่จำกัด',
        en: {
          name: 'Practise System Design Interviews',
          description:
            'For mid-level roles and above that include a system design round. We practise gathering requirements, estimating scale, sketching the architecture and explaining the trade-offs of each option within the time limit.',
        },
        category: TECH,
        priceBaht: 1800,
        durationMinutes: 60,
        photos: [photo(5125366), photo(8720589)],
        packages: [
          {
            name: 'ซ้อมหนึ่งโจทย์',
            description: 'สัมภาษณ์จำลองหนึ่งโจทย์พร้อมฟีดแบ็ก',
            en: { name: 'One Mock Problem', description: 'One mock design problem with feedback.' },
            durationMinutes: 60,
            priceBaht: 1800,
          },
          {
            name: 'ซ้อมพร้อมทบทวนพื้นฐาน',
            description: 'ทบทวนแนวคิดที่ต้องรู้ แล้วซ้อมโจทย์เต็มรอบ',
            en: { name: 'Fundamentals and Mock', description: 'Review the core concepts, then work through a full mock problem.' },
            durationMinutes: 90,
            priceBaht: 2500,
          },
        ],
      },
    ],
  },
  {
    email: 'life.thanawin.p@advisory.demo',
    displayName: 'ธนวินท์ ประเสริฐวงศ์',
    fullName: 'ธนวินท์ ประเสริฐวงศ์',
    portrait: portrait(30645249),
    headline: 'นักพัฒนาเว็บและที่ปรึกษาไอทีสำหรับร้านค้า',
    bio: 'นักพัฒนาเว็บฟรีแลนซ์ที่ทำเว็บไซต์และระบบออนไลน์ให้ร้านค้า คาเฟ่ และคลินิกมาแล้วกว่า 60 ราย จบวิศวกรรมคอมพิวเตอร์และเคยทำงานที่บริษัทซอฟต์แวร์ 3 ปี ช่วยเจ้าของกิจการที่ไม่มีทีมไอทีเลือกระบบหน้าร้าน ระบบรับเงิน และดูแลความปลอดภัยเบื้องต้นให้พอดีกับขนาดธุรกิจ ถนัดสอนเจ้าของร้านให้ดูแลระบบเองได้หลังส่งมอบ ไม่ต้องพึ่งนักพัฒนาทุกครั้งที่อยากแก้อะไรเล็กๆ',
    en: {
      headline: 'Web Developer and IT Advisor for Shops',
      bio: "A freelance web developer who has built websites and online systems for more than 60 shops, cafés and clinics. A computer engineering graduate with three years at a software company, he helps owners without an IT team choose point-of-sale, payment and basic security set-ups that fit the size of the business, and specialises in teaching them to run things themselves after handover, so they don't need a developer for every small change.",
    },
    services: [
      {
        name: 'เลือกระบบ POS และหลังร้านให้เหมาะกับร้าน',
        description:
          'เทียบระบบขายหน้าร้านที่นิยมในไทย ทั้งเรื่องราคา การตัดสต็อก การออกใบกำกับภาษี และการเชื่อมกับแอปเดลิเวอรี ให้เลือกระบบที่พอดีกับร้าน และไม่ต้องจ่ายค่าฟีเจอร์ที่ไม่ได้ใช้',
        en: {
          name: 'Choose the Right POS and Back-Office System',
          description:
            "We compare the point-of-sale systems popular in Thailand on price, stock tracking, tax invoices and delivery-app integration, so you choose one that fits your shop and don't pay for features you won't use.",
        },
        category: TECH,
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(12935047), photo(17235420)],
        packages: [
          {
            name: 'เทียบระบบ',
            description: 'เทียบระบบที่เข้ากับร้านคุณสามระบบ',
            en: { name: 'System Comparison', description: 'Three systems that suit your shop, side by side.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'เลือกระบบพร้อมแผนติดตั้ง',
            description: 'เลือกระบบและวางขั้นตอนย้ายข้อมูลสินค้าและเริ่มใช้งาน',
            en: { name: 'Choose and Plan the Roll-Out', description: 'Pick a system and plan moving your product data over and going live.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
      {
        name: 'ตั้งระบบรับเงินผ่าน QR และบัตรให้ร้าน',
        description:
          'เลือกช่องทางรับเงินที่เหมาะกับร้าน ทั้ง QR พร้อมเพย์ เครื่องรับบัตร และการรับเงินออนไลน์ เทียบค่าธรรมเนียมของแต่ละเจ้า และวางวิธีเช็กยอดเงินเข้าทุกวันเพื่อกันสลิปปลอม',
        en: {
          name: 'Set Up QR and Card Payments for Your Shop',
          description:
            "We pick the right ways for your shop to take payment, from PromptPay QR and card terminals to online payments, compare each provider's fees, and set up a daily routine for checking money received so fake transfer slips don't get through.",
        },
        category: TECH,
        priceBaht: 600,
        durationMinutes: 30,
        photos: [photo(6812431), photo(2988232)],
        packages: [
          {
            name: 'เลือกช่องทางรับเงิน',
            description: 'เทียบช่องทางและค่าธรรมเนียมที่เหมาะกับยอดขายของร้าน',
            en: { name: 'Choose Payment Methods', description: "Compare methods and fees for your shop's sales volume." },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'ตั้งระบบพร้อมวิธีตรวจยอด',
            description: 'เลือกช่องทางและวางขั้นตอนตรวจเงินเข้าสำหรับพนักงาน',
            en: { name: 'Set Up and Reconcile', description: 'Choose your methods and set up a payment-checking routine for staff.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
      {
        name: 'ตรวจความปลอดภัยไซเบอร์เบื้องต้นสำหรับบริษัทเล็ก',
        description:
          'ไล่เช็กรหัสผ่าน การสำรองข้อมูล สิทธิ์การเข้าถึงไฟล์ และอีเมลหลอกลวงที่พนักงานมักเจอ แล้วจัดลำดับสิ่งที่ควรทำก่อน เพื่อลดความเสี่ยงจากการโดนแฮ็กหรือโดนเรียกค่าไถ่ข้อมูล',
        en: {
          name: 'Basic Cybersecurity Check for Small Companies',
          description:
            'We check passwords, backups, file access permissions and the phishing emails your staff are likely to see, then rank what to do first to reduce the risk of being hacked or hit by ransomware.',
        },
        category: TECH,
        priceBaht: 1500,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(5380642), photo(30901557), photo(706500)],
        packages: [
          {
            name: 'ตรวจเบื้องต้น',
            description: 'ไล่เช็กลิสต์ความปลอดภัยและสรุปจุดเสี่ยงสำคัญ',
            en: { name: 'Initial Check', description: 'Run through the security checklist and list the main risks.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'ตรวจพร้อมแผนแก้ไข',
            description: 'ตรวจครบและวางแผนแก้ไขสามเดือนพร้อมนโยบายสั้นๆ สำหรับพนักงาน',
            en: { name: 'Check and Fix Plan', description: 'A full check, a three-month fix plan and a short policy for staff.' },
            durationMinutes: 120,
            priceBaht: 2800,
          },
        ],
      },
      {
        name: 'ทำเว็บไซต์ร้านด้วย WordPress เอง',
        description:
          'เลือกโฮสติ้ง ธีม และปลั๊กอินที่จำเป็น วางหน้าเว็บที่ร้านต้องมี และสอนแก้ข้อความ รูป และสินค้าได้เอง จบแล้วมีเว็บร้านที่พร้อมเปิดใช้และรู้วิธีดูแลต่อ',
        en: {
          name: 'Build Your Shop Website Yourself With WordPress',
          description:
            'We choose hosting, a theme and the plugins you need, plan the pages your shop should have, and teach you to update text, photos and products yourself. You leave with a site ready to go live and know how to look after it.',
        },
        category: TECH,
        priceBaht: 1200,
        durationMinutes: 60,
        trialMinutes: 15,
        photos: [photo(6446709), photo(583842)],
        packages: [
          {
            name: 'วางโครงเว็บ',
            description: 'เลือกเครื่องมือและวางหน้าเว็บที่ต้องมี',
            en: { name: 'Site Plan', description: 'Choose your tools and plan the pages you need.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'สร้างเว็บไปด้วยกัน',
            description: 'ติดตั้งและสร้างเว็บจริงไปพร้อมกันจนพร้อมเปิดใช้',
            en: { name: 'Build It Together', description: 'Install and build the real site together until it is ready to launch.' },
            durationMinutes: 180,
            priceBaht: 3200,
          },
        ],
      },
      {
        name: 'ตั้งระบบสั่งอาหารด้วย QR Code ให้ร้าน',
        description:
          'ให้ลูกค้าสแกนสั่งอาหารจากโต๊ะได้เอง ลดงานพนักงานและออร์เดอร์ผิด เทียบระบบสำเร็จรูปกับแบบทำเอง ตั้งเมนู รูป และราคาให้ครบ และเชื่อมกับเครื่องพิมพ์ในครัว',
        en: {
          name: 'Set Up QR Code Ordering for Your Restaurant',
          description:
            'Let customers scan and order from their table, cutting staff workload and wrong orders. We compare ready-made systems with building your own, set up the menu, photos and prices, and connect it to the kitchen printer.',
        },
        category: TECH,
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(12935078), photo(12935066)],
        packages: [
          {
            name: 'เลือกระบบ',
            description: 'เทียบระบบที่เหมาะกับขนาดร้านและงบ',
            en: { name: 'Choose a System', description: "Compare systems for your restaurant's size and budget." },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'ตั้งระบบพร้อมเมนู',
            description: 'ตั้งระบบ ใส่เมนูจริง และทดสอบสั่งจนถึงครัว',
            en: { name: 'Set Up With Your Menu', description: 'Set up the system, load your real menu and test an order through to the kitchen.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
      {
        name: 'กู้และป้องกันเพจร้านโดนแฮ็ก',
        description:
          'เพจหรือบัญชีโซเชียลของร้านโดนแฮ็กหรือกลัวจะโดน ไล่ขั้นตอนกู้บัญชีผ่านช่องทางทางการ ตั้งการยืนยันตัวตนสองชั้น จัดสิทธิ์แอดมิน และรู้ทันลิงก์หลอกที่มักส่งมาหาร้านค้า ไม่รับประกันว่าจะกู้บัญชีคืนได้ทุกกรณี',
        en: {
          name: 'Recover and Protect a Hacked Shop Page',
          description:
            "Your shop's page or social account has been hacked, or you're worried it will be. We go through the official recovery steps, set up two-factor authentication, sort out admin roles and learn to spot the scam links sent to shops. Recovery can't be guaranteed in every case.",
        },
        category: TECH,
        priceBaht: 600,
        durationMinutes: 30,
        photos: [photo(11391947), photo(5935794)],
        packages: [
          {
            name: 'ป้องกันบัญชี',
            description: 'ตั้งค่าความปลอดภัยของทุกบัญชีที่ร้านใช้',
            en: { name: 'Lock Down Your Accounts', description: 'Security settings for every account the shop uses.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'กู้บัญชีพร้อมป้องกัน',
            description: 'ไล่ขั้นตอนกู้บัญชีที่โดนแฮ็ก แล้วตั้งค่าป้องกันครบ',
            en: { name: 'Recover and Protect', description: 'Work through recovering a hacked account, then secure everything.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
    ],
  },

  // ── Languages and exams ────────────────────────────────────────────────
  {
    email: 'life.pitchaya.a@advisory.demo',
    displayName: 'พิชญา อนันตกุล',
    fullName: 'พิชญา อนันตกุล',
    portrait: portrait(28570312),
    headline: 'ครูเตรียมสอบ IELTS/TOEIC และโค้ชภาษาอังกฤษเพื่อการทำงาน (IELTS 8.5)',
    bio: 'ได้ IELTS 8.5 สอนเตรียมสอบมา 7 ปีที่สถาบันภาษาในกรุงเทพฯ ก่อนออกมาสอนตัวต่อตัว นักเรียนส่วนใหญ่เป็นคนทำงานที่ต้องใช้คะแนนยื่นเรียนต่อหรือสมัครงาน และหัวหน้างานที่ต้องประชุม เขียนอีเมล และนำเสนองานกับต่างชาติ เน้นวิเคราะห์ว่าเสียคะแนนหรือติดขัดตรงไหน แล้วฝึกเฉพาะจุดนั้น และเน้นพูดให้ชัดและมั่นใจมากกว่าพูดให้เหมือนเจ้าของภาษา',
    en: {
      headline: 'IELTS/TOEIC Tutor and Business English Coach (IELTS 8.5)',
      bio: "Scored 8.5 in IELTS and taught test preparation for seven years at a Bangkok language institute before going one-to-one. Most of her students are working adults who need a score for further study or a job application, or managers who have to run meetings, write emails and present to international colleagues. She works out where you're losing marks or getting stuck and drills exactly that, focusing on speaking clearly and confidently rather than sounding like a native speaker.",
    },
    services: [
      {
        name: 'เตรียมสอบ IELTS ให้ได้ 6.5 ภายใน 2 เดือน',
        description:
          'สำหรับคนที่มีพื้นฐานราว 5.5 และต้องการ 6.5 ภายในเวลาจำกัด วัดระดับทั้งสี่ทักษะ หาส่วนที่เพิ่มคะแนนได้เร็วที่สุด แล้ววางตารางฝึกรายสัปดาห์ รวมถึงซ้อม Speaking แบบสอบจริง',
        en: {
          name: 'IELTS 6.5 in Two Months',
          description:
            'For learners at around 5.5 who need 6.5 on a deadline. We assess all four skills, find where your score can rise fastest, and set a weekly practice schedule, including mock Speaking tests in the real format.',
        },
        category: LANGUAGES,
        priceBaht: 800,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(6684209), photo(6325982), photo(6683393)],
        packages: [
          {
            name: 'วัดระดับและวางแผน',
            description: 'วัดระดับสี่ทักษะและวางตารางฝึกแปดสัปดาห์',
            en: { name: 'Assessment and Plan', description: 'Assess all four skills and set an eight-week schedule.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'ติวเข้มจุดอ่อน',
            description: 'ติวทักษะที่ได้คะแนนต่ำที่สุดแบบเจาะลึก',
            en: { name: 'Weak-Spot Intensive', description: 'In-depth tutoring on your lowest-scoring skill.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
          {
            name: 'ติวพร้อมซ้อม Speaking',
            description: 'ติวจุดอ่อนและซ้อม Speaking ครบสามพาร์ตพร้อมประเมินแบนด์',
            en: { name: 'Tutoring and Speaking Mock', description: 'Weak-spot tutoring plus a full three-part Speaking mock with a band estimate.' },
            durationMinutes: 120,
            priceBaht: 1900,
          },
        ],
      },
      {
        name: 'ตรวจ IELTS Writing Task 2 พร้อมแนวทางแก้',
        description:
          'ส่งเรียงความมาก่อนนัด ได้คะแนนประเมินตามเกณฑ์ทั้งสี่ด้าน แล้วไล่แก้ทีละย่อหน้าว่าควรขยายความ เชื่อมประโยค และเลือกคำอย่างไรให้ขยับขึ้นอีกครึ่งแบนด์',
        en: {
          name: 'IELTS Writing Task 2 Marking and Feedback',
          description:
            'Send your essay before the session. You get an estimated band against all four criteria, then we work through it paragraph by paragraph on developing ideas, linking sentences and word choice to move up another half band.',
        },
        category: LANGUAGES,
        priceBaht: 450,
        durationMinutes: 30,
        photos: [photo(267491), photo(6683676)],
        packages: [
          {
            name: 'ตรวจหนึ่งเรียงความ',
            description: 'ประเมินแบนด์และชี้จุดที่ต้องแก้',
            en: { name: 'One Essay', description: 'A band estimate and what to fix.' },
            durationMinutes: 30,
            priceBaht: 450,
          },
          {
            name: 'ตรวจสองเรียงความพร้อมเขียนใหม่',
            description: 'ตรวจสองเรียงความและเขียนย่อหน้าใหม่ไปด้วยกัน',
            en: { name: 'Two Essays and a Rewrite', description: 'Two essays marked, with paragraphs rewritten together.' },
            durationMinutes: 60,
            priceBaht: 850,
          },
        ],
      },
      {
        name: 'วางแผนสอบ TOEIC ให้ได้ 750 ขึ้นไป',
        description:
          'หลายบริษัทใช้คะแนน TOEIC 600–750 เป็นเกณฑ์รับสมัครหรือเลื่อนตำแหน่ง ฝึกเทคนิคฟัง Part 2–4 และอ่าน Part 7 ที่คนไทยเสียคะแนนบ่อย พร้อมวางแผนอ่านให้ทันวันสอบ',
        en: {
          name: 'Plan to Score 750+ on the TOEIC',
          description:
            'Many companies use TOEIC scores of 600 to 750 for hiring or promotion. We practise techniques for listening Parts 2–4 and reading Part 7, where Thai test-takers most often lose marks, and plan your study to be ready by test day.',
        },
        category: LANGUAGES,
        priceBaht: 700,
        durationMinutes: 45,
        photos: [photo(6684265), photo(6684268)],
        packages: [
          {
            name: 'วางแผนอ่าน',
            description: 'วัดระดับและวางแผนอ่านจนถึงวันสอบ',
            en: { name: 'Study Plan', description: 'A level check and a study plan up to test day.' },
            durationMinutes: 45,
            priceBaht: 700,
          },
          {
            name: 'ฝึกเทคนิคครบทุกพาร์ต',
            description: 'ฝึกเทคนิคฟังและอ่านทุกพาร์ตจากข้อสอบเสมือนจริง',
            en: { name: 'Every Part, Practised', description: 'Listening and reading techniques for every part, using realistic tests.' },
            durationMinutes: 90,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'พูดภาษาอังกฤษในที่ประชุมให้มั่นใจ',
        description:
          'รู้คำตอบแต่พูดไม่ทัน หรือไม่กล้าแทรกในประชุมกับต่างชาติ ฝึกประโยคสำหรับเปิดประเด็น แสดงความเห็นแย้งอย่างสุภาพ และสรุปสิ่งที่ตกลงกัน ผ่านการประชุมจำลองจากสถานการณ์จริงของคุณ',
        en: {
          name: 'Speak Up Confidently in English Meetings',
          description:
            "You know the answer but can't get it out in time, or don't dare to jump in when meeting with foreign colleagues. We practise phrases for raising a point, disagreeing politely and summarising what was agreed, through mock meetings based on your real situations.",
        },
        category: LANGUAGES,
        priceBaht: 800,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(7793133), photo(7495644)],
        packages: [
          {
            name: 'ฝึกประโยคสำคัญ',
            description: 'ประโยคที่ใช้บ่อยในการประชุมพร้อมฝึกพูดทันที',
            en: { name: 'Key Phrases', description: 'The phrases you need most in meetings, practised on the spot.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'ประชุมจำลอง',
            description: 'ประชุมจำลองจากวาระจริงของคุณพร้อมฟีดแบ็ก',
            en: { name: 'Mock Meeting', description: 'A mock meeting built from your real agenda, with feedback.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'เขียนอีเมลภาษาอังกฤษถึงลูกค้าต่างชาติ',
        description:
          'ส่งอีเมลที่เคยเขียนมาก่อนนัด แล้วปรับให้สั้น ตรงประเด็น และสุภาพในระดับที่เหมาะ ทั้งอีเมลขอข้อมูล ตามงาน แจ้งปัญหา และปฏิเสธ พร้อมแม่แบบที่ใช้ต่อได้',
        en: {
          name: 'Write English Emails to International Clients',
          description:
            "Send a few emails you've written before the session, and we make them shorter, clearer and polite at the right level, covering requests, follow-ups, raising problems and saying no, with templates you can keep using.",
        },
        category: LANGUAGES,
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(6958503), photo(4240497)],
        packages: [
          {
            name: 'แก้อีเมลจริง',
            description: 'แก้อีเมลที่ส่งมาสามฉบับพร้อมอธิบายเหตุผล',
            en: { name: 'Fix Real Emails', description: 'Three of your emails edited, with the reasons explained.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'แก้อีเมลพร้อมแม่แบบ',
            description: 'แก้อีเมลจริงและทำแม่แบบสำหรับสถานการณ์ที่เจอบ่อย',
            en: { name: 'Edits and Templates', description: 'Edit your emails and build templates for the situations you meet most.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
        ],
      },
      {
        name: 'เตรียมพรีเซนต์งานเป็นภาษาอังกฤษ',
        description:
          'ปรับสไลด์และสคริปต์ให้เล่าเรื่องได้ลื่น ฝึกออกเสียงคำสำคัญ จังหวะการพูด และการตอบคำถามที่คาดไม่ถึง ซ้อมจนพร้อมก่อนวันนำเสนอจริง',
        en: {
          name: 'Prepare a Presentation in English',
          description:
            "We tighten your slides and script so the story flows, practise pronouncing key words, pacing and handling unexpected questions, and rehearse until you're ready for the real day.",
        },
        category: LANGUAGES,
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(7413908), photo(3931447)],
        packages: [
          {
            name: 'ปรับสคริปต์',
            description: 'ปรับสคริปต์และสไลด์ให้เล่าเรื่องชัด',
            en: { name: 'Script Edit', description: 'Make your script and slides tell a clear story.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'ปรับสคริปต์และซ้อมเต็มรอบ',
            description: 'ปรับสคริปต์แล้วซ้อมนำเสนอเต็มรอบพร้อมช่วงถามตอบ',
            en: { name: 'Script and Full Rehearsal', description: 'Edit the script, then rehearse the whole talk including Q&A.' },
            durationMinutes: 120,
            priceBaht: 2200,
          },
        ],
      },
    ],
  },
  {
    email: 'life.chalermpon.s@advisory.demo',
    displayName: 'เฉลิมพล แซ่ตั้ง',
    fullName: 'เฉลิมพล แซ่ตั้ง',
    portrait: portrait(16963942),
    headline: 'ครูภาษาจีนธุรกิจและเตรียมสอบ HSK',
    bio: 'จบปริญญาโทด้านการสอนภาษาจีนจากมหาวิทยาลัยในปักกิ่ง ได้ HSK ระดับ 6 ทำงานฝ่ายจัดซื้อกับโรงงานในกว่างโจวและอี้อู 8 ปี ก่อนออกมาสอนเต็มตัว สอนทั้งผู้ใหญ่ที่ต้องใช้ภาษาจีนในงาน และเด็กที่เริ่มเรียนภาษาจีนเป็นภาษาที่สาม',
    en: {
      headline: 'Business Chinese and HSK Tutor',
      bio: "Holds a master's in teaching Chinese from a university in Beijing and HSK Level 6, and spent eight years in procurement working with factories in Guangzhou and Yiwu before teaching full time. He teaches adults who need Chinese for work, and children starting Chinese as a third language.",
    },
    services: [
      {
        name: 'เตรียมสอบ HSK 4 ให้ผ่านในรอบเดียว',
        description:
          'HSK 4 เป็นระดับที่หลายบริษัทและทุนเรียนต่อใช้เป็นเกณฑ์ วัดระดับคำศัพท์และไวยากรณ์ที่มีอยู่ วางแผนท่องคำศัพท์ 1,200 คำให้ทัน และฝึกทำข้อสอบเก่าทุกพาร์ตพร้อมเทคนิคบริหารเวลา',
        en: {
          name: 'Pass HSK 4 at the First Attempt',
          description:
            'HSK 4 is the level many employers and scholarships ask for. We assess your vocabulary and grammar, plan how to learn the 1,200 words in time, and practise every section of past papers with time-management techniques.',
        },
        category: LANGUAGES,
        priceBaht: 700,
        durationMinutes: 45,
        photos: [photo(7532870), photo(5992912)],
        packages: [
          {
            name: 'วัดระดับและวางแผน',
            description: 'ประเมินระดับและวางแผนอ่านจนถึงวันสอบ',
            en: { name: 'Level Check and Plan', description: 'Find your level and plan your study up to the exam.' },
            durationMinutes: 45,
            priceBaht: 700,
          },
          {
            name: 'ติวข้อสอบเก่า',
            description: 'ทำข้อสอบเก่าด้วยกันพร้อมอธิบายทุกข้อที่พลาด',
            en: { name: 'Past Paper Tutoring', description: 'Work through a past paper together, explaining every mistake.' },
            durationMinutes: 90,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'ภาษาจีนสำหรับคุยงานกับซัพพลายเออร์',
        description:
          'สำหรับเจ้าของร้านและฝ่ายจัดซื้อที่สั่งของจากจีน ฝึกถามราคา ต่อรองจำนวนสั่งซื้อขั้นต่ำ ตามงานผลิต และแจ้งปัญหาสินค้า ทั้งการแชตใน WeChat และการคุยทางโทรศัพท์',
        en: {
          name: 'Chinese for Dealing With Suppliers',
          description:
            'For shop owners and buyers who order from China. We practise asking for prices, negotiating minimum order quantities, chasing production and reporting product problems, both in WeChat chats and on the phone.',
        },
        category: LANGUAGES,
        priceBaht: 1000,
        durationMinutes: 60,
        photos: [photo(15267457), photo(10766992)],
        packages: [
          {
            name: 'ฝึกหนึ่งสถานการณ์',
            description: 'ฝึกสถานการณ์ที่คุณต้องใช้บ่อยที่สุดจนคล่อง',
            en: { name: 'One Situation', description: 'Practise the situation you face most until it comes easily.' },
            durationMinutes: 60,
            priceBaht: 1000,
          },
          {
            name: 'ฝึกครบทุกขั้นการสั่งซื้อ',
            description: 'ตั้งแต่ขอราคาจนถึงตามของและเคลมสินค้า',
            en: { name: 'The Whole Order Cycle', description: 'From asking for a quote to chasing delivery and making claims.' },
            durationMinutes: 90,
            priceBaht: 1400,
          },
        ],
      },
      {
        name: 'ภาษาจีนสำหรับเด็กและเตรียมสอบ YCT',
        description:
          'สำหรับเด็กประถมที่เริ่มเรียนภาษาจีน ฝึกพินอิน วรรณยุกต์ และตัวอักษรพื้นฐานผ่านเกมและบทสนทนาสั้นๆ พร้อมเตรียมสอบ YCT ระดับต้น ผู้ปกครองนั่งฟังด้วยได้',
        en: {
          name: 'Chinese for Children and YCT Preparation',
          description:
            'For primary-school children starting Chinese. We practise pinyin, tones and basic characters through games and short conversations, and prepare for the lower YCT levels. Parents are welcome to sit in.',
        },
        category: LANGUAGES,
        priceBaht: 400,
        durationMinutes: 30,
        photos: [photo(8055084), photo(8055804)],
        packages: [
          {
            name: 'เรียนครั้งละ 30 นาที',
            description: 'บทเรียนสั้นที่พอดีกับสมาธิของเด็กเล็ก',
            en: { name: '30-Minute Lesson', description: "A short lesson that suits a young child's attention span." },
            durationMinutes: 30,
            priceBaht: 400,
          },
          {
            name: 'เรียนพร้อมเตรียมสอบ',
            description: 'บทเรียนเต็มชั่วโมงพร้อมฝึกข้อสอบ YCT',
            en: { name: 'Lesson and Exam Practice', description: 'A full-hour lesson with YCT exam practice.' },
            durationMinutes: 60,
            priceBaht: 750,
          },
        ],
      },
    ],
  },
  {
    email: 'life.panuwat.c@advisory.demo',
    displayName: 'ภาณุวัฒน์ จันทร์หอม',
    fullName: 'ภาณุวัฒน์ จันทร์หอม',
    portrait: portrait(17381484),
    headline: 'ติวเตอร์ TOEFL/GRE และที่ปรึกษาเรียนต่อโทอเมริกาและอังกฤษ',
    bio: 'ศิษย์เก่าทุนฟุลไบรท์ จบปริญญาโทด้านนโยบายสาธารณะจากมหาวิทยาลัยในสหรัฐอเมริกา ได้ TOEFL iBT 112 ปัจจุบันทำงานในองค์กรระหว่างประเทศที่กรุงเทพฯ ซึ่งมีเพื่อนร่วมงานจบจากอังกฤษจำนวนมาก และติวสอบกับให้คำปรึกษาการสมัครเรียนต่อทั้งอเมริกาและอังกฤษช่วงเย็นและวันหยุด รวมถึงทุนฟุลไบรท์และ Chevening ช่วยผู้สมัครมาแล้วกว่า 80 คน',
    en: {
      headline: 'TOEFL/GRE Tutor and US and UK Graduate School Advisor',
      bio: "A Fulbright alumnus with a master's in public policy from a US university and a TOEFL iBT score of 112. He works for an international organisation in Bangkok, alongside many UK graduates, and in the evenings and at weekends tutors and advises applicants for graduate school in both the US and the UK, including Fulbright and Chevening scholarships, having helped more than 80 people so far.",
    },
    services: [
      {
        name: 'เตรียมสอบ TOEFL iBT ให้ได้ 90 ขึ้นไป',
        description:
          'คะแนน 90 ขึ้นไปเป็นเกณฑ์ของหลักสูตรปริญญาโทส่วนใหญ่ในอเมริกา ทำข้อสอบวัดระดับ ฝึกเทคนิคจดโน้ตสำหรับพาร์ต Listening และโครงคำตอบสำหรับ Speaking และ Writing แบบรวมทักษะ',
        en: {
          name: 'Score 90+ on the TOEFL iBT',
          description:
            "A score of 90 or more is the requirement for most US master's programmes. We take a diagnostic test, practise note-taking for the Listening section, and learn answer structures for the integrated Speaking and Writing tasks.",
        },
        category: LANGUAGES,
        priceBaht: 750,
        durationMinutes: 45,
        photos: [photo(6683673), photo(7963988)],
        packages: [
          {
            name: 'วัดระดับและวางแผน',
            description: 'ทำข้อสอบวัดระดับและวางแผนอ่านตามคะแนนเป้าหมาย',
            en: { name: 'Diagnostic and Plan', description: 'A diagnostic test and a study plan for your target score.' },
            durationMinutes: 45,
            priceBaht: 750,
          },
          {
            name: 'ติว Speaking และ Writing',
            description: 'ฝึกโครงคำตอบและทำโจทย์จริงพร้อมฟีดแบ็ก',
            en: { name: 'Speaking and Writing Tutoring', description: 'Answer structures and real tasks, with feedback.' },
            durationMinutes: 90,
            priceBaht: 1400,
          },
        ],
      },
      {
        name: 'วางแผนสอบ GRE สำหรับคนทำงาน',
        description:
          'สำหรับคนทำงานที่ต้องใช้คะแนน GRE สมัครเรียนต่อ ดูว่าหลักสูตรเป้าหมายต้องการคะแนนเท่าไร วัดระดับ Verbal และ Quant แล้ววางแผนอ่านสามเดือนที่ทำได้ควบคู่กับงานประจำ',
        en: {
          name: 'Plan Your GRE Around a Full-Time Job',
          description:
            'For working professionals who need a GRE score for graduate applications. We check the scores your target programmes expect, assess your Verbal and Quant, and plan three months of study you can manage alongside work.',
        },
        category: LANGUAGES,
        priceBaht: 800,
        durationMinutes: 45,
        photos: [photo(5554236), photo(7683897)],
        packages: [
          {
            name: 'ตั้งเป้าคะแนน',
            description: 'ดูคะแนนที่หลักสูตรต้องการและระดับปัจจุบันของคุณ',
            en: { name: 'Set Your Target', description: 'The scores your programmes want, and where you are now.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'แผนอ่านสามเดือน',
            description: 'แผนอ่านรายสัปดาห์พร้อมแหล่งฝึกที่คุ้มเวลา',
            en: { name: 'Three-Month Study Plan', description: 'A weekly plan with the practice materials most worth your time.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'วางแผนสมัครปริญญาโทที่อเมริกา',
        description:
          'เลือกหลักสูตรและมหาวิทยาลัยตามเป้าหมายและงบประมาณ ดูโอกาสได้ทุนหรือตำแหน่งผู้ช่วยสอน วางไทม์ไลน์สอบ ขอจดหมายแนะนำ และเขียน Statement of Purpose ให้ทันรอบสมัครภาคฤดูใบไม้ร่วง',
        en: {
          name: "Plan Your Master's Applications to the US",
          description:
            'We choose programmes and universities to match your goals and budget, look at funding and teaching assistant opportunities, and set a timeline for tests, recommendation letters and your Statement of Purpose to meet the fall application round.',
        },
        category: ABROAD,
        priceBaht: 900,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(7973039), photo(7972512)],
        packages: [
          {
            name: 'คัดหลักสูตร',
            description: 'คัดรายชื่อหลักสูตรที่ตรงกับเป้าหมายและงบ',
            en: { name: 'Programme Shortlist', description: 'A shortlist of programmes that fit your goals and budget.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'วางแผนสมัครทั้งรอบ',
            description: 'ไทม์ไลน์ครบตั้งแต่สอบจนถึงวันกดส่งใบสมัคร',
            en: { name: 'Full Application Plan', description: 'A complete timeline from tests to hitting submit.' },
            durationMinutes: 90,
            priceBaht: 1800,
          },
        ],
      },
      {
        name: 'ยื่นทุนฟุลไบรท์ตั้งแต่เรียงความถึงสัมภาษณ์',
        description:
          'ทุนฟุลไบรท์ให้น้ำหนักกับเป้าหมายระยะยาวและสิ่งที่คุณจะกลับมาทำให้ประเทศ ช่วยวางเรื่องเล่าในเรียงความให้ชัด และซ้อมสัมภาษณ์กับคำถามที่กรรมการมักถาม ไม่สามารถรับประกันผลการคัดเลือกได้',
        en: {
          name: 'Apply for a Fulbright Scholarship, From Essays to Interview',
          description:
            "Fulbright weighs your long-term goals and what you'll bring back to Thailand. We sharpen the story in your essays and rehearse the questions panels tend to ask. Selection can't be guaranteed.",
        },
        category: ABROAD,
        priceBaht: 1500,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(7683887), photo(7972514)],
        packages: [
          {
            name: 'วางเรื่องเรียงความ',
            description: 'หาแก่นเรื่องและวางโครงเรียงความทุกชิ้น',
            en: { name: 'Essay Strategy', description: 'Find your core story and outline every essay.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'เรียงความและสัมภาษณ์',
            description: 'ตรวจเรียงความแล้วซ้อมสัมภาษณ์เต็มรอบ',
            en: { name: 'Essays and Interview', description: 'Review your essays, then rehearse a full interview.' },
            durationMinutes: 120,
            priceBaht: 3000,
          },
        ],
      },
      {
        name: 'วางแผนเรียนต่อปริญญาโทที่อังกฤษ',
        description:
          'เลือกสาขาและมหาวิทยาลัยให้ตรงกับเป้าหมายงานและงบประมาณ ดูเกณฑ์รับสมัคร คะแนนภาษาอังกฤษที่ต้องใช้ และกำหนดการยื่นของแต่ละที่ จบด้วยรายชื่อมหาวิทยาลัยและไทม์ไลน์การสมัครทั้งปี',
        en: {
          name: "Plan a Master's Degree in the UK",
          description:
            "We choose a subject and universities that fit your career goals and budget, and check entry requirements, the English scores you'll need and each deadline. You leave with a shortlist and a full year's application timeline.",
        },
        category: ABROAD,
        priceBaht: 900,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(30624828), photo(31147777)],
        packages: [
          {
            name: 'คุยภาพรวม',
            description: 'ดูความเป็นไปได้ งบประมาณ และสาขาที่เหมาะ',
            en: { name: 'Overview', description: 'Feasibility, budget and the right subject area.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'วางแผนสมัครทั้งปี',
            description: 'คัดรายชื่อมหาวิทยาลัยและทำไทม์ไลน์การสมัครครบทุกขั้น',
            en: { name: 'Full-Year Application Plan', description: 'A university shortlist and a step-by-step application timeline.' },
            durationMinutes: 90,
            priceBaht: 1900,
          },
        ],
      },
      {
        name: 'เขียน Personal Statement ให้ตรงโจทย์',
        description:
          'ส่งร่างแรกหรือแม้แต่โน้ตสั้นๆ มาก่อนนัด แล้วช่วยกันหาเรื่องที่ทำให้คุณต่างจากผู้สมัครคนอื่น จัดโครงเรื่องให้ตอบสิ่งที่หลักสูตรอยากรู้ และตัดส่วนที่เขียนกว้างจนไม่มีใครจำได้',
        en: {
          name: 'Write a Personal Statement That Answers the Brief',
          description:
            'Send a first draft, or even rough notes, before the session. We find the story that sets you apart from other applicants, structure it around what the programme wants to know, and cut the generic parts no one will remember.',
        },
        category: ABROAD,
        priceBaht: 900,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(5921570), photo(280249)],
        packages: [
          {
            name: 'หาแก่นเรื่อง',
            description: 'คุยหาเรื่องเด่นและวางโครงเรียงความ',
            en: { name: 'Find Your Story', description: 'Find your strongest material and outline the essay.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'แก้ร่างทั้งฉบับ',
            description: 'แก้ร่างทีละย่อหน้าจนพร้อมส่ง',
            en: { name: 'Full Draft Edit', description: 'Edit the draft paragraph by paragraph until it is ready to submit.' },
            durationMinutes: 90,
            priceBaht: 1800,
          },
        ],
      },
      {
        name: 'ยื่นทุน Chevening ตั้งแต่เรียงความถึงสัมภาษณ์',
        description:
          'ทุน Chevening ดูทั้งความเป็นผู้นำ การสร้างเครือข่าย และแผนหลังเรียนจบ ช่วยวางเรื่องเล่าของทั้งสี่เรียงความให้สอดคล้องกัน และซ้อมสัมภาษณ์กับคำถามที่กรรมการถามบ่อย ไม่สามารถรับประกันผลการคัดเลือกได้',
        en: {
          name: 'Apply for Chevening, From Essays to Interview',
          description:
            'Chevening looks at leadership, networking and your plans after graduating. We make your four essays tell one consistent story, then rehearse the questions panels ask most often. No result can be guaranteed.',
        },
        category: ABROAD,
        priceBaht: 1200,
        durationMinutes: 45,
        photos: [photo(21220702), photo(77171), photo(3577403)],
        packages: [
          {
            name: 'ซ้อมสัมภาษณ์ทุน',
            description: 'สัมภาษณ์จำลองตามรูปแบบจริง พร้อมฟีดแบ็กทุกคำตอบ',
            en: { name: 'Interview Practice', description: 'A mock interview in the real format, with feedback on every answer.' },
            durationMinutes: 45,
            priceBaht: 1200,
          },
          {
            name: 'วางเรื่องเรียงความ',
            description: 'วางประเด็นของทั้งสี่เรียงความให้ไปในทางเดียวกัน',
            en: { name: 'Essay Strategy', description: 'Plan all four essays so they point the same way.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'ดูแลครบทั้งใบสมัคร',
            description: 'ตรวจเรียงความทั้งสี่เรื่องและซ้อมสัมภาษณ์ในนัดเดียว',
            en: { name: 'Whole Application', description: 'Review all four essays and practise the interview in one session.' },
            durationMinutes: 120,
            priceBaht: 3200,
          },
        ],
      },
      {
        name: 'เตรียมตัวก่อนบินไปเรียนที่อังกฤษ',
        description:
          'ได้ตอบรับแล้ว ต่อไปคือวีซ่านักเรียน หาที่พัก เปิดบัญชีธนาคาร และวางงบรายเดือน ไล่เช็กลิสต์ทีละข้อจากประสบการณ์จริงของคนที่ไปมาแล้ว ให้ไปถึงแล้วไม่ต้องวุ่นในสัปดาห์แรก',
        en: {
          name: 'Get Ready to Fly Out to Study in the UK',
          description:
            "You've got your offer; next come the student visa, accommodation, a bank account and a monthly budget. We go through the checklist item by item, drawing on real experience, so your first week there isn't chaos.",
        },
        category: ABROAD,
        priceBaht: 600,
        durationMinutes: 30,
        photos: [photo(19251001), photo(8212231), photo(672532)],
        packages: [
          {
            name: 'เช็กลิสต์ก่อนบิน',
            description: 'ไล่รายการสิ่งที่ต้องทำให้เสร็จก่อนเดินทาง',
            en: { name: 'Pre-Departure Checklist', description: 'Everything to get done before you leave.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'วางแผนเดือนแรกที่อังกฤษ',
            description: 'วางงบประมาณ ที่พัก และสิ่งที่ต้องจัดการในเดือนแรก',
            en: { name: 'Your First Month in the UK', description: 'Budget, accommodation and what to sort out in your first month.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
    ],
  },

  // ── Wellbeing (continued) ──────────────────────────────────────────────
  {
    email: 'life.nantana.w@advisory.demo',
    displayName: 'นันทนา วงศ์สวัสดิ์',
    fullName: 'นันทนา วงศ์สวัสดิ์',
    portrait: portrait(8204315),
    headline: 'นักจิตวิทยาการปรึกษาด้านคู่รักและครอบครัว',
    bio: 'ให้คำปรึกษาคู่รักและครอบครัวมากว่า 20 ปี เริ่มจากคลินิกให้คำปรึกษาครอบครัวของโรงพยาบาลเอกชน ก่อนออกมาให้คำปรึกษาออนไลน์เป็นหลัก ทำงานกับคู่ที่ทะเลาะเรื่องเดิมซ้ำๆ คนที่เพิ่งผ่านการเลิกรา และคนที่ต้องแบกภาระดูแลพ่อแม่ ช่วยให้แต่ละฝ่ายได้พูดและได้ฟังกันจริง',
    en: {
      headline: 'Couples and Family Counseling Psychologist',
      bio: "Has counselled couples and families for more than 20 years, starting at a private hospital's family counselling clinic before moving mainly online. She works with couples who keep having the same argument, people going through a break-up, and those carrying the load of caring for their parents, helping each person really speak and be heard.",
    },
    services: [
      {
        name: 'ปรึกษาปัญหาคู่รักที่ทะเลาะเรื่องเดิมซ้ำ',
        description:
          'ทะเลาะเรื่องเงิน งานบ้าน หรือครอบครัวของอีกฝ่ายวนอยู่ที่เดิม นัดได้ทั้งแบบมาคนเดียวหรือมาเป็นคู่ ช่วยหาว่าอะไรซ่อนอยู่ใต้การทะเลาะ และฝึกวิธีคุยที่ไม่จบด้วยการเงียบใส่กัน บริการนี้ไม่เหมาะกับกรณีที่มีความรุนแรง',
        en: {
          name: 'Couples Counseling for the Same Old Arguments',
          description:
            "Arguments about money, housework or each other's families that keep going round in circles. Come alone or as a couple; we look at what lies underneath the arguments and practise ways of talking that don't end in silence. This service isn't suitable where there is violence.",
        },
        category: WELLBEING,
        priceBaht: 1200,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(23496459), photo(23496489)],
        packages: [
          {
            name: 'คุยคนเดียว',
            description: 'คุยกับฝ่ายใดฝ่ายหนึ่งเพื่อมองความสัมพันธ์ให้ชัดขึ้น',
            en: { name: 'Individual Session', description: 'One partner on their own, to see the relationship more clearly.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'คุยเป็นคู่',
            description: 'คุยพร้อมกันทั้งสองฝ่ายโดยมีคนกลางช่วยดูแลการสนทนา',
            en: { name: 'Couple Session', description: 'Both partners together, with the counsellor guiding the conversation.' },
            durationMinutes: 90,
            priceBaht: 1800,
          },
        ],
      },
      {
        name: 'ปรับตัวหลังการหย่าร้างหรือเลิกรา',
        description:
          'พื้นที่สำหรับเล่าความรู้สึกหลังการเลิกรา ทั้งความเสียใจ ความโกรธ และความกลัวที่จะเริ่มใหม่ ค่อยๆ แยกสิ่งที่ต้องจัดการตอนนี้ออกจากสิ่งที่ยังรอได้ และหาวิธีดูแลตัวเองในช่วงที่ยากที่สุด',
        en: {
          name: 'Coping After Divorce or a Break-Up',
          description:
            'A space to talk about how you feel after a break-up: the grief, the anger and the fear of starting over. We gently separate what needs dealing with now from what can wait, and find ways to look after yourself through the hardest stretch.',
        },
        category: WELLBEING,
        priceBaht: 1100,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(7710166), photo(3759657)],
        packages: [
          {
            name: 'คุยหนึ่งชั่วโมง',
            description: 'เล่าสิ่งที่เกิดขึ้นและความรู้สึกในจังหวะของคุณ',
            en: { name: 'One-Hour Session', description: 'Talk about what happened and how you feel, at your own pace.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
          {
            name: 'คุยแบบไม่เร่งรีบ',
            description: 'เวลาที่มากพอสำหรับเรื่องที่ซับซ้อน เช่น ลูกหรือทรัพย์สิน',
            en: { name: 'Unhurried Session', description: 'Enough time for complicated matters such as children or shared property.' },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'ดูแลใจคนที่ต้องดูแลพ่อแม่สูงวัย',
        description:
          'สำหรับลูกที่ดูแลพ่อแม่ป่วยหรือสูงวัยควบคู่กับงานประจำ จนเหนื่อย รู้สึกผิด หรือขัดแย้งกับพี่น้อง คุยเรื่องการแบ่งภาระ การขอความช่วยเหลือ และการดูแลตัวเองโดยไม่รู้สึกว่าเห็นแก่ตัว',
        en: {
          name: 'Support for People Caring for Elderly Parents',
          description:
            'For adult children looking after sick or ageing parents alongside a job, who are worn out, feel guilty or are in conflict with siblings. We talk about sharing the load, asking for help, and looking after yourself without feeling selfish.',
        },
        category: WELLBEING,
        priceBaht: 900,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(6919285), photo(29372724)],
        packages: [
          {
            name: 'คุยให้โล่ง',
            description: 'พื้นที่ระบายความเหนื่อยและความรู้สึกผิด',
            en: { name: 'Talk It Out', description: 'Space to let out the exhaustion and the guilt.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'คุยพร้อมวางแผนแบ่งภาระ',
            description: 'คุยและวางแผนแบ่งงานดูแลกับคนในครอบครัว',
            en: { name: 'Talk and Share the Load', description: 'Talk it through, then plan how to share caring with your family.' },
            durationMinutes: 75,
            priceBaht: 1300,
          },
        ],
      },
    ],
  },
  {
    email: 'life.pattra.l@advisory.demo',
    displayName: 'ภัทรา เลิศวิริยะ',
    fullName: 'ภัทรา เลิศวิริยะ',
    portrait: portrait(7688101),
    headline: 'โค้ชชีวิตและครูสอนสติสำหรับคนทำงาน',
    bio: 'โค้ชที่ได้รับการรับรองจาก ICF ระดับ ACC ผ่านหลักสูตรครูสอนสติแบบ MBSR และเป็นครูโยคะ RYT-200 เคยทำงานฝ่ายการตลาดในเอเจนซีโฆษณา 7 ปีจนหมดไฟเอง จึงเข้าใจคนที่วิ่งทั้งวันโดยไม่มีเวลาหยุดหายใจ ชวนเริ่มจากสิ่งเล็กที่ทำได้ทุกวัน มากกว่าการเปลี่ยนชีวิตทั้งหมดในครั้งเดียว',
    en: {
      headline: 'Life Coach and Mindfulness Teacher for Working People',
      bio: 'An ICF-certified coach at ACC level who has completed MBSR teacher training and is an RYT-200 yoga teacher. She spent seven years in marketing at an advertising agency until she burned out herself, so she understands people who run all day without stopping to breathe. She starts with small things you can do every day rather than overhauling your life in one go.',
    },
    services: [
      {
        name: 'เริ่มฝึกสติสำหรับคนทำงานไม่มีเวลา',
        description:
          'ฝึกสติแบบสั้นที่แทรกได้ในวันทำงาน ตั้งแต่การหายใจห้านาทีก่อนประชุม จนถึงการพักใจสั้นๆ ระหว่างวัน ไม่ต้องนั่งสมาธินาน และไม่ต้องมีพื้นฐานมาก่อน',
        en: {
          name: 'Mindfulness for People With No Time',
          description:
            'Short mindfulness practices you can fit into a working day, from five minutes of breathing before a meeting to brief pauses during the day. No long sitting sessions and no experience needed.',
        },
        category: WELLBEING,
        priceBaht: 450,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(6802935), photo(6643397)],
        packages: [
          {
            name: 'ฝึกเทคนิคแรก',
            description: 'ฝึกเทคนิคสั้นสองแบบที่เริ่มใช้ได้พรุ่งนี้',
            en: { name: 'First Techniques', description: 'Two short techniques you can start using tomorrow.' },
            durationMinutes: 30,
            priceBaht: 450,
          },
          {
            name: 'วางกิจวัตรฝึกสติ',
            description: 'ฝึกหลายเทคนิคและวางกิจวัตรที่เข้ากับตารางงานของคุณ',
            en: { name: 'Build a Practice Routine', description: 'Several techniques, plus a routine that fits your work schedule.' },
            durationMinutes: 60,
            priceBaht: 850,
          },
        ],
      },
      {
        name: 'ตั้งเป้าหมายปีนี้ให้ทำได้จริง',
        description:
          'ตั้งเป้าหมายทุกปีแต่เลิกกลางทาง ทบทวนว่าอะไรสำคัญกับคุณจริง เลือกเป้าหมายไม่เกินสามเรื่อง แล้วแตกเป็นนิสัยเล็กๆ รายสัปดาห์ที่ติดตามผลได้',
        en: {
          name: "Set Goals for This Year That You'll Actually Keep",
          description:
            'You set goals every year but give up halfway. We look at what really matters to you, choose no more than three goals, and break them into small weekly habits you can track.',
        },
        category: WELLBEING,
        priceBaht: 750,
        durationMinutes: 45,
        photos: [photo(5797899), photo(6159189)],
        packages: [
          {
            name: 'เลือกเป้าหมาย',
            description: 'ทบทวนและเลือกเป้าหมายที่สำคัญจริง',
            en: { name: 'Choose Your Goals', description: 'Reflect and pick the goals that really matter.' },
            durationMinutes: 45,
            priceBaht: 750,
          },
          {
            name: 'เป้าหมายพร้อมแผนนิสัย',
            description: 'เลือกเป้าหมายและแตกเป็นนิสัยรายสัปดาห์พร้อมวิธีติดตาม',
            en: { name: 'Goals and Habit Plan', description: 'Choose your goals and turn them into weekly habits with a way to track them.' },
            durationMinutes: 90,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'แบ่งเวลางานกับชีวิตสำหรับคุณแม่ทำงาน',
        description:
          'สำหรับคุณแม่ที่รู้สึกว่าทำได้ไม่ดีสักทางทั้งงานและบ้าน ไล่ดูว่าเวลาหมดไปกับอะไร อะไรส่งต่อหรือปล่อยได้ และหาเวลาเล็กๆ ให้ตัวเองโดยไม่ต้องรู้สึกผิด',
        en: {
          name: 'Work-Life Balance for Working Mothers',
          description:
            "For mothers who feel they're falling short at both work and home. We look at where your time goes, what can be handed off or let go, and find small pockets of time for yourself without the guilt.",
        },
        category: WELLBEING,
        priceBaht: 750,
        durationMinutes: 45,
        photos: [photo(4474035), photo(6246197)],
        packages: [
          {
            name: 'ดูว่าเวลาหายไปไหน',
            description: 'ไล่ดูหนึ่งสัปดาห์ของคุณและหาสิ่งที่ปล่อยได้',
            en: { name: 'Where Your Time Goes', description: 'Go through a week of your life and find what can be let go.' },
            durationMinutes: 45,
            priceBaht: 750,
          },
          {
            name: 'วางสมดุลใหม่',
            description: 'วางตารางชีวิตใหม่พร้อมวิธีคุยแบ่งงานกับคนในบ้าน',
            en: { name: 'A New Balance', description: 'A new weekly rhythm, and how to share tasks with the people at home.' },
            durationMinutes: 75,
            priceBaht: 1200,
          },
        ],
      },
      {
        name: 'สร้างความมั่นใจก่อนพูดต่อหน้าคน',
        description:
          'มือสั่น เสียงสั่น หรือสมองว่างทุกครั้งที่ต้องพูดในที่ประชุมหรือบนเวที ฝึกจัดการความตื่นเต้นด้วยการหายใจและการเตรียมตัว แล้วซ้อมพูดจริงสั้นๆ จนรู้สึกว่าคุมตัวเองได้',
        en: {
          name: 'Build Confidence Before Speaking in Front of People',
          description:
            'Shaking hands, a trembling voice or a blank mind whenever you speak in a meeting or on stage. We practise managing the nerves through breathing and preparation, then rehearse short real talks until you feel in control.',
        },
        category: WELLBEING,
        priceBaht: 800,
        durationMinutes: 45,
        photos: [photo(1181487), photo(5356694)],
        packages: [
          {
            name: 'จัดการความตื่นเต้น',
            description: 'เทคนิคหายใจและเตรียมตัวก่อนพูด',
            en: { name: 'Handle the Nerves', description: 'Breathing and preparation techniques for before you speak.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'ฝึกพร้อมซ้อมพูดจริง',
            description: 'ฝึกเทคนิคแล้วซ้อมพูดเรื่องที่คุณต้องพูดจริง',
            en: { name: 'Practise With a Real Talk', description: 'Learn the techniques, then rehearse a talk you actually have to give.' },
            durationMinutes: 90,
            priceBaht: 1400,
          },
        ],
      },
      {
        name: 'โยคะเบาๆ คลายเครียดหลังเลิกงาน',
        description:
          'ชุดโยคะและการยืดเหยียด 20 นาทีที่ทำได้ในห้องนั่งเล่น เน้นคลายบ่า หลัง และสะโพกที่ตึงจากการนั่งทั้งวัน พร้อมการหายใจช่วยให้ใจสงบก่อนนอน เหมาะกับมือใหม่ หากมีอาการบาดเจ็บควรปรึกษาแพทย์ก่อน',
        en: {
          name: 'Gentle Yoga to Unwind After Work',
          description:
            'A 20-minute yoga and stretching routine you can do in your living room, focusing on the shoulders, back and hips that tighten from sitting all day, with breathing to calm your mind before bed. Suitable for beginners; if you have an injury, check with a doctor first.',
        },
        category: WELLBEING,
        priceBaht: 400,
        durationMinutes: 30,
        photos: [photo(6703088), photo(6246215)],
        packages: [
          {
            name: 'เรียนชุดท่าแรก',
            description: 'ฝึกชุดท่า 20 นาทีพร้อมการหายใจ',
            en: { name: 'First Routine', description: 'Learn a 20-minute routine with breathing.' },
            durationMinutes: 30,
            priceBaht: 400,
          },
          {
            name: 'ชุดท่าปรับตามร่างกาย',
            description: 'ปรับท่าให้เข้ากับจุดที่ตึงและความยืดหยุ่นของคุณ',
            en: { name: 'Routine Tailored to You', description: 'Adapt the poses to where you feel tight and how flexible you are.' },
            durationMinutes: 60,
            priceBaht: 700,
          },
        ],
      },
    ],
  },
];
