import type { CatalogueAdvisor } from './types';

/**
 * Part A of the demo catalogue: money. Tax, accounting, credit and debt,
 * property, investing, and insurance and retirement.
 *
 * Every photograph is a Pexels image, its ID taken from a real Pexels page and
 * checked to load and to fit the service it illustrates.
 */

const photo = (id: number): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

const portrait = (id: number): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;

export const PART_A: readonly CatalogueAdvisor[] = [
  // ── การเงินและภาษี ──────────────────────────────────────────────
  {
    email: 'fin.natthida.i@advisory.demo',
    displayName: 'ณัฐธิดา อินทรประเสริฐ',
    fullName: 'ณัฐธิดา อินทรประเสริฐ',
    portrait: portrait(7643740),
    headline: 'ที่ปรึกษาภาษีเงินได้สำหรับมนุษย์เงินเดือน',
    bio: 'ทำงานฝ่ายบัญชีเงินเดือนของบริษัทข้ามชาติ 6 ปี ก่อนออกมาเป็นที่ปรึกษาภาษีบุคคลธรรมดาเต็มตัว ช่วยพนักงานบริษัทที่เริ่มมีรายได้เสริม เปลี่ยนงานกลางปี หรือได้จดหมายจากสรรพากร ให้ยื่นแบบถูกและใช้ค่าลดหย่อนครบ และช่วยนายจ้างมือใหม่หักภาษี ณ ที่จ่ายให้ถูกตั้งแต่เดือนแรก คุยด้วยภาษาง่าย ๆ และส่งตารางสรุปให้หลังนัดทุกครั้ง',
    en: {
      headline: 'Income Tax Advisor for Salaried Employees',
      bio: 'Spent six years in payroll at a multinational before becoming a full-time personal income tax advisor. Helps employees who have picked up side income, changed jobs mid-year, or received a letter from the Revenue Department file correctly and claim every deduction, and helps first-time employers get withholding tax right from the first month. Explains things plainly and sends a written summary after every session.',
    },
    services: [
      {
        name: 'ยื่นภาษีครั้งแรกของมนุษย์เงินเดือนที่มีรายได้เสริม',
        description:
          'สำหรับคนที่มีเงินเดือนประจำแล้วเริ่มรับงานนอก ขายของ หรือได้ค่าคอมมิชชัน ไล่ดูว่ารายได้แต่ละก้อนเป็นเงินได้ประเภทไหน ต้องยื่น ภ.ง.ด.90 หรือ 91 และหักค่าใช้จ่ายได้เท่าไร จบนัดคุณจะรู้ตัวเลขภาษีที่ต้องจ่ายหรือได้คืนโดยประมาณ',
        en: {
          name: 'First Tax Return With a Salary and Side Income',
          description:
            "For salaried people who have started freelancing, selling, or earning commission on the side. We sort each income stream into its tax category, work out whether you file PND 90 or 91, and what expenses you can deduct. You leave with a rough figure for the tax you'll owe or get back.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 600,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(6927334), photo(4050291)],
        packages: [
          {
            name: 'ถามข้อเดียว',
            description: 'ตอบคำถามเรื่องรายได้เสริมหนึ่งก้อนว่าต้องยื่นอย่างไร',
            en: { name: 'One Question', description: 'How to file one specific source of side income.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'ไล่รายได้ทั้งปี',
            description: 'ไล่รายได้ทุกก้อนทั้งปีแล้วประมาณภาษีที่ต้องจ่ายหรือได้คืน',
            en: { name: 'Full-Year Review', description: 'Every income stream for the year, with an estimate of tax owed or refunded.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
          {
            name: 'นั่งยื่นด้วยกัน',
            description: 'นั่งกรอกแบบในระบบยื่นภาษีออนไลน์ไปพร้อมกันจนกดส่ง',
            en: { name: 'File It Together', description: 'We fill in the online return together until you hit submit.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
      {
        name: 'วางค่าลดหย่อนก่อนสิ้นปีให้ใช้สิทธิ์ครบ',
        description:
          'นัดช่วงตุลาคมถึงธันวาคม ก่อนหมดเวลาซื้อสิทธิ์ ดูว่าปีนี้คุณใช้ค่าลดหย่อนอะไรไปแล้ว เหลือเพดานตรงไหน และควรเติมอะไรเพิ่มให้คุ้มกับฐานภาษีจริง ไม่ใช่ซื้อตามโฆษณา ได้รายการสิ่งที่ต้องทำก่อน 31 ธันวาคม',
        en: {
          name: 'Plan Your Deductions Before Year-End',
          description:
            "Best booked October to December, before the window closes. We check which deductions you've used this year, where you still have room, and what is actually worth adding for your tax bracket rather than what the ads push. You get a to-do list for before 31 December.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(5408818), photo(6863183)],
        packages: [
          {
            name: 'เช็กเพดานที่เหลือ',
            description: 'สรุปว่าค่าลดหย่อนแต่ละตัวยังเหลือสิทธิ์อีกเท่าไร',
            en: { name: 'Check Remaining Limits', description: 'How much room is left under each deduction.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'วางแผนลดหย่อนเต็ม',
            description: 'จัดลำดับว่าควรเติมอะไรก่อนหลัง พร้อมเทียบภาษีที่ประหยัดได้',
            en: { name: 'Full Deduction Plan', description: 'What to top up first, with the tax saved by each option compared.' },
            durationMinutes: 75,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'ขอคืนภาษีที่ค้างและตอบเมื่อสรรพากรขอเอกสารเพิ่ม',
        description:
          'ยื่นขอคืนภาษีไปนานแล้วเงินยังไม่เข้า หรือได้ข้อความให้ส่งเอกสารเพิ่ม มาไล่ดูว่าเจ้าหน้าที่ต้องการอะไร เตรียมหลักฐานชุดไหน และควรเขียนคำชี้แจงอย่างไรให้จบในรอบเดียว',
        en: {
          name: 'Chase a Stuck Refund or Answer a Document Request',
          description:
            "Filed for a refund long ago and still waiting, or asked to send more documents? We work out what the officer needs, which evidence to gather, and how to word your explanation so it's settled in one round.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 700,
        durationMinutes: 30,
        photos: [photo(6863250), photo(4959907)],
        packages: [
          {
            name: 'ดูสถานะและสิ่งที่ต้องส่ง',
            description: 'อ่านข้อความจากสรรพากรด้วยกันแล้วสรุปเอกสารที่ต้องเตรียม',
            en: { name: 'Status and Checklist', description: "Read the Revenue Department's message together and list the documents needed." },
            durationMinutes: 30,
            priceBaht: 700,
          },
          {
            name: 'เตรียมคำชี้แจงพร้อมส่ง',
            description: 'ช่วยเรียงหลักฐานและร่างคำชี้แจงให้พร้อมอัปโหลด',
            en: { name: 'Ready-to-Send Reply', description: 'Organise your evidence and draft the explanation, ready to upload.' },
            durationMinutes: 60,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'ภาษีของคนเปลี่ยนงานกลางปี',
        description:
          'ย้ายงานระหว่างปี ได้หนังสือรับรองการหักภาษี ณ ที่จ่ายสองใบ หรือได้เงินชดเชยและเงินกองทุนสำรองเลี้ยงชีพตอนลาออก ไล่ดูว่าต้องรวมยื่นอย่างไร เงินก้อนไหนเลือกแยกคำนวณได้ และทำไมบางคนต้องจ่ายภาษีเพิ่มทั้งที่ถูกหักไว้แล้ว',
        en: {
          name: 'Tax When You Changed Jobs Mid-Year',
          description:
            "Moved jobs during the year, have two withholding certificates, or received severance and provident fund money when you left? We work out how to combine it all on one return, which lump sums can be taxed separately, and why some people still owe tax after withholding.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 1000,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(8296978), photo(1024403)],
        packages: [
          {
            name: 'เช็กเอกสารสองนายจ้าง',
            description: 'รวมตัวเลขจากหนังสือรับรองทั้งสองใบแล้วดูว่าต้องจ่ายเพิ่มไหม',
            en: { name: 'Two-Employer Check', description: 'Combine both certificates and see whether more tax is due.' },
            durationMinutes: 45,
            priceBaht: 1000,
          },
          {
            name: 'รวมเงินก้อนตอนลาออก',
            description: 'คำนวณเทียบระหว่างรวมยื่นกับแยกยื่นเงินชดเชยและเงินกองทุน',
            en: { name: 'Include Leaving Lump Sums', description: 'Compare combining versus separately taxing severance and fund payouts.' },
            durationMinutes: 90,
            priceBaht: 1900,
          },
        ],
      },
      {
        name: 'ภาษีหัก ณ ที่จ่ายสำหรับเจ้าของกิจการมือใหม่',
        description:
          'จ่ายค่าจ้าง ค่าเช่า ค่าโฆษณา หรือค่าบริการแล้วไม่แน่ใจว่าต้องหักภาษีกี่เปอร์เซ็นต์ ยื่น ภ.ง.ด.1, 3 หรือ 53 มาสรุปอัตราที่ใช้บ่อยกับธุรกิจของคุณ วิธีออกหนังสือรับรองการหักภาษี และกำหนดยื่นที่ห้ามพลาด',
        en: {
          name: 'Withholding Tax for New Business Owners',
          description:
            "Paying wages, rent, advertising, or service fees and unsure what percentage to withhold, or whether to file PND 1, 3, or 53? We summarise the rates you'll use most, how to issue withholding certificates, and the deadlines you can't miss.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 800,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(7958169), photo(7580753)],
        packages: [
          {
            name: 'ตารางอัตราของธุรกิจคุณ',
            description: 'สรุปอัตราหัก ณ ที่จ่ายสำหรับรายจ่ายที่คุณมีจริง',
            en: { name: 'Your Rate Table', description: 'Withholding rates for the payments your business actually makes.' },
            durationMinutes: 30,
            priceBaht: 800,
          },
          {
            name: 'ยื่นแบบรอบแรก',
            description: 'ทำหนังสือรับรองและยื่นแบบรอบแรกไปพร้อมกัน',
            en: { name: 'First Filing Round', description: 'Issue certificates and file your first round of returns together.' },
            durationMinutes: 75,
            priceBaht: 1600,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.prasert.s@advisory.demo',
    displayName: 'ประเสริฐ ศรีวงศ์ทอง',
    fullName: 'ประเสริฐ ศรีวงศ์ทอง',
    portrait: portrait(5668885),
    headline: 'อดีตเจ้าหน้าที่สรรพากร ที่ปรึกษาภาษีบุคคลธรรมดา',
    bio: 'รับราชการที่สำนักงานสรรพากรพื้นที่ 18 ปี ดูงานตรวจสอบภาษีเงินได้บุคคลธรรมดาและภาษีจากการขายอสังหาริมทรัพย์ ปัจจุบันเป็นที่ปรึกษาอิสระ ช่วยคนที่ได้หนังสือเชิญพบ คนที่ขายบ้านหรือที่ดิน และเจ้าของห้องเช่า เตรียมตัวและเตรียมเอกสารให้ตรงกับที่เจ้าหน้าที่ต้องการ',
    en: {
      headline: 'Former Revenue Officer, Personal Tax Advisor',
      bio: "Spent 18 years at an area Revenue office auditing personal income tax and tax on property sales. Now an independent advisor who helps people who've been called in by the Revenue Department, people selling a house or land, and landlords prepare themselves and their paperwork the way officers expect.",
    },
    services: [
      {
        name: 'เตรียมตัวก่อนไปพบเจ้าหน้าที่สรรพากรตามหนังสือเชิญ',
        description:
          'ได้หนังสือเชิญพบหรือหนังสือขอให้ชี้แจงรายได้แล้วไม่รู้จะเริ่มตรงไหน มาอ่านหนังสือด้วยกัน ไล่ดูว่าเจ้าหน้าที่น่าจะถามเรื่องอะไร ต้องนำเอกสารอะไรไป และควรอธิบายรายได้แต่ละก้อนอย่างไรให้ตรงกับหลักฐาน',
        en: {
          name: 'Prepare for a Revenue Department Summons',
          description:
            "Received a summons or a letter asking you to explain your income and don't know where to start? We read it together, go through what the officer is likely to ask, which documents to bring, and how to explain each income stream so it matches your records.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 1500,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(6863260)],
        packages: [
          {
            name: 'อ่านหนังสือด้วยกัน',
            description: 'อธิบายว่าหนังสือฉบับนี้ต้องการอะไรและมีกำหนดเวลาเท่าไร',
            en: { name: 'Read the Letter Together', description: 'What the letter is asking for and the deadline you have.' },
            durationMinutes: 45,
            priceBaht: 1500,
          },
          {
            name: 'ซ้อมก่อนวันนัด',
            description: 'จัดชุดเอกสารและซ้อมตอบคำถามที่เจ้าหน้าที่มักถาม',
            en: { name: 'Rehearse Before the Meeting', description: 'Assemble your documents and practise the questions officers usually ask.' },
            durationMinutes: 90,
            priceBaht: 2800,
          },
          {
            name: 'เตรียมคำชี้แจงเป็นลายลักษณ์อักษร',
            description: 'ร่างหนังสือชี้แจงพร้อมตารางรายได้และหลักฐานแนบ',
            en: { name: 'Written Explanation', description: 'A drafted reply letter with an income table and supporting evidence.' },
            durationMinutes: 120,
            priceBaht: 4200,
          },
        ],
      },
      {
        name: 'ภาษีและค่าธรรมเนียมเมื่อขายบ้านหรือที่ดินมรดก',
        description:
          'ได้บ้านหรือที่ดินมาจากพ่อแม่แล้วจะขาย คำนวณให้เห็นภาษีเงินได้หัก ณ ที่จ่าย ภาษีธุรกิจเฉพาะหรืออากรแสตมป์ และค่าโอนที่กรมที่ดิน ดูว่าระยะเวลาถือครองและการมีชื่อในทะเบียนบ้านเปลี่ยนตัวเลขแค่ไหน ก่อนตกลงราคากับผู้ซื้อ',
        en: {
          name: 'Tax and Fees When Selling an Inherited House or Land',
          description:
            'Inherited a house or land and planning to sell? We calculate the withholding income tax, specific business tax or stamp duty, and transfer fees at the Land Office, and show how the holding period and being on the house registration change the numbers, before you agree a price with the buyer.',
        },
        category: 'การเงินและภาษี',
        priceBaht: 1200,
        durationMinutes: 45,
        photos: [photo(1974596), photo(8482871)],
        packages: [
          {
            name: 'คำนวณแปลงเดียว',
            description: 'คำนวณภาษีและค่าธรรมเนียมทั้งหมดของทรัพย์หนึ่งรายการ',
            en: { name: 'One Property', description: 'All tax and fees worked out for a single property.' },
            durationMinutes: 45,
            priceBaht: 1200,
          },
          {
            name: 'เทียบขายตอนนี้กับรอขาย',
            description: 'เทียบภาระภาษีหากขายทันทีกับรอให้ครบเงื่อนไขระยะเวลาถือครอง',
            en: { name: 'Sell Now or Wait', description: 'Tax if you sell now compared with waiting until the holding-period rules change in your favour.' },
            durationMinutes: 75,
            priceBaht: 2000,
          },
        ],
      },
      {
        name: 'ภาษีค่าเช่าสำหรับเจ้าของคอนโดและบ้านให้เช่า',
        description:
          'ปล่อยเช่าห้องหรือบ้านแล้วไม่แน่ใจว่าต้องยื่นอย่างไร มาดูว่าค่าเช่าเป็นเงินได้ประเภทไหน เลือกหักค่าใช้จ่ายแบบเหมาหรือตามจริงแบบไหนดีกว่า และเมื่อมีหลายห้องควรถือในนามบุคคลต่อหรือเปลี่ยนรูปแบบ',
        en: {
          name: 'Rental Income Tax for Condo and House Landlords',
          description:
            "Renting out a room or a house and unsure how to file? We look at which income category rent falls under, whether a flat-rate or actual expense deduction works better for you, and whether to keep holding several units in your own name.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 900,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(7546548), photo(6863176)],
        packages: [
          {
            name: 'ห้องเดียว',
            description: 'วิธียื่นภาษีสำหรับทรัพย์ปล่อยเช่าหนึ่งรายการ',
            en: { name: 'One Unit', description: 'How to file for a single rental property.' },
            durationMinutes: 30,
            priceBaht: 900,
          },
          {
            name: 'หลายห้องทั้งพอร์ต',
            description: 'วางภาพรวมภาษีของทรัพย์ปล่อยเช่าทุกห้อง พร้อมเทียบรูปแบบการถือครอง',
            en: { name: 'Whole Portfolio', description: 'The tax picture across all your rentals, comparing ways of holding them.' },
            durationMinutes: 90,
            priceBaht: 2500,
          },
        ],
      },
      {
        name: 'ภาษีเงินได้จากต่างประเทศของคนทำงานรีโมต',
        description:
          'รับเงินเดือนหรือค่าจ้างจากบริษัทต่างประเทศโดยทำงานอยู่ในไทย หรือมีเงินได้จากต่างประเทศที่โอนกลับเข้ามา ไล่ดูหลักเกณฑ์การเป็นผู้มีถิ่นที่อยู่ ปีที่ต้องนำมายื่น และเอกสารที่ควรเก็บเพื่อใช้เครดิตภาษีต่างประเทศ',
        en: {
          name: 'Foreign Income Tax for Remote Workers',
          description:
            "Paid by a foreign company while working from Thailand, or bringing income from abroad into the country? We go through the residency rules, which year the income has to be declared in, and the records to keep so you can claim foreign tax credits.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 1800,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(7552568), photo(4386367)],
        packages: [
          {
            name: 'ประเมินสถานะ',
            description: 'ดูว่ากรณีของคุณต้องยื่นในไทยหรือไม่และยื่นปีไหน',
            en: { name: 'Status Check', description: 'Whether you need to file in Thailand, and for which year.' },
            durationMinutes: 60,
            priceBaht: 1800,
          },
          {
            name: 'วางแผนพร้อมเอกสาร',
            description: 'คำนวณภาษีพร้อมสรุปเอกสารสำหรับขอเครดิตภาษีต่างประเทศ',
            en: { name: 'Plan With Paperwork', description: 'A tax calculation plus the documents needed to claim foreign tax credits.' },
            durationMinutes: 120,
            priceBaht: 3500,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.parichat.s@advisory.demo',
    displayName: 'ปาริชาติ แสงอรุณ',
    fullName: 'ปาริชาติ แสงอรุณ',
    portrait: portrait(10583382),
    headline: 'โค้ชการเงินส่วนบุคคลสำหรับคนเริ่มทำงาน',
    bio: 'ทำงานฝ่ายบริการลูกค้าที่ธนาคารพาณิชย์ 4 ปี เห็นคนรุ่นใหม่จำนวนมากเริ่มมีหนี้บัตรตั้งแต่ปีแรกที่ทำงาน จึงผันตัวมาเป็นโค้ชการเงินส่วนบุคคล ได้คุณวุฒินักวางแผนการเงิน AFPT ช่วยคนอายุ 22–32 ปีจัดงบ เก็บเงินสำรอง และตัดสินใจเรื่องเงินก้อนแรกของชีวิตโดยไม่ต้องอดอยาก',
    en: {
      headline: 'Personal Finance Coach for Early-Career Workers',
      bio: 'Worked four years in customer service at a commercial bank, where she saw many young people take on card debt in their first year of work. Now a personal finance coach holding the AFPT financial planning qualification, she helps people aged 22 to 32 budget, build an emergency fund, and make their first big money decisions without living on instant noodles.',
    },
    services: [
      {
        name: 'จัดงบเดือนแรกหลังได้เงินเดือน',
        description:
          'เพิ่งเริ่มงานหรือเพิ่งได้ขึ้นเงินเดือนแล้วเงินหมดก่อนสิ้นเดือน มาแบ่งเงินเดือนจริงของคุณเป็นก้อนค่าใช้จ่ายประจำ เงินเก็บ และเงินใช้สบาย ๆ ตั้งบัญชีแยกให้เงินไหลเองอัตโนมัติ ได้แผนงบที่ทำตามได้ตั้งแต่เดือนหน้า',
        en: {
          name: 'Budget Your First Pay Cheque',
          description:
            "Just started work or got a raise, but the money runs out before month-end? We split your actual salary into fixed costs, savings, and guilt-free spending, and set up separate accounts so money moves on its own. You leave with a budget you can follow from next month.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 450,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(7054421), photo(7063765)],
        packages: [
          {
            name: 'ตั้งงบเร็ว',
            description: 'แบ่งเงินเดือนเป็นก้อนหลักพร้อมสัดส่วนเริ่มต้น',
            en: { name: 'Quick Budget', description: 'Split your salary into main buckets with starting percentages.' },
            durationMinutes: 30,
            priceBaht: 450,
          },
          {
            name: 'งบพร้อมระบบบัญชี',
            description: 'ออกแบบงบและวางว่าบัญชีไหนรับเงินอะไร ตัดอะไรอัตโนมัติ',
            en: { name: 'Budget and Account Setup', description: 'A budget plus which account receives what, and what is paid automatically.' },
            durationMinutes: 60,
            priceBaht: 850,
          },
        ],
      },
      {
        name: 'สร้างเงินสำรองฉุกเฉินให้ครบหกเดือน',
        description:
          'อยากมีเงินสำรองแต่เก็บทีไรก็ถูกดึงไปใช้ทุกที มาคำนวณว่าคุณต้องมีเงินสำรองเท่าไรตามภาระจริง เลือกที่พักเงินที่ถอนได้เร็วแต่ไม่ล่อตา และวางแผนเติมรายเดือนจนครบ',
        en: {
          name: 'Build a Six-Month Emergency Fund',
          description:
            "Want a safety net but keep dipping into it? We work out how much you actually need based on your real commitments, choose where to keep it so it's quick to reach but out of sight, and plan monthly top-ups until it's full.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(1602726), photo(4056856)],
        packages: [
          {
            name: 'คำนวณเป้า',
            description: 'หาตัวเลขเงินสำรองที่เหมาะกับภาระของคุณ',
            en: { name: 'Set the Target', description: 'The emergency fund figure that fits your commitments.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'แผนเก็บจนครบ',
            description: 'วางแผนรายเดือนและที่พักเงิน พร้อมนัดติดตามสั้น ๆ อีกหนึ่งครั้ง',
            en: { name: 'Plan to Full', description: 'A monthly plan and where to park the money, with one short follow-up call.' },
            durationMinutes: 60,
            priceBaht: 950,
          },
        ],
      },
      {
        name: 'วางแผนเงินก่อนลาออกไปเรียนต่อหรือพักงาน',
        description:
          'กำลังจะลาออกไปเรียนโท พักฟื้นใจ หรือเริ่มธุรกิจของตัวเอง มาคำนวณว่าต้องมีเงินเท่าไรถึงจะอยู่ได้ตามจำนวนเดือนที่ตั้งใจ ค่าประกันสังคมและประกันสุขภาพที่ต้องจ่ายเอง และจุดที่ควรกลับไปทำงานถ้าเงินเหลือน้อยกว่าที่คิด',
        en: {
          name: 'Plan Your Money Before a Career Break',
          description:
            "About to quit for a master's degree, a breather, or your own venture? We calculate how much you need to last the months you have in mind, the social security and health cover you'll now pay yourself, and the point at which you should head back to work if money runs lower than planned.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 900,
        durationMinutes: 60,
        photos: [photo(4049730), photo(11350076)],
        packages: [
          {
            name: 'คำนวณเงินที่ต้องมี',
            description: 'ตัวเลขเงินที่ต้องเตรียมตามจำนวนเดือนที่จะหยุดงาน',
            en: { name: 'Runway Figure', description: 'How much you need for the number of months you plan to stop.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
          {
            name: 'แผนพร้อมจุดเตือน',
            description: 'แผนใช้เงินรายเดือนพร้อมจุดเตือนว่าเมื่อไรต้องเริ่มหางาน',
            en: { name: 'Plan With Warning Points', description: 'A monthly spending plan with clear points for when to start job hunting.' },
            durationMinutes: 90,
            priceBaht: 1400,
          },
        ],
      },
      {
        name: 'คุยเรื่องเงินกับแฟนก่อนแต่งงาน',
        description:
          'นัดคุยทั้งคู่เพื่อเปิดตัวเลขรายได้ หนี้ และภาระที่ต่างคนต่างมี แล้วตกลงกันว่าจะรวมเงินแค่ไหน แบ่งค่าใช้จ่ายอย่างไร และเป้าหมายห้าปีแรกคืออะไร มีคนกลางช่วยให้คุยเรื่องที่พูดยากได้ง่ายขึ้น',
        en: {
          name: 'The Money Talk Before Marriage',
          description:
            "A session for both of you to lay out income, debts, and family obligations, then agree how much to pool, how to split costs, and what your first five years should look like. Having someone in the middle makes the hard topics easier to say out loud.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(6963018), photo(6964338)],
        packages: [
          {
            name: 'คุยครั้งแรก',
            description: 'เปิดตัวเลขของทั้งคู่และตกลงหลักการแบ่งเงิน',
            en: { name: 'First Conversation', description: "Put both sets of numbers on the table and agree how you'll share money." },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'แผนการเงินคู่',
            description: 'ต่อยอดเป็นแผนเป้าหมายร่วม ทั้งงานแต่ง บ้าน และเงินเก็บ',
            en: { name: 'Joint Money Plan', description: 'Go on to a shared plan covering the wedding, a home, and savings.' },
            durationMinutes: 120,
            priceBaht: 2200,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.wanna.j@advisory.demo',
    displayName: 'วรรณา จิตต์มั่น',
    fullName: 'วรรณา จิตต์มั่น',
    portrait: portrait(35356592),
    headline: 'นักวางแผนการเงินครอบครัวและภาษี CFP',
    bio: 'นักวางแผนการเงิน CFP และผู้สอบบัญชีภาษีอากร (TA) ที่ทำงานในธุรกิจหลักทรัพย์และธนาคารรวม 22 ปี ก่อนเปิดสำนักงานวางแผนการเงินของตัวเอง ทำงานกับครอบครัวที่มีลูกเล็ก ครอบครัวที่ต้องดูแลพ่อแม่ไปพร้อมกัน คนที่เริ่มคิดเรื่องส่งต่อทรัพย์สิน และฟรีแลนซ์กับครีเอเตอร์ที่มีรายได้จากหลายแพลตฟอร์มซึ่งต้องวางแผนภาษีให้ถูก ไม่ขายผลิตภัณฑ์ทางการเงินใด ๆ รับค่าที่ปรึกษาเท่านั้น',
    en: {
      headline: 'CFP Family and Tax Planner',
      bio: 'A CFP professional and licensed tax auditor (TA) with 22 years in securities and banking before opening her own planning practice. Works with families raising young children, families supporting ageing parents at the same time, people starting to think about passing on their assets, and freelancers and creators earning from several platforms who need their tax planned properly. Sells no financial products and is paid by advice fees only.',
    },
    services: [
      {
        name: 'ภาษีของครีเอเตอร์ที่มีรายได้จากแพลตฟอร์มและสปอนเซอร์',
        description:
          'มีรายได้จากส่วนแบ่งโฆษณา ค่าจ้างรีวิว ของที่ได้รับฟรี และค่าคอมมิชชันจากหลายแพลตฟอร์ม มาจัดว่ารายได้แต่ละแบบเป็นเงินได้ประเภทไหน อะไรต้องนับเป็นรายได้บ้าง และหลักฐานอะไรที่ต้องเก็บไว้ตั้งแต่วันนี้',
        en: {
          name: 'Tax for Creators Earning From Platforms and Sponsors',
          description:
            "Earning from ad revenue shares, paid reviews, free products, and affiliate commission across several platforms? We sort out which tax category each type falls into, what counts as income, and what records you should start keeping today.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 800,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(7129700)],
        packages: [
          {
            name: 'จัดประเภทรายได้',
            description: 'ไล่รายได้ทุกช่องทางแล้วจัดประเภทให้ถูก',
            en: { name: 'Classify Your Income', description: 'Go through every channel and put each one in the right category.' },
            durationMinutes: 30,
            priceBaht: 800,
          },
          {
            name: 'วางแผนภาษีทั้งปี',
            description: 'ประมาณภาษีทั้งปีและวางระบบเก็บหลักฐานรายรับรายจ่าย',
            en: { name: 'Full-Year Tax Plan', description: 'An estimate of the year’s tax and a simple system for keeping income and expense records.' },
            durationMinutes: 90,
            priceBaht: 2200,
          },
        ],
      },
      {
        name: 'หักค่าใช้จ่ายตามจริงหรือหักเหมา แบบไหนคุ้มกว่า',
        description:
          'สำหรับฟรีแลนซ์และคนขายของที่มีต้นทุนจริงสูง เอาตัวเลขรายได้และค่าใช้จ่ายของคุณมาคำนวณเทียบทั้งสองแบบ ดูว่าเอกสารที่มีอยู่พอใช้หักตามจริงไหม และถ้าจะหักตามจริงปีหน้าต้องเริ่มเก็บอะไร',
        en: {
          name: 'Actual or Flat-Rate Expenses: Which Saves More?',
          description:
            "For freelancers and sellers with real costs that run high. We plug in your income and expenses and compare both methods, check whether your current paperwork is enough to claim actual costs, and what to start keeping if you want to claim them next year.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(8296974)],
        packages: [
          {
            name: 'คำนวณเทียบ',
            description: 'คำนวณภาษีทั้งสองแบบจากตัวเลขของคุณ',
            en: { name: 'Side-by-Side Calculation', description: 'Your tax worked out both ways from your own figures.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'เทียบพร้อมตรวจเอกสาร',
            description: 'คำนวณเทียบและตรวจว่าเอกสารค่าใช้จ่ายใช้ได้จริงหรือไม่',
            en: { name: 'Compare and Check Receipts', description: 'The comparison plus a check of whether your expense documents will stand up.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
      {
        name: 'ถึงเวลาจดทะเบียนภาษีมูลค่าเพิ่มหรือยัง',
        description:
          'รายได้ใกล้ 1.8 ล้านบาทต่อปี หรือลูกค้าองค์กรขอใบกำกับภาษี มาดูว่าคุณต้องจด VAT เมื่อไร การจดจะกระทบราคาที่เสนอลูกค้าแค่ไหน และหลังจดแล้วต้องยื่นแบบอะไรทุกเดือน',
        en: {
          name: 'Is It Time to Register for VAT?',
          description:
            "Income nearing 1.8 million baht a year, or corporate clients asking for tax invoices? We look at when you'd have to register, how registering affects the prices you quote, and what you'd need to file every month afterwards.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 1300,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(209224)],
        packages: [
          {
            name: 'ประเมินว่าต้องจดไหม',
            description: 'ดูรายได้ย้อนหลังและแนวโน้มว่าจะถึงเกณฑ์เมื่อไร',
            en: { name: 'Do I Need to Register?', description: 'Look at past income and the trend to see when you’ll cross the threshold.' },
            durationMinutes: 45,
            priceBaht: 1300,
          },
          {
            name: 'เตรียมจดและตั้งราคาใหม่',
            description: 'วางขั้นตอนจดทะเบียนและปรับใบเสนอราคาให้รวม VAT อย่างถูกต้อง',
            en: { name: 'Register and Reprice', description: 'Plan the registration and update your quotes to include VAT correctly.' },
            durationMinutes: 90,
            priceBaht: 2400,
          },
        ],
      },
      {
        name: 'แยกเงินส่วนตัวกับเงินงานของฟรีแลนซ์',
        description:
          'เงินค่าจ้าง เงินค่าใช้จ่ายงาน และเงินใช้ส่วนตัวปนอยู่ในบัญชีเดียวจนไม่รู้ว่ากำไรจริงเท่าไร มาวางบัญชีแยก กำหนดว่าจะจ่ายเงินเดือนให้ตัวเองเท่าไร และกันเงินภาษีไว้ล่วงหน้าทุกครั้งที่ลูกค้าโอนเข้ามา',
        en: {
          name: 'Separate Your Freelance and Personal Money',
          description:
            "Client payments, work costs, and personal spending all in one account, so you can't tell what you really earn? We set up separate accounts, decide what salary to pay yourself, and put aside tax every time a client pays.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 600,
        durationMinutes: 30,
        photos: [photo(8837758), photo(4482900)],
        packages: [
          {
            name: 'วางโครงบัญชี',
            description: 'กำหนดว่าควรมีกี่บัญชีและแต่ละบัญชีมีไว้ทำอะไร',
            en: { name: 'Account Structure', description: 'How many accounts you need and what each one is for.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'ระบบพร้อมเงินเดือนตัวเอง',
            description: 'คำนวณเงินเดือนที่จ่ายตัวเองได้และสัดส่วนกันภาษีจากทุกยอดที่ได้รับ',
            en: { name: 'System and Owner Salary', description: 'The salary you can pay yourself and the share of each payment to set aside for tax.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
      {
        name: 'วางแผนการเงินครอบครัวที่เพิ่งมีลูก',
        description:
          'ลูกคนแรกมาพร้อมค่าใช้จ่ายที่ไม่เคยมี มาวางงบครอบครัวใหม่ ดูความคุ้มครองที่พ่อแม่ควรมีถ้าเกิดอะไรขึ้นกับคนหาเงินหลัก และตั้งเป้าเงินเก็บระยะยาวของลูกโดยไม่ทิ้งแผนเกษียณของตัวเอง',
        en: {
          name: 'Financial Plan for a New Family',
          description:
            "A first child brings costs you've never had before. We redo the family budget, look at the cover parents should have in case something happens to the main earner, and set long-term savings goals for your child without abandoning your own retirement plan.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 1800,
        durationMinutes: 60,
        trialMinutes: 15,
        photos: [photo(6963888)],
        packages: [
          {
            name: 'วางงบครอบครัว',
            description: 'จัดงบรายเดือนใหม่ให้รองรับค่าใช้จ่ายของลูก',
            en: { name: 'Family Budget', description: 'A new monthly budget that makes room for the baby’s costs.' },
            durationMinutes: 60,
            priceBaht: 1800,
          },
          {
            name: 'แผนครอบครัวเต็ม',
            description: 'งบ ความคุ้มครอง และเป้าหมายเงินเก็บระยะยาวในแผนเดียว',
            en: { name: 'Full Family Plan', description: 'Budget, protection, and long-term savings goals in a single plan.' },
            durationMinutes: 120,
            priceBaht: 3500,
          },
          {
            name: 'แผนพร้อมรายงาน',
            description: 'แผนเต็มพร้อมรายงานเป็นเอกสารและนัดทบทวนหลังสามเดือน',
            en: { name: 'Plan With Written Report', description: 'The full plan as a written report, plus a review call after three months.' },
            durationMinutes: 180,
            priceBaht: 5500,
          },
        ],
      },
      {
        name: 'วางแผนทุนการศึกษาลูกถึงปริญญาตรี',
        description:
          'คำนวณค่าเล่าเรียนตามเส้นทางที่คุณคิดไว้ ทั้งโรงเรียนรัฐ เอกชน หรือหลักสูตรนานาชาติ ปรับด้วยอัตราค่าเล่าเรียนที่ขึ้นทุกปี แล้วแบ่งเป็นเงินที่ต้องเก็บต่อเดือนและที่พักเงินที่เหมาะกับระยะเวลาที่เหลือ',
        en: {
          name: "Plan Your Child's Education Fund to University",
          description:
            "We cost out the path you have in mind, whether state, private, or international schools, allow for fees rising every year, then break it down into a monthly savings amount and where to keep the money for the time you have left.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 1500,
        durationMinutes: 60,
        photos: [photo(12955547)],
        packages: [
          {
            name: 'คำนวณเป้าหมาย',
            description: 'ตัวเลขทุนการศึกษาที่ต้องมีตามเส้นทางที่เลือก',
            en: { name: 'Set the Goal', description: 'The education fund you need for the path you choose.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'แผนเก็บพร้อมที่พักเงิน',
            description: 'แบ่งเป็นก้อนตามช่วงชั้นเรียนพร้อมแนวทางเลือกที่พักเงินแต่ละก้อน',
            en: { name: 'Savings Plan and Where to Hold It', description: 'Split by school stage, with guidance on where to keep each portion.' },
            durationMinutes: 90,
            priceBaht: 2400,
          },
        ],
      },
      {
        name: 'วางแผนส่งต่อทรัพย์สินให้ลูกหลาน',
        description:
          'สำหรับคนวัย 50 ขึ้นไปที่อยากจัดการทรัพย์สินให้ชัดก่อนเกิดปัญหาในครอบครัว ทำรายการทรัพย์สินและหนี้ทั้งหมด ดูทางเลือกระหว่างให้ตอนมีชีวิตอยู่ ทำพินัยกรรม หรือระบุผู้รับประโยชน์ พร้อมภาระภาษีของแต่ละทาง แล้วจึงส่งต่อให้ทนายร่างเอกสาร',
        en: {
          name: 'Plan How to Pass On Your Assets',
          description:
            "For people over 50 who want things settled before they cause family trouble. We list all your assets and debts, compare giving during your lifetime, making a will, and naming beneficiaries, along with the tax each route carries, before you hand over to a lawyer to draft the documents.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 2500,
        durationMinutes: 90,
        screeningRequired: true,
        photos: [photo(7477702), photo(3771097)],
        packages: [
          {
            name: 'ทำรายการทรัพย์สิน',
            description: 'รวบรวมทรัพย์สินและหนี้ทั้งหมดพร้อมคำถามที่ต้องตัดสินใจ',
            en: { name: 'Asset Inventory', description: 'Everything you own and owe, with the decisions you need to make.' },
            durationMinutes: 90,
            priceBaht: 2500,
          },
          {
            name: 'แผนส่งต่อทั้งครอบครัว',
            description: 'เทียบทางเลือกการส่งต่อพร้อมภาระภาษี และร่างแนวทางให้ทนายใช้ต่อ',
            en: { name: 'Whole-Family Succession Plan', description: 'Compare the options and their tax, and draft guidance for your lawyer to work from.' },
            durationMinutes: 180,
            priceBaht: 6500,
          },
        ],
      },
      {
        name: 'ตรวจสุขภาพการเงินทั้งบ้านประจำปี',
        description:
          'นัดปีละครั้งเพื่อดูภาพรวมการเงินของครอบครัว ทั้งรายรับรายจ่าย หนี้ เงินออม เงินลงทุน และประกัน เทียบกับปีที่แล้ว ดูว่าเป้าหมายไหนเดินตามแผน และอะไรที่ต้องปรับก่อนเริ่มปีใหม่',
        en: {
          name: 'Annual Household Financial Check-Up',
          description:
            "A once-a-year look at your family's whole financial picture: income and spending, debt, savings, investments, and insurance, compared with last year. We see which goals are on track and what needs adjusting before the new year starts.",
        },
        category: 'การเงินและภาษี',
        priceBaht: 1600,
        durationMinutes: 60,
        photos: [photo(6964107), photo(669612)],
        packages: [
          {
            name: 'ตรวจภาพรวม',
            description: 'ดูตัวเลขสำคัญของบ้านและชี้จุดที่ควรแก้ก่อน',
            en: { name: 'Big-Picture Check', description: 'The household’s key numbers, and what to fix first.' },
            durationMinutes: 60,
            priceBaht: 1600,
          },
          {
            name: 'ตรวจพร้อมแผนปีหน้า',
            description: 'ตรวจละเอียดทุกหมวดและวางเป้าหมายตัวเลขของปีหน้า',
            en: { name: 'Check-Up and Next-Year Plan', description: 'A detailed review of every area and number targets for next year.' },
            durationMinutes: 120,
            priceBaht: 3000,
          },
        ],
      },
    ],
  },

  // ── บัญชีและการตรวจสอบ ──────────────────────────────────────────
  {
    email: 'fin.sunanta.l@advisory.demo',
    displayName: 'สุนันทา เลิศวิริยะ',
    fullName: 'สุนันทา เลิศวิริยะ',
    portrait: portrait(8837463),
    headline: 'ผู้สอบบัญชีรับอนุญาต ดูแลงบการเงินและระบบบัญชี SME',
    bio: 'ผู้สอบบัญชีรับอนุญาต (CPA) ประสบการณ์ 20 ปี เริ่มงานที่สำนักงานสอบบัญชีขนาดใหญ่ก่อนเปิดสำนักงานของตัวเอง ปัจจุบันตรวจสอบงบให้ SME กว่า 60 บริษัท ถนัดอธิบายงบการเงินให้เจ้าของกิจการที่ไม่ได้เรียนบัญชีเข้าใจ ช่วยแก้ปัญหางบที่ค้างหรือยื่นผิดมาหลายปี และวางระบบบัญชีออนไลน์ ผังบัญชี และการคุมสต็อกให้ร้านที่ขายหลายช่องทางทำเองได้',
    en: {
      headline: 'Certified Public Accountant for SME Financial Statements and Bookkeeping Systems',
      bio: 'A CPA with 20 years of experience, starting at a large audit firm before opening her own practice, which now audits more than 60 SMEs. Good at explaining financial statements to owners who never studied accounting, sorting out statements that are years overdue or were filed wrong, and setting up online bookkeeping, charts of accounts, and stock control that shops selling across several channels can run themselves.',
    },
    services: [
      {
        name: 'เตรียมตัวก่อนผู้สอบบัญชีเข้าตรวจงบประจำปี',
        description:
          'สำหรับบริษัทที่กำลังจะปิดงบและไม่อยากให้การตรวจสอบลากยาว ไล่ดูเอกสารที่ผู้สอบบัญชีจะขอ ยอดที่มักถูกตั้งคำถาม เช่น เงินกู้กรรมการ สินค้าคงเหลือ และลูกหนี้ค้างนาน แล้วจัดลำดับสิ่งที่ต้องเตรียมก่อนวันเข้าตรวจ',
        en: {
          name: 'Get Ready Before Your Annual Audit',
          description:
            "For companies about to close the year that don't want the audit to drag on. We go through the documents the auditor will ask for, the balances that usually draw questions, such as director loans, inventory, and old receivables, and put what you need to prepare in order before fieldwork starts.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1800,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(8370964), photo(267582)],
        packages: [
          {
            name: 'เช็กลิสต์ก่อนตรวจ',
            description: 'รายการเอกสารและยอดบัญชีที่ต้องเตรียมให้พร้อม',
            en: { name: 'Pre-Audit Checklist', description: 'The documents and balances to have ready.' },
            durationMinutes: 60,
            priceBaht: 1800,
          },
          {
            name: 'ตรวจยอดสำคัญก่อน',
            description: 'ไล่ตรวจยอดที่มีความเสี่ยงสูงพร้อมแนะนำการปรับปรุงรายการ',
            en: { name: 'Review Key Balances First', description: 'Check the high-risk balances and suggest the adjusting entries.' },
            durationMinutes: 120,
            priceBaht: 3800,
          },
        ],
      },
      {
        name: 'อ่านงบการเงินของบริษัทตัวเองให้เข้าใจ',
        description:
          'เจ้าของกิจการหลายคนเซ็นงบทุกปีโดยไม่รู้ว่าตัวเลขบอกอะไร นัดนี้จะเปิดงบของบริษัทคุณจริง ๆ อธิบายงบแสดงฐานะการเงิน งบกำไรขาดทุน และกระแสเงินสดทีละบรรทัด พร้อมตัวชี้วัดไม่กี่ตัวที่ควรดูทุกไตรมาส',
        en: {
          name: "Understand Your Own Company's Financial Statements",
          description:
            "Many owners sign their statements every year without knowing what the numbers say. We open your company's actual statements and walk through the balance sheet, income statement, and cash flow line by line, plus the handful of ratios worth checking every quarter.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1500,
        durationMinutes: 60,
        trialMinutes: 15,
        photos: [photo(7247416), photo(7947710)],
        packages: [
          {
            name: 'อ่านงบปีล่าสุด',
            description: 'อธิบายงบปีล่าสุดของบริษัทคุณทีละส่วน',
            en: { name: 'Latest Year Walk-Through', description: "Your company's latest statements explained section by section." },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'เทียบสามปีย้อนหลัง',
            description: 'เทียบงบสามปีเพื่อดูแนวโน้มกำไร หนี้ และเงินสด',
            en: { name: 'Three-Year Comparison', description: 'Compare three years to see trends in profit, debt, and cash.' },
            durationMinutes: 120,
            priceBaht: 3200,
          },
        ],
      },
      {
        name: 'แก้งบที่ยื่นช้าหรือยื่นผิดย้อนหลัง',
        description:
          'ไม่ได้ยื่นงบหรือ ภ.ง.ด.50 มาหนึ่งถึงสองปี หรือพบว่างบที่ยื่นไปมีตัวเลขผิด มาประเมินว่าตอนนี้มีค่าปรับและเงินเพิ่มประมาณเท่าไร ต้องทำอะไรก่อนหลังกับกรมพัฒนาธุรกิจการค้าและกรมสรรพากร และจะปิดเรื่องนี้ให้จบได้ภายในกี่เดือน',
        en: {
          name: 'Fix Late or Incorrect Financial Statements',
          description:
            "Haven't filed your statements or corporate tax return for a year or two, or found errors in what you filed? We estimate the fines and surcharges you're facing, set out what to do first with the Department of Business Development and the Revenue Department, and how many months it should take to close the matter.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 2200,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(6694919), photo(8374286)],
        packages: [
          {
            name: 'ประเมินสถานการณ์',
            description: 'สรุปสิ่งที่ค้าง ค่าปรับโดยประมาณ และลำดับการแก้ไข',
            en: { name: 'Assess the Situation', description: "What's outstanding, rough penalties, and the order to fix things in." },
            durationMinutes: 60,
            priceBaht: 2200,
          },
          {
            name: 'แผนแก้ไขพร้อมไทม์ไลน์',
            description: 'แผนแก้ไขละเอียดรายเดือนและเอกสารที่ต้องรวบรวมแต่ละขั้น',
            en: { name: 'Remediation Plan and Timeline', description: 'A detailed month-by-month plan and the documents needed at each step.' },
            durationMinutes: 120,
            priceBaht: 4500,
          },
        ],
      },
      {
        name: 'เปลี่ยนสำนักงานบัญชีกลางปีโดยงานไม่สะดุด',
        description:
          'ไม่พอใจสำนักงานบัญชีเดิมแต่กลัวว่าเปลี่ยนแล้วข้อมูลจะหาย มาวางรายการสิ่งที่ต้องขอรับมอบ ตั้งแต่สมุดบัญชี เอกสารแบบยื่นภาษี จนถึงรหัสผ่านระบบออนไลน์ และจุดที่ต้องตรวจสอบก่อนสำนักงานใหม่รับงานต่อ',
        en: {
          name: 'Switch Accounting Firms Mid-Year Without Disruption',
          description:
            "Unhappy with your current accountants but worried data will get lost if you move? We list everything you need handed over, from ledgers and filed returns to logins for online systems, and what to check before the new firm takes over.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1200,
        durationMinutes: 45,
        photos: [photo(8292831), photo(1181618)],
        packages: [
          {
            name: 'รายการรับมอบงาน',
            description: 'เช็กลิสต์สิ่งที่ต้องขอจากสำนักงานเดิมให้ครบ',
            en: { name: 'Handover Checklist', description: 'A checklist of everything to collect from your old firm.' },
            durationMinutes: 45,
            priceBaht: 1200,
          },
          {
            name: 'รับมอบพร้อมตรวจยอดยกมา',
            description: 'ตรวจยอดยกมาว่าตรงกับงบที่ยื่นก่อนส่งต่อให้สำนักงานใหม่',
            en: { name: 'Handover and Opening Balance Check', description: 'Confirm the opening balances match the filed statements before the new firm takes over.' },
            durationMinutes: 90,
            priceBaht: 2600,
          },
        ],
      },
      {
        name: 'เลือกโปรแกรมบัญชีออนไลน์ให้เหมาะกับธุรกิจเล็ก',
        description:
          'โปรแกรมบัญชีมีให้เลือกหลายเจ้า ราคาและความสามารถต่างกันมาก เล่าวิธีขายและจำนวนเอกสารต่อเดือนของคุณ แล้วมาเทียบว่าต้องการฟีเจอร์ไหนจริง ฟีเจอร์ไหนจ่ายเกินจำเป็น และควรเริ่มด้วยแพ็กเกจระดับใด',
        en: {
          name: 'Choose Online Accounting Software for a Small Business',
          description:
            "There are plenty of accounting programs, with big differences in price and features. Tell me how you sell and how many documents you issue each month, and we'll compare which features you actually need, which you'd be overpaying for, and which plan to start on.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 700,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(21325131), photo(8534180)],
        packages: [
          {
            name: 'เทียบตัวเลือก',
            description: 'สรุปสองถึงสามโปรแกรมที่เหมาะกับธุรกิจของคุณ',
            en: { name: 'Compare Options', description: 'A shortlist of two or three programs that suit your business.' },
            durationMinutes: 30,
            priceBaht: 700,
          },
          {
            name: 'เลือกพร้อมทดลองตั้งค่า',
            description: 'เลือกโปรแกรมแล้วนั่งตั้งค่าบริษัทและเอกสารแรกไปด้วยกัน',
            en: { name: 'Choose and Set Up', description: 'Pick a program, then set up your company and first documents together.' },
            durationMinutes: 90,
            priceBaht: 1900,
          },
        ],
      },
      {
        name: 'วางผังบัญชีและระบบเอกสารรับจ่าย',
        description:
          'ใบเสร็จหาย ใบกำกับภาษีไม่ครบ หรือไม่รู้ว่าค่าใช้จ่ายแต่ละอย่างควรลงหมวดไหน มาวางผังบัญชีให้พอดีกับธุรกิจ กำหนดว่าเอกสารแต่ละใบต้องผ่านใครและเก็บที่ไหน และตั้งรอบการส่งเอกสารให้สำนักงานบัญชี',
        en: {
          name: 'Set Up a Chart of Accounts and Document Flow',
          description:
            "Lost receipts, missing tax invoices, or no idea which category each expense belongs in? We design a chart of accounts that fits your business, decide who each document passes through and where it's stored, and set a regular schedule for sending paperwork to your accountant.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1500,
        durationMinutes: 60,
        photos: [photo(7718714), photo(10099173)],
        packages: [
          {
            name: 'ผังบัญชีพื้นฐาน',
            description: 'ออกแบบผังบัญชีที่เหมาะกับประเภทธุรกิจของคุณ',
            en: { name: 'Basic Chart of Accounts', description: 'A chart of accounts designed for your type of business.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'ผังบัญชีพร้อมระบบเอกสาร',
            description: 'ผังบัญชีพร้อมขั้นตอนเอกสารรับจ่ายที่ทีมใช้ได้ทันที',
            en: { name: 'Accounts Plus Document Flow', description: 'The chart plus a receipts-and-payments process your team can use straight away.' },
            durationMinutes: 120,
            priceBaht: 3000,
          },
        ],
      },
      {
        name: 'ทำบัญชีร้านที่ขายบนหลายแพลตฟอร์ม',
        description:
          'ขายทั้งมาร์เก็ตเพลส โซเชียล และหน้าร้าน แต่ยอดเงินที่เข้าบัญชีไม่ตรงกับยอดขาย มาไล่ว่าค่าธรรมเนียม ค่าส่ง และส่วนลดของแต่ละแพลตฟอร์มควรบันทึกอย่างไร และกระทบยอดรายเดือนแบบไหนให้รู้กำไรจริง',
        en: {
          name: 'Bookkeeping for Shops Selling on Several Platforms',
          description:
            "Selling on marketplaces, social media, and in a shop, but the money landing in your account never matches sales? We work out how to record each platform's fees, shipping, and discounts, and how to reconcile monthly so you know your real profit.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1400,
        durationMinutes: 60,
        photos: [photo(7857523), photo(4440883)],
        packages: [
          {
            name: 'วิธีบันทึกรายการ',
            description: 'วิธีบันทึกยอดขายและค่าธรรมเนียมของแต่ละแพลตฟอร์ม',
            en: { name: 'How to Record It', description: "How to record each platform's sales and fees." },
            durationMinutes: 60,
            priceBaht: 1400,
          },
          {
            name: 'กระทบยอดเดือนจริง',
            description: 'นั่งกระทบยอดเดือนล่าสุดของร้านคุณด้วยกันจนตัวเลขตรง',
            en: { name: 'Reconcile a Real Month', description: "Reconcile your shop's latest month together until the numbers agree." },
            durationMinutes: 120,
            priceBaht: 2800,
          },
        ],
      },
      {
        name: 'ทำบัญชีสต็อกสินค้าให้ตรงกับของจริง',
        description:
          'นับสต็อกทีไรไม่ตรงกับในระบบ หรือไม่เคยรู้ต้นทุนขายที่แท้จริง มาวางวิธีรับเข้า เบิกออก และตัดสต็อก เลือกวิธีคิดต้นทุนที่เหมาะกับสินค้า และกำหนดรอบการตรวจนับที่ทำได้จริงกับขนาดร้าน',
        en: {
          name: 'Make Your Inventory Records Match the Shelf',
          description:
            "Stock counts never match the system, or you've never known your true cost of goods sold? We set up how stock comes in, goes out, and is written off, choose a costing method that suits your products, and set a counting schedule that's realistic for the size of your shop.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1600,
        durationMinutes: 60,
        photos: [photo(6170458), photo(7857535)],
        packages: [
          {
            name: 'วางวิธีคุมสต็อก',
            description: 'ขั้นตอนรับเข้า เบิกออก และวิธีคิดต้นทุนที่เหมาะกับร้าน',
            en: { name: 'Stock Control Method', description: 'Receiving and issuing steps and the right costing method for your shop.' },
            durationMinutes: 60,
            priceBaht: 1600,
          },
          {
            name: 'วางระบบพร้อมตรวจนับ',
            description: 'วางระบบและออกแบบแบบฟอร์มตรวจนับพร้อมวิธีปรับยอดผลต่าง',
            en: { name: 'System and Stock Count', description: 'The system, a stock-count form, and how to adjust for differences.' },
            durationMinutes: 120,
            priceBaht: 3200,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.pairoj.w@advisory.demo',
    displayName: 'ไพโรจน์ วิเศษสุวรรณ',
    fullName: 'ไพโรจน์ วิเศษสุวรรณ',
    portrait: portrait(5921492),
    headline: 'ผู้ตรวจสอบภายในและที่ปรึกษาระบบบัญชีและภาษีธุรกิจ',
    bio: 'ผู้ตรวจสอบภายในของธนาคารพาณิชย์ 25 ปี ได้วุฒิผู้ตรวจสอบภายในรับอนุญาต (CIA) และผู้สอบบัญชีภาษีอากร (TA) หลังเกษียณก่อนกำหนดหันมาช่วยธุรกิจครอบครัว นิติบุคคลอาคารชุด และมูลนิธิวางระบบการเงินให้ตรวจสอบได้ ตั้งแต่ย้ายบัญชีจาก Excel ขึ้นระบบไปจนถึงยื่นภาษีมูลค่าเพิ่มและภาษีเงินได้นิติบุคคลให้ถูกต้อง ใจเย็น ชอบอธิบายด้วยตัวอย่างจากเคสจริง และไม่ชี้นิ้วหาคนผิด',
    en: {
      headline: 'Internal Auditor and Accounting Systems and Business Tax Advisor',
      bio: 'Spent 25 years in internal audit at a commercial bank and holds the Certified Internal Auditor (CIA) designation and a tax auditor (TA) licence. After taking early retirement he now helps family businesses, condominium juristic persons, and foundations set up finances that can be checked, from moving the books off Excel to filing VAT and corporate income tax correctly. Patient, explains through real cases, and focuses on fixing systems rather than blaming people.',
    },
    services: [
      {
        name: 'ย้ายบัญชีจากไฟล์ Excel ขึ้นระบบกลางปี',
        description:
          'ทำบัญชีด้วย Excel มาหลายปีแล้วอยากย้ายขึ้นระบบโดยไม่ต้องรอต้นปี มาวางว่าจะยกยอดอะไรบ้าง ณ วันไหน ข้อมูลลูกค้า สินค้า และลูกหนี้ค้างชำระย้ายอย่างไร และตรวจอย่างไรว่ายอดหลังย้ายตรงกับของเดิม',
        en: {
          name: 'Move Your Books From Excel to Software Mid-Year',
          description:
            "Kept your books in Excel for years and want to switch without waiting for January? We plan which balances to bring over and as of what date, how to move customer, product, and receivable data, and how to check the figures match after the move.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1200,
        durationMinutes: 45,
        photos: [photo(3184611), photo(6325892)],
        packages: [
          {
            name: 'แผนย้ายข้อมูล',
            description: 'กำหนดวันตัดยอดและรายการข้อมูลที่ต้องย้าย',
            en: { name: 'Migration Plan', description: 'The cut-off date and the list of data to move.' },
            durationMinutes: 45,
            priceBaht: 1200,
          },
          {
            name: 'ย้ายพร้อมตรวจยอด',
            description: 'ช่วยเตรียมไฟล์นำเข้าและตรวจยอดหลังย้ายให้ตรงกัน',
            en: { name: 'Migrate and Verify', description: 'Prepare the import files and check the balances agree afterwards.' },
            durationMinutes: 120,
            priceBaht: 3000,
          },
        ],
      },
      {
        name: 'ยื่น ภ.พ.30 เองทุกเดือนให้ถูกต้อง',
        description:
          'เพิ่งจด VAT หรืออยากเลิกจ้างคนยื่นแบบรายเดือน มาฝึกยื่น ภ.พ.30 กับตัวเลขจริงของเดือนล่าสุด ตั้งแต่ทำรายงานภาษีซื้อภาษีขาย แยกภาษีซื้อที่ใช้ได้กับใช้ไม่ได้ จนถึงชำระภาษีออนไลน์ให้ทันกำหนด',
        en: {
          name: 'File Your Monthly VAT Return Yourself',
          description:
            "Newly VAT-registered, or want to stop paying someone to file every month? We practise filing PP 30 with your latest month's real figures, from preparing the input and output tax reports and separating claimable from non-claimable input tax, to paying online before the deadline.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(8296985), photo(6863259)],
        packages: [
          {
            name: 'ยื่นเดือนแรกด้วยกัน',
            description: 'นั่งยื่นแบบเดือนล่าสุดด้วยกันทีละขั้น',
            en: { name: 'First Month Together', description: 'File your latest month together, step by step.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'ยื่นพร้อมคู่มือของบริษัท',
            description: 'ยื่นจริงหนึ่งเดือนและทำคู่มือขั้นตอนสำหรับเดือนต่อ ๆ ไป',
            en: { name: 'File and Write the Playbook', description: 'File one real month and write a step-by-step guide for the months after.' },
            durationMinutes: 120,
            priceBaht: 2400,
          },
        ],
      },
      {
        name: 'ตรวจใบกำกับภาษีซื้อขายก่อนสรรพากรตรวจ',
        description:
          'ได้หนังสือแจ้งตรวจภาษีมูลค่าเพิ่ม หรืออยากตรวจตัวเองก่อนขอคืนภาษี สุ่มตรวจใบกำกับภาษีซื้อและขายของคุณว่ามีรายการครบตามกฎหมายไหม ภาษีซื้อรายการไหนเสี่ยงถูกตัด และควรแก้ไขอะไรก่อนเจ้าหน้าที่เข้าตรวจ',
        en: {
          name: 'Check Your Tax Invoices Before a VAT Audit',
          description:
            "Received notice of a VAT audit, or want to check yourself before claiming a refund? We sample your purchase and sales tax invoices for the required details, flag input tax at risk of being disallowed, and decide what to fix before the officer arrives.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 2000,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(5561909), photo(6120205)],
        packages: [
          {
            name: 'สุ่มตรวจหนึ่งเดือน',
            description: 'สุ่มตรวจเอกสารภาษีของหนึ่งเดือนและสรุปจุดเสี่ยง',
            en: { name: 'One-Month Sample', description: "Sample one month's tax documents and summarise the risks." },
            durationMinutes: 60,
            priceBaht: 2000,
          },
          {
            name: 'ตรวจหกเดือนพร้อมแนวทางแก้',
            description: 'ตรวจย้อนหลังหกเดือนพร้อมแนวทางแก้ไขและเอกสารชี้แจง',
            en: { name: 'Six Months With Fixes', description: 'Review six months back, with corrections and supporting explanations.' },
            durationMinutes: 180,
            priceBaht: 5500,
          },
        ],
      },
      {
        name: 'ประมาณการกำไรครึ่งปีและยื่น ภ.ง.ด.51',
        description:
          'บริษัทต้องประมาณกำไรทั้งปีเพื่อจ่ายภาษีครึ่งปี ถ้าประมาณต่ำไปมากอาจโดนเงินเพิ่ม มาดูตัวเลขหกเดือนแรกของคุณ ประมาณกำไรทั้งปีอย่างมีหลักการ และคำนวณภาษีที่ต้องจ่ายพร้อมเครดิตภาษีที่ถูกหักไว้',
        en: {
          name: 'Estimate Half-Year Profit and File PND 51',
          description:
            "Companies have to estimate full-year profit to pay half-year tax, and underestimating by too much can mean surcharges. We look at your first six months, estimate the full year on a sound basis, and work out the tax due after the credits already withheld.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1500,
        durationMinutes: 60,
        photos: [photo(590045), photo(8297478)],
        packages: [
          {
            name: 'ประมาณการและคำนวณ',
            description: 'ประมาณกำไรทั้งปีและคำนวณภาษีครึ่งปีที่ต้องชำระ',
            en: { name: 'Estimate and Calculate', description: 'Estimate full-year profit and the half-year tax payable.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'ประมาณการพร้อมวางแผนภาษีปลายปี',
            description: 'ต่อยอดเป็นแผนลดภาษีปลายปีที่ทำได้ตามกฎหมาย',
            en: { name: 'Estimate Plus Year-End Planning', description: 'Go on to plan legitimate ways to reduce tax before year-end.' },
            durationMinutes: 120,
            priceBaht: 3000,
          },
        ],
      },
      {
        name: 'ตรวจบัญชีนิติบุคคลอาคารชุดก่อนประชุมใหญ่',
        description:
          'สำหรับกรรมการนิติบุคคลหรือเจ้าของร่วมที่อยากเข้าใจงบก่อนยกมือรับรอง ไล่ดูรายรับค่าส่วนกลาง ค่าใช้จ่ายที่สูงผิดปกติ ยอดค้างชำระ และเงินกองทุน แล้วเตรียมคำถามที่ควรถามผู้จัดการอาคารในที่ประชุม',
        en: {
          name: 'Review Condo Accounts Before the Annual Meeting',
          description:
            "For committee members or co-owners who want to understand the accounts before voting to approve them. We go through common-fee income, unusually high expenses, arrears, and the sinking fund, then prepare the questions to put to the building manager at the meeting.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1500,
        durationMinutes: 60,
        photos: [photo(129494), photo(15994062)],
        packages: [
          {
            name: 'อ่านงบนิติบุคคล',
            description: 'อธิบายงบปีล่าสุดและชี้รายการที่ควรถามต่อ',
            en: { name: 'Read the Building Accounts', description: 'The latest year explained, with the items worth asking about.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'ตรวจพร้อมคำถามสำหรับที่ประชุม',
            description: 'เทียบงบสองปีและเตรียมชุดคำถามพร้อมเอกสารที่ควรขอดู',
            en: { name: 'Review Plus Meeting Questions', description: 'Compare two years and prepare questions plus the documents to request.' },
            durationMinutes: 120,
            priceBaht: 3000,
          },
        ],
      },
      {
        name: 'หาจุดรั่วของเงินสดหน้าร้าน',
        description:
          'ยอดเงินในลิ้นชักไม่ตรงกับยอดขายบ่อยขึ้น หรือสงสัยว่ามีเงินหายแต่ไม่อยากกล่าวหาใคร มาไล่ขั้นตอนตั้งแต่รับเงิน ทอนเงิน ปิดกะ จนถึงนำฝาก หาจุดที่เงินหลุดได้ และวางวิธีควบคุมที่ไม่ทำให้พนักงานรู้สึกถูกจับผิด',
        en: {
          name: 'Find Where Cash Is Leaking at the Till',
          description:
            "The till keeps coming up short against sales, or you suspect money is going missing but don't want to accuse anyone? We trace every step from taking payment and giving change to closing the shift and banking, find where cash can slip out, and put in controls that don't make staff feel watched.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1800,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(4921262)],
        packages: [
          {
            name: 'ไล่ขั้นตอนเงินสด',
            description: 'ไล่ขั้นตอนเงินสดของร้านและชี้จุดเสี่ยง',
            en: { name: 'Trace the Cash Process', description: "Walk through your shop's cash handling and point out the weak spots." },
            durationMinutes: 60,
            priceBaht: 1800,
          },
          {
            name: 'วางระบบควบคุมเงินสด',
            description: 'ออกแบบขั้นตอนปิดกะ ใบสรุปยอด และการตรวจนับแบบสุ่ม',
            en: { name: 'Cash Control System', description: 'Shift-close steps, a daily summary sheet, and surprise cash counts.' },
            durationMinutes: 120,
            priceBaht: 3600,
          },
        ],
      },
      {
        name: 'วางระบบควบคุมภายในสำหรับธุรกิจครอบครัว',
        description:
          'ธุรกิจโตขึ้นแต่ทุกการจ่ายเงินยังต้องผ่านคุณพ่อหรือคุณแม่คนเดียว มาวางว่าใครอนุมัติอะไรได้ถึงวงเงินเท่าไร แยกหน้าที่คนจ่ายเงินกับคนลงบัญชี และกำหนดรายงานไม่กี่ฉบับที่เจ้าของควรเห็นทุกสัปดาห์',
        en: {
          name: 'Internal Controls for a Family Business',
          description:
            "The business has grown but every payment still goes through Mum or Dad alone. We decide who can approve what and up to which limit, separate the person paying from the person recording, and set the few reports owners should see every week.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 2200,
        durationMinutes: 90,
        trialMinutes: 15,
        photos: [photo(7654411)],
        packages: [
          {
            name: 'ตารางอำนาจอนุมัติ',
            description: 'ออกแบบตารางอำนาจอนุมัติและการแบ่งหน้าที่',
            en: { name: 'Approval Matrix', description: 'Design an approval matrix and the split of duties.' },
            durationMinutes: 90,
            priceBaht: 2200,
          },
          {
            name: 'ระบบควบคุมครบชุด',
            description: 'อำนาจอนุมัติ ขั้นตอนจ่ายเงิน และรายงานประจำสัปดาห์ในชุดเดียว',
            en: { name: 'Full Control Set', description: 'Approval limits, payment steps, and weekly reports in one package.' },
            durationMinutes: 180,
            priceBaht: 5000,
          },
        ],
      },
      {
        name: 'วางระบบบัญชีให้มูลนิธิและกองทุนชุมชน',
        description:
          'สำหรับกรรมการมูลนิธิ สมาคม หรือกองทุนหมู่บ้านที่ต้องรายงานการใช้เงินให้ผู้บริจาคและสมาชิก มาวางวิธีรับเงินบริจาค ออกใบเสร็จ แยกเงินตามโครงการ และทำรายงานการเงินประจำปีที่อ่านเข้าใจและตรวจสอบได้',
        en: {
          name: 'Bookkeeping for Foundations and Community Funds',
          description:
            "For committee members of foundations, associations, or village funds who have to report to donors and members. We set up how donations are received and receipted, how money is tracked by project, and an annual financial report that's easy to read and can be checked.",
        },
        category: 'บัญชีและการตรวจสอบ',
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(6995212)],
        packages: [
          {
            name: 'วางระบบรับจ่าย',
            description: 'วิธีรับเงิน ออกใบเสร็จ และแยกเงินตามโครงการ',
            en: { name: 'Receipts and Payments Setup', description: 'How to receive money, issue receipts, and track funds by project.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'ระบบพร้อมรายงานประจำปี',
            description: 'วางระบบและออกแบบรายงานการเงินประจำปีสำหรับสมาชิกและผู้บริจาค',
            en: { name: 'System Plus Annual Report', description: 'The system and an annual financial report for members and donors.' },
            durationMinutes: 120,
            priceBaht: 2400,
          },
        ],
      },
    ],
  },

  // ── สินเชื่อและการจัดการหนี้ ─────────────────────────────────────
  {
    email: 'fin.kamonchanok.s@advisory.demo',
    displayName: 'กมลชนก ศรีสวัสดิ์',
    fullName: 'กมลชนก ศรีสวัสดิ์',
    portrait: portrait(6538856),
    headline: 'ที่ปรึกษาสินเชื่อและปรับโครงสร้างหนี้ส่วนบุคคล',
    bio: 'ทำงานฝ่ายสินเชื่อและฝ่ายปรับโครงสร้างหนี้ของสถาบันการเงินรวม 10 ปี จึงเข้าใจทั้งฝั่งเจ้าหนี้และลูกหนี้ ตั้งแต่วันยื่นกู้จนถึงวันที่ผ่อนไม่ไหว ปัจจุบันช่วยคนที่จะกู้บ้านหรือรีไฟแนนซ์เตรียมตัวก่อนยื่น และช่วยคนที่มีหนี้บัตรหรือสินเชื่อบุคคลวางแผนชำระที่ทำได้จริง คุยได้ทุกเรื่องโดยไม่ตัดสิน และไม่รับประกันผลอนุมัติแทนธนาคาร',
    en: {
      headline: 'Lending and Personal Debt Restructuring Advisor',
      bio: "Spent ten years across lending and debt restructuring at a financial institution, so she understands both lenders and borrowers, from the day you apply to the day you can't keep up. Helps people preparing for a mortgage or a refinance get ready before they apply, and helps people with card or personal-loan debt build repayment plans they can actually keep. Nothing you tell her will be judged, and she never promises an approval on a bank's behalf.",
    },
    services: [
      {
        name: 'เตรียมยื่นกู้บ้านสำหรับฟรีแลนซ์และเจ้าของกิจการ',
        description:
          'ไม่มีสลิปเงินเดือนแต่อยากกู้ซื้อบ้าน มาดูว่าธนาคารจะคิดรายได้ของคุณจากอะไร เดินบัญชีย้อนหลังกี่เดือน ภาระหนี้ต่อรายได้เหลือเท่าไร และควรเตรียมเอกสารชุดไหนเพิ่มเพื่อให้เคสอ่านง่ายที่สุดสำหรับเจ้าหน้าที่',
        en: {
          name: 'Home Loan Prep for Freelancers and Business Owners',
          description:
            "No payslip but want a mortgage? We look at how a bank will assess your income, how many months of statements it will want, how much room your debt-to-income ratio leaves, and which extra documents make your case easiest for the officer to read.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 1200,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(8292854), photo(8470836)],
        packages: [
          {
            name: 'ประเมินความพร้อม',
            description: 'ประเมินรายได้ที่ธนาคารน่าจะใช้และวงเงินโดยประมาณ',
            en: { name: 'Readiness Check', description: 'The income a bank is likely to count and a rough loan amount.' },
            durationMinutes: 45,
            priceBaht: 1200,
          },
          {
            name: 'จัดชุดเอกสารยื่นกู้',
            description: 'ไล่เอกสารทีละรายการและเขียนสรุปที่มาของรายได้แนบไปกับคำขอ',
            en: { name: 'Application Pack', description: 'Go through every document and write an income summary to attach to the application.' },
            durationMinutes: 90,
            priceBaht: 2400,
          },
        ],
      },
      {
        name: 'รีไฟแนนซ์บ้านหลังครบสามปี',
        description:
          'ครบสามปีแล้วดอกเบี้ยลอยตัวเริ่มขึ้น ควรขอลดดอกเบี้ยกับธนาคารเดิมหรือย้ายธนาคาร เอาสัญญาเดิมกับข้อเสนอที่ได้มาคำนวณเทียบกัน รวมค่าประเมิน ค่าจดจำนอง และค่าปรับไถ่ถอนก่อนกำหนด ให้เห็นว่าทางไหนประหยัดจริงตลอดอายุที่เหลือ',
        en: {
          name: 'Refinance Once Your Three Years Are Up',
          description:
            "Three years in and the floating rate is climbing: should you ask your bank for a lower rate or move? We compare your current contract with the offers you've received, including appraisal fees, mortgage registration, and early repayment penalties, to see which really saves money over the remaining term.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 900,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(8292880), photo(28914932)],
        packages: [
          {
            name: 'เทียบสองข้อเสนอ',
            description: 'เทียบข้อเสนอธนาคารเดิมกับธนาคารใหม่หนึ่งราย',
            en: { name: 'Compare Two Offers', description: 'Your current bank against one new offer.' },
            durationMinutes: 30,
            priceBaht: 900,
          },
          {
            name: 'เทียบทุกข้อเสนอพร้อมแผนต่อรอง',
            description: 'เทียบทุกข้อเสนอที่มีและเตรียมตัวเลขไว้ต่อรองกับธนาคารเดิม',
            en: { name: 'All Offers and a Negotiation Plan', description: 'Compare every offer and prepare figures to negotiate with your current bank.' },
            durationMinutes: 60,
            priceBaht: 1600,
          },
        ],
      },
      {
        name: 'ยื่นกู้ไม่ผ่าน หาสาเหตุก่อนยื่นใหม่',
        description:
          'ถูกปฏิเสธมาแล้วหนึ่งถึงสองครั้งและไม่รู้ว่าเพราะอะไร มาไล่ดูประวัติเครดิต ภาระหนี้ รายได้ และเอกสารที่ยื่นไป หาสาเหตุที่เป็นไปได้มากที่สุด แล้ววางแผนว่าต้องแก้อะไรและควรรออีกนานแค่ไหนก่อนยื่นใหม่',
        en: {
          name: 'Turned Down for a Loan? Find Out Why Before Reapplying',
          description:
            "Rejected once or twice and never told why? We go through your credit history, existing debts, income, and the documents you submitted to find the most likely reason, then plan what to fix and how long to wait before applying again.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 1000,
        durationMinutes: 45,
        photos: [photo(4226218), photo(3760067)],
        packages: [
          {
            name: 'หาสาเหตุ',
            description: 'วิเคราะห์สาเหตุที่น่าจะทำให้ไม่ผ่าน',
            en: { name: 'Find the Cause', description: 'Work out the most likely reasons you were declined.' },
            durationMinutes: 45,
            priceBaht: 1000,
          },
          {
            name: 'แผนยื่นใหม่',
            description: 'แผนแก้ไขรายเดือนจนถึงวันที่พร้อมยื่นอีกครั้ง',
            en: { name: 'Reapplication Plan', description: "A month-by-month plan up to the day you're ready to apply again." },
            durationMinutes: 90,
            priceBaht: 1900,
          },
        ],
      },
      {
        name: 'ขอวงเงินเบิกเกินบัญชีให้ร้านค้า',
        description:
          'ร้านขายดีแต่เงินสดตึงทุกต้นเดือนเพราะต้องจ่ายค่าของก่อนเก็บเงินลูกค้า มาคำนวณว่าควรขอวงเงิน OD หรือสินเชื่อหมุนเวียนเท่าไร ธนาคารจะดูงบและเดินบัญชีแบบไหน หลักประกันที่ต้องใช้ และต้นทุนดอกเบี้ยที่ร้านรับไหว',
        en: {
          name: 'Get an Overdraft Line for Your Shop',
          description:
            "Sales are good but cash is tight every month because you pay suppliers before customers pay you? We work out how big an overdraft or working-capital line to ask for, how the bank will read your accounts and statements, what collateral it may want, and the interest cost your shop can carry.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 1800,
        durationMinutes: 60,
        photos: [photo(4427557), photo(4963430)],
        packages: [
          {
            name: 'คำนวณวงเงินที่ควรขอ',
            description: 'ประเมินวงเงินจากรอบเงินสดจริงของร้าน',
            en: { name: 'Size the Credit Line', description: "Estimate the line from your shop's real cash cycle." },
            durationMinutes: 60,
            priceBaht: 1800,
          },
          {
            name: 'เตรียมเอกสารยื่นธนาคาร',
            description: 'จัดงบย่อ ประมาณการเงินสด และชุดเอกสารสำหรับยื่นขอวงเงิน',
            en: { name: 'Bank Application Pack', description: 'Summary accounts, a cash forecast, and the documents for the application.' },
            durationMinutes: 120,
            priceBaht: 3500,
          },
        ],
      },
      {
        name: 'โปะหนี้บ้านก่อนกำหนดหรือเก็บเงินไว้ลงทุน',
        description:
          'มีเงินก้อนแล้วลังเลว่าจะเอาไปโปะบ้านหรือเก็บไว้ คำนวณให้เห็นดอกเบี้ยที่ประหยัดได้ เทียบกับสภาพคล่องที่เสียไป สิทธิลดหย่อนดอกเบี้ยบ้าน และเงื่อนไขค่าปรับในสัญญาของคุณ เพื่อตัดสินใจจากตัวเลขของตัวเอง',
        en: {
          name: 'Pay Down Your Mortgage Early or Keep the Cash?',
          description:
            "Have a lump sum and can't decide whether to put it against your mortgage? We calculate the interest you'd save against the flexibility you'd give up, your mortgage interest deduction, and any penalty terms in your contract, so you decide from your own numbers.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 800,
        durationMinutes: 30,
        photos: [photo(4174740), photo(19693228)],
        packages: [
          {
            name: 'คำนวณเทียบ',
            description: 'เทียบดอกเบี้ยที่ประหยัดได้กับการเก็บเงินไว้',
            en: { name: 'Run the Numbers', description: 'Interest saved compared with keeping the cash.' },
            durationMinutes: 30,
            priceBaht: 800,
          },
          {
            name: 'แผนโปะหนี้รายปี',
            description: 'วางแผนโปะเป็นรายปีให้สอดคล้องกับเงินสำรองและสิทธิลดหย่อน',
            en: { name: 'Yearly Paydown Plan', description: 'A yearly paydown plan that fits your emergency fund and tax deduction.' },
            durationMinutes: 60,
            priceBaht: 1400,
          },
        ],
      },
      {
        name: 'รวมหนี้บัตรเครดิตและสินเชื่อบุคคลให้เหลือก้อนเดียว',
        description:
          'มีบัตรหลายใบและสินเชื่อหลายเจ้า จ่ายขั้นต่ำทุกเดือนแต่ยอดไม่ลด มาทำตารางหนี้ทั้งหมด ดูว่าคุณเข้าเงื่อนไขรวมหนี้กับธนาคารที่มีสินเชื่อบ้านหรือรถอยู่หรือไม่ และเทียบดอกเบี้ยกับระยะผ่อนให้เห็นว่ารวมแล้วดีขึ้นจริงไหม',
        en: {
          name: 'Consolidate Card Debt and Personal Loans',
          description:
            "Several cards and loans, paying the minimum every month and the balance never shrinks? We put all your debts in one table, check whether you qualify for debt consolidation with a bank that holds your mortgage or car loan, and compare rates and terms to see whether consolidating really helps.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 700,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(164501), photo(6237886)],
        packages: [
          {
            name: 'ทำตารางหนี้',
            description: 'รวมหนี้ทุกก้อนพร้อมดอกเบี้ยและยอดผ่อนจริง',
            en: { name: 'Debt Table', description: 'Every debt with its real rate and monthly payment.' },
            durationMinutes: 30,
            priceBaht: 700,
          },
          {
            name: 'ตารางหนี้พร้อมทางเลือกรวมหนี้',
            description: 'เทียบทางเลือกรวมหนี้ที่คุณเข้าเงื่อนไขพร้อมขั้นตอนยื่น',
            en: { name: 'Table Plus Consolidation Options', description: 'Compare the consolidation options you qualify for and how to apply.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
        ],
      },
      {
        name: 'เตรียมตัวเข้าโครงการคลินิกแก้หนี้',
        description:
          'หนี้บัตรหรือสินเชื่อบุคคลค้างชำระจนเป็นหนี้เสียแล้ว มาดูว่าคุณเข้าเงื่อนไขโครงการคลินิกแก้หนี้หรือมาตรการแก้หนี้อื่นหรือไม่ ต้องเตรียมเอกสารอะไร และค่างวดหลังปรับโครงสร้างจะประมาณเท่าไร ก่อนกรอกใบสมัครจริง',
        en: {
          name: 'Prepare to Apply for the Debt Clinic Scheme',
          description:
            "Card or personal loan arrears have turned into a non-performing debt? We check whether you qualify for the Debt Clinic scheme or other relief measures, what documents you'll need, and roughly what your instalments would be after restructuring, before you fill in the real application.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 800,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(5900150), photo(6964105)],
        packages: [
          {
            name: 'เช็กคุณสมบัติ',
            description: 'ดูว่าหนี้ก้อนไหนเข้าโครงการได้และก้อนไหนต้องใช้ทางอื่น',
            en: { name: 'Eligibility Check', description: 'Which debts qualify for the scheme and which need another route.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'เตรียมสมัครครบชุด',
            description: 'เตรียมเอกสาร คำนวณค่างวด และวางงบรายเดือนหลังเข้าโครงการ',
            en: { name: 'Full Application Prep', description: "Documents, estimated instalments, and a monthly budget for after you're in." },
            durationMinutes: 90,
            priceBaht: 1500,
          },
        ],
      },
      {
        name: 'แผนปลดหนี้ภายในสามปี',
        description:
          'อยากหมดหนี้ให้ได้ภายในเวลาที่กำหนด มาจัดลำดับว่าจะปิดหนี้ก้อนไหนก่อน หาเงินจากงบประจำเดือนมาโปะได้เท่าไรโดยไม่ทิ้งเงินสำรอง และตั้งจุดตรวจทุกหกเดือนเพื่อดูว่าแผนยังเดินอยู่',
        en: {
          name: 'A Three-Year Plan to Be Debt-Free',
          description:
            "Want to clear your debts within a set time? We decide which debt to close first, how much you can free up from your monthly budget without dropping your emergency fund, and set six-monthly checkpoints to make sure the plan is still on track.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 1000,
        durationMinutes: 60,
        photos: [photo(12912009), photo(6963056)],
        packages: [
          {
            name: 'แผนปลดหนี้',
            description: 'ลำดับการปิดหนี้และยอดโปะรายเดือน',
            en: { name: 'Payoff Plan', description: 'The order to clear debts in and the monthly overpayment.' },
            durationMinutes: 60,
            priceBaht: 1000,
          },
          {
            name: 'แผนพร้อมติดตามสามครั้ง',
            description: 'แผนเต็มพร้อมนัดติดตามสั้น ๆ สามครั้งในปีแรก',
            en: { name: 'Plan With Three Check-Ins', description: 'The full plan plus three short follow-up calls in the first year.' },
            durationMinutes: 120,
            priceBaht: 2200,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.phanuphong.r@advisory.demo',
    displayName: 'ภาณุพงศ์ รัตนวงศ์',
    fullName: 'ภาณุพงศ์ รัตนวงศ์',
    portrait: portrait(26524785),
    headline: 'ที่ปรึกษาเครดิตและสินเชื่อสำหรับคนรุ่นใหม่',
    bio: 'นักวิเคราะห์สินเชื่อของบริษัทบัตรเครดิต 5 ปี เห็นมาแล้วว่าการตัดสินใจเล็ก ๆ ตอนอายุ 25 กลายเป็นปัญหาตอนจะกู้บ้านได้อย่างไร ช่วยคนรุ่นใหม่อ่านรายงานเครดิตบูโร ใช้บัตรใบแรกให้เป็น ผ่อนรถอย่างรู้ตัว และรับมือเมื่อหนี้บัตร หนี้ กยศ. หรือหนี้นอกระบบเริ่มเกินมือ',
    en: {
      headline: 'Credit and Borrowing Advisor for Young Adults',
      bio: "Spent five years as a credit analyst at a credit card company and has seen small decisions made at 25 turn into problems when people later apply for a mortgage. Helps young adults read their credit bureau report, use a first credit card well, take on a car loan knowingly, and cope when card debt, student loans, or informal loans get out of hand.",
    },
    services: [
      {
        name: 'ผ่อนหนี้ กยศ. ที่ค้างให้กลับมาปกติ',
        description:
          'ค้างชำระ กยศ. มาหลายปีหรือถูกแจ้งว่าจะถูกฟ้อง มาดูยอดค้างจริง สิทธิ์ปรับโครงสร้างหนี้และลดเบี้ยปรับตามหลักเกณฑ์ปัจจุบัน และวางงวดผ่อนที่จ่ายไหวโดยไม่ต้องไปกู้ที่อื่นมาโปะ',
        en: {
          name: 'Get Your Student Loan Back on Track',
          description:
            "Years behind on your Student Loan Fund repayments, or warned you're about to be sued? We look at what you really owe, your right to restructure and have penalties reduced under the current rules, and set instalments you can afford without borrowing elsewhere to cover them.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(6237901)],
        packages: [
          {
            name: 'เช็กยอดและสิทธิ์',
            description: 'ดูยอดค้างและสิทธิ์ปรับโครงสร้างที่คุณมี',
            en: { name: 'Balance and Rights Check', description: 'What you owe and the restructuring options open to you.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'วางแผนผ่อนพร้อมยื่นคำขอ',
            description: 'คำนวณงวดผ่อนที่จ่ายไหวและเตรียมยื่นคำขอปรับโครงสร้าง',
            en: { name: 'Repayment Plan and Request', description: 'Affordable instalments and a restructuring request ready to submit.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
        ],
      },
      {
        name: 'ออกจากหนี้นอกระบบอย่างปลอดภัย',
        description:
          'กู้เงินนอกระบบแล้วดอกเบี้ยท่วมจนจ่ายแค่ดอกทุกวัน นัดนี้คุยกันเป็นความลับ ไล่ยอดที่จ่ายไปแล้วเทียบกับเงินต้น ดูช่องทางสินเชื่อในระบบที่อาจเข้าถึงได้ หน่วยงานรัฐที่รับเรื่องหนี้นอกระบบ และสิ่งที่ควรทำถ้าถูกทวงหนี้ผิดกฎหมาย',
        en: {
          name: 'Get Out of Informal Loan Shark Debt Safely',
          description:
            "Borrowed from an informal lender and now paying nothing but interest every day? This conversation stays confidential. We compare what you've paid against the original principal, look at formal credit you may be able to reach, the government offices that handle informal debt, and what to do if collectors act illegally.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 400,
        durationMinutes: 30,
        screeningRequired: true,
        photos: [photo(9063397), photo(4471312)],
        packages: [
          {
            name: 'คุยหาทางออก',
            description: 'ประเมินสถานการณ์และทางเลือกที่ปลอดภัยที่สุดตอนนี้',
            en: { name: 'Find a Way Out', description: 'Assess where you stand and the safest options right now.' },
            durationMinutes: 30,
            priceBaht: 400,
          },
          {
            name: 'แผนออกจากหนี้นอกระบบ',
            description: 'แผนทีละขั้นพร้อมเอกสารสำหรับติดต่อหน่วยงานที่เกี่ยวข้อง',
            en: { name: 'Step-by-Step Exit Plan', description: 'A step-by-step plan with the paperwork for contacting the right agencies.' },
            durationMinutes: 60,
            priceBaht: 800,
          },
        ],
      },
      {
        name: 'อ่านรายงานเครดิตบูโรและแก้ประวัติค้างชำระ',
        description:
          'ขอรายงานเครดิตบูโรมาแล้วอ่านไม่ออก หรือกังวลว่าประวัติค้างชำระเก่าจะทำให้กู้ไม่ผ่าน มาอ่านรายงานของคุณด้วยกันทีละบรรทัด ดูว่าสถานะบัญชีแต่ละแบบหมายถึงอะไร ข้อมูลจะอยู่นานเท่าไร และต้องทำอะไรให้ประวัติกลับมาดี',
        en: {
          name: 'Read Your Credit Bureau Report and Repair Late Payments',
          description:
            "Got your credit bureau report but can't make sense of it, or worried old late payments will sink a loan application? We read your report together line by line: what each account status means, how long the record stays, and what to do to rebuild a clean history.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 500,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(4482903)],
        packages: [
          {
            name: 'อ่านรายงานด้วยกัน',
            description: 'อธิบายรายงานเครดิตของคุณทีละบรรทัด',
            en: { name: 'Read It Together', description: 'Your credit report explained line by line.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'แผนฟื้นประวัติเครดิต',
            description: 'แผนรายเดือนเพื่อให้ประวัติเครดิตพร้อมก่อนยื่นกู้ก้อนใหญ่',
            en: { name: 'Credit Repair Plan', description: 'A monthly plan to get your credit ready before a big loan application.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
        ],
      },
      {
        name: 'ใช้บัตรเครดิตใบแรกโดยไม่กลายเป็นหนี้',
        description:
          'เพิ่งได้บัตรใบแรกหรือกำลังจะสมัคร มาเข้าใจรอบบัญชี วันครบกำหนด ดอกเบี้ยเมื่อจ่ายไม่เต็ม และกับดักของการผ่อนศูนย์เปอร์เซ็นต์ แล้วตั้งกติกาการใช้บัตรของตัวเองที่ช่วยสร้างประวัติเครดิตแทนที่จะสร้างหนี้',
        en: {
          name: 'Use Your First Credit Card Without Falling Into Debt',
          description:
            "Just got your first card or about to apply? We cover billing cycles, due dates, the interest you pay when you don't clear the balance, and the traps in zero-percent instalment plans, then set your own card rules that build a credit history instead of debt.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 400,
        durationMinutes: 30,
        photos: [photo(4968638), photo(9122014)],
        packages: [
          {
            name: 'พื้นฐานบัตรเครดิต',
            description: 'เข้าใจรอบบัญชี ดอกเบี้ย และค่าธรรมเนียมที่ต้องระวัง',
            en: { name: 'Card Basics', description: 'Billing cycles, interest, and the fees to watch for.' },
            durationMinutes: 30,
            priceBaht: 400,
          },
          {
            name: 'ตั้งกติกาการใช้บัตร',
            description: 'ตั้งวงเงินใช้จริง วันตัดจ่ายอัตโนมัติ และวิธีเช็กยอดทุกสัปดาห์',
            en: { name: 'Your Card Rules', description: 'A real spending limit, autopay, and a weekly balance check routine.' },
            durationMinutes: 45,
            priceBaht: 650,
          },
        ],
      },
      {
        name: 'ผ่อนรถคันแรก ราคาที่ไหวและสัญญาที่ต้องอ่าน',
        description:
          'กำลังจะออกรถคันแรก มาคำนวณราคารถ เงินดาวน์ และระยะผ่อนที่เหมาะกับรายได้ รวมค่าประกัน ค่าน้ำมัน และค่าดูแลรายปี อ่านสัญญาเช่าซื้อเรื่องดอกเบี้ยแบบคงที่ การปิดบัญชีก่อนกำหนด และสิ่งที่เกิดขึ้นถ้าผ่อนไม่ไหว',
        en: {
          name: 'Your First Car Loan: An Affordable Price and the Contract Terms',
          description:
            "About to buy your first car? We work out a price, down payment, and term that fit your income, including insurance, fuel, and yearly upkeep, then read the hire-purchase contract for its flat interest rate, early settlement terms, and what happens if you can't keep up.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 600,
        durationMinutes: 30,
        photos: [photo(97079), photo(8962688)],
        packages: [
          {
            name: 'คำนวณงบรถ',
            description: 'ราคารถและค่างวดที่เหมาะกับรายได้ของคุณ',
            en: { name: 'Car Budget', description: 'The car price and instalment that fit your income.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'งบรถพร้อมอ่านสัญญา',
            description: 'คำนวณงบและอ่านสัญญาเช่าซื้อจริงก่อนเซ็น',
            en: { name: 'Budget and Contract Read-Through', description: 'Set the budget and read your actual hire-purchase contract before signing.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
      {
        name: 'ถูกฟ้องหนี้บัตรเครดิต เตรียมตัวก่อนวันนัดศาล',
        description:
          'ได้หมายศาลเรื่องหนี้บัตรหรือสินเชื่อบุคคลแล้วตกใจ มาอ่านคำฟ้องด้วยกันว่าเจ้าหนี้เรียกยอดเท่าไร ตรวจดอกเบี้ยและค่าธรรมเนียมที่เรียกมา และเตรียมข้อเสนอผ่อนชำระที่จ่ายไหวสำหรับการไกล่เกลี่ยในวันนัด หากต้องสู้คดีจะแนะนำให้ปรึกษาทนายต่อ',
        en: {
          name: 'Sued Over Card Debt: Prepare for Your Court Date',
          description:
            "Received a court summons over card or personal loan debt? We read the claim together to see what the lender is asking for, check the interest and fees it has added, and prepare an affordable repayment offer for mediation on the day. If you need to contest the case, you'll be pointed to a lawyer.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 900,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(7640809), photo(6266281)],
        packages: [
          {
            name: 'อ่านคำฟ้อง',
            description: 'อธิบายคำฟ้องและยอดที่ถูกเรียกเก็บ',
            en: { name: 'Read the Claim', description: 'The claim and the amount being demanded, explained.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'เตรียมข้อเสนอไกล่เกลี่ย',
            description: 'คำนวณข้อเสนอผ่อนชำระและซ้อมการเจรจาในวันนัด',
            en: { name: 'Mediation Offer', description: 'Work out a repayment offer and rehearse the negotiation for the day.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
    ],
  },

  // ── อสังหาริมทรัพย์และบ้าน ───────────────────────────────────────
  {
    email: 'fin.sasithorn.w@advisory.demo',
    displayName: 'ศศิธร วัฒนกุล',
    fullName: 'ศศิธร วัฒนกุล',
    portrait: portrait(8101987),
    headline: 'ที่ปรึกษาซื้อคอนโดในกรุงเทพฯ',
    bio: 'ทำงานฝ่ายขายของบริษัทพัฒนาอสังหาริมทรัพย์ 5 ปี ก่อนออกมาเป็นนายหน้าอิสระที่เน้นคอนโดแนวรถไฟฟ้า เคยพาลูกค้าดูห้องมาแล้วหลายร้อยห้อง รู้ว่าตัวเลขไหนในใบเสนอราคาที่เซลส์ไม่ค่อยพูดถึง การนัดปรึกษาที่นี่เป็นความเห็นอิสระ ไม่ผูกกับโครงการใด',
    en: {
      headline: 'Bangkok Condo Buying Advisor',
      bio: "Worked five years in sales for a property developer before becoming an independent agent focused on condos along the rail lines. Has shown clients hundreds of units and knows which figures on a quotation the sales team rarely mention. Sessions here are independent advice, not tied to any project.",
    },
    services: [
      {
        name: 'เลือกคอนโดหลังแรกใกล้รถไฟฟ้า',
        description:
          'งบมีจำกัดแต่อยากอยู่ใกล้รถไฟฟ้า มาตั้งเกณฑ์จากที่ทำงาน งบผ่อนต่อเดือน และไลฟ์สไตล์ของคุณ เทียบทำเลสองถึงสามย่านที่เป็นไปได้ แล้วคัดโครงการที่ควรไปดูจริงไม่เกินห้าแห่ง',
        en: {
          name: 'Choose Your First Condo Near the Train Line',
          description:
            "Tight budget but want to live near a station? We set criteria from your workplace, monthly repayment budget, and lifestyle, compare two or three realistic areas, and narrow it down to no more than five projects worth visiting.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 800,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(30516945), photo(6933852)],
        packages: [
          {
            name: 'ตั้งเกณฑ์และทำเล',
            description: 'กำหนดงบ ทำเล และเกณฑ์ห้องที่เหมาะกับคุณ',
            en: { name: 'Criteria and Area', description: 'Set your budget, area, and what you need in a unit.' },
            durationMinutes: 45,
            priceBaht: 800,
          },
          {
            name: 'คัดโครงการให้',
            description: 'คัดโครงการที่ควรไปดูพร้อมข้อดีข้อเสียของแต่ละแห่ง',
            en: { name: 'Project Shortlist', description: 'A shortlist of projects to visit, with pros and cons for each.' },
            durationMinutes: 90,
            priceBaht: 1600,
          },
        ],
      },
      {
        name: 'คอนโดมือหนึ่งหรือมือสอง เทียบค่าใช้จ่ายจริง',
        description:
          'ราคาต่อตารางเมตรเป็นแค่ส่วนหนึ่งของต้นทุน มาเทียบคอนโดใหม่กับห้องมือสองที่คุณสนใจ ทั้งค่าส่วนกลาง เงินกองทุน ค่าตกแต่ง ค่าโอน ระยะเวลารอสร้างเสร็จ และสภาพนิติบุคคล ให้เห็นต้นทุนห้าปีแรกของแต่ละห้อง',
        en: {
          name: 'New or Resale Condo: Compare the Real Costs',
          description:
            "Price per square metre is only part of the cost. We compare the new and resale units you're looking at on common fees, sinking fund, furnishing, transfer costs, the wait for completion, and how well the building is run, to see the first five years' cost of each.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(6588599), photo(1463917)],
        packages: [
          {
            name: 'เทียบสองห้อง',
            description: 'เทียบต้นทุนจริงของห้องที่คุณสนใจสองห้อง',
            en: { name: 'Two Units', description: 'The real cost of two units you are considering.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'เทียบสูงสุดห้าห้อง',
            description: 'เทียบได้สูงสุดห้าห้องพร้อมตารางต้นทุนห้าปี',
            en: { name: 'Up to Five Units', description: 'Up to five units compared, with a five-year cost table.' },
            durationMinutes: 120,
            priceBaht: 2400,
          },
        ],
      },
      {
        name: 'ซื้อคอนโดปล่อยเช่า คิดผลตอบแทนหลังหักทุกอย่าง',
        description:
          'โฆษณาบอกผลตอบแทนค่าเช่าหกเปอร์เซ็นต์ แต่หลังหักค่าส่วนกลาง ภาษี ค่าซ่อม และเดือนที่ห้องว่าง อาจเหลือน้อยกว่านั้นมาก มาคำนวณผลตอบแทนสุทธิของห้องที่คุณสนใจด้วยตัวเลขตลาดจริง และดูว่าค่าเช่าในย่านนั้นมีคู่แข่งมากแค่ไหน',
        en: {
          name: 'Buying a Condo to Rent Out: Returns After Every Cost',
          description:
            "The brochure says a six percent rental yield, but after common fees, tax, repairs, and empty months it can be far less. We work out the net return on the unit you're considering using real market rents, and look at how much competition there is for tenants in that area.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 1500,
        durationMinutes: 60,
        photos: [photo(11104755), photo(6782363)],
        packages: [
          {
            name: 'คำนวณห้องเดียว',
            description: 'ผลตอบแทนสุทธิของห้องหนึ่งห้อง',
            en: { name: 'One Unit', description: 'The net return on a single unit.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'เทียบพร้อมสำรวจตลาดเช่า',
            description: 'เทียบหลายห้องพร้อมข้อมูลค่าเช่าและห้องว่างในย่านนั้น',
            en: { name: 'Compare With Rental Market Check', description: 'Several units compared, with rents and vacancy in each area.' },
            durationMinutes: 120,
            priceBaht: 3000,
          },
        ],
      },
      {
        name: 'เตรียมวันโอนกรรมสิทธิ์คอนโด',
        description:
          'ใกล้วันโอนแล้วไม่รู้ว่าต้องเตรียมเงินเท่าไรและทำอะไรที่สำนักงานที่ดิน มาทำรายการค่าใช้จ่ายวันโอน ค่าส่วนกลางล่วงหน้า เงินกองทุน มิเตอร์น้ำไฟ และเอกสารที่ต้องถือไป พร้อมสิ่งที่ต้องเช็กในห้องก่อนเซ็นรับ',
        en: {
          name: 'Get Ready for Condo Transfer Day',
          description:
            "Transfer day is close and you're not sure how much money to bring or what happens at the Land Office? We list the costs on the day, advance common fees, sinking fund, water and electricity meters, and the documents to take, plus what to check in the unit before you sign.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 700,
        durationMinutes: 30,
        photos: [photo(8112184), photo(8482861)],
        packages: [
          {
            name: 'เช็กลิสต์วันโอน',
            description: 'รายการค่าใช้จ่ายและเอกสารที่ต้องเตรียม',
            en: { name: 'Transfer Day Checklist', description: 'The costs and documents to prepare.' },
            durationMinutes: 30,
            priceBaht: 700,
          },
          {
            name: 'เตรียมครบพร้อมตรวจสัญญา',
            description: 'เช็กลิสต์ครบชุดพร้อมอ่านสัญญาจะซื้อจะขายเรื่องการส่งมอบ',
            en: { name: 'Full Prep With Contract Check', description: 'The full checklist plus a read of your sale agreement’s handover terms.' },
            durationMinutes: 60,
            priceBaht: 1300,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.chanida.p@advisory.demo',
    displayName: 'ชนิดา พงษ์ไพบูลย์',
    fullName: 'ชนิดา พงษ์ไพบูลย์',
    portrait: portrait(8367784),
    headline: 'วิศวกรโยธา ผู้ตรวจบ้าน และผู้จัดการทรัพย์สินให้เช่า',
    bio: 'วิศวกรโยธาที่มีใบอนุญาตประกอบวิชาชีพวิศวกรรมควบคุม คุมงานก่อสร้างบ้านจัดสรรและคอนโด 4 ปี ก่อนมาดูแลคอนโดและห้องเช่าให้เจ้าของกว่า 120 ห้องในย่านมหาวิทยาลัยและนิคมอุตสาหกรรมอีก 6 ปี ตรวจบ้านก่อนรับโอนมาแล้วหลายร้อยหลัง และดูแลตั้งแต่หาผู้เช่า ทำสัญญา เก็บค่าเช่า จนถึงงานซ่อมและรีโนเวต ช่วยมองปัญหาให้ออกก่อนจ่ายเงินและก่อนเรียกช่าง และวางระบบให้เจ้าของไม่ต้องตามเองทุกเรื่อง',
    en: {
      headline: 'Civil Engineer, Home Inspector, and Rental Property Manager',
      bio: 'A licensed civil engineer who supervised construction of housing estates and condos for four years, then spent six more managing over 120 condos and rooms for owners around universities and industrial estates. Has inspected hundreds of homes before handover, and handles everything from finding tenants and drawing up leases to collecting rent, repairs, and renovations. Helps you spot problems before you pay or call in a builder, and puts systems in place so owners are not chasing everything themselves.',
    },
    services: [
      {
        name: 'วางแผนตรวจบ้านก่อนรับโอน',
        description:
          'ได้นัดตรวจบ้านจากโครงการแล้วแต่ไม่รู้จะดูอะไร มาวางลำดับการตรวจตั้งแต่โครงสร้าง หลังคา ระบบไฟ ระบบน้ำ จนถึงงานสี เครื่องมือง่าย ๆ ที่ควรพกไป และวิธีจดรายการแก้ไขให้โครงการรับเรื่องได้ชัดเจน',
        en: {
          name: 'Plan Your Pre-Handover Home Inspection',
          description:
            "Have an inspection date with the developer but don't know what to look at? We set the order to check things, from structure and roof to electrics, plumbing, and paintwork, the simple tools to bring, and how to record defects so the developer can't misread them.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(8293680), photo(8293642)],
        packages: [
          {
            name: 'เช็กลิสต์ตรวจบ้าน',
            description: 'ลำดับการตรวจและเช็กลิสต์สำหรับบ้านแบบของคุณ',
            en: { name: 'Inspection Checklist', description: 'An inspection order and checklist for your type of home.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'ดูรูปและวิดีโอจากวันตรวจ',
            description: 'ส่งรูปและวิดีโอจากวันตรวจมาดูด้วยกันแล้วสรุปรายการที่ต้องให้แก้',
            en: { name: 'Review Your Inspection Footage', description: 'Go through photos and video from your inspection and list what must be fixed.' },
            durationMinutes: 90,
            priceBaht: 1800,
          },
        ],
      },
      {
        name: 'อ่านแบบบ้านและสัญญาผู้รับเหมาก่อนสร้าง',
        description:
          'กำลังจะสร้างบ้านบนที่ดินของตัวเอง มาอ่านแบบและรายการวัสดุด้วยกันว่าครบไหม งวดงานกับงวดเงินสมดุลหรือเปล่า มีข้อเรื่องงานเพิ่มงานลด การรับประกัน และค่าปรับเมื่อทำงานล่าช้าหรือไม่ ก่อนจ่ายเงินงวดแรก',
        en: {
          name: 'Review House Plans and the Builder Contract Before You Build',
          description:
            "About to build on your own land? We read the plans and material schedule together to see if anything's missing, whether work stages and payment stages are balanced, and whether there are clauses on variations, warranty, and penalties for delays, before you pay the first instalment.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 2500,
        durationMinutes: 90,
        screeningRequired: true,
        photos: [photo(271667), photo(8470810)],
        packages: [
          {
            name: 'อ่านแบบและรายการวัสดุ',
            description: 'ตรวจแบบและรายการวัสดุว่าครบและชัดเจน',
            en: { name: 'Plans and Materials', description: 'Check the plans and materials list are complete and clear.' },
            durationMinutes: 90,
            priceBaht: 2500,
          },
          {
            name: 'ตรวจแบบพร้อมสัญญา',
            description: 'ตรวจแบบ รายการวัสดุ และสัญญาผู้รับเหมาพร้อมข้อที่ควรขอแก้',
            en: { name: 'Plans Plus Contract', description: 'Plans, materials, and the builder contract, with the clauses to ask to change.' },
            durationMinutes: 180,
            priceBaht: 5500,
          },
        ],
      },
      {
        name: 'รีโนเวตบ้านเก่า ตั้งงบและลำดับงาน',
        description:
          'ได้บ้านเก่ามาหรืออยู่มานานจนถึงเวลาซ่อมใหญ่ ส่งรูปและวิดีโอบ้านมาก่อนนัด แล้วมาแยกว่างานไหนจำเป็นต้องทำก่อน งานไหนรอได้ ประมาณงบแต่ละส่วน และลำดับงานที่ไม่ต้องรื้อของที่เพิ่งทำเสร็จ',
        en: {
          name: 'Renovating an Old House: Budget and Order of Works',
          description:
            "Inherited an old house, or lived in yours long enough for a major overhaul? Send photos and video before the session, then we separate what must be done first from what can wait, estimate each part, and set an order of works that won't mean tearing out what was just finished.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 1500,
        durationMinutes: 60,
        trialMinutes: 15,
        photos: [photo(6474471), photo(7218011)],
        packages: [
          {
            name: 'จัดลำดับงาน',
            description: 'แยกงานจำเป็นกับงานที่รอได้ พร้อมลำดับการทำ',
            en: { name: 'Prioritise the Work', description: 'Essential versus can-wait jobs, and the order to do them in.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'งบและลำดับงานครบชุด',
            description: 'ประมาณงบแต่ละหมวดและขอบเขตงานสำหรับขอราคาผู้รับเหมา',
            en: { name: 'Full Budget and Scope', description: 'A budget by category and a scope of works for getting builder quotes.' },
            durationMinutes: 120,
            priceBaht: 3200,
          },
        ],
      },
      {
        name: 'รอยร้าวและน้ำซึม ปรึกษาก่อนเรียกช่าง',
        description:
          'เห็นรอยร้าวที่ผนัง น้ำซึมจากหลังคาหรือห้องน้ำ แล้วไม่แน่ใจว่าร้ายแรงแค่ไหน ส่งรูปมาดูด้วยกันว่าเป็นรอยร้าวโครงสร้างหรือแค่ผิวปูน น้ำมาจากจุดไหนได้บ้าง และควรเรียกช่างประเภทไหนพร้อมคำถามที่ต้องถามก่อนตกลงราคา',
        en: {
          name: 'Cracks and Leaks: Get Advice Before Calling a Builder',
          description:
            "Seeing cracks in the walls or water coming through the roof or bathroom, and not sure how serious it is? Send photos and we'll look at whether it's structural or just the plaster, where the water could be coming from, and which kind of tradesperson to call, with the questions to ask before agreeing a price.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 600,
        durationMinutes: 30,
        photos: [photo(32497163), photo(8292785)],
        packages: [
          {
            name: 'ดูรูปจุดเดียว',
            description: 'ประเมินปัญหาหนึ่งจุดจากรูปและวิดีโอ',
            en: { name: 'One Problem Area', description: 'Assess one problem from photos and video.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'ไล่ทั้งบ้าน',
            description: 'ไล่ดูปัญหาทุกจุดที่พบพร้อมจัดลำดับความเร่งด่วน',
            en: { name: 'Whole House', description: 'Every issue you have found, ranked by urgency.' },
            durationMinutes: 75,
            priceBaht: 1400,
          },
        ],
      },
      {
        name: 'ปล่อยเช่าคอนโดครั้งแรก ตั้งราคาและคัดผู้เช่า',
        description:
          'เพิ่งได้ห้องมาและอยากปล่อยเช่าให้เร็วโดยไม่ได้ผู้เช่าที่มีปัญหา มาตั้งค่าเช่าจากห้องที่ปล่อยจริงในตึกเดียวกัน เตรียมรูปและประกาศที่ดึงคนที่ใช่ และวางคำถามคัดกรองผู้เช่าก่อนนัดดูห้อง',
        en: {
          name: 'Letting Your Condo for the First Time: Price It and Pick a Tenant',
          description:
            "Just got the keys and want a tenant quickly, but not a problem one? We set the rent from units actually let in the same building, prepare photos and a listing that attract the right people, and draw up screening questions to ask before any viewing.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 600,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(6934189), photo(7031599)],
        packages: [
          {
            name: 'ตั้งค่าเช่า',
            description: 'ตั้งค่าเช่าจากข้อมูลห้องที่ปล่อยจริงในย่านนั้น',
            en: { name: 'Set the Rent', description: 'Price the rent from real lettings in the area.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'พร้อมปล่อยเช่า',
            description: 'ตั้งราคา เขียนประกาศ และวางขั้นตอนคัดผู้เช่า',
            en: { name: 'Ready to Let', description: 'Pricing, a written listing, and a tenant screening process.' },
            durationMinutes: 75,
            priceBaht: 1400,
          },
        ],
      },
      {
        name: 'เงินประกันและการตรวจห้องตอนผู้เช่าย้ายออก',
        description:
          'เรื่องที่เจ้าของกับผู้เช่าทะเลาะกันบ่อยที่สุดคือเงินประกัน มาวางวิธีตรวจห้องตอนเข้าอยู่พร้อมรูปถ่าย รายการค่าเสียหายที่หักได้อย่างสมเหตุสมผล และขั้นตอนคืนเงินประกันที่ชัดเจนตั้งแต่วันเซ็นสัญญา',
        en: {
          name: 'Deposits and the Move-Out Inspection',
          description:
            "Deposits are what landlords and tenants argue about most. We set up a move-in inspection with photos, a fair list of what can be deducted for damage, and a clear deposit return process from the day the lease is signed.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(8293778), photo(6447393)],
        packages: [
          {
            name: 'วางขั้นตอนตรวจห้อง',
            description: 'ขั้นตอนตรวจห้องตอนเข้าและออกพร้อมแบบฟอร์ม',
            en: { name: 'Inspection Process', description: 'Move-in and move-out inspection steps, with a form.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'ชุดเอกสารผู้เช่าครบ',
            description: 'แบบฟอร์มตรวจห้อง รายการค่าเสียหาย และข้อความในสัญญาเรื่องเงินประกัน',
            en: { name: 'Full Tenant Paperwork', description: 'Inspection form, damage price list, and deposit wording for your lease.' },
            durationMinutes: 60,
            priceBaht: 950,
          },
        ],
      },
      {
        name: 'ระบบเก็บค่าเช่าและแจ้งซ่อมสำหรับห้องเช่าหลายห้อง',
        description:
          'มีห้องเช่าตั้งแต่ห้าห้องขึ้นไปแล้วเริ่มจำไม่ได้ว่าใครจ่ายแล้วใครยังไม่จ่าย มาวางระบบออกบิล เก็บเงิน ทวงถามอย่างสุภาพ และรับแจ้งซ่อม ด้วยเครื่องมือที่คุณใช้อยู่แล้ว พร้อมรายงานรายเดือนที่ดูจบในหน้าเดียว',
        en: {
          name: 'Rent Collection and Repair Requests for Several Units',
          description:
            "Five or more rental units and losing track of who has paid? We set up billing, collection, polite reminders, and repair requests using tools you already have, plus a monthly report that fits on one page.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(15221631), photo(1743227)],
        packages: [
          {
            name: 'วางระบบเก็บเงิน',
            description: 'ระบบออกบิล เก็บเงิน และติดตามค่าเช่าค้าง',
            en: { name: 'Collection System', description: 'Billing, collection, and chasing late rent.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'ระบบเต็มพร้อมแจ้งซ่อม',
            description: 'ระบบเก็บเงิน รับแจ้งซ่อม รายชื่อช่าง และรายงานรายเดือน',
            en: { name: 'Full System With Repairs', description: 'Collection, repair requests, a list of tradespeople, and a monthly report.' },
            durationMinutes: 120,
            priceBaht: 2400,
          },
        ],
      },
      {
        name: 'ปล่อยเช่าต่อหรือขาย ตัดสินใจกับคอนโดที่ไม่ได้อยู่',
        description:
          'ย้ายออกจากคอนโดแล้วไม่แน่ใจว่าจะเก็บไว้ปล่อยเช่าหรือขายออก มาเทียบรายได้ค่าเช่าสุทธิ ภาระผ่อนที่เหลือ ภาษีเมื่อขาย และราคาขายจริงในตึกเดียวกัน ให้เห็นภาพห้าปีข้างหน้าของทั้งสองทาง',
        en: {
          name: "Rent It Out or Sell? Deciding on a Condo You Don't Live In",
          description:
            "Moved out and unsure whether to keep the condo as a rental or sell? We compare net rental income, the mortgage you still owe, tax on a sale, and actual sale prices in the same building, to show the next five years down each path.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 1100,
        durationMinutes: 45,
        photos: [photo(4857757), photo(7937684)],
        packages: [
          {
            name: 'เทียบสองทาง',
            description: 'เทียบตัวเลขปล่อยเช่ากับขายสำหรับห้องของคุณ',
            en: { name: 'Compare Both Paths', description: 'Rental versus sale figures for your unit.' },
            durationMinutes: 45,
            priceBaht: 1100,
          },
          {
            name: 'เทียบพร้อมแผนลงมือ',
            description: 'เทียบตัวเลขและวางขั้นตอนลงมือของทางที่เลือก',
            en: { name: 'Compare and Plan Next Steps', description: 'The comparison plus next steps for the path you choose.' },
            durationMinutes: 90,
            priceBaht: 2000,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.thanawat.s@advisory.demo',
    displayName: 'ธนวัฒน์ สายสุวรรณ',
    fullName: 'ธนวัฒน์ สายสุวรรณ',
    portrait: portrait(32844861),
    headline: 'ที่ปรึกษาซื้อขายบ้านและที่ดินสำหรับคนรุ่นใหม่',
    bio: 'เป็นที่ปรึกษาการขายของโครงการบ้านจัดสรร 6 ปี และทำงานฝ่ายประเมินราคาทรัพย์สินของธนาคารอีก 4 ปี จึงรู้ทั้งโปรโมชันที่คุ้มและไม่คุ้ม และรู้ว่าบ้านกับที่ดินควรประเมินราคาอย่างไร ตอนนี้อยู่อีกฝั่งของโต๊ะ ช่วยคนอายุ 25–45 ปีตัดสินใจเรื่องบ้านและที่ดินด้วยตัวเลข ตั้งแต่เช่าหรือซื้อ ทำเลไหน ตรวจเอกสารสิทธิ์ จนถึงกู้คนเดียวหรือกู้ร่วม',
    en: {
      headline: 'Home and Land Advisor for Young Buyers',
      bio: "Spent six years as a sales consultant for housing developments and four more in a bank's property valuation team, so he knows which promotions are worth it and how houses and land should be valued. Now on the other side of the table, he helps people aged 25 to 45 make home and land decisions with numbers: rent or buy, which area, checking title deeds, and whether to borrow alone or jointly.",
    },
    services: [
      {
        name: 'ซื้อที่ดินเปล่า ตรวจโฉนด ผังเมือง และทางเข้าออก',
        description:
          'เจอที่ดินถูกใจแต่ไม่แน่ใจว่าซื้อได้ปลอดภัยไหม ส่งสำเนาเอกสารสิทธิ์และพิกัดมาก่อนนัด แล้วมาดูประเภทเอกสารสิทธิ์ ภาระจำนองหรือภาระจำยอม สีผังเมือง ทางเข้าออกตามกฎหมาย และสิ่งที่ต้องไปตรวจที่สำนักงานที่ดินก่อนวางมัดจำ',
        en: {
          name: 'Buying Vacant Land: Title, Zoning, and Access Checks',
          description:
            "Found a plot you like but not sure it's safe to buy? Send a copy of the title document and the location before the session, then we look at the type of title, any mortgage or easement, the zoning colour, legal road access, and what to verify at the Land Office before you pay a deposit.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 1500,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(3030296), photo(8408298)],
        packages: [
          {
            name: 'ตรวจเอกสารแปลงเดียว',
            description: 'ตรวจเอกสารสิทธิ์ ผังเมือง และทางเข้าออกของที่ดินหนึ่งแปลง',
            en: { name: 'One Plot Check', description: 'Title, zoning, and access checked for one plot.' },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'ตรวจพร้อมประเมินราคา',
            description: 'ตรวจเอกสารพร้อมประเมินราคาตลาดเทียบกับราคาที่เสนอขาย',
            en: { name: 'Checks Plus Valuation', description: 'The document checks plus a market value compared with the asking price.' },
            durationMinutes: 120,
            priceBaht: 3500,
          },
        ],
      },
      {
        name: 'แบ่งที่ดินมรดกระหว่างพี่น้อง',
        description:
          'พ่อแม่ทิ้งที่ดินไว้หนึ่งแปลงแต่มีทายาทหลายคน มาดูทางเลือกระหว่างแบ่งแยกโฉนด ถือกรรมสิทธิ์รวม หรือขายแล้วแบ่งเงิน ประเมินมูลค่าแต่ละส่วนตามหน้ากว้างและทางเข้าออก และค่าใช้จ่ายของแต่ละทาง ช่วยให้พี่น้องคุยกันด้วยตัวเลขเดียวกัน',
        en: {
          name: 'Dividing Inherited Land Between Siblings',
          description:
            "Your parents left one plot and there are several heirs? We look at splitting the title, holding it jointly, or selling and sharing the money, value each portion by its frontage and access, and cost out each route, so the family discusses the same numbers.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 1800,
        durationMinutes: 60,
        photos: [photo(1438516), photo(6251893)],
        packages: [
          {
            name: 'ทางเลือกการแบ่ง',
            description: 'เทียบทางเลือกการแบ่งพร้อมค่าใช้จ่ายโดยประมาณ',
            en: { name: 'Division Options', description: 'Compare ways to divide, with rough costs.' },
            durationMinutes: 60,
            priceBaht: 1800,
          },
          {
            name: 'คุยพร้อมกันทั้งครอบครัว',
            description: 'นัดคุยกับทายาททุกคนพร้อมประเมินมูลค่าแต่ละแปลงย่อย',
            en: { name: 'Whole-Family Session', description: 'A session with all the heirs, valuing each proposed portion.' },
            durationMinutes: 120,
            priceBaht: 3800,
          },
        ],
      },
      {
        name: 'ประเมินราคาบ้านก่อนตั้งราคาขาย',
        description:
          'อยากขายบ้านแต่ไม่รู้ว่าควรตั้งราคาเท่าไร มาประเมินจากราคาซื้อขายจริงในย่าน ราคาประเมินของทางราชการ สภาพบ้าน และระยะเวลาที่คุณรอขายได้ ได้ช่วงราคาที่สมเหตุสมผลและเหตุผลที่ใช้คุยกับผู้ซื้อหรือนายหน้า',
        en: {
          name: 'Value Your House Before Setting a Sale Price',
          description:
            "Want to sell but unsure what to ask? We estimate from actual sales in the area, the official appraisal value, the condition of the house, and how long you can wait to sell. You get a sensible price range and the reasoning to use with buyers or agents.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 1200,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(13041118), photo(27745581)],
        packages: [
          {
            name: 'ประเมินเบื้องต้น',
            description: 'ช่วงราคาจากข้อมูลตลาดและรูปบ้าน',
            en: { name: 'Initial Estimate', description: 'A price range from market data and photos of the house.' },
            durationMinutes: 45,
            priceBaht: 1200,
          },
          {
            name: 'ประเมินพร้อมกลยุทธ์ขาย',
            description: 'ช่วงราคาพร้อมราคาเริ่มต้น ราคาต่ำสุดที่รับได้ และจังหวะปรับราคา',
            en: { name: 'Valuation and Sale Strategy', description: 'The range plus an asking price, your floor, and when to adjust.' },
            durationMinutes: 90,
            priceBaht: 2400,
          },
        ],
      },
      {
        name: 'ซื้อทรัพย์ขายทอดตลาดจากกรมบังคับคดี',
        description:
          'ทรัพย์ขายทอดตลาดราคาน่าสนใจแต่มีเรื่องที่ต้องรู้ก่อนยกป้าย มาอ่านประกาศขายด้วยกัน ดูภาระที่ติดมากับทรัพย์ ผู้อยู่อาศัยเดิม ค่าใช้จ่ายหลังชนะประมูล และวิธีตั้งราคาสูงสุดที่ยอมจ่าย',
        en: {
          name: 'Buying Property at a Legal Execution Department Auction',
          description:
            "Auction prices look tempting, but there's a lot to know before you raise your paddle. We read the sale notice together, check the encumbrances that come with the property, any current occupants, costs after you win, and how to set your maximum bid.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 1300,
        durationMinutes: 45,
        photos: [photo(11909980)],
        packages: [
          {
            name: 'อ่านประกาศหนึ่งรายการ',
            description: 'อ่านประกาศขายและประเมินความเสี่ยงของทรัพย์หนึ่งรายการ',
            en: { name: 'One Listing', description: 'Read one sale notice and assess its risks.' },
            durationMinutes: 45,
            priceBaht: 1300,
          },
          {
            name: 'เตรียมเข้าประมูล',
            description: 'ประเมินราคาและวางราคาสูงสุดที่ยอมจ่ายพร้อมขั้นตอนวันประมูล',
            en: { name: 'Auction-Ready', description: 'A valuation, your maximum bid, and what happens on auction day.' },
            durationMinutes: 90,
            priceBaht: 2600,
          },
        ],
      },
      {
        name: 'เช่าต่อหรือซื้อบ้าน เทียบด้วยตัวเลขของคุณ',
        description:
          'ทุกคนบอกว่าเช่าคือเสียเงินเปล่า แต่คำตอบขึ้นกับตัวเลขของแต่ละคน มาเทียบค่าเช่าปัจจุบันกับค่าผ่อน ดอกเบี้ย ค่าส่วนกลาง และเงินดาวน์ที่ต้องใช้ รวมถึงสิ่งที่เงินก้อนนั้นทำได้ถ้าไม่เอาไปดาวน์ ให้เห็นว่าซื้อตอนนี้หรือรออีกสองปีดีกว่า',
        en: {
          name: 'Keep Renting or Buy? Compare Using Your Numbers',
          description:
            "Everyone says renting is throwing money away, but the answer depends on your figures. We compare your current rent with repayments, interest, common fees, and the down payment you'd need, including what that money could do if it weren't a deposit, to see whether buying now or in two years makes more sense.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 600,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(7599735), photo(7641904)],
        packages: [
          {
            name: 'เทียบเร็ว',
            description: 'เทียบเช่ากับซื้อจากตัวเลขหลักของคุณ',
            en: { name: 'Quick Comparison', description: 'Renting versus buying from your main figures.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'เทียบสิบปี',
            description: 'ตารางเทียบสิบปีพร้อมสถานการณ์ดอกเบี้ยขึ้นและลง',
            en: { name: 'Ten-Year Comparison', description: 'A ten-year table with rising and falling rate scenarios.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
      {
        name: 'ทาวน์โฮมชานเมืองหรือคอนโดในเมือง',
        description:
          'งบเท่ากันได้ทาวน์โฮมสามห้องนอนชานเมืองหรือคอนโดหนึ่งห้องนอนใกล้ที่ทำงาน มาเทียบค่าเดินทาง เวลาในแต่ละวัน แผนมีครอบครัว ค่าดูแลรักษา และราคาขายต่อ ให้ตัดสินใจจากชีวิตจริงของคุณ ไม่ใช่จากรูปในโบรชัวร์',
        en: {
          name: 'Suburban Townhouse or City Condo?',
          description:
            "The same budget buys a three-bedroom townhouse in the suburbs or a one-bedroom condo near work. We compare commuting costs, time each day, family plans, upkeep, and resale value, so you decide from your real life rather than the brochure photos.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(7718485), photo(9877524)],
        packages: [
          {
            name: 'เทียบสองแบบ',
            description: 'เทียบทาวน์โฮมกับคอนโดตามโจทย์ของคุณ',
            en: { name: 'Compare the Two', description: 'Townhouse against condo for your situation.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'เทียบพร้อมเลือกทำเล',
            description: 'เทียบสองแบบและคัดทำเลที่เข้ากับงบและการเดินทาง',
            en: { name: 'Compare and Pick Areas', description: 'The comparison plus areas that fit your budget and commute.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
      {
        name: 'เดินดูโครงการพร้อมเช็กลิสต์คำถาม',
        description:
          'ก่อนไปเยี่ยมชมโครงการ มาเตรียมคำถามที่ต้องถามเซลส์ เช่น ค่าส่วนกลางปีที่สอง ภาระผูกพันของโครงการ สิ่งที่รวมและไม่รวมในราคา และเงื่อนไขของโปรโมชัน พร้อมจุดที่ต้องดูในบ้านตัวอย่างและรอบหมู่บ้าน',
        en: {
          name: 'Visit Housing Projects With a Question Checklist',
          description:
            "Before you visit a development, we prepare the questions to put to sales staff, such as second-year common fees, the developer's obligations, what is and isn't included in the price, and the fine print on promotions, plus what to look at in the show house and around the estate.",
        },
        category: 'อสังหาริมทรัพย์และบ้าน',
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(8293635), photo(8815915)],
        packages: [
          {
            name: 'เช็กลิสต์มาตรฐาน',
            description: 'ชุดคำถามและจุดที่ต้องดูสำหรับการเยี่ยมชมโครงการ',
            en: { name: 'Standard Checklist', description: 'Questions and things to look at when visiting a project.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'เตรียมเฉพาะโครงการ',
            description: 'ศึกษาโครงการที่คุณจะไปดูล่วงหน้าและปรับคำถามให้ตรงจุด',
            en: { name: 'Project-Specific Prep', description: 'Research the projects you plan to visit and tailor the questions.' },
            durationMinutes: 60,
            priceBaht: 1000,
          },
        ],
      },
      {
        name: 'กู้ร่วมซื้อบ้านกับแฟนหรือพี่น้อง',
        description:
          'กู้ร่วมช่วยให้ได้วงเงินมากขึ้น แต่ผูกพันกันไปอีกหลายสิบปี มาเทียบกู้คนเดียวกับกู้ร่วม ดูว่าใครถือกรรมสิทธิ์สัดส่วนเท่าไร ใครใช้สิทธิลดหย่อนดอกเบี้ย และต้องตกลงอะไรกันไว้ล่วงหน้าถ้าวันหนึ่งความสัมพันธ์เปลี่ยน',
        en: {
          name: 'Buying a Home on a Joint Loan With a Partner or Sibling',
          description:
            "A joint loan gets you a bigger amount but ties you together for decades. We compare borrowing alone with borrowing jointly, look at who owns what share, who claims the interest deduction, and what you should agree in advance in case the relationship changes one day.",
        },
        category: 'สินเชื่อและการจัดการหนี้',
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(8292791), photo(6963032)],
        packages: [
          {
            name: 'เทียบกู้คนเดียวกับกู้ร่วม',
            description: 'วงเงินและภาระของการกู้แต่ละแบบ',
            en: { name: 'Solo Versus Joint', description: 'The loan amount and obligations under each option.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'วางข้อตกลงร่วม',
            description: 'เทียบทางเลือกและร่างประเด็นที่ควรตกลงกันเป็นลายลักษณ์อักษร',
            en: { name: 'Draft a Shared Agreement', description: 'Compare the options and outline what to agree in writing.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
    ],
  },

  // ── การลงทุนและการออม ───────────────────────────────────────────
  {
    email: 'fin.pongsakorn.c@advisory.demo',
    displayName: 'พงศกร เจริญสุข',
    fullName: 'พงศกร เจริญสุข',
    portrait: portrait(25884447),
    headline: 'ผู้แนะนำการลงทุน สอนเริ่มต้นกองทุนรวม',
    bio: 'ผู้แนะนำการลงทุนที่ได้รับใบอนุญาตจาก ก.ล.ต. ทำงานในบริษัทหลักทรัพย์จัดการกองทุน 8 ปี ตอบคำถามนักลงทุนมือใหม่มาแล้วนับหมื่นข้อ ตอนนี้สอนแบบตัวต่อตัวให้คนที่อยากเริ่มลงทุนอย่างเข้าใจ เน้นวิธีคิดและวิธีอ่านข้อมูลกองทุน ไม่ชี้ว่าควรซื้อกองทุนตัวไหนและไม่รับค่าตอบแทนจากบริษัทจัดการกองทุน',
    en: {
      headline: 'Licensed Investment Consultant Teaching Mutual Fund Basics',
      bio: "A Thai SEC-licensed investment consultant who spent eight years at an asset management company and has answered tens of thousands of beginner questions. Now teaches one-to-one for people who want to start investing with understanding. Focuses on how to think about and read fund information, never tells you which fund to buy, and takes no payment from fund managers.",
    },
    services: [
      {
        name: 'เริ่มลงทุนกองทุนรวมด้วยเงินเดือนละ 3,000 บาท',
        description:
          'มีเงินเก็บไม่มากแต่อยากเริ่มลงทุนอย่างถูกวิธี มาเข้าใจความต่างของกองทุนตลาดเงิน ตราสารหนี้ ผสม และหุ้น ระดับความเสี่ยงที่รับได้จริง เปิดบัญชีกองทุนผ่านแอป และวางแผนลงทุนรายเดือนที่ไม่ต้องคอยเฝ้าหน้าจอ',
        en: {
          name: 'Start Investing in Mutual Funds With 3,000 Baht a Month',
          description:
            "Not much saved but want to start investing properly? We cover the difference between money market, bond, mixed, and equity funds, the level of risk you can really live with, opening a fund account in an app, and a monthly plan you don't need to watch all day.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 500,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(12969361)],
        packages: [
          {
            name: 'พื้นฐานกองทุน',
            description: 'ประเภทกองทุน ความเสี่ยง และวิธีเปิดบัญชี',
            en: { name: 'Fund Basics', description: 'Fund types, risk, and how to open an account.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'วางแผนลงทุนรายเดือน',
            description: 'ประเมินความเสี่ยงที่รับได้และวางสัดส่วนลงทุนรายเดือนของคุณ',
            en: { name: 'Monthly Investing Plan', description: 'Assess your risk tolerance and set your monthly allocation.' },
            durationMinutes: 60,
            priceBaht: 950,
          },
        ],
      },
      {
        name: 'เลือก SSF RMF และ ThaiESG ให้เหมาะกับฐานภาษี',
        description:
          'กองทุนลดหย่อนแต่ละแบบมีเพดาน ระยะถือครอง และเงื่อนไขขายคืนต่างกัน มาคำนวณว่าฐานภาษีของคุณประหยัดได้จริงเท่าไร ควรใส่กองทุนแบบไหนก่อน และระยะถือครองที่ต้องผูกเงินไว้สอดคล้องกับแผนชีวิตหรือไม่',
        en: {
          name: 'Choose Between SSF, RMF, and ThaiESG for Your Tax Bracket',
          description:
            "Each tax-saving fund has its own limit, holding period, and redemption rules. We calculate how much you'd really save in your bracket, which type to fill first, and whether the years your money would be locked up fit your life plans.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 700,
        durationMinutes: 30,
        photos: [photo(12920750), photo(6863248)],
        packages: [
          {
            name: 'คำนวณภาษีที่ประหยัดได้',
            description: 'ภาษีที่ประหยัดได้จากกองทุนลดหย่อนแต่ละแบบ',
            en: { name: 'Tax Saving Calculation', description: 'How much tax each type of fund would save you.' },
            durationMinutes: 30,
            priceBaht: 700,
          },
          {
            name: 'แผนกองทุนลดหย่อนระยะยาว',
            description: 'วางแผนลงทุนกองทุนลดหย่อนหลายปีให้สอดคล้องกับเป้าเกษียณ',
            en: { name: 'Multi-Year Tax Fund Plan', description: 'A multi-year tax fund plan that lines up with your retirement goals.' },
            durationMinutes: 60,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'อ่านหนังสือชี้ชวนและค่าธรรมเนียมกองทุนเป็น',
        description:
          'ข้อมูลสำคัญอยู่ในหนังสือชี้ชวนแต่ไม่มีใครอ่าน มาเปิดหนังสือชี้ชวนส่วนสรุปของกองทุนที่คุณสนใจ อ่านนโยบายการลงทุน ดัชนีชี้วัด ค่าธรรมเนียมทั้งที่เห็นและไม่เห็น และผลการดำเนินงานย้อนหลังอย่างไม่หลงตัวเลข',
        en: {
          name: 'Learn to Read a Fund Prospectus and Its Fees',
          description:
            "The important details are in the prospectus, but nobody reads it. We open the fact sheet of a fund you're interested in and read its investment policy, benchmark, the fees you see and the ones you don't, and past performance without being misled by the numbers.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 600,
        durationMinutes: 30,
        photos: [photo(7876979)],
        packages: [
          {
            name: 'อ่านกองทุนเดียว',
            description: 'อ่านหนังสือชี้ชวนของกองทุนหนึ่งกองด้วยกัน',
            en: { name: 'One Fund', description: "Read one fund's prospectus together." },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'เทียบสามกองทุน',
            description: 'เทียบนโยบาย ค่าธรรมเนียม และความเสี่ยงของสามกองทุน',
            en: { name: 'Compare Three Funds', description: 'Policy, fees, and risk compared across three funds.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
      {
        name: 'ตั้งระบบ DCA กองทุนดัชนีแล้วปล่อยให้ทำงาน',
        description:
          'อยากลงทุนระยะยาวแบบไม่ต้องจับจังหวะตลาด มาเข้าใจหลักการลงทุนสม่ำเสมอ ความต่างระหว่างกองทุนดัชนีกับกองทุนเชิงรุก ตั้งยอดและวันตัดเงินอัตโนมัติ และกติกาสำหรับวันที่ตลาดตกแรงจนอยากหยุด',
        en: {
          name: 'Set Up Index Fund DCA and Let It Run',
          description:
            "Want to invest for the long term without timing the market? We cover how regular investing works, index funds versus actively managed ones, setting the amount and automatic debit date, and your rules for the days the market drops hard and you want to stop.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 600,
        durationMinutes: 30,
        photos: [photo(210607), photo(16902140)],
        packages: [
          {
            name: 'ตั้งระบบ',
            description: 'ตั้งยอด วันตัดเงิน และบัญชีที่ใช้ลงทุน',
            en: { name: 'Set It Up', description: 'Amount, debit date, and the account to invest from.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'ระบบพร้อมกติกาตลาดผันผวน',
            description: 'ตั้งระบบและเขียนกติกาการลงทุนของตัวเองไว้ใช้ตอนตลาดตก',
            en: { name: 'System Plus Volatility Rules', description: 'The setup plus your own written rules for when markets fall.' },
            durationMinutes: 60,
            priceBaht: 1000,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.ratchaneekorn.m@advisory.demo',
    displayName: 'รัชนีกร มหาวงศ์',
    fullName: 'รัชนีกร มหาวงศ์',
    portrait: portrait(25950426),
    headline: 'นักวางแผนการเงิน CFP ด้านจัดพอร์ต หุ้น และหุ้นกู้',
    bio: 'นักวางแผนการเงิน CFP ที่เริ่มงานเป็นนักวิเคราะห์ในฝ่ายวิจัยการลงทุนของธนาคาร ก่อนย้ายมาดูแลพอร์ตลูกค้าบุคคล 7 ปี ช่วยคนที่ลงทุนอยู่แล้วแต่พอร์ตกระจัดกระจาย หรือซื้อตามคนอื่นจนไม่รู้ว่าถืออะไรอยู่ ให้มีพอร์ตที่ผูกกับเป้าหมายจริง และสอนอ่านงบการเงินก่อนซื้อหุ้นหรือหุ้นกู้ด้วยตัวเอง ไม่แนะนำหุ้นรายตัว คิดค่าที่ปรึกษาตามเวลา ไม่รับค่าคอมมิชชันจากผลิตภัณฑ์',
    en: {
      headline: 'CFP Financial Planner for Portfolios, Shares, and Bonds',
      bio: "A CFP professional who started as an analyst in a bank's investment research team, then spent seven years managing portfolios for individual clients. Helps people who already invest but have scattered holdings, or bought what others bought until they lost track, build portfolios tied to real goals, and teaches them to read financial statements before buying shares or bonds themselves. Never recommends individual stocks, charges by the hour, and takes no product commission.",
    },
    services: [
      {
        name: 'จัดพอร์ตลงทุนตามเป้าหมายและอายุ',
        description:
          'แยกเงินลงทุนตามเป้าหมาย เช่น เงินดาวน์บ้าน ทุนการศึกษาลูก และเงินเกษียณ แต่ละเป้ามีระยะเวลาและความเสี่ยงที่รับได้ต่างกัน มาวางสัดส่วนสินทรัพย์ของแต่ละก้อนและกติกาการปรับเมื่ออายุและเป้าหมายเปลี่ยน',
        en: {
          name: 'Build a Portfolio Around Your Goals and Age',
          description:
            "Separate your investments by goal, such as a home deposit, your child's education, and retirement, each with its own time frame and acceptable risk. We set the asset mix for each pot and the rules for adjusting it as your age and goals change.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 1800,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(7947703), photo(669621)],
        packages: [
          {
            name: 'วางสัดส่วนหนึ่งเป้าหมาย',
            description: 'จัดสัดส่วนสินทรัพย์สำหรับเป้าหมายเดียว',
            en: { name: 'One Goal', description: 'An asset mix for a single goal.' },
            durationMinutes: 60,
            priceBaht: 1800,
          },
          {
            name: 'พอร์ตครบทุกเป้าหมาย',
            description: 'วางพอร์ตแยกตามทุกเป้าหมายพร้อมแผนปรับตามช่วงอายุ',
            en: { name: 'Every Goal', description: 'Separate portfolios for each goal, with a plan to adjust as you age.' },
            durationMinutes: 120,
            priceBaht: 3500,
          },
          {
            name: 'พอร์ตพร้อมรายงานและติดตาม',
            description: 'พอร์ตครบทุกเป้าหมายเป็นรายงาน พร้อมนัดทบทวนหลังหกเดือน',
            en: { name: 'Portfolio With Report and Review', description: 'The full plan as a written report, plus a six-month review.' },
            durationMinutes: 180,
            priceBaht: 5500,
          },
        ],
      },
      {
        name: 'ตรวจพอร์ตที่ซื้อตามเพื่อนหรือตามข่าว',
        description:
          'ถือกองทุนและหุ้นหลายตัวที่ซื้อมาตามคำแนะนำคนรอบตัว แต่ไม่แน่ใจว่าซ้ำกันหรือเสี่ยงเกินไปหรือเปล่า ส่งรายการที่ถืออยู่มาก่อนนัด แล้วมาดูว่าจริง ๆ พอร์ตกระจุกอยู่ที่ไหน ค่าธรรมเนียมรวมเท่าไร และอะไรที่ไม่ตรงกับเป้าหมายของคุณ',
        en: {
          name: 'Review a Portfolio Built on Tips and Headlines',
          description:
            "Holding a pile of funds and stocks bought on other people's advice, and not sure if they overlap or carry too much risk? Send your holdings before the session, then we look at where the portfolio is really concentrated, what you pay in total fees, and what doesn't fit your goals.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 1200,
        durationMinutes: 45,
        photos: [photo(4911411), photo(16594725)],
        packages: [
          {
            name: 'ตรวจภาพรวม',
            description: 'ดูการกระจุกตัวและความเสี่ยงหลักของพอร์ต',
            en: { name: 'Overview', description: 'Concentration and the main risks in the portfolio.' },
            durationMinutes: 45,
            priceBaht: 1200,
          },
          {
            name: 'ตรวจละเอียดพร้อมแนวทางจัดใหม่',
            description: 'ตรวจทุกรายการพร้อมแนวทางปรับพอร์ตให้ตรงเป้าหมาย',
            en: { name: 'Detailed Review and Restructure', description: 'Every holding reviewed, with a way to reshape the portfolio around your goals.' },
            durationMinutes: 90,
            priceBaht: 2300,
          },
        ],
      },
      {
        name: 'ปรับสมดุลพอร์ตปีละครั้ง',
        description:
          'พอร์ตที่ตั้งไว้ดีเมื่อปีที่แล้วอาจเอียงไปตามตลาด มาเทียบสัดส่วนปัจจุบันกับเป้า ตัดสินใจว่าจะขายส่วนเกินหรือเติมส่วนที่ขาด คำนึงถึงค่าธรรมเนียมและเงื่อนไขกองทุนลดหย่อน แล้ววางรอบปรับครั้งถัดไป',
        en: {
          name: 'Annual Portfolio Rebalancing',
          description:
            "A portfolio set up well last year may have drifted with the market. We compare your current mix with your targets, decide whether to trim what's overweight or top up what's under, allowing for fees and tax-fund rules, and set the next rebalancing date.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 1000,
        durationMinutes: 45,
        photos: [photo(4960438)],
        packages: [
          {
            name: 'คำนวณการปรับ',
            description: 'เทียบสัดส่วนปัจจุบันกับเป้าและคำนวณยอดที่ต้องปรับ',
            en: { name: 'Rebalancing Figures', description: 'Current mix versus targets, and the amounts to move.' },
            durationMinutes: 45,
            priceBaht: 1000,
          },
          {
            name: 'ปรับพร้อมทบทวนเป้าหมาย',
            description: 'คำนวณการปรับและทบทวนว่าเป้าหมายหรือความเสี่ยงที่รับได้เปลี่ยนไปหรือไม่',
            en: { name: 'Rebalance and Revisit Goals', description: 'The rebalancing plus a check on whether your goals or risk tolerance have changed.' },
            durationMinutes: 90,
            priceBaht: 1900,
          },
        ],
      },
      {
        name: 'ลงทุนต่างประเทศผ่านกองทุนไทยหรือเปิดบัญชีต่างประเทศ',
        description:
          'อยากกระจายเงินไปตลาดต่างประเทศแต่ไม่รู้จะเริ่มทางไหน มาเทียบกองทุนรวมต่างประเทศในไทย บัญชีซื้อหุ้นต่างประเทศผ่านโบรกเกอร์ไทย และบัญชีกับโบรกเกอร์ต่างประเทศ ทั้งค่าธรรมเนียม ความเสี่ยงค่าเงิน ภาษี และความยุ่งยากในการดูแล',
        en: {
          name: 'Investing Abroad: Thai Feeder Funds or an Overseas Account?',
          description:
            "Want to spread money into overseas markets but don't know which route to take? We compare Thai foreign-investment funds, buying foreign shares through a Thai broker, and opening an account with an overseas broker, on fees, currency risk, tax, and how much effort each takes to manage.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 1100,
        durationMinutes: 45,
        trialMinutes: 15,
        photos: [photo(31772144)],
        packages: [
          {
            name: 'เทียบช่องทาง',
            description: 'ข้อดีข้อเสียของแต่ละช่องทางสำหรับกรณีของคุณ',
            en: { name: 'Compare the Routes', description: 'The pros and cons of each route for your situation.' },
            durationMinutes: 45,
            priceBaht: 1100,
          },
          {
            name: 'เทียบพร้อมวางสัดส่วน',
            description: 'เลือกช่องทางและวางสัดส่วนเงินลงทุนต่างประเทศในพอร์ต',
            en: { name: 'Compare and Allocate', description: 'Pick a route and decide how much of your portfolio to put abroad.' },
            durationMinutes: 90,
            priceBaht: 2100,
          },
        ],
      },
      {
        name: 'อ่านงบการเงินบริษัทจดทะเบียนก่อนซื้อหุ้น',
        description:
          'เลือกบริษัทที่คุณสนใจมาหนึ่งแห่ง แล้วเปิดงบการเงินและคำอธิบายและการวิเคราะห์ของฝ่ายจัดการไปพร้อมกัน ดูว่ารายได้มาจากไหน กำไรมีคุณภาพหรือเปล่า หนี้สูงเกินไปไหม และกระแสเงินสดสอดคล้องกับกำไรหรือไม่',
        en: {
          name: "Read a Listed Company's Financials Before You Buy",
          description:
            "Pick one company you're interested in and we'll go through its financial statements and management discussion together: where revenue comes from, whether profit is good quality, whether debt is too high, and whether cash flow backs up the earnings.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 1500,
        durationMinutes: 60,
        photos: [photo(534216)],
        packages: [
          {
            name: 'อ่านงบหนึ่งบริษัท',
            description: 'อ่านงบปีล่าสุดของบริษัทที่คุณเลือก',
            en: { name: 'One Company', description: "The latest year's statements for the company you choose." },
            durationMinutes: 60,
            priceBaht: 1500,
          },
          {
            name: 'เทียบกับคู่แข่ง',
            description: 'อ่านงบห้าปีและเทียบกับคู่แข่งในอุตสาหกรรมเดียวกัน',
            en: { name: 'Compare With Peers', description: 'Five years of statements compared with competitors in the same industry.' },
            durationMinutes: 120,
            priceBaht: 3000,
          },
        ],
      },
      {
        name: 'หุ้นปันผล ความเสี่ยงที่ต้องรู้ก่อนเริ่ม',
        description:
          'อัตราปันผลสูงไม่ได้แปลว่าปลอดภัย มาดูว่าปันผลมาจากกำไรจริงหรือจากการขายทรัพย์สิน อัตราการจ่ายปันผลยั่งยืนแค่ไหน ราคาหุ้นหลังขึ้นเครื่องหมาย XD และภาษีเงินปันผลกับเครดิตภาษีที่ขอคืนได้',
        en: {
          name: 'Dividend Stocks: The Risks to Know First',
          description:
            "A high dividend yield doesn't mean safe. We look at whether dividends come from real earnings or from selling assets, how sustainable the payout ratio is, what happens to the share price after it goes ex-dividend, and dividend tax along with the tax credit you may be able to claim back.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(9755376)],
        packages: [
          {
            name: 'หลักคิดหุ้นปันผล',
            description: 'วิธีดูความยั่งยืนของปันผลและภาษีที่เกี่ยวข้อง',
            en: { name: 'Dividend Investing Principles', description: 'How to judge dividend sustainability and the tax involved.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'ฝึกวิเคราะห์สามบริษัท',
            description: 'ฝึกวิเคราะห์หุ้นปันผลสามบริษัทที่คุณเลือกเอง',
            en: { name: 'Practise on Three Companies', description: 'Work through three dividend stocks of your choice.' },
            durationMinutes: 120,
            priceBaht: 2600,
          },
        ],
      },
      {
        name: 'เปิดบัญชีหุ้นและส่งคำสั่งซื้อครั้งแรก',
        description:
          'อยากเริ่มซื้อหุ้นแต่ยังไม่มีบัญชี มาเลือกประเภทบัญชีซื้อขาย เข้าใจค่าคอมมิชชัน รอบการชำระเงิน ประเภทคำสั่งซื้อขาย และขั้นต่ำการซื้อ แล้วลองส่งคำสั่งจริงด้วยเงินจำนวนน้อยภายใต้กติกาที่ตั้งไว้ก่อน',
        en: {
          name: 'Open a Stock Account and Place Your First Order',
          description:
            "Want to start buying shares but don't have an account yet? We choose the account type, cover commission, settlement, order types, and board lots, then place a real order with a small amount under rules you set beforehand.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 500,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(28682348)],
        packages: [
          {
            name: 'พื้นฐานก่อนเปิดบัญชี',
            description: 'ประเภทบัญชี ค่าธรรมเนียม และขั้นตอนการซื้อขาย',
            en: { name: 'Before You Open', description: 'Account types, fees, and how trading works.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'ส่งคำสั่งแรกด้วยกัน',
            description: 'ตั้งกติกาการลงทุนและส่งคำสั่งซื้อครั้งแรกไปพร้อมกัน',
            en: { name: 'First Order Together', description: 'Set your investing rules and place your first order together.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
        ],
      },
      {
        name: 'หุ้นกู้และอันดับความน่าเชื่อถือ',
        description:
          'หุ้นกู้ดอกเบี้ยสูงดูน่าสนใจแต่เคยมีหลายบริษัทที่ผิดนัดชำระ มาเข้าใจอันดับความน่าเชื่อถือ ความต่างระหว่างหุ้นกู้มีประกันกับไม่มีประกัน หุ้นกู้ด้อยสิทธิ์ และวิธีอ่านแบบแสดงรายการข้อมูลของหุ้นกู้ก่อนจองซื้อ',
        en: {
          name: 'Corporate Bonds and Credit Ratings',
          description:
            "High-coupon corporate bonds look attractive, but several issuers have defaulted. We cover credit ratings, secured versus unsecured and subordinated bonds, and how to read the bond's filing documents before you subscribe.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 1200,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(5561913), photo(10473494)],
        packages: [
          {
            name: 'พื้นฐานหุ้นกู้',
            description: 'อันดับความน่าเชื่อถือ ประเภทหุ้นกู้ และความเสี่ยงหลัก',
            en: { name: 'Bond Basics', description: 'Ratings, types of bond, and the main risks.' },
            durationMinutes: 45,
            priceBaht: 1200,
          },
          {
            name: 'อ่านเอกสารหุ้นกู้ที่สนใจ',
            description: 'อ่านเอกสารของหุ้นกู้ที่คุณกำลังจะจองและประเมินความเสี่ยงด้วยกัน',
            en: { name: 'Review a Specific Bond', description: "Read the documents for a bond you're about to buy and assess the risk together." },
            durationMinutes: 90,
            priceBaht: 2300,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.kanokwan.s@advisory.demo',
    displayName: 'กนกวรรณ ศรีทอง',
    fullName: 'กนกวรรณ ศรีทอง',
    portrait: portrait(7578747),
    headline: 'โค้ชการออมและการจัดการเงินก้อน',
    bio: 'เคยเป็นฟรีแลนซ์ด้านการตลาดออนไลน์ 6 ปีและรู้ดีว่าเดือนที่งานเยอะกับเดือนที่งานเงียบต่างกันแค่ไหน ได้คุณวุฒินักวางแผนการเงิน AFPT แล้วหันมาช่วยฟรีแลนซ์ แม่ค้าออนไลน์ และคนทำงานรายวันวางระบบออม ทั้งเงินสำรอง ออมทอง และเงินดาวน์บ้าน แบบที่ไม่ต้องพึ่งวินัยอย่างเดียว รวมถึงช่วยคนที่เพิ่งได้เงินก้อนใหญ่ตั้งหลักก่อนตัดสินใจลงทุน โดยไม่ขายผลิตภัณฑ์ใด',
    en: {
      headline: 'Savings and Lump-Sum Coach',
      bio: "Freelanced in online marketing for six years and knows how different a busy month and a quiet one can be. Holds the AFPT financial planning qualification and now helps freelancers, online sellers, and day workers set up savings systems for emergency funds, gold savings, and a home deposit that don't depend on willpower alone. Also helps people who've just received a large sum get their bearings before they invest, without selling any product.",
    },
    services: [
      {
        name: 'ออมทองรายเดือน ซื้อทองแท่งหรือออมผ่านแอป',
        description:
          'อยากออมทองแต่ไม่แน่ใจว่าจะซื้อทองแท่ง ทองรูปพรรณ ออมทองกับร้านทอง หรือซื้อผ่านแอป มาเทียบค่ากำเหน็จ ส่วนต่างราคาซื้อขาย ความปลอดภัยในการเก็บ และสัดส่วนทองที่เหมาะกับเงินออมทั้งหมดของคุณ',
        en: {
          name: 'Monthly Gold Savings: Bars or an App?',
          description:
            "Want to save in gold but unsure whether to buy bars, jewellery, a gold shop savings plan, or an app? We compare making charges, buy-sell spreads, safe storage, and how much gold makes sense as a share of your total savings.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(8442330), photo(321452)],
        packages: [
          {
            name: 'เทียบวิธีออมทอง',
            description: 'ข้อดีข้อเสียและต้นทุนของการออมทองแต่ละแบบ',
            en: { name: 'Compare Gold Options', description: 'The pros, cons, and costs of each way to save in gold.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'แผนออมทองรายเดือน',
            description: 'เลือกวิธีและวางยอดออมรายเดือนในสัดส่วนที่เหมาะ',
            en: { name: 'Monthly Gold Plan', description: 'Pick a method and set a monthly amount in the right proportion.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
        ],
      },
      {
        name: 'เงินฝากประจำ สลากออมทรัพย์ หรือกองทุนตลาดเงิน',
        description:
          'มีเงินเย็นที่ยังไม่อยากเสี่ยงแต่ไม่อยากปล่อยไว้ในออมทรัพย์เฉย ๆ มาเทียบผลตอบแทนหลังภาษี สภาพคล่อง และเงื่อนไขถอนก่อนกำหนดของเงินฝากประจำ สลากออมทรัพย์ของธนาคารรัฐ และกองทุนตลาดเงิน แล้ววางว่าเงินก้อนไหนควรอยู่ที่ใด',
        en: {
          name: 'Fixed Deposit, Savings Lottery Bonds, or a Money Market Fund?',
          description:
            "Have spare cash you don't want to risk but don't want sitting in a savings account? We compare after-tax returns, liquidity, and early-withdrawal terms for fixed deposits, state bank savings lottery bonds, and money market funds, then decide which pot of money belongs where.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 450,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(11933549), photo(157520)],
        packages: [
          {
            name: 'เทียบที่พักเงิน',
            description: 'เทียบผลตอบแทนและสภาพคล่องของแต่ละทางเลือก',
            en: { name: 'Compare Where to Park It', description: 'Returns and liquidity of each option, side by side.' },
            durationMinutes: 30,
            priceBaht: 450,
          },
          {
            name: 'จัดเงินทุกก้อน',
            description: 'แบ่งเงินออมทุกก้อนตามระยะเวลาที่ต้องใช้',
            en: { name: 'Place Every Pot', description: 'Split all your savings by when you will need them.' },
            durationMinutes: 60,
            priceBaht: 850,
          },
        ],
      },
      {
        name: 'เก็บเงินดาวน์บ้านให้ได้ภายในสามปี',
        description:
          'ตั้งราคาบ้านที่อยากได้ คำนวณเงินดาวน์ ค่าโอน และเงินสำรองหลังเข้าอยู่ แล้วย้อนกลับมาเป็นยอดเก็บต่อเดือน เลือกที่พักเงินที่ความเสี่ยงต่ำพอสำหรับเป้าหมายสามปี และวางแผนสำรองถ้ารายได้บางเดือนไม่ถึง',
        en: {
          name: 'Save a Home Deposit Within Three Years',
          description:
            "We start from the price of the home you want, work out the deposit, transfer costs, and a cushion for after you move in, then turn that into a monthly savings figure. We pick low-risk places for a three-year goal and plan a backup for months when income falls short.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 700,
        durationMinutes: 45,
        photos: [photo(7579135), photo(29148783)],
        packages: [
          {
            name: 'คำนวณเป้า',
            description: 'ยอดเงินดาวน์และยอดเก็บต่อเดือน',
            en: { name: 'Set the Target', description: 'The deposit you need and the monthly savings figure.' },
            durationMinutes: 45,
            priceBaht: 700,
          },
          {
            name: 'แผนเก็บพร้อมแผนสำรอง',
            description: 'แผนเก็บรายเดือน ที่พักเงิน และแผนสำรองสำหรับเดือนที่รายได้น้อย',
            en: { name: 'Plan With a Backup', description: 'Monthly plan, where to keep it, and a fallback for lean months.' },
            durationMinutes: 75,
            priceBaht: 1200,
          },
        ],
      },
      {
        name: 'วางระบบออมสำหรับฟรีแลนซ์ที่รายได้ขึ้นลง',
        description:
          'เดือนไหนงานเยอะก็ใช้เยอะ เดือนไหนงานน้อยก็ต้องดึงเงินเก็บ มาวางระบบเงินเดือนให้ตัวเองจากรายได้เฉลี่ย แยกบัญชีพักเงินเดือนที่ได้เยอะ กันเงินภาษีและประกันสังคมมาตรา 40 และตั้งการออมอัตโนมัติที่ไม่สะดุดในเดือนเงียบ',
        en: {
          name: 'A Savings System for Freelancers With Uneven Income',
          description:
            "Spend big in busy months, raid savings in quiet ones? We set up a salary for yourself based on average income, a buffer account for good months, money set aside for tax and voluntary social security, and automatic saving that keeps going through slow months.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 600,
        durationMinutes: 30,
        photos: [photo(4146007), photo(30047570)],
        packages: [
          {
            name: 'คำนวณเงินเดือนตัวเอง',
            description: 'หาเงินเดือนที่จ่ายตัวเองได้จากรายได้ย้อนหลัง',
            en: { name: 'Find Your Salary', description: 'The salary you can pay yourself, based on past income.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'ระบบออมครบชุด',
            description: 'ระบบบัญชีพักเงิน เงินภาษี และการออมอัตโนมัติ',
            en: { name: 'Full Savings System', description: 'Buffer account, tax money, and automatic saving.' },
            durationMinutes: 75,
            priceBaht: 1200,
          },
        ],
      },
      {
        name: 'ได้เงินก้อนใหญ่ จัดการอย่างไรในหกเดือนแรก',
        description:
          'ได้มรดก ขายกิจการ หรือได้เงินชดเชยก้อนใหญ่ สิ่งสำคัญคืออย่ารีบ มาจัดลำดับว่าต้องปิดหนี้อะไร กันเงินภาษีไว้เท่าไร พักเงินที่ไหนระหว่างตัดสินใจ และวางแผนทยอยลงทุนในหกเดือน โดยไม่ต้องรับข้อเสนอจากใครทันที',
        en: {
          name: 'Received a Large Sum? The First Six Months',
          description:
            "An inheritance, a business sale, or a big severance payment: the key is not to rush. We decide which debts to clear, how much to hold back for tax, where to park the money while you decide, and a six-month plan to invest it gradually, without accepting anyone's offer on the spot.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 3000,
        durationMinutes: 60,
        screeningRequired: true,
        photos: [photo(3966779), photo(4963357)],
        packages: [
          {
            name: 'ตั้งหลัก',
            description: 'ลำดับสิ่งที่ต้องทำก่อนและที่พักเงินระหว่างตัดสินใจ',
            en: { name: 'Get Your Bearings', description: 'What to do first and where to hold the money while you decide.' },
            durationMinutes: 60,
            priceBaht: 3000,
          },
          {
            name: 'แผนหกเดือน',
            description: 'แผนทยอยลงทุนหกเดือนพร้อมสัดส่วนสินทรัพย์เป้าหมาย',
            en: { name: 'Six-Month Plan', description: 'A six-month phased investment plan with a target asset mix.' },
            durationMinutes: 120,
            priceBaht: 5500,
          },
          {
            name: 'แผนพร้อมรายงานครอบครัว',
            description: 'แผนหกเดือนเป็นรายงานสำหรับคุยกับครอบครัว พร้อมนัดติดตามสองครั้ง',
            en: { name: 'Plan With Family Report', description: 'The six-month plan as a report to share with family, plus two follow-ups.' },
            durationMinutes: 180,
            priceBaht: 8000,
          },
        ],
      },
      {
        name: 'คริปโตในพอร์ต สัดส่วนและความเสี่ยงที่รับได้',
        description:
          'ไม่ได้มาบอกว่าควรซื้อเหรียญไหน แต่มาคุยว่าถ้าจะมีสินทรัพย์ดิจิทัลในพอร์ต ควรมีได้ไม่เกินเท่าไรเมื่อเทียบกับเงินทั้งหมด ความเสี่ยงของศูนย์ซื้อขายและการเก็บรักษา ภาษีจากกำไร และกติกาตัดขาดทุนที่ต้องตั้งก่อนเข้า',
        en: {
          name: 'Crypto in Your Portfolio: How Much Risk Is Too Much?',
          description:
            "This isn't about which coin to buy. We discuss the maximum share of your wealth digital assets should take if you hold them at all, the risks of exchanges and storage, tax on gains, and the stop-loss rules to set before you go in.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 1200,
        durationMinutes: 45,
        photos: [photo(730564), photo(5833263)],
        packages: [
          {
            name: 'คุยเรื่องความเสี่ยง',
            description: 'ความเสี่ยงหลักและสัดส่วนสูงสุดที่เหมาะกับคุณ',
            en: { name: 'Risk Conversation', description: 'The main risks and the maximum share that suits you.' },
            durationMinutes: 45,
            priceBaht: 1200,
          },
          {
            name: 'ตั้งกติกาการถือ',
            description: 'ตั้งสัดส่วน กติกาตัดขาดทุน และการเก็บรักษาให้ปลอดภัย',
            en: { name: 'Set Your Holding Rules', description: 'Allocation, stop-loss rules, and safe storage.' },
            durationMinutes: 75,
            priceBaht: 2000,
          },
        ],
      },
      {
        name: 'ลงทุนอสังหาฯ ผ่านกองรีทแทนการซื้อห้อง',
        description:
          'อยากมีรายได้จากอสังหาฯ แต่ไม่อยากเป็นเจ้าของห้องเช่าเอง มาเข้าใจกองทรัสต์เพื่อการลงทุนในอสังหาริมทรัพย์ ประเภทอาคารที่ถือ อายุสิทธิการเช่า ภาระหนี้ และความเสี่ยงเมื่อดอกเบี้ยขึ้น เทียบกับการซื้อคอนโดปล่อยเช่า',
        en: {
          name: 'Property Income Through REITs Instead of Buying a Unit',
          description:
            "Want property income without becoming a landlord? We look at real estate investment trusts: the kinds of buildings they hold, remaining leasehold terms, debt levels, and the risks when interest rates rise, compared with buying a condo to rent out.",
        },
        category: 'การลงทุนและการออม',
        priceBaht: 1000,
        durationMinutes: 45,
        photos: [photo(31288944), photo(20020757)],
        packages: [
          {
            name: 'พื้นฐานกองรีท',
            description: 'โครงสร้าง รายได้ และความเสี่ยงหลักของกองรีท',
            en: { name: 'REIT Basics', description: 'How REITs are structured, where income comes from, and the main risks.' },
            durationMinutes: 45,
            priceBaht: 1000,
          },
          {
            name: 'เทียบกับซื้อห้องเช่า',
            description: 'เทียบผลตอบแทนและภาระของกองรีทกับคอนโดปล่อยเช่าด้วยตัวเลขของคุณ',
            en: { name: 'Versus Buying a Rental', description: 'REIT returns and effort versus a rental condo, using your numbers.' },
            durationMinutes: 90,
            priceBaht: 1900,
          },
        ],
      },
    ],
  },

  // ── ประกันและวางแผนเกษียณ ───────────────────────────────────────
  {
    email: 'fin.thidarat.k@advisory.demo',
    displayName: 'ธิดารัตน์ คงเจริญ',
    fullName: 'ธิดารัตน์ คงเจริญ',
    portrait: portrait(12903018),
    headline: 'นายหน้าประกันชีวิตและประกันสุขภาพอิสระ',
    bio: 'ถือใบอนุญาตนายหน้าประกันชีวิตและนายหน้าประกันวินาศภัยจาก คปภ. และคุณวุฒินักวางแผนการเงิน AFPT ทำงานด้านประกันมา 10 ปี เปรียบเทียบแผนจากหลายบริษัทแทนการขายของบริษัทเดียว ช่วยครอบครัวที่ต้องดูแลพ่อแม่สูงวัย คนที่สวัสดิการบริษัทไม่พอ คนที่ถือกรมธรรม์หลายฉบับจนไม่แน่ใจว่าคุ้มครองอะไรบ้าง และคนที่อยากรู้ว่าต้องมีเงินเท่าไรในวันเกษียณ ในนัดปรึกษาจะไม่ปิดการขาย',
    en: {
      headline: 'Independent Life and Health Insurance Broker',
      bio: "Holds life and non-life insurance broker licences from the OIC and the AFPT financial planning qualification, and has worked in insurance for ten years. Compares plans from several insurers rather than selling one company's products. Helps families caring for ageing parents, people whose employer cover falls short, people holding so many policies they're unsure what they're covered for, and people who want to know how much they'll need for retirement. No selling during consultations.",
    },
    services: [
      {
        name: 'ประกันสุขภาพสำหรับพ่อแม่วัยเกษียณ',
        description:
          'พ่อแม่อายุ 60 ขึ้นไปไม่มีสวัสดิการข้าราชการ และค่ารักษาโรงพยาบาลเอกชนสูงขึ้นทุกปี มาดูว่าในวัยนี้ยังสมัครแผนแบบไหนได้ เงื่อนไขโรคที่เป็นอยู่เดิม เบี้ยที่จะเพิ่มขึ้นตามอายุ และทางเลือกอื่นถ้าเบี้ยสูงเกินกว่าที่ลูกจะช่วยจ่ายไหว',
        en: {
          name: 'Health Insurance for Retired Parents',
          description:
            "Parents over 60 with no civil-servant benefits, and private hospital bills rising every year? We look at which plans they can still apply for at their age, how pre-existing conditions are treated, how premiums climb with age, and the alternatives if premiums are more than the family can help pay.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 600,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(36263265)],
        packages: [
          {
            name: 'ดูทางเลือก',
            description: 'แผนที่พ่อแม่ยังสมัครได้และเงื่อนไขสำคัญ',
            en: { name: 'See the Options', description: 'Plans your parents can still join and the key conditions.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'เทียบแผนพร้อมประมาณเบี้ยระยะยาว',
            description: 'เทียบแผนจากหลายบริษัทพร้อมเบี้ยที่ต้องจ่ายสิบปีข้างหน้า',
            en: { name: 'Compare Plans and Long-Term Premiums', description: 'Plans from several insurers compared, with premiums over the next ten years.' },
            durationMinutes: 75,
            priceBaht: 1300,
          },
        ],
      },
      {
        name: 'ตรวจกรมธรรม์ที่มีอยู่ว่าซ้ำหรือขาดตรงไหน',
        description:
          'ซื้อประกันมาหลายฉบับจากคนรู้จักหลายคน จ่ายเบี้ยรวมปีละหลายหมื่นแต่ไม่แน่ใจว่าคุ้มครองอะไร ส่งกรมธรรม์มาก่อนนัด แล้วมาทำตารางสรุปความคุ้มครองทั้งหมด ดูส่วนที่ซ้ำ ส่วนที่ยังขาด และฉบับที่ควรเก็บไว้หรือพิจารณาใหม่',
        en: {
          name: "Check Your Existing Policies for Overlaps and Gaps",
          description:
            "Bought several policies from several acquaintances, paying tens of thousands a year without being sure what's covered? Send your policies ahead of time and we'll build a table of all your cover, spot overlaps and gaps, and decide which policies to keep or reconsider.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(7736043)],
        packages: [
          {
            name: 'ตรวจไม่เกินสามฉบับ',
            description: 'สรุปความคุ้มครองของกรมธรรม์ไม่เกินสามฉบับ',
            en: { name: 'Up to Three Policies', description: 'A cover summary for up to three policies.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'ตรวจทั้งครอบครัว',
            description: 'ตรวจกรมธรรม์ของทุกคนในบ้านพร้อมตารางสรุปและข้อแนะนำ',
            en: { name: 'Whole Family', description: "Every family member's policies, with a summary table and recommendations." },
            durationMinutes: 120,
            priceBaht: 2400,
          },
        ],
      },
      {
        name: 'ประกันสุขภาพของตัวเองเมื่อสวัสดิการบริษัทไม่พอ',
        description:
          'วงเงินค่ารักษาจากบริษัทอาจไม่พอเมื่อป่วยหนัก และหายไปทันทีเมื่อลาออก มาดูว่าสวัสดิการที่มีคุ้มครองแค่ไหน ควรซื้อประกันสุขภาพส่วนตัวเพิ่มเท่าไร เลือกแผนเหมาจ่ายหรือแผนแยกค่าใช้จ่าย และควรซื้อตอนอายุยังน้อยเพราะอะไร',
        en: {
          name: "Your Own Health Insurance When Your Employer's Isn't Enough",
          description:
            "Employer medical cover may not stretch to a serious illness, and it vanishes the day you resign. We look at how far your benefits go, how much personal cover to add, whether a lump-sum or itemised plan suits you, and why buying while you're young matters.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(3683041), photo(6938709)],
        packages: [
          {
            name: 'ประเมินช่องว่าง',
            description: 'เทียบสวัสดิการที่มีกับค่ารักษาจริงในโรงพยาบาลที่คุณใช้',
            en: { name: 'Gap Check', description: 'Your benefits compared with real costs at the hospital you use.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'เทียบแผนที่เหมาะ',
            description: 'เทียบแผนประกันสุขภาพสามแผนที่เหมาะกับงบและความต้องการ',
            en: { name: 'Compare Suitable Plans', description: 'Three health plans compared against your budget and needs.' },
            durationMinutes: 60,
            priceBaht: 950,
          },
        ],
      },
      {
        name: 'ต่ออายุแล้วเจอเงื่อนไขร่วมจ่าย ควรทำอย่างไร',
        description:
          'ได้หนังสือแจ้งต่ออายุว่ากรมธรรม์จะมีเงื่อนไขร่วมจ่ายค่ารักษา มาอ่านหนังสือแจ้งด้วยกันว่าเกิดจากการเคลมแบบไหน ร่วมจ่ายกี่เปอร์เซ็นต์และนานเท่าไร เงื่อนไขจะหายเมื่อไร และควรเก็บแผนเดิมไว้หรือหาทางเลือกเสริม',
        en: {
          name: 'Your Renewal Now Includes Co-Payment: What Next?',
          description:
            "Got a renewal notice saying your policy will now have co-payment? We read it together to see which claims triggered it, what percentage you'll share and for how long, when the condition falls away, and whether to keep the plan or add something alongside it.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 700,
        durationMinutes: 30,
        screeningRequired: true,
        photos: [photo(7734599)],
        packages: [
          {
            name: 'อ่านหนังสือแจ้ง',
            description: 'อธิบายเงื่อนไขร่วมจ่ายในหนังสือแจ้งของคุณ',
            en: { name: 'Read the Notice', description: 'The co-payment terms in your notice, explained.' },
            durationMinutes: 30,
            priceBaht: 700,
          },
          {
            name: 'อ่านพร้อมเทียบทางเลือก',
            description: 'อ่านเงื่อนไขและเทียบการเก็บแผนเดิมกับการเพิ่มแผนเสริม',
            en: { name: 'Read and Compare Options', description: 'Understand the terms and compare keeping the plan with adding cover.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
        ],
      },
      {
        name: 'ประกันโรคร้ายแรงสำหรับวัยทำงาน',
        description:
          'ประกันสุขภาพจ่ายค่าโรงพยาบาล แต่เมื่อป่วยหนักยังมีรายได้ที่หายไปและค่าใช้จ่ายระหว่างพักฟื้น มาคำนวณทุนประกันโรคร้ายแรงที่เหมาะกับรายได้และภาระ เข้าใจนิยามโรคระยะต้นกับระยะรุนแรง และเทียบแบบจ่ายครั้งเดียวกับแบบจ่ายหลายครั้ง',
        en: {
          name: 'Critical Illness Cover for Working Adults',
          description:
            "Health insurance pays the hospital, but a serious illness also means lost income and costs while you recover. We calculate a critical illness sum insured that fits your income and commitments, explain early-stage versus severe-stage definitions, and compare single-payout with multi-payout plans.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(6798875)],
        packages: [
          {
            name: 'คำนวณทุนประกัน',
            description: 'ทุนประกันที่เหมาะกับรายได้และภาระของคุณ',
            en: { name: 'Size the Cover', description: 'The sum insured that fits your income and commitments.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'เทียบแผนโรคร้ายแรง',
            description: 'เทียบนิยามความคุ้มครองและเบี้ยของแผนจากหลายบริษัท',
            en: { name: 'Compare Critical Illness Plans', description: 'Cover definitions and premiums compared across insurers.' },
            durationMinutes: 60,
            priceBaht: 950,
          },
        ],
      },
      {
        name: 'คำนวณเงินที่ต้องมีในวันเกษียณ',
        description:
          'ตัวเลขเกษียณจากโฆษณามักไม่ตรงกับชีวิตคุณ มาคำนวณจากค่าใช้จ่ายที่คาดว่าจะมีหลังเกษียณ อายุที่อยากหยุดทำงาน เงินเฟ้อ และสิ่งที่มีอยู่แล้ว ทั้งกองทุนสำรองเลี้ยงชีพ ประกันสังคม และเงินออม แล้วดูว่ายังขาดเท่าไรและต้องเก็บเพิ่มเดือนละเท่าไร',
        en: {
          name: 'Work Out How Much You Need to Retire',
          description:
            "The retirement figures in ads rarely fit your life. We calculate from your expected spending after retirement, the age you want to stop work, inflation, and what you already have in provident funds, social security, and savings, then see the shortfall and how much more to save each month.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 1200,
        durationMinutes: 60,
        trialMinutes: 15,
        photos: [photo(6975211), photo(8837397)],
        packages: [
          {
            name: 'คำนวณตัวเลขเกษียณ',
            description: 'เงินที่ต้องมีและเงินที่ยังขาดจากตัวเลขของคุณ',
            en: { name: 'Your Retirement Number', description: 'What you need and the gap, from your own figures.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'แผนเกษียณเต็ม',
            description: 'ตัวเลขเกษียณพร้อมแผนออมและลงทุนรายปีจนถึงวันเกษียณ',
            en: { name: 'Full Retirement Plan', description: 'Your number plus a year-by-year saving and investing plan to retirement.' },
            durationMinutes: 120,
            priceBaht: 2800,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.kriangkrai.c@advisory.demo',
    displayName: 'เกรียงไกร ชัยมงคล',
    fullName: 'เกรียงไกร ชัยมงคล',
    portrait: portrait(36298150),
    headline: 'นักวางแผนเกษียณ CFP สำหรับพนักงานบริษัทและข้าราชการ',
    bio: 'ทำงานด้านกองทุนสำรองเลี้ยงชีพของบริษัทหลักทรัพย์จัดการกองทุน 20 ปี เคยบรรยายเรื่องการเตรียมเกษียณให้พนักงานบริษัทและส่วนราชการมาแล้วหลายร้อยแห่ง ได้คุณวุฒินักวางแผนการเงิน CFP ช่วยคนวัย 35–60 ปีตัดสินใจเรื่องกองทุนสำรองเลี้ยงชีพ กบข. บำเหน็จบำนาญ ประกันสังคม และประกันบำนาญ จากตัวเลขจริงของแต่ละคน อธิบายระเบียบที่ซับซ้อนให้เป็นตัวเลขที่ใช้ตัดสินใจได้',
    en: {
      headline: 'CFP Retirement Planner for Company Staff and Civil Servants',
      bio: 'Spent 20 years running provident funds at an asset management company and has given retirement talks at hundreds of companies and government agencies. A CFP professional who helps people aged 35 to 60 make decisions about provident funds, the Government Pension Fund, gratuities and pensions, social security, and annuity insurance from their own real figures, turning complicated regulations into numbers they can decide with.',
    },
    services: [
      {
        name: 'เลือกแผนลงทุนในกองทุนสำรองเลี้ยงชีพ',
        description:
          'บริษัทมีแผนลงทุนให้เลือกหลายแบบแต่คนส่วนใหญ่อยู่แผนเดิมตั้งแต่วันแรกที่เข้างาน มาดูว่าแผนที่คุณอยู่ลงทุนในอะไร เหมาะกับอายุและระยะเวลาที่เหลือก่อนเกษียณหรือไม่ และควรสับเปลี่ยนแผนอย่างไร',
        en: {
          name: 'Choose Your Provident Fund Investment Plan',
          description:
            "Your employer offers several investment plans, but most people stay in whatever they were put in on day one. We look at what your current plan invests in, whether it suits your age and the years left before retirement, and how to switch if it doesn't.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 700,
        durationMinutes: 30,
        photos: [photo(16254451)],
        packages: [
          {
            name: 'ตรวจแผนปัจจุบัน',
            description: 'ดูว่าแผนที่อยู่ตอนนี้เหมาะกับคุณหรือไม่',
            en: { name: 'Check Your Current Plan', description: 'Whether the plan you are in now suits you.' },
            durationMinutes: 30,
            priceBaht: 700,
          },
          {
            name: 'เลือกแผนและสัดส่วนเงินสะสม',
            description: 'เลือกแผนลงทุนและอัตราเงินสะสมที่เหมาะกับเป้าเกษียณ',
            en: { name: 'Pick a Plan and Contribution Rate', description: 'Choose the investment plan and contribution rate for your retirement goal.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
        ],
      },
      {
        name: 'ลาออกแล้วเงินกองทุนสำรองเลี้ยงชีพเอาไปไหนดี',
        description:
          'ลาออกหรือเปลี่ยนงานแล้วต้องตัดสินใจเรื่องเงินกองทุน มาเทียบการคงเงินไว้ในกองทุนเดิม โอนไปกองทุนของนายจ้างใหม่ โอนไป RMF สำหรับกองทุนสำรองเลี้ยงชีพ และการถอนออกมา พร้อมภาษีของแต่ละทางตามอายุสมาชิกและอายุตัวของคุณ',
        en: {
          name: 'Leaving Your Job: What to Do With Your Provident Fund',
          description:
            "Resigned or changed jobs and now have to decide about your fund? We compare leaving it in the old fund, moving it to your new employer's fund, transferring to an RMF for provident fund money, and withdrawing it, with the tax on each route based on your years of membership and your age.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 800,
        durationMinutes: 30,
        photos: [photo(7578414)],
        packages: [
          {
            name: 'เทียบทางเลือก',
            description: 'เทียบทางเลือกทั้งหมดพร้อมภาษีของแต่ละทาง',
            en: { name: 'Compare the Options', description: 'Every option compared, with the tax on each.' },
            durationMinutes: 30,
            priceBaht: 800,
          },
          {
            name: 'เทียบพร้อมแผนเงินก้อน',
            description: 'เลือกทางที่เหมาะและวางแผนใช้หรือลงทุนเงินก้อนนี้ต่อ',
            en: { name: 'Compare and Plan the Lump Sum', description: 'Choose the best route and plan how to use or invest the money.' },
            durationMinutes: 60,
            priceBaht: 1400,
          },
        ],
      },
      {
        name: 'เงินชราภาพประกันสังคม บำนาญหรือบำเหน็จ',
        description:
          'ส่งประกันสังคมมานานแต่ไม่รู้ว่าเมื่ออายุครบ 55 จะได้อะไร มาดูจำนวนเดือนที่ส่งแล้ว สิทธิ์ที่คุณได้ระหว่างบำนาญรายเดือนกับบำเหน็จก้อนเดียว ประมาณยอดที่จะได้รับ และผลของการส่งต่อตามมาตรา 39 หลังออกจากงาน',
        en: {
          name: 'Social Security Old-Age Benefit: Pension or Lump Sum?',
          description:
            "Paid into social security for years but not sure what you'll get at 55? We look at how many months you've contributed, whether you're entitled to a monthly pension or a one-off lump sum, a rough estimate of the amount, and the effect of continuing voluntarily under Section 39 after leaving work.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(6975187), photo(8087985)],
        packages: [
          {
            name: 'เช็กสิทธิ์',
            description: 'สรุปสิทธิ์และประมาณยอดที่จะได้รับ',
            en: { name: 'Check Your Entitlement', description: 'Your entitlement and a rough estimate of the payout.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'วางแผนก่อนอายุ 55',
            description: 'วางแผนการส่งเงินสมทบที่เหลือเพื่อให้ได้สิทธิ์ที่ดีที่สุด',
            en: { name: 'Plan Before 55', description: 'Plan your remaining contributions to get the best entitlement.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
        ],
      },
      {
        name: 'ประกันบำนาญเทียบกับ RMF สำหรับเงินเกษียณ',
        description:
          'ทั้งสองแบบใช้ลดหย่อนภาษีได้และสร้างเงินหลังเกษียณได้ แต่ทำงานต่างกันมาก มาเทียบเงินที่ได้รับรายปีแบบรับประกันกับผลตอบแทนที่ขึ้นลงตามตลาด สภาพคล่อง เงื่อนไขการเลิกกลางทาง และสัดส่วนที่เหมาะกับแผนเกษียณของคุณ',
        en: {
          name: 'Annuity Insurance Versus RMF for Retirement',
          description:
            "Both can cut your tax and build retirement income, but they work very differently. We compare guaranteed yearly payouts with market-linked returns, liquidity, what happens if you stop part-way, and the mix that fits your retirement plan.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 900,
        durationMinutes: 45,
        photos: [photo(8317678), photo(4975631)],
        packages: [
          {
            name: 'เทียบหลักการ',
            description: 'ความต่างของสองทางเลือกและเงื่อนไขสำคัญ',
            en: { name: 'Compare the Principles', description: 'How the two differ and the key conditions.' },
            durationMinutes: 45,
            priceBaht: 900,
          },
          {
            name: 'เทียบด้วยตัวเลขของคุณ',
            description: 'คำนวณเงินที่ได้จริงของทั้งสองแบบตามอายุและงบของคุณ',
            en: { name: 'Compare With Your Numbers', description: 'Real payouts from both, based on your age and budget.' },
            durationMinutes: 90,
            priceBaht: 1700,
          },
        ],
      },
      {
        name: 'บำเหน็จหรือบำนาญ ตัดสินใจก่อนเกษียณราชการ',
        description:
          'การเลือกบำเหน็จหรือบำนาญเปลี่ยนกลับไม่ได้ มาคำนวณเงินที่จะได้รับทั้งสองแบบจากเงินเดือนและอายุราชการจริงของคุณ รวมเงินจาก กบข. ดูว่าต้องมีชีวิตอยู่ถึงอายุเท่าไรบำนาญถึงจะคุ้มกว่า และผลต่อสวัสดิการรักษาพยาบาลของครอบครัว',
        en: {
          name: 'Gratuity or Pension? Decide Before You Retire From Government Service',
          description:
            "The choice between a lump-sum gratuity and a monthly pension can't be undone. We calculate both from your real salary and years of service, include your GPF money, find the age you'd need to live to for the pension to come out ahead, and look at the effect on your family's medical benefits.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 1000,
        durationMinutes: 45,
        screeningRequired: true,
        photos: [photo(7545210), photo(5699412)],
        packages: [
          {
            name: 'คำนวณเทียบ',
            description: 'คำนวณบำเหน็จกับบำนาญจากตัวเลขจริงของคุณ',
            en: { name: 'Side-by-Side Figures', description: 'Gratuity and pension worked out from your actual figures.' },
            durationMinutes: 45,
            priceBaht: 1000,
          },
          {
            name: 'เทียบพร้อมแผนใช้เงิน',
            description: 'เทียบสองทางและวางแผนใช้เงินหลังเกษียณของทางที่เลือก',
            en: { name: 'Compare and Plan Spending', description: 'Compare both and plan your post-retirement spending for the one you choose.' },
            durationMinutes: 90,
            priceBaht: 1900,
          },
        ],
      },
      {
        name: 'เลือกแผนลงทุนใน กบข. ให้เหมาะกับอายุ',
        description:
          'สมาชิก กบข. ส่วนใหญ่ไม่เคยเปลี่ยนแผนลงทุน มาดูว่าแผนที่อยู่ตอนนี้มีสัดส่วนหุ้นและตราสารหนี้อย่างไร แผนสมดุลตามอายุทำงานแบบไหน และเมื่อเหลืออายุราชการไม่กี่ปีควรลดความเสี่ยงเมื่อไรและแค่ไหน',
        en: {
          name: 'Choose the Right GPF Investment Plan for Your Age',
          description:
            "Most Government Pension Fund members have never changed their plan. We look at the equity and bond mix in your current plan, how the age-based plan works, and, with only a few years of service left, when and how much to reduce risk.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 600,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(7545020)],
        packages: [
          {
            name: 'ตรวจแผนปัจจุบัน',
            description: 'ดูความเสี่ยงของแผนที่อยู่เทียบกับอายุราชการที่เหลือ',
            en: { name: 'Check Your Current Plan', description: 'The risk in your plan compared with your remaining years of service.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'วางแผนสับเปลี่ยน',
            description: 'เลือกแผนและกำหนดช่วงเวลาลดความเสี่ยงก่อนเกษียณ',
            en: { name: 'Plan Your Switches', description: 'Pick a plan and set when to reduce risk before retirement.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
      {
        name: 'วางแผนรายจ่ายสิบปีแรกหลังเกษียณ',
        description:
          'สิบปีแรกหลังเกษียณมักเป็นช่วงที่ใช้เงินมากที่สุด ทั้งท่องเที่ยว ซ่อมบ้าน และช่วยลูกหลาน มาวางงบรายปี แยกเงินที่ต้องใช้เร็วออกจากเงินที่ลงทุนต่อได้ และตั้งเพดานการช่วยเหลือลูกหลานที่ไม่กระทบเงินใช้ในบั้นปลาย',
        en: {
          name: 'Plan Your Spending for the First Ten Years of Retirement',
          description:
            "The first decade after retirement is usually when you spend the most, on travel, home repairs, and helping children and grandchildren. We set a yearly budget, separate money you'll need soon from money that can stay invested, and set a limit on family help that won't eat into your later years.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 1000,
        durationMinutes: 60,
        photos: [photo(8796059), photo(13919146)],
        packages: [
          {
            name: 'งบรายปี',
            description: 'งบประมาณรายปีสำหรับสิบปีแรก',
            en: { name: 'Yearly Budget', description: 'A year-by-year budget for the first ten years.' },
            durationMinutes: 60,
            priceBaht: 1000,
          },
          {
            name: 'งบพร้อมแผนแบ่งเงิน',
            description: 'งบรายปีพร้อมการแบ่งเงินเป็นก้อนใช้จ่ายและก้อนลงทุน',
            en: { name: 'Budget and Money Buckets', description: 'The yearly budget plus splitting money into spending and invested pots.' },
            durationMinutes: 120,
            priceBaht: 2000,
          },
        ],
      },
      {
        name: 'ลาออกก่อนเกษียณ คำนวณว่าเงินพอไหม',
        description:
          'อยากลาออกจากราชการหรือรัฐวิสาหกิจก่อนอายุ 60 มาดูว่าอายุราชการตอนนี้มีสิทธิ์ได้อะไรบ้าง เงินที่จะได้รับลดลงแค่ไหนเมื่อเทียบกับอยู่ครบ สวัสดิการรักษาพยาบาลที่เสียไป และต้องมีเงินออมเพิ่มเท่าไรให้อยู่ได้ถึงวัยที่บำนาญหรือเงินอื่นเริ่มเข้ามา',
        en: {
          name: 'Leaving Before Retirement Age: Will the Money Last?',
          description:
            "Want to leave government or state enterprise service before 60? We look at what your current years of service entitle you to, how much less you'd receive than if you stayed, the medical benefits you'd lose, and how much extra savings you'd need to bridge the years until other income begins.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 1200,
        durationMinutes: 60,
        photos: [photo(5970616), photo(6838610)],
        packages: [
          {
            name: 'คำนวณสิทธิ์',
            description: 'สิทธิ์และเงินที่ได้หากลาออกตอนนี้',
            en: { name: 'Calculate Entitlements', description: 'What you would receive if you left now.' },
            durationMinutes: 60,
            priceBaht: 1200,
          },
          {
            name: 'คำนวณพร้อมแผนช่วงรอยต่อ',
            description: 'คำนวณสิทธิ์และวางแผนเงินช่วงรอยต่อจนถึงวัยเกษียณ',
            en: { name: 'Entitlements and Bridge Plan', description: 'Entitlements plus a plan to bridge the gap to retirement age.' },
            durationMinutes: 120,
            priceBaht: 2300,
          },
        ],
      },
    ],
  },
  {
    email: 'fin.anuwat.k@advisory.demo',
    displayName: 'อนุวัฒน์ แก้วประเสริฐ',
    fullName: 'อนุวัฒน์ แก้วประเสริฐ',
    portrait: portrait(31972610),
    headline: 'ที่ปรึกษาประกันรถยนต์และประกันทรัพย์สิน',
    bio: 'ทำงานฝ่ายสินไหมของบริษัทประกันวินาศภัย 5 ปี เห็นเคลมรถ เคลมบ้าน และเคลมร้านค้ามาหลายพันเรื่อง ปัจจุบันเป็นนายหน้าประกันวินาศภัยที่มีใบอนุญาตจาก คปภ. ช่วยเลือกความคุ้มครองที่ใช้ได้จริงตอนเกิดเหตุ และช่วยไล่เคลมที่ติดขัดให้เดินหน้าต่อได้',
    en: {
      headline: 'Car and Property Insurance Advisor',
      bio: "Spent five years in the claims department of a non-life insurer, handling thousands of car, home, and shop claims. Now an OIC-licensed non-life insurance broker who helps people choose cover that actually pays out when something happens, and helps move stalled claims forward.",
    },
    services: [
      {
        name: 'เลือกประกันรถชั้นไหนให้คุ้มกับการใช้งาน',
        description:
          'รถอายุห้าปี ขับไปทำงานทุกวัน ควรต่อชั้น 1 หรือลดเป็น 2+ มาดูมูลค่ารถ ระยะทางที่ขับ ที่จอดรถ และประวัติเคลม เทียบความคุ้มครองกับเบี้ยของแต่ละชั้น รวมถึงซ่อมห้างหรือซ่อมอู่ และค่าเสียหายส่วนแรก',
        en: {
          name: 'Which Class of Car Insurance Is Worth It for You?',
          description:
            "Five-year-old car, driven to work every day: renew first class or drop to 2+? We look at the car's value, your mileage, where you park, and your claims history, then compare cover and premiums for each class, including dealer versus garage repairs and the deductible.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 400,
        durationMinutes: 30,
        trialMinutes: 15,
        photos: [photo(6270443)],
        packages: [
          {
            name: 'เทียบชั้นประกัน',
            description: 'เทียบความคุ้มครองและเบี้ยของประกันแต่ละชั้นสำหรับรถคุณ',
            en: { name: 'Compare Classes', description: 'Cover and premiums for each class for your car.' },
            durationMinutes: 30,
            priceBaht: 400,
          },
          {
            name: 'เทียบหลายบริษัท',
            description: 'เทียบเงื่อนไขและเบี้ยจากหลายบริษัทในชั้นที่เลือก',
            en: { name: 'Compare Insurers', description: 'Terms and premiums from several insurers in the class you pick.' },
            durationMinutes: 60,
            priceBaht: 750,
          },
        ],
      },
      {
        name: 'เคลมประกันรถไม่จบ ไล่ขั้นตอนกับคุณ',
        description:
          'อุบัติเหตุผ่านมาหลายสัปดาห์แต่เคลมยังไม่คืบ อู่รออนุมัติ หรือบริษัทประกันเสนอค่าเสียหายน้อยกว่าที่คิด มาไล่เอกสาร ใบเคลม และเงื่อนไขกรมธรรม์ด้วยกัน ดูว่าติดอยู่ที่ขั้นไหน ควรติดต่อใคร และถ้าไม่ได้ข้อยุติจะร้องเรียนต่อ คปภ. อย่างไร',
        en: {
          name: 'Car Insurance Claim Stuck? Work Through It Together',
          description:
            "Weeks since the accident and the claim hasn't moved, the garage is waiting for approval, or the insurer is offering less than you expected? We go through the documents, claim form, and policy terms together to see where it's stuck, who to contact, and how to complain to the OIC if it isn't resolved.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 600,
        durationMinutes: 30,
        photos: [photo(374598), photo(10102313)],
        packages: [
          {
            name: 'หาจุดที่ติด',
            description: 'ไล่เอกสารและสถานะเคลมเพื่อหาจุดที่ติดอยู่',
            en: { name: 'Find the Blockage', description: 'Check the documents and claim status to find what is holding it up.' },
            durationMinutes: 30,
            priceBaht: 600,
          },
          {
            name: 'แผนติดตามเคลม',
            description: 'ร่างข้อความติดตามเคลมและเตรียมเอกสารร้องเรียนหากจำเป็น',
            en: { name: 'Claim Follow-Up Plan', description: 'Draft follow-up messages and prepare a complaint file if needed.' },
            durationMinutes: 60,
            priceBaht: 1100,
          },
        ],
      },
      {
        name: 'ประกันอัคคีภัยและภัยน้ำท่วมสำหรับบ้าน',
        description:
          'ประกันอัคคีภัยที่ธนาคารให้ทำตอนกู้บ้านมักคุ้มครองแค่ตัวอาคาร มาดูว่ากรมธรรม์ของคุณครอบคลุมทรัพย์สินในบ้าน ภัยน้ำท่วม พายุ และการโจรกรรมหรือไม่ ทุนประกันเหมาะกับค่าก่อสร้างจริงไหม และควรเพิ่มอะไรสำหรับบ้านในพื้นที่เสี่ยงน้ำท่วม',
        en: {
          name: 'Fire and Flood Insurance for Your Home',
          description:
            "The fire policy your bank required with the mortgage often covers only the building. We check whether yours covers your belongings, floods, storms, and burglary, whether the sum insured matches real rebuilding costs, and what to add if your home is in a flood-prone area.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 500,
        durationMinutes: 30,
        photos: [photo(20059227)],
        packages: [
          {
            name: 'ตรวจกรมธรรม์บ้าน',
            description: 'ตรวจว่ากรมธรรม์ปัจจุบันคุ้มครองอะไรและขาดอะไร',
            en: { name: 'Check Your Home Policy', description: 'What your current policy covers and what it misses.' },
            durationMinutes: 30,
            priceBaht: 500,
          },
          {
            name: 'ตรวจพร้อมเทียบแผนใหม่',
            description: 'ตรวจกรมธรรม์เดิมและเทียบแผนที่คุ้มครองภัยธรรมชาติเพิ่ม',
            en: { name: 'Check and Compare New Plans', description: 'Review your policy and compare plans with natural disaster cover.' },
            durationMinutes: 60,
            priceBaht: 900,
          },
        ],
      },
      {
        name: 'ประกันสำหรับร้านค้าและออฟฟิศขนาดเล็ก',
        description:
          'เปิดร้านกาแฟ ร้านค้า หรือออฟฟิศเล็กแล้วไม่เคยทำประกันอะไรเลย มาดูความเสี่ยงที่ธุรกิจของคุณมีจริง ทั้งไฟไหม้ ของในร้าน เงินสด ความรับผิดต่อลูกค้าที่ได้รับบาดเจ็บ และธุรกิจหยุดชะงัก แล้วเลือกแผนที่เบี้ยพอดีกับขนาดร้าน',
        en: {
          name: 'Insurance for Small Shops and Offices',
          description:
            "Opened a café, shop, or small office and never insured anything? We look at the risks your business really faces, such as fire, stock, cash, liability if a customer is hurt, and business interruption, then choose a plan with premiums that suit the size of your business.",
        },
        category: 'ประกันและวางแผนเกษียณ',
        priceBaht: 700,
        durationMinutes: 45,
        photos: [photo(7289733)],
        packages: [
          {
            name: 'ประเมินความเสี่ยง',
            description: 'ความเสี่ยงหลักของธุรกิจคุณและความคุ้มครองที่ควรมี',
            en: { name: 'Risk Review', description: 'Your main business risks and the cover you should have.' },
            durationMinutes: 45,
            priceBaht: 700,
          },
          {
            name: 'ประเมินพร้อมเทียบแผน',
            description: 'ประเมินความเสี่ยงและเทียบแผนประกันธุรกิจจากหลายบริษัท',
            en: { name: 'Review and Compare Plans', description: 'The risk review plus business insurance plans from several insurers.' },
            durationMinutes: 90,
            priceBaht: 1400,
          },
        ],
      },
    ],
  },
];
