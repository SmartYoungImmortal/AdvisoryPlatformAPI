import type {
  CatalogueAdvisor,
  CataloguePackage,
  CatalogueService,
} from './types';

/**
 * Part B of the large demo catalogue: business, work and law. Advisors in
 * business and marketing, online shops, freelancing, HR, law and contracts,
 * and restaurants and cafés.
 */

const BIZ = 'ธุรกิจและการตลาด';
const SHOP = 'ร้านค้าออนไลน์และอีคอมเมิร์ซ';
const FREELANCE = 'ฟรีแลนซ์และงานอิสระ';
const HR = 'ทรัพยากรบุคคลและการจ้างงาน';
const LAW = 'กฎหมายและสัญญา';
const FOOD = 'ร้านอาหารและคาเฟ่';

/** A service photograph on the Pexels CDN, by its photo id. */
const photo = (id: number): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

/** A square advisor portrait on the Pexels CDN, by its photo id. */
const portrait = (id: number): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop`;

/** A package: its length, price, Thai name and line, then the English. */
const pkg = (
  durationMinutes: number,
  priceBaht: number,
  name: string,
  description: string,
  enName: string,
  enDescription: string,
): CataloguePackage => ({
  name,
  description,
  en: { name: enName, description: enDescription },
  durationMinutes,
  priceBaht,
});

/** A service, its price and length taken from its first (cheapest) package. */
const service = (
  s: Omit<CatalogueService, 'priceBaht' | 'durationMinutes'>,
): CatalogueService => ({
  ...s,
  priceBaht: s.packages[0].priceBaht,
  durationMinutes: s.packages[0].durationMinutes,
});

export const PART_B: readonly CatalogueAdvisor[] = [
  // ─── Business and marketing ────────────────────────────────────────────
  {
    email: 'biz.phattra.s@advisory.demo',
    displayName: 'ภัทรา ศิริมงคล',
    fullName: 'ภัทรา ศิริมงคล',
    portrait: portrait(1181690),
    headline: 'ที่ปรึกษาโฆษณา Facebook และ Instagram สำหรับร้านเล็ก',
    bio: 'อดีตมีเดียบายเออร์ในเอเจนซีโฆษณา 8 ปี ดูแลงบโฆษณาของแบรนด์ค้าปลีกเดือนละหลายล้านบาท ก่อนออกมาช่วยร้านเล็กที่มีงบวันละไม่กี่ร้อย เปิดบัญชีโฆษณาของคุณดูไปด้วยกันและปรับให้เห็นกับตาในนัดเดียว',
    en: {
      headline: 'Facebook and Instagram Ads Advisor for Small Shops',
      bio: "Spent 8 years as a media buyer at an advertising agency, running retail brands' ad budgets worth millions of baht a month, before moving on to help small shops that spend a few hundred a day. Opens your ad account with you and makes the changes live, in the same session.",
    },
    services: [
      service({
        name: 'ยิงแอด Facebook ให้ร้านเสื้อผ้าออนไลน์ด้วยงบวันละ 300',
        description:
          'สำหรับร้านเสื้อผ้าที่เพิ่งเริ่มยิงแอด หรือยิงแล้วแต่ไม่มีคนทักแชท นั่งตั้งแคมเปญจริงในบัญชีของคุณ ตั้งแต่กลุ่มเป้าหมาย รูป ไปจนถึงข้อความชวนทัก แล้วแบ่งงบ 300 บาทให้ทดสอบได้ในสัปดาห์แรก ออกไปพร้อมแคมเปญที่เปิดใช้แล้วและเกณฑ์ว่าแอดไหนควรปิดเมื่อไร',
        en: {
          name: 'Facebook Ads for an Online Clothing Shop on 300 Baht a Day',
          description:
            'For clothing shops new to ads, or already running them without getting messages. We build a real campaign in your account together, from the audience and images to the message prompt, then split the 300 baht so you can test in the first week. You leave with a live campaign and clear rules for when to switch an ad off.',
        },
        category: SHOP,
        photos: [photo(7857577), photo(5531746)],
        packages: [
          pkg(
            30,
            600,
            'ตรวจแอดที่ยิงอยู่',
            'ดูแคมเปญที่เปิดอยู่แล้วชี้ว่าเงินรั่วตรงไหน',
            'Check My Current Ads',
            'A look at the campaigns you already run, to find where the money leaks.',
          ),
          pkg(
            60,
            1200,
            'ตั้งแคมเปญใหม่ด้วยกัน',
            'ตั้งแคมเปญทดสอบตั้งแต่ศูนย์ในบัญชีของคุณจนเปิดใช้งานได้',
            'Build a Campaign Together',
            'Build a test campaign from scratch in your account, through to going live.',
          ),
          pkg(
            90,
            1900,
            'แคมเปญพร้อมชุดข้อความ',
            'ตั้งแคมเปญและเขียนข้อความโฆษณาชุดแรก 5 ชิ้นไว้สลับทดสอบ',
            'Campaign Plus Ad Copy',
            'Set up the campaign and write a first set of five ad captions to rotate.',
          ),
        ],
      }),
      service({
        name: 'อ่านตัวเลขในหน้าจัดการโฆษณาแล้วตัดสินใจเพิ่มหรือหยุดงบ',
        description:
          'สำหรับเจ้าของธุรกิจที่จ่ายค่าโฆษณาทุกเดือนแต่ไม่แน่ใจว่าคุ้มไหม เปิดหน้าจัดการโฆษณาของคุณดูด้วยกัน อธิบายว่าตัวเลขไหนต้องดูและตัวไหนไม่ต้องสนใจ แล้วตั้งต้นทุนต่อลูกค้าที่ธุรกิจของคุณรับได้ ออกไปพร้อมตารางสรุปที่ใช้เช็กเองได้ทุกสัปดาห์',
        en: {
          name: 'Read Your Ads Manager and Decide Where the Money Goes',
          description:
            "For owners who pay for ads every month but aren't sure it's worth it. We open your Ads Manager together, go over which numbers matter and which to ignore, and set the cost per customer your business can afford. You leave with a summary sheet you can check yourself every week.",
        },
        category: BIZ,
        trialMinutes: 15,
        photos: [photo(12969403), photo(577195)],
        packages: [
          pkg(
            30,
            700,
            'ถามเฉพาะจุด',
            'ดูแคมเปญเดียวที่สงสัยและตอบว่าควรไปต่อหรือหยุด',
            'One Campaign, One Answer',
            'Look at the one campaign you are unsure about and decide: keep going or stop.',
          ),
          pkg(
            60,
            1400,
            'ไล่ทั้งบัญชี',
            'ไล่ทุกแคมเปญในบัญชีและตั้งเกณฑ์ต้นทุนต่อลูกค้าร่วมกัน',
            'Whole Account Review',
            'Go through every campaign in the account and agree on a target cost per customer.',
          ),
        ],
      }),
      service({
        name: 'ปรับแชทขายของให้คนที่ทักมาจากแอดซื้อจริง',
        description:
          'แอดได้แชทเยอะแต่ปิดการขายได้น้อย เอาแชทจริงของร้านมาไล่ดูด้วยกัน หาจังหวะที่ลูกค้าหายไป แล้วเขียนชุดข้อความตอบตั้งแต่ทักครั้งแรก แจ้งราคา จนถึงตามลูกค้าที่เงียบไป ออกไปพร้อมสคริปต์แชทที่แอดมินของร้านใช้ได้ทันที',
        en: {
          name: 'Turn Messages From Your Ads Into Sales',
          description:
            "Lots of messages from your ads but few sales? We go through your shop's real chats together, find where customers drop off, then write replies for every step from the first hello and the price quote to following up with people who went quiet. You leave with a chat script your admins can use straight away.",
        },
        category: SHOP,
        photos: [photo(4921398), photo(7343000)],
        packages: [
          pkg(
            30,
            600,
            'ดูแชทตัวอย่าง',
            'ไล่แชท 10 ห้องล่าสุดและชี้จุดที่ทำให้ลูกค้าหลุด',
            'Chat Sample Review',
            'Read your last ten chats and point out where customers slip away.',
          ),
          pkg(
            60,
            1300,
            'เขียนสคริปต์ครบชุด',
            'เขียนข้อความตอบทุกขั้นตั้งแต่ทักแรกจนปิดการขายและตามลูกค้า',
            'Full Chat Script',
            'Write replies for every step, from first message to closing and follow-up.',
          ),
        ],
      }),
      service({
        name: 'ยิงแอดหาลูกค้าในรัศมี 5 กิโลเมตรให้ร้านอาหารและคาเฟ่',
        description:
          'สำหรับร้านอาหารและคาเฟ่ที่ลูกค้าส่วนใหญ่อยู่หรือทำงานใกล้ร้าน วางแคมเปญที่ยิงเฉพาะพื้นที่รอบร้าน ตั้งให้ลูกค้ากดดูเส้นทาง จองโต๊ะ หรือสั่งกลับบ้านผ่านแชทได้จากแอดเลย และวางวิธีนับว่าแอดพาคนมาที่ร้านจริงกี่คน ออกไปพร้อมแผนงบรายเดือนและข้อความโฆษณาชุดแรก',
        en: {
          name: 'Local Ads Within 5 km for Restaurants and Cafés',
          description:
            'For restaurants and cafés whose customers mostly live or work nearby. We plan a campaign that only reaches the area around your shop, let people get directions, book a table or order takeaway through chat straight from the ad, and set up a way to count how many the ads actually bring in. You leave with a monthly budget plan and your first set of ads.',
        },
        category: BIZ,
        photos: [photo(14680058), photo(5864208)],
        packages: [
          pkg(
            45,
            900,
            'วางแผนเร็ว',
            'กำหนดพื้นที่ งบ และข้อความหลักของแคมเปญ',
            'Quick Plan',
            'Set the area, the budget and the main message for the campaign.',
          ),
          pkg(
            90,
            2000,
            'วางแคมเปญเต็ม',
            'ตั้งแคมเปญในบัญชีจริงพร้อมวิธีนับลูกค้าที่มาจากแอด',
            'Full Campaign Build',
            'Build the campaign in your account, with a way to count customers who came from ads.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.supachai.b@advisory.demo',
    displayName: 'ศุภชัย บุญประเสริฐ',
    fullName: 'ศุภชัย บุญประเสริฐ',
    portrait: portrait(30975992),
    headline: 'ที่ปรึกษาระบบงาน แฟรนไชส์ และการขายเข้าร้านค้าปลีกสำหรับ SME',
    bio: 'อดีตผู้อำนวยการฝ่ายปฏิบัติการของเครือร้านอาหารที่มีกว่า 60 สาขา ดูแลการขยายสาขา ระบบแฟรนไชส์ และการนำสินค้าของเครือเข้าร้านค้าปลีกมา 15 ปี ช่วยเจ้าของกิจการที่ยังต้องเฝ้าร้านทุกวันวางระบบให้ร้านเดินเองได้ ช่วยผู้ผลิตรายย่อยวางแบรนด์และเตรียมตัวก่อนคุยกับฝ่ายจัดซื้อของห้าง และประเมินอย่างตรงไปตรงมาว่าธุรกิจพร้อมขยายหรือยัง',
    en: {
      headline:
        'Operations, Franchise, and Retail Distribution Advisor for SMEs',
      bio: "Former director of operations for a restaurant chain with more than 60 branches, running expansion, franchising, and getting the chain's own products into retail stores for 15 years. Helps owners who still have to be at the shop every day build systems so it runs without them, helps small producers shape their brand and prepare before meeting a retailer's buying team, and gives an honest view on whether the business is ready to grow.",
    },
    services: [
      service({
        name: 'เตรียมสินค้าเข้าขายในร้านสะดวกซื้อและห้างค้าปลีก',
        description:
          'สำหรับผู้ผลิตที่อยากวางสินค้าบนชั้นของห้างหรือร้านสะดวกซื้อเป็นครั้งแรก ไล่ดูว่าฝ่ายจัดซื้อจะถามอะไร ค่าแรกเข้า ส่วนแบ่งการขาย และเงื่อนไขเครดิตที่ต้องเผื่อไว้ แล้วคำนวณว่าราคาขายปลีกเท่าไรถึงยังมีกำไร ออกไปพร้อมรายการเอกสารและตัวเลขที่ต้องมีก่อนนัดเจรจา',
        en: {
          name: 'Get Your Product Into Convenience Stores and Retail Chains',
          description:
            "For producers aiming to get on a chain's shelves for the first time. We go through what the buyers will ask, the listing fees, the margin they take and the credit terms to plan for, then work out the retail price that still leaves you a profit. You leave with the documents and numbers you need before the meeting.",
        },
        category: BIZ,
        screeningRequired: true,
        photos: [photo(32550092), photo(1366594), photo(7451957)],
        packages: [
          pkg(
            60,
            1800,
            'ประเมินความพร้อม',
            'ดูสินค้า ราคา และกำลังผลิตว่าพร้อมคุยกับห้างหรือยัง',
            'Readiness Check',
            'Check your product, price and capacity to see if you are ready to talk to a chain.',
          ),
          pkg(
            120,
            3800,
            'เตรียมเจรจาครบชุด',
            'คำนวณราคาทุกช่องทาง เตรียมเอกสาร และซ้อมตอบคำถามฝ่ายจัดซื้อ',
            'Full Negotiation Prep',
            "Price every channel, prepare the documents and rehearse the buyer's questions.",
          ),
        ],
      }),
      service({
        name: 'ปั้นแบรนด์ของฝากและสินค้าชุมชนให้ขายได้ราคาขึ้น',
        description:
          'สินค้าดีอย่างกาแฟดอย น้ำพริก หรือผ้าทอ แต่ขายได้แค่ราคาตลาดนัด คุยตั้งแต่ใครคือคนซื้อจริง ซื้อไปทำอะไร แล้วปรับชื่อ เรื่องเล่า และบรรจุภัณฑ์ให้ตรงกับคนกลุ่มนั้น ออกไปพร้อมแนวทางแบรนด์หนึ่งหน้าที่ส่งต่อให้นักออกแบบทำงานต่อได้',
        en: {
          name: 'Build a Brand for Local Souvenirs and Community Products',
          description:
            'Hill-grown coffee, chilli paste or hand-woven cloth that only sells at market-stall prices? We start from who really buys it and why, then rework the name, the story and the packaging to suit those buyers. You leave with a one-page brand guide you can hand straight to a designer.',
        },
        category: BIZ,
        photos: [photo(7657849), photo(4464920)],
        packages: [
          pkg(
            45,
            900,
            'หามุมขายใหม่',
            'หาคนซื้อหลักและจุดขายที่ทำให้ตั้งราคาสูงขึ้นได้',
            'Find a New Angle',
            'Find your core buyer and the selling point that justifies a higher price.',
          ),
          pkg(
            90,
            2400,
            'แนวทางแบรนด์ครบชุด',
            'วางชื่อ เรื่องเล่า โทนภาพ และบรีฟบรรจุภัณฑ์สำหรับนักออกแบบ',
            'Full Brand Guide',
            'Set the name, story, visual tone and a packaging brief for your designer.',
          ),
        ],
      }),
      service({
        name: 'ตั้งราคาขายส่ง ขายปลีก และราคาตัวแทนไม่ให้ตีกันเอง',
        description:
          'สำหรับเจ้าของสินค้าที่เริ่มมีตัวแทนและร้านค้าส่ง แล้วเจอปัญหาตัดราคากันเอง วางโครงราคาแต่ละระดับ ส่วนลดตามจำนวน และกติกาการขายออนไลน์ของตัวแทน ออกไปพร้อมตารางราคาที่ประกาศใช้ได้ทันที',
        en: {
          name: "Set Wholesale, Retail and Reseller Prices That Don't Clash",
          description:
            'For product owners who now have resellers and wholesalers and are seeing them undercut each other. We set a price for each tier, volume discounts, and rules for how resellers may sell online. You leave with a price table you can announce right away.',
        },
        category: BIZ,
        trialMinutes: 15,
        photos: [photo(4483862), photo(7019222)],
        packages: [
          pkg(
            30,
            600,
            'ตรวจราคาที่ใช้อยู่',
            'ดูโครงราคาปัจจุบันและชี้ช่องที่ทำให้ตัวแทนตัดราคา',
            'Review Current Prices',
            'Review your current price structure and spot the gaps resellers exploit.',
          ),
          pkg(
            60,
            1500,
            'วางโครงราคาใหม่',
            'วางราคาทุกระดับพร้อมส่วนลดและกติกาสำหรับตัวแทน',
            'New Price Structure',
            'Set every price tier with discounts and rules for resellers.',
          ),
        ],
      }),
      service({
        name: 'วางตำแหน่งแบรนด์ให้ต่างจากคู่แข่งในตลาดเดียวกัน',
        description:
          'เมื่อสินค้าในตลาดหน้าตาคล้ายกันหมดและแข่งกันที่ราคา ไล่เทียบคู่แข่งหลักทีละราย หาช่องที่ยังไม่มีใครยืน แล้วสรุปเป็นประโยคเดียวที่ทีมขายและทีมคอนเทนต์ใช้ตรงกัน ออกไปพร้อมแผนผังตำแหน่งแบรนด์และข้อความหลัก 3 ข้อ',
        en: {
          name: 'Position Your Brand Apart From Competitors',
          description:
            'When everything in your market looks alike and competes on price, we compare your main competitors one by one, find the space nobody owns yet, and sum it up in one sentence your sales and content teams can share. You leave with a positioning map and three key messages.',
        },
        category: BIZ,
        photos: [photo(8518810), photo(7710077)],
        packages: [
          pkg(
            60,
            1500,
            'เทียบคู่แข่ง',
            'เทียบคู่แข่ง 3 รายและหาช่องว่างในตลาด',
            'Competitor Comparison',
            'Compare three competitors and find the gap in the market.',
          ),
          pkg(
            120,
            3500,
            'เวิร์กช็อปกับทีม',
            'ทำเวิร์กช็อปกับทีมจนได้ตำแหน่งแบรนด์และข้อความหลักที่ตกลงกันแล้ว',
            'Team Workshop',
            'A workshop with your team that ends with an agreed position and key messages.',
          ),
        ],
      }),
      service({
        name: 'วางระบบ SOP ให้ร้านเดินได้โดยไม่ต้องเฝ้าทุกวัน',
        description:
          'สำหรับเจ้าของร้านที่หยุดไปวันเดียวแล้วงานสะดุด ไล่งานในร้านตั้งแต่เปิดจนปิด เลือกงานที่ต้องเขียนเป็นขั้นตอนก่อน และวางรายการตรวจที่พนักงานใช้ได้จริง ออกไปพร้อมแม่แบบ SOP และรายการตรวจประจำวันของร้านคุณ',
        en: {
          name: 'Write SOPs So the Shop Runs Without You There Every Day',
          description:
            'For owners whose shop stumbles the moment they take a day off. We walk through the day from opening to closing, pick which tasks to write up first, and design checklists staff will actually use. You leave with an SOP template and a daily checklist for your shop.',
        },
        category: BIZ,
        screeningRequired: true,
        photos: [photo(8895214), photo(18617712)],
        packages: [
          pkg(
            60,
            1500,
            'หางานที่ต้องเขียนก่อน',
            'ไล่งานทั้งวันและเลือก 5 งานที่ต้องมีขั้นตอนก่อน',
            'Find What to Write First',
            'Map the working day and pick the five tasks that need procedures first.',
          ),
          pkg(
            120,
            3500,
            'เขียน SOP ด้วยกัน',
            'เขียน SOP และรายการตรวจของงานหลักให้เสร็จในนัด',
            'Write the SOPs Together',
            'Write the SOPs and checklists for your core tasks within the session.',
          ),
        ],
      }),
      service({
        name: 'ประเมินว่าธุรกิจพร้อมขายแฟรนไชส์หรือยัง',
        description:
          'ร้านขายดีไม่ได้แปลว่าพร้อมขายแฟรนไชส์ ดูตัวเลขกำไรต่อสาขา ระบบวัตถุดิบ และคู่มือที่มีอยู่ แล้วบอกตรงๆ ว่ายังขาดอะไร ค่าแรกเข้าและค่าธรรมเนียมรายเดือนควรอยู่ที่เท่าไร ออกไปพร้อมรายการสิ่งที่ต้องทำก่อนเปิดขายสาขาแรก',
        en: {
          name: 'Is Your Business Ready to Franchise?',
          description:
            "A busy shop isn't necessarily ready to franchise. We look at profit per branch, your supply system and the manuals you have, then tell you plainly what's missing and what the joining fee and monthly royalty should be. You leave with a list of what to do before selling your first franchise.",
        },
        category: BIZ,
        screeningRequired: true,
        photos: [photo(30424439), photo(16563658)],
        packages: [
          pkg(
            60,
            2000,
            'ประเมินเบื้องต้น',
            'ดูตัวเลขและระบบที่มีแล้วสรุปว่าพร้อมแค่ไหน',
            'First Assessment',
            'Review your numbers and systems and sum up how ready you are.',
          ),
          pkg(
            180,
            6500,
            'วางโมเดลแฟรนไชส์',
            'วางค่าแรกเข้า ค่าธรรมเนียม และสิ่งที่แฟรนไชส์ซีจะได้รับ',
            'Design the Franchise Model',
            'Set the joining fee, royalties and exactly what franchisees will get.',
          ),
        ],
      }),
      service({
        name: 'เลือกซื้อแฟรนไชส์อาหารก่อนจ่ายค่าแรกเข้า',
        description:
          'สำหรับคนที่กำลังจะซื้อแฟรนไชส์ร้านอาหารหรือเครื่องดื่ม เอาเอกสารที่เจ้าของแบรนด์ให้มาไล่ดูด้วยกัน คำนวณจุดคุ้มทุนจากยอดขายที่เป็นไปได้จริงในทำเลของคุณ และเตรียมคำถามที่ต้องถามก่อนเซ็น ออกไปพร้อมตัวเลขที่ใช้ตัดสินใจได้',
        en: {
          name: 'Check a Food Franchise Before You Pay the Joining Fee',
          description:
            'For anyone about to buy a food or drinks franchise. We go through the documents the brand gave you, work out the break-even point from sales that are realistic for your location, and prepare the questions to ask before you sign. You leave with numbers you can decide on.',
        },
        category: FOOD,
        photos: [photo(239975), photo(36815720)],
        packages: [
          pkg(
            45,
            900,
            'อ่านข้อเสนอ',
            'อ่านเอกสารแฟรนไชส์และชี้ค่าใช้จ่ายที่ซ่อนอยู่',
            'Read the Offer',
            'Read the franchise documents and point out the hidden costs.',
          ),
          pkg(
            90,
            2200,
            'คำนวณคุ้มทุน',
            'คำนวณจุดคุ้มทุนตามทำเลจริงและเทียบกับอีกแบรนด์ที่สนใจ',
            'Break-Even Check',
            'Work out break-even for your actual location and compare with another brand you are considering.',
          ),
        ],
      }),
      service({
        name: 'อ่านงบกำไรขาดทุนของร้านตัวเองให้เป็นใน 1 ชั่วโมง',
        description:
          'ได้งบจากสำนักงานบัญชีทุกปีแต่ไม่เคยอ่าน เอางบของคุณมาเปิดดูด้วยกันทีละบรรทัด ดูว่าเงินไปหมดที่ไหน กำไรจริงต่อเดือนเท่าไร และตัวเลขไหนต้องเฝ้าทุกเดือน ออกไปพร้อมหน้าสรุปตัวเลขสำคัญที่ใช้ติดตามเองได้',
        en: {
          name: 'Learn to Read Your Own Profit and Loss in One Hour',
          description:
            'Your accountant sends you statements every year and you never read them? We open yours together line by line: where the money goes, what you really make each month, and which figures to watch monthly. You leave with a one-page summary of key numbers to track yourself.',
        },
        category: BIZ,
        trialMinutes: 15,
        photos: [photo(33175649), photo(16098005)],
        packages: [
          pkg(
            60,
            1200,
            'อ่านงบด้วยกัน',
            'อ่านงบกำไรขาดทุนปีล่าสุดของคุณทีละบรรทัด',
            'Read It Together',
            "Go through last year's profit and loss line by line.",
          ),
          pkg(
            90,
            1900,
            'อ่านงบพร้อมวางตัวชี้วัด',
            'อ่านงบแล้วตั้งตัวเลข 5 ตัวที่ต้องติดตามทุกเดือน',
            'Read It and Set Your Numbers',
            'Read the statements, then set the five numbers to track every month.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.nicha.t@advisory.demo',
    displayName: 'ณิชา ธนวัฒน์',
    fullName: 'ณิชา ธนวัฒน์',
    portrait: portrait(8727533),
    headline: 'ที่ปรึกษาคอนเทนต์และ TikTok สำหรับธุรกิจท้องถิ่น',
    bio: 'เคยดูแลคอนเทนต์ให้ร้านอาหาร คาเฟ่ และโรงแรมในเชียงใหม่ ปั้นช่องของลูกค้าจากศูนย์จนมีผู้ติดตามหลักแสนมาแล้วหลายช่อง ถนัดสอนเจ้าของร้านถ่ายและตัดคลิปเองด้วยมือถือ โดยไม่ต้องจ้างทีมโปรดักชัน',
    en: {
      headline: 'Content and TikTok Advisor for Local Businesses',
      bio: 'Ran content for restaurants, cafés and hotels in Chiang Mai, growing several client accounts from zero to hundreds of thousands of followers. Specialises in teaching owners to shoot and edit their own videos on a phone, with no production crew.',
    },
    services: [
      service({
        name: 'ทำคลิป TikTok ให้ร้านท้องถิ่นโดยไม่ต้องจ้างทีมถ่าย',
        description:
          'สำหรับเจ้าของร้านที่อยากมีคลิปลงทุกสัปดาห์แต่ไม่มีงบจ้างทีม ดูช่องของคุณ เลือกรูปแบบคลิป 3 แบบที่ถ่ายซ้ำได้ แล้วลองถ่ายและตัดต่อด้วยมือถือไปพร้อมกัน ออกไปพร้อมคลิปแรกที่โพสต์ได้และรายการไอเดียสำหรับเดือนแรก',
        en: {
          name: 'TikTok Videos for Local Shops Without a Film Crew',
          description:
            "For owners who want to post every week but can't pay for a crew. We review your account, pick three video formats you can repeat, then shoot and edit on your phone together. You leave with a first video ready to post and a list of ideas for the first month.",
        },
        category: BIZ,
        trialMinutes: 15,
        photos: [photo(12199411), photo(13929770)],
        packages: [
          pkg(
            45,
            800,
            'วางรูปแบบคลิป',
            'เลือกรูปแบบคลิป 3 แบบที่เหมาะกับร้านและเขียนโครงเรื่อง',
            'Pick Your Formats',
            'Choose three video formats that suit your shop and outline them.',
          ),
          pkg(
            90,
            1800,
            'ถ่ายและตัดด้วยกัน',
            'ถ่ายและตัดต่อคลิปแรกบนมือถือของคุณจนพร้อมโพสต์',
            'Shoot and Edit Together',
            'Shoot and edit your first video on your own phone until it is ready to post.',
          ),
        ],
      }),
      service({
        name: 'วางแผนคอนเทนต์ 30 วันสำหรับเพจธุรกิจ',
        description:
          'โพสต์บ้างไม่โพสต์บ้างเพราะคิดไม่ออกว่าจะลงอะไร วางสัดส่วนคอนเทนต์ขาย คอนเทนต์ให้ความรู้ และคอนเทนต์เบื้องหลังให้เหมาะกับธุรกิจ แล้วเติมหัวข้อลงปฏิทินจนครบเดือน ออกไปพร้อมปฏิทินคอนเทนต์ 30 วันที่ทำตามได้เลย',
        en: {
          name: 'A 30-Day Content Plan for Your Business Page',
          description:
            "Posting on and off because you can't think what to post? We set the right mix of selling, teaching and behind-the-scenes posts for your business, then fill a calendar with topics for the whole month. You leave with a 30-day content calendar you can follow straight away.",
        },
        category: BIZ,
        photos: [photo(7710049), photo(9413665)],
        packages: [
          pkg(
            60,
            1200,
            'ปฏิทินหนึ่งเดือน',
            'วางสัดส่วนคอนเทนต์และหัวข้อครบ 30 วัน',
            'One-Month Calendar',
            'Set the content mix and fill 30 days with topics.',
          ),
          pkg(
            90,
            1900,
            'ปฏิทินพร้อมแคปชัน',
            'วางปฏิทินและเขียนแคปชันสัปดาห์แรกให้พร้อมโพสต์',
            'Calendar Plus Captions',
            'Plan the calendar and write the first week of captions, ready to post.',
          ),
        ],
      }),
      service({
        name: 'หาครีเอเตอร์มารีวิวสินค้าและต่อราคาให้พอดีงบ',
        description:
          'อยากให้ครีเอเตอร์รีวิวแต่ไม่รู้จะเลือกใครและควรจ่ายเท่าไร ดูวิธีคัดครีเอเตอร์จากยอดเข้าถึงจริงแทนยอดผู้ติดตาม ตั้งงบตามผลที่คาดหวัง และเขียนบรีฟกับข้อความติดต่อ ออกไปพร้อมรายชื่อครีเอเตอร์ที่ควรติดต่อและบรีฟงานหนึ่งชุด',
        en: {
          name: 'Find Creators to Review Your Product, at the Right Price',
          description:
            'Want creators to review your product but unsure whom to pick or what to pay? We cover how to judge creators by real reach rather than follower count, set a budget from the results you expect, and write the brief and outreach message. You leave with a shortlist to contact and a ready brief.',
        },
        category: BIZ,
        photos: [photo(6347571), photo(6347590)],
        packages: [
          pkg(
            45,
            900,
            'คัดรายชื่อ',
            'คัดครีเอเตอร์ 5 รายที่เหมาะกับสินค้าและงบ',
            'Build a Shortlist',
            'Shortlist five creators who fit your product and budget.',
          ),
          pkg(
            90,
            2000,
            'คัดรายชื่อพร้อมบรีฟ',
            'คัดรายชื่อ ตั้งงบ และเขียนบรีฟกับข้อความติดต่อให้เสร็จ',
            'Shortlist Plus Brief',
            'Shortlist, set the budget, and finish the brief and outreach message.',
          ),
        ],
      }),
      service({
        name: 'ทำคลิปสั้นขายสินค้าในตะกร้า TikTok Shop',
        description:
          'สำหรับร้านที่ปักตะกร้าแล้วแต่คลิปไม่มีคนกดซื้อ ดูคลิปที่โพสต์ไปแล้วว่าคนเลื่อนผ่านตรงวินาทีไหน แล้ววางโครงคลิปขายที่เปิดด้วยปัญหาของลูกค้าและปิดด้วยเหตุผลให้กดตะกร้า ออกไปพร้อมสคริปต์คลิปขาย 5 ชิ้น',
        en: {
          name: 'Short Videos That Sell From Your TikTok Shop Basket',
          description:
            "For shops with products tagged but no one buying from the videos. We look at the second where viewers scroll away in your past videos, then plan sales videos that open on the customer's problem and close with a reason to tap the basket. You leave with scripts for five videos.",
        },
        category: SHOP,
        photos: [photo(7676488), photo(7482005)],
        packages: [
          pkg(
            30,
            600,
            'ตรวจคลิปเดิม',
            'ดูคลิปขาย 5 ชิ้นล่าสุดและชี้จุดที่ต้องแก้',
            'Review Past Videos',
            'Review your last five sales videos and show what to fix.',
          ),
          pkg(
            60,
            1300,
            'เขียนสคริปต์ขาย',
            'วางโครงและเขียนสคริปต์คลิปขาย 5 ชิ้นสำหรับสินค้าหลัก',
            'Write Sales Scripts',
            'Outline and write five sales video scripts for your main products.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.worapot.s@advisory.demo',
    displayName: 'วรพจน์ แสงทอง',
    fullName: 'วรพจน์ แสงทอง',
    portrait: portrait(17049766),
    headline: 'ที่ปรึกษาการขาย B2B ทีมขาย และการนำเสนอต่อนักลงทุน',
    bio: 'ทำงานฝ่ายขายของบริษัทจัดจำหน่ายอุปกรณ์อุตสาหกรรมมา 12 ปีจนขึ้นเป็นผู้จัดการฝ่ายขาย ปิดสัญญากับโรงงานและหน่วยงานรัฐมาแล้วหลายร้อยราย ช่วงหลังร่วมลงทุนและเป็นพี่เลี้ยงให้สตาร์ตอัปที่ขายให้องค์กรอีกหลายราย ช่วยธุรกิจที่ขายให้องค์กรวางขั้นตอนการขาย ตั้งเป้าทีม และทำใบเสนอราคาที่ลูกค้าตัดสินใจได้ง่าย และช่วยผู้ก่อตั้งเตรียมตัวเลขกับการนำเสนอก่อนคุยกับนักลงทุนรอบแรก',
    en: {
      headline: 'B2B Sales, Sales Team, and Investor Pitch Advisor',
      bio: "Has spent 12 years in sales at an industrial equipment distributor, rising to sales manager and closing contracts with hundreds of factories and government agencies, and has since invested in and mentored several startups that sell to businesses. Helps companies that sell to organisations map their sales process, set team targets, and write quotations that make the buyer's decision easy, and helps founders get their numbers and pitch ready before their first investor meetings.",
    },
    services: [
      service({
        name: 'เขียนใบเสนอราคา B2B ให้ฝ่ายจัดซื้ออนุมัติเร็ว',
        description:
          'ใบเสนอราคาที่ส่งไปแล้วเงียบ มักขาดข้อมูลที่ฝ่ายจัดซื้อต้องใช้ขออนุมัติ ปรับใบเสนอราคาของคุณให้มีขอบเขต เงื่อนไข และตัวเลือกราคาที่ชัด พร้อมอีเมลติดตามที่ไม่กดดันลูกค้า ออกไปพร้อมแม่แบบใบเสนอราคาที่ใช้ซ้ำได้',
        en: {
          name: 'B2B Quotations Purchasing Teams Approve Quickly',
          description:
            "A quotation that goes quiet usually lacks what the buyer needs to get approval. We rework yours with a clear scope, terms and price options, plus a follow-up email that doesn't push. You leave with a quotation template you can reuse.",
        },
        category: BIZ,
        trialMinutes: 15,
        photos: [photo(8112180), photo(8297220)],
        packages: [
          pkg(
            30,
            700,
            'ตรวจใบเสนอราคา',
            'ตรวจใบเสนอราคาหนึ่งฉบับและบอกจุดที่ต้องแก้',
            'Quotation Check',
            'Review one quotation and mark what to change.',
          ),
          pkg(
            60,
            1500,
            'ทำแม่แบบใหม่',
            'ทำแม่แบบใบเสนอราคาและอีเมลติดตามที่ใช้ได้ทุกงาน',
            'New Template',
            'Build a quotation template and follow-up email for every deal.',
          ),
        ],
      }),
      service({
        name: 'ตั้งเป้าและค่าคอมมิชชันให้ทีมขาย 5 คน',
        description:
          'ทีมขายเริ่มมีหลายคนแต่ยังจ่ายคอมมิชชันแบบตกลงกันปากเปล่า วางเป้ารายคนจากยอดจริงที่ผ่านมา ออกแบบขั้นคอมมิชชันที่กระตุ้นยอดโดยไม่ทำให้กำไรหาย และวางการประชุมติดตามยอดรายสัปดาห์ ออกไปพร้อมตารางเป้าและสูตรคอมมิชชัน',
        en: {
          name: 'Targets and Commission for a Five-Person Sales Team',
          description:
            'Your sales team has grown, but commission is still a verbal agreement. We set individual targets from past results, design commission tiers that push sales without eating your margin, and plan a weekly pipeline meeting. You leave with a target table and a commission formula.',
        },
        category: BIZ,
        screeningRequired: true,
        photos: [photo(5439481), photo(7651717)],
        packages: [
          pkg(
            60,
            1800,
            'วางเป้าทีม',
            'ตั้งเป้ารายคนและรายไตรมาสจากยอดขายที่ผ่านมา',
            'Set Team Targets',
            'Set individual and quarterly targets from past sales.',
          ),
          pkg(
            120,
            3800,
            'เป้าพร้อมคอมมิชชัน',
            'ตั้งเป้า ออกแบบคอมมิชชัน และคำนวณผลต่อกำไรให้เห็นก่อนใช้จริง',
            'Targets and Commission',
            'Set targets, design commission and show the effect on profit before rollout.',
          ),
        ],
      }),
      service({
        name: 'เตรียมยื่นประมูลงานภาครัฐผ่าน e-bidding ครั้งแรก',
        description:
          'สำหรับธุรกิจที่อยากขายให้หน่วยงานรัฐแต่ไม่เคยยื่นซองมาก่อน ไล่ขั้นตอนตั้งแต่ลงทะเบียนในระบบจัดซื้อจัดจ้างภาครัฐ อ่านขอบเขตงาน เตรียมหลักฐานผลงาน ไปจนถึงหลักประกันซอง ออกไปพร้อมรายการเอกสารและปฏิทินงานสำหรับงานแรกที่จะยื่น',
        en: {
          name: 'Prepare Your First Government e-Bidding Submission',
          description:
            'For businesses that want to sell to the government but have never bid. We go through registering on the government procurement system, reading the terms of reference, preparing proof of past work and the bid bond. You leave with a document checklist and a timeline for your first bid.',
        },
        category: BIZ,
        photos: [photo(357514), photo(8468119)],
        packages: [
          pkg(
            60,
            1800,
            'ไล่ขั้นตอนทั้งหมด',
            'อธิบายขั้นตอนและเอกสารที่ต้องใช้ตั้งแต่ลงทะเบียนจนยื่นซอง',
            'Walk Through the Process',
            'Explain every step and document, from registration to submission.',
          ),
          pkg(
            120,
            4200,
            'เตรียมงานจริง',
            'อ่านขอบเขตงานที่จะยื่นจริงและเตรียมเอกสารไปพร้อมกัน',
            'Prepare a Real Bid',
            'Read the actual terms of reference and prepare the documents together.',
          ),
        ],
      }),
      service({
        name: 'ซ้อมนำเสนอขายกับลูกค้าองค์กรรายใหญ่',
        description:
          'มีนัดนำเสนอกับลูกค้ารายใหญ่ในอีกไม่กี่วัน ซ้อมนำเสนอจริงหนึ่งรอบโดยมีคนเล่นเป็นฝ่ายจัดซื้อและผู้บริหาร แล้วปรับลำดับเรื่อง ตัวเลข และวิธีรับข้อโต้แย้ง ออกไปพร้อมสไลด์ที่กระชับขึ้นและคำตอบสำหรับคำถามยากที่น่าจะเจอ',
        en: {
          name: 'Rehearse Your Pitch to a Major Corporate Client',
          description:
            'Pitching to a big client in a few days? You present once for real to someone playing the buyer and the executive, then we rework the flow, the numbers and how you handle objections. You leave with tighter slides and answers to the hard questions you are likely to face.',
        },
        category: BIZ,
        photos: [photo(5668510), photo(36766676)],
        packages: [
          pkg(
            60,
            1500,
            'ซ้อมหนึ่งรอบ',
            'นำเสนอหนึ่งรอบแล้วรับฟีดแบ็กทีละช่วง',
            'One Rehearsal',
            'Present once, then get feedback section by section.',
          ),
          pkg(
            90,
            2400,
            'ซ้อมพร้อมแก้สไลด์',
            'ซ้อม ปรับสไลด์ และซ้อมรอบสองกับคำถามที่ยากขึ้น',
            'Rehearse and Fix the Slides',
            'Rehearse, fix the slides, then run a second round with tougher questions.',
          ),
        ],
      }),
      service({
        name: 'รีวิวพิชเด็คก่อนคุยกับนักลงทุน',
        description:
          'ส่งพิชเด็คมาก่อนนัด แล้วไล่ดูทีละสไลด์จากมุมของนักลงทุนว่าสไลด์ไหนทำให้เลิกอ่าน ตัวเลขไหนดูไม่น่าเชื่อ และเรื่องไหนยังขาด ออกไปพร้อมรายการแก้ไขเรียงตามความสำคัญ',
        en: {
          name: 'Pitch Deck Review Before You Meet Investors',
          description:
            "Send your deck before the session, then we go through it slide by slide from an investor's point of view: which slide makes them stop reading, which numbers look doubtful, and what's missing. You leave with a list of fixes in order of priority.",
        },
        category: BIZ,
        screeningRequired: true,
        photos: [photo(7413924), photo(7413913)],
        packages: [
          pkg(
            45,
            1200,
            'อ่านเด็คหนึ่งรอบ',
            'อ่านพิชเด็คและให้ฟีดแบ็กทีละสไลด์',
            'Deck Read-Through',
            'Read your deck and give feedback slide by slide.',
          ),
          pkg(
            90,
            2800,
            'รีวิวพร้อมเรียงเรื่องใหม่',
            'รีวิวแล้วจัดลำดับเรื่องเล่าและตัวเลขใหม่ไปด้วยกัน',
            'Review and Restructure',
            'Review it, then rework the storyline and numbers together.',
          ),
        ],
      }),
      service({
        name: 'ประเมินมูลค่ากิจการและแบ่งหุ้นผู้ก่อตั้งรอบแรก',
        description:
          'ก่อนรับเงินรอบแรกต้องตอบให้ได้ว่าบริษัทมีมูลค่าเท่าไรและผู้ก่อตั้งแต่ละคนถือหุ้นเท่าไร คุยวิธีประเมินมูลค่าที่ใช้กันในรอบเริ่มต้น การแบ่งหุ้นตามบทบาท และการทยอยได้หุ้นตามเวลา ออกไปพร้อมตารางผู้ถือหุ้นก่อนและหลังระดมทุน',
        en: {
          name: 'Valuation and Founder Equity for Your First Round',
          description:
            'Before taking your first money you need to know what the company is worth and who owns how much. We cover the valuation methods used at early stage, splitting equity by role, and vesting over time. You leave with a cap table before and after the raise.',
        },
        category: BIZ,
        photos: [photo(5439478), photo(7651738)],
        packages: [
          pkg(
            60,
            2000,
            'แบ่งหุ้นผู้ก่อตั้ง',
            'ตกลงสัดส่วนหุ้นและเงื่อนไขการทยอยได้หุ้นระหว่างผู้ก่อตั้ง',
            'Founder Split',
            'Agree the equity split and vesting terms between founders.',
          ),
          pkg(
            120,
            4500,
            'มูลค่าและตารางหุ้น',
            'ประเมินมูลค่า จำลองการระดมทุน และทำตารางผู้ถือหุ้นให้เสร็จ',
            'Valuation and Cap Table',
            'Value the company, model the raise and finish the cap table.',
          ),
        ],
      }),
      service({
        name: 'ซ้อมตอบคำถามนักลงทุนก่อนวันนำเสนอจริง',
        description:
          'นักลงทุนมักถามเรื่องเดิมๆ แต่ผู้ก่อตั้งมักตอบไม่ทัน นำเสนอจริงหนึ่งรอบแล้วรับคำถามแบบที่นักลงทุนถามจริง ทั้งเรื่องตลาด คู่แข่ง ทีม และการใช้เงิน ออกไปพร้อมคำตอบสั้นๆ สำหรับคำถาม 20 ข้อที่เจอบ่อยที่สุด',
        en: {
          name: 'Rehearse Investor Q&A Before Demo Day',
          description:
            'Investors ask the same questions, yet founders often stumble. You pitch once for real, then take the kind of questions investors actually ask about market, competition, team and use of funds. You leave with short answers to the 20 questions that come up most.',
        },
        category: BIZ,
        trialMinutes: 15,
        photos: [photo(7413915), photo(5668512)],
        packages: [
          pkg(
            45,
            1000,
            'ถามตอบหนึ่งรอบ',
            'นำเสนอสั้นๆ แล้วรับคำถามยากต่อเนื่อง 30 นาที',
            'One Q&A Round',
            'A short pitch followed by 30 minutes of hard questions.',
          ),
          pkg(
            90,
            2200,
            'ซ้อมเต็มพร้อมสรุป',
            'ซ้อมสองรอบ และสรุปคำตอบของคำถามที่เจอบ่อยให้ไว้ทบทวน',
            'Full Rehearsal and Notes',
            'Two rehearsal rounds, plus written answers to the common questions.',
          ),
        ],
      }),
      service({
        name: 'ยื่นขอทุนสนับสนุนนวัตกรรมจากหน่วยงานรัฐ',
        description:
          'สำหรับสตาร์ตอัปและธุรกิจเทคโนโลยีที่อยากยื่นขอทุนแบบให้เปล่าจากหน่วยงานส่งเสริมนวัตกรรม เลือกโครงการที่เข้าเกณฑ์ อ่านเงื่อนไขด้วยกัน แล้ววางโครงข้อเสนอโครงการให้ตรงกับที่กรรมการให้คะแนน ออกไปพร้อมโครงร่างข้อเสนอและงบประมาณโครงการ',
        en: {
          name: 'Apply for Government Innovation Grants',
          description:
            'For startups and tech businesses applying for non-repayable grants from innovation agencies. We pick the programmes you qualify for, read the conditions together, and outline a proposal that matches how the committee scores. You leave with a proposal outline and a project budget.',
        },
        category: BIZ,
        photos: [photo(7034734), photo(3059749)],
        packages: [
          pkg(
            60,
            1500,
            'เลือกทุนที่เข้าเกณฑ์',
            'ดูธุรกิจของคุณแล้วเลือกทุนที่มีโอกาสได้มากที่สุด',
            'Find the Right Grant',
            'Review your business and pick the grants you have the best chance with.',
          ),
          pkg(
            120,
            3800,
            'วางข้อเสนอโครงการ',
            'วางโครงข้อเสนอ ตัวชี้วัด และงบประมาณให้พร้อมเขียนฉบับเต็ม',
            'Outline the Proposal',
            'Outline the proposal, its indicators and budget, ready to write in full.',
          ),
        ],
      }),
    ],
  },

  // ─── Online shops and e-commerce ───────────────────────────────────────
  {
    email: 'biz.sunisa.k@advisory.demo',
    displayName: 'สุนิสา แก้วประเสริฐ',
    fullName: 'สุนิสา แก้วประเสริฐ',
    portrait: portrait(7163350),
    headline: 'ที่ปรึกษาร้านค้าบน Shopee และ Lazada',
    bio: 'เปิดร้านเครื่องสำอางบน Shopee และ Lazada มาตั้งแต่ปี 2560 จนเป็นร้าน Mall ยอดขายเดือนละหลักล้าน ปัจจุบันช่วยแม่ค้าออนไลน์จัดหน้าร้าน วางแผนเข้าแคมเปญ และอ่านรายงานยอดขายหลังบ้านให้เป็น สอนจากหน้าร้านจริงของคุณ ไม่ใช่สไลด์',
    en: {
      headline: 'Shopee and Lazada Store Advisor',
      bio: 'Has sold cosmetics on Shopee and Lazada since 2017, growing the shop into a Mall store with monthly sales in the millions. Now helps online sellers set up their storefront, plan for campaigns, and read their seller-centre reports, teaching from your real shop rather than slides.',
    },
    services: [
      service({
        name: 'เปิดร้าน Shopee ให้คนค้นเจอใน 30 วันแรก',
        description:
          'สำหรับคนที่เพิ่งเปิดร้านหรือเปิดมาแล้วแต่ไม่มีคนเห็นสินค้า ตั้งค่าหน้าร้าน หมวดหมู่ และสินค้าชิ้นแรกไปด้วยกัน พร้อมวางแผนรีวิวและโปรโมชันช่วงเดือนแรกให้ร้านเริ่มมีออเดอร์ ออกไปพร้อมรายการสิ่งที่ต้องทำทุกวันใน 30 วันแรก',
        en: {
          name: 'Get Your Shopee Store Found in the First 30 Days',
          description:
            'For new sellers, or anyone whose products nobody sees yet. We set up your storefront, categories and first listing together, and plan reviews and promotions for the first month so orders start coming in. You leave with a day-by-day list for the first 30 days.',
        },
        category: SHOP,
        trialMinutes: 15,
        photos: [photo(8938731), photo(6214389)],
        packages: [
          pkg(
            45,
            800,
            'ตั้งหน้าร้าน',
            'ตั้งค่าร้าน หมวดหมู่ และสินค้าชิ้นแรกให้ถูกตั้งแต่ต้น',
            'Set Up the Store',
            'Set up the store, categories and first listing correctly from day one.',
          ),
          pkg(
            90,
            1800,
            'แผน 30 วันแรก',
            'ตั้งหน้าร้านและวางแผนรีวิว โปรโมชัน และงานรายวันของเดือนแรก',
            'First 30-Day Plan',
            'Set up the store and plan reviews, promotions and daily tasks for the first month.',
          ),
        ],
      }),
      service({
        name: 'วางแผนเข้าแคมเปญ 11.11 และ 12.12 ให้ไม่ขาดทุน',
        description:
          'แคมเปญใหญ่ขายได้เยอะแต่หลายร้านขายแล้วขาดทุน คำนวณส่วนลด ค่าธรรมเนียม และค่าส่งที่ร้านต้องแบกในแต่ละโปร เลือกสินค้าที่ควรเข้าแคมเปญ และเตรียมสต็อกให้พอดี ออกไปพร้อมตารางสินค้าและราคาสำหรับแคมเปญถัดไป',
        en: {
          name: 'Plan 11.11 and 12.12 Campaigns Without Losing Money',
          description:
            'Big campaigns bring big sales, yet many shops sell at a loss. We work out the discounts, fees and shipping you carry under each promotion, choose which products should join, and plan stock to match. You leave with a product and price table for your next campaign.',
        },
        category: SHOP,
        photos: [photo(4440842), photo(4440846)],
        packages: [
          pkg(
            60,
            1200,
            'คำนวณกำไรต่อโปร',
            'คำนวณกำไรจริงของสินค้าหลักในแต่ละรูปแบบโปรโมชัน',
            'Profit per Promotion',
            'Work out the real profit on your main products under each promotion type.',
          ),
          pkg(
            120,
            2800,
            'แผนแคมเปญทั้งร้าน',
            'เลือกสินค้า ตั้งราคา วางสต็อก และกำหนดงบโฆษณาของแคมเปญ',
            'Whole-Store Campaign Plan',
            'Choose products, set prices, plan stock and set the ad budget for the campaign.',
          ),
        ],
      }),
      service({
        name: 'ตั้งโฆษณาในแพลตฟอร์มให้ต้นทุนต่อออเดอร์ไม่บานปลาย',
        description:
          'เปิดโฆษณาค้นหาในแพลตฟอร์มแล้วงบหมดไวแต่ยอดไม่ขึ้น ดูคีย์เวิร์ด ราคาประมูล และสินค้าที่ยิงอยู่ ตัดส่วนที่เผาเงินทิ้ง แล้วตั้งเพดานต้นทุนต่อออเดอร์ที่ร้านรับได้ ออกไปพร้อมการตั้งค่าโฆษณาที่ปรับแล้วในบัญชีของคุณ',
        en: {
          name: 'Marketplace Ads Without a Runaway Cost per Order',
          description:
            "Running search ads on the marketplace, burning through budget with no sales lift? We review your keywords, bids and promoted products, cut what's wasting money, and set a ceiling on cost per order your shop can live with. You leave with the ads already adjusted in your account.",
        },
        category: SHOP,
        photos: [photo(8938722), photo(4604639)],
        packages: [
          pkg(
            30,
            600,
            'ตรวจโฆษณา',
            'ดูโฆษณาที่เปิดอยู่และชี้คีย์เวิร์ดที่ควรตัด',
            'Ads Check',
            'Review your live ads and flag the keywords to cut.',
          ),
          pkg(
            60,
            1300,
            'ตั้งโฆษณาใหม่',
            'ปรับคีย์เวิร์ด ราคาประมูล และเพดานต้นทุนในบัญชีไปพร้อมกัน',
            'Rebuild the Ads',
            'Rework keywords, bids and cost ceilings in your account together.',
          ),
        ],
      }),
      service({
        name: 'ยกระดับร้านเป็น Shopee Mall และ LazMall',
        description:
          'สำหรับแบรนด์ที่ขายได้สม่ำเสมอและอยากได้ป้าย Mall ไล่เกณฑ์ที่แพลตฟอร์มใช้ เอกสารแบรนด์และเครื่องหมายการค้าที่ต้องมี และค่าธรรมเนียมที่เพิ่มขึ้น แล้วคำนวณว่าคุ้มหรือยัง ออกไปพร้อมแผนเตรียมร้านก่อนยื่นสมัคร',
        en: {
          name: 'Move Up to Shopee Mall and LazMall',
          description:
            "For brands with steady sales who want the Mall badge. We go through the platform's criteria, the brand and trademark documents you need, and the higher fees, then work out whether it pays yet. You leave with a plan to get the store ready before you apply.",
        },
        category: SHOP,
        screeningRequired: true,
        photos: [photo(10825661), photo(31552020)],
        packages: [
          pkg(
            45,
            900,
            'เช็กคุณสมบัติ',
            'ดูยอดขายและเอกสารว่าผ่านเกณฑ์ Mall หรือยัง',
            'Eligibility Check',
            'Check your sales and documents against the Mall criteria.',
          ),
          pkg(
            90,
            2200,
            'แผนยื่นสมัคร',
            'คำนวณความคุ้มค่าและวางแผนเตรียมร้านและเอกสารก่อนยื่น',
            'Application Plan',
            'Weigh the costs, then plan the store and paperwork before you apply.',
          ),
        ],
      }),
      service({
        name: 'เขียนชื่อสินค้าและรายละเอียดให้ติดการค้นหา',
        description:
          'สินค้าดีแต่ลูกค้าค้นไม่เจอ หาคำที่ลูกค้าใช้ค้นจริง แล้วเขียนชื่อสินค้า รายละเอียด และเลือกรูปปกใหม่ให้ทั้งค้นเจอและน่ากด ออกไปพร้อมหน้าสินค้าที่แก้แล้ว 5 รายการ และวิธีทำต่อเองกับสินค้าที่เหลือ',
        en: {
          name: 'Product Titles and Descriptions That Show Up in Search',
          description:
            "Good products that customers can't find? We find the words buyers actually search for, then rewrite titles and descriptions and pick new cover images that get found and get clicked. You leave with five listings fixed and a method to do the rest yourself.",
        },
        category: SHOP,
        photos: [photo(1253646), photo(7718711)],
        packages: [
          pkg(
            30,
            500,
            'แก้ชื่อสินค้า',
            'หาคำค้นและเขียนชื่อสินค้าใหม่ 5 รายการ',
            'Fix Product Titles',
            'Find search terms and rewrite five product titles.',
          ),
          pkg(
            60,
            1100,
            'แก้หน้าสินค้าครบ',
            'แก้ชื่อ รายละเอียด และรูปปกของสินค้าขายดี 5 รายการ',
            'Full Listing Makeover',
            'Rewrite the title, description and cover image of five best-sellers.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.paweena.s@advisory.demo',
    displayName: 'ปวีณา ศรีวงศ์',
    fullName: 'ปวีณา ศรีวงศ์',
    portrait: portrait(26953796),
    headline: 'ที่ปรึกษาไลฟ์ขายของ TikTok Shop และระบบแพ็กส่ง',
    bio: 'ไลฟ์ขายเสื้อผ้าผ่าน Facebook และ TikTok มา 5 ปี ทำยอดสูงสุดในไลฟ์เดียวกว่า 4 แสนบาท และดูแลสต็อกกับการแพ็กส่งของร้านเองในวันที่ออเดอร์เข้าหลายพันกล่อง ปัจจุบันเทรนแม่ค้าและพนักงานไลฟ์ให้ร้านเสื้อผ้าและเครื่องสำอาง สอนตั้งแต่จัดฉาก เขียนสคริปต์ อ่านสถิติหลังไลฟ์ ไปจนถึงจัดที่เก็บสต็อก วางขั้นตอนแพ็ก และเลือกขนส่งให้ต้นทุนต่อกล่องลดลง',
    en: {
      headline: 'Live Selling, TikTok Shop, and Fulfilment Advisor',
      bio: "Has sold clothes live on Facebook and TikTok for 5 years, with a best single stream of over 400,000 baht, and has run her own shop's stock and packing on days with thousands of orders. Now trains sellers and live hosts for clothing and cosmetics shops, covering the set, the script, and reading the stats after each stream, through to organising stock, setting up packing steps, and choosing couriers that lower the cost per parcel.",
    },
    services: [
      service({
        name: 'จัดสต็อกและขั้นตอนแพ็กของให้ทันวันละ 200 ออเดอร์',
        description:
          'ออเดอร์เพิ่มจนแพ็กไม่ทัน ส่งผิด ส่งตกหล่น ไล่ดูพื้นที่เก็บของและขั้นตอนตั้งแต่พิมพ์ใบปะหน้าจนส่งของ แล้วจัดผังชั้นวาง รหัสสินค้า และลำดับการแพ็กใหม่ ออกไปพร้อมผังห้องสต็อกและขั้นตอนแพ็กที่สอนลูกน้องได้',
        en: {
          name: 'Stock and Packing Steps for 200 Orders a Day',
          description:
            "Orders have grown and you can't pack in time, with wrong and missed parcels. We look at your storage space and every step from printing the label to handing over to the courier, then redo the shelving, product codes and packing order. You leave with a stockroom layout and packing steps you can teach your staff.",
        },
        category: SHOP,
        photos: [photo(7857553), photo(7857510), photo(7289727)],
        packages: [
          pkg(
            60,
            1300,
            'วางขั้นตอนแพ็ก',
            'ไล่ขั้นตอนแพ็กของปัจจุบันและวางลำดับใหม่ที่ผิดพลาดน้อยลง',
            'Packing Workflow',
            'Map your current packing steps and design a new order with fewer mistakes.',
          ),
          pkg(
            120,
            2800,
            'จัดห้องสต็อกทั้งระบบ',
            'วางผังชั้นวาง รหัสสินค้า การนับสต็อก และขั้นตอนแพ็กครบชุด',
            'Full Stockroom System',
            'Plan shelving, product codes, stock counts and the full packing process.',
          ),
        ],
      }),
      service({
        name: 'เลือกขนส่งและตั้งค่าส่งให้ไม่กินกำไร',
        description:
          'ค่าส่งเป็นต้นทุนที่หลายร้านคิดพลาด เทียบราคาขนส่งแต่ละเจ้าตามน้ำหนักและปลายทางที่ร้านส่งจริง คิดค่ากล่องและค่าแพ็กรวมเข้าไป แล้วตั้งค่าส่งที่เรียกเก็บลูกค้าให้ไม่ขาดทุน ออกไปพร้อมตารางเทียบขนส่งและค่าส่งที่ควรตั้ง',
        en: {
          name: 'Choose Couriers and Set Shipping Fees That Keep Your Margin',
          description:
            'Shipping is a cost many shops get wrong. We compare couriers by the weights and destinations you actually ship, add in boxes and packing, then set the shipping fee you charge so you never lose money on it. You leave with a courier comparison table and the fees to set.',
        },
        category: SHOP,
        trialMinutes: 15,
        photos: [photo(12725460), photo(6667681)],
        packages: [
          pkg(
            30,
            500,
            'เทียบขนส่ง',
            'เทียบราคาขนส่ง 3 เจ้าจากออเดอร์จริงของร้าน',
            'Courier Comparison',
            "Compare three couriers using your shop's real orders.",
          ),
          pkg(
            60,
            1100,
            'ตั้งค่าส่งใหม่',
            'คิดต้นทุนส่งต่อกล่องทั้งหมดและตั้งค่าส่งให้ลูกค้าใหม่',
            'Reset Shipping Fees',
            'Work out the full cost per parcel and set new shipping fees for customers.',
          ),
        ],
      }),
      service({
        name: 'ลดพัสดุตีกลับจากการเก็บเงินปลายทาง',
        description:
          'ร้านที่ขายแบบเก็บเงินปลายทางมักเสียค่าส่งไปกลับกับพัสดุที่ลูกค้าไม่รับ ดูสถิติตีกลับของร้าน หาว่าเกิดจากสินค้า ช่องทาง หรือลูกค้ากลุ่มไหน แล้ววางขั้นตอนยืนยันออเดอร์ก่อนส่ง ออกไปพร้อมข้อความยืนยันออเดอร์และเกณฑ์ปฏิเสธออเดอร์เสี่ยง',
        en: {
          name: 'Cut Returned Parcels on Cash on Delivery',
          description:
            'Shops selling cash on delivery often pay shipping both ways on parcels customers refuse. We look at your return figures, find whether the product, the channel or certain customers are behind it, then set up an order confirmation step before shipping. You leave with a confirmation message and rules for declining risky orders.',
        },
        category: SHOP,
        photos: [photo(12725400), photo(7843997)],
        packages: [
          pkg(
            45,
            800,
            'หาสาเหตุตีกลับ',
            'ดูสถิติตีกลับและแยกสาเหตุหลัก',
            'Find the Causes',
            'Go through your return figures and separate the main causes.',
          ),
          pkg(
            90,
            1700,
            'วางระบบยืนยันออเดอร์',
            'วางขั้นตอนยืนยัน ข้อความ และเกณฑ์คัดออเดอร์เสี่ยงให้ทีมใช้',
            'Order Confirmation System',
            'Set up confirmation steps, messages and risk rules for your team.',
          ),
        ],
      }),
      service({
        name: 'เลือกระหว่างแพ็กเองกับจ้างคลังสินค้าภายนอก',
        description:
          'ถึงจุดที่ต้องตัดสินใจว่าจะเช่าโกดังจ้างคนเพิ่ม หรือส่งสต็อกไปให้คลังสินค้าภายนอกแพ็กแทน คำนวณต้นทุนต่อออเดอร์ของทั้งสองทาง ดูสัญญาและค่าธรรมเนียมแฝงของผู้ให้บริการ ออกไปพร้อมตัวเลขเปรียบเทียบที่ใช้ตัดสินใจได้',
        en: {
          name: 'Pack In-House or Use a Fulfilment Warehouse?',
          description:
            "Reached the point of choosing between renting space and hiring more staff, or sending your stock to a fulfilment warehouse? We work out the cost per order both ways and look at providers' contracts and hidden fees. You leave with a comparison you can decide on.",
        },
        category: SHOP,
        screeningRequired: true,
        photos: [photo(4483942), photo(7019315)],
        packages: [
          pkg(
            60,
            1400,
            'เทียบต้นทุน',
            'คำนวณต้นทุนต่อออเดอร์ของการแพ็กเองเทียบกับจ้างคลัง',
            'Cost Comparison',
            'Compare cost per order for in-house packing and outsourcing.',
          ),
          pkg(
            90,
            2200,
            'เทียบพร้อมอ่านสัญญา',
            'เทียบต้นทุนและอ่านข้อเสนอของผู้ให้บริการ 2 รายไปด้วยกัน',
            'Compare and Read the Contracts',
            "Compare costs and read two providers' offers together.",
          ),
        ],
      }),
      service({
        name: 'ไลฟ์ขายของใน TikTok Shop ครั้งแรกให้มีคนดู',
        description:
          'สำหรับคนที่ยังไม่เคยไลฟ์หรือไลฟ์แล้วคนดูไม่ถึงสิบ จัดมุมกล้อง แสง และเสียงด้วยของที่มีอยู่ เลือกช่วงเวลาไลฟ์ และวาง 10 นาทีแรกที่ทำให้คนหยุดดู ออกไปพร้อมฉากไลฟ์ที่ตั้งเสร็จและโครงไลฟ์ครั้งแรก',
        en: {
          name: 'Your First TikTok Shop Live, With People Watching',
          description:
            'For anyone who has never gone live, or does but gets fewer than ten viewers. We set up the camera angle, light and sound with what you have, pick your time slot, and plan the first ten minutes that make people stop and watch. You leave with your set ready and an outline for your first stream.',
        },
        category: SHOP,
        trialMinutes: 15,
        photos: [photo(6593771), photo(6347621)],
        packages: [
          pkg(
            45,
            800,
            'จัดฉากไลฟ์',
            'จัดกล้อง แสง เสียง และมุมโชว์สินค้าผ่านวิดีโอคอล',
            'Set Up Your Set',
            'Set up camera, light, sound and product angles over video call.',
          ),
          pkg(
            90,
            1700,
            'ซ้อมไลฟ์จริง',
            'จัดฉากแล้วซ้อมไลฟ์ 20 นาทีพร้อมฟีดแบ็กทันที',
            'Practice Live',
            'Set up, then run a 20-minute practice stream with live feedback.',
          ),
        ],
      }),
      service({
        name: 'เขียนสคริปต์ไลฟ์ขายเสื้อผ้า 2 ชั่วโมง',
        description:
          'ไลฟ์ยาวแล้วพูดวน คนดูหลุดกลางทาง วางโครงไลฟ์ 2 ชั่วโมงเป็นช่วงๆ ตั้งแต่เปิดไลฟ์ โชว์สินค้า ปล่อยโปร จนถึงปิดการขาย พร้อมประโยคเรียกคนดูกลับและตอบคำถามเรื่องไซซ์ ออกไปพร้อมสคริปต์ที่ใช้กับคอลเลกชันถัดไปได้ทันที',
        en: {
          name: 'A Two-Hour Script for Selling Clothes Live',
          description:
            'Long streams that go round in circles and lose viewers halfway? We break two hours into segments, from opening and showing pieces to dropping offers and closing, with lines that pull viewers back and answer size questions. You leave with a script you can use for your next collection.',
        },
        category: SHOP,
        photos: [photo(12432838), photo(3812433)],
        packages: [
          pkg(
            60,
            1200,
            'โครงไลฟ์',
            'วางโครงไลฟ์ 2 ชั่วโมงแบ่งเป็นช่วงพร้อมจังหวะปล่อยโปร',
            'Live Outline',
            'Outline a two-hour stream in segments, with timing for offers.',
          ),
          pkg(
            90,
            1900,
            'สคริปต์เต็ม',
            'เขียนสคริปต์เต็มพร้อมประโยคปิดการขายและตอบคำถามที่เจอบ่อย',
            'Full Script',
            'Write the full script, with closing lines and answers to common questions.',
          ),
        ],
      }),
      service({
        name: 'ชวนครีเอเตอร์ช่วยขายผ่านระบบแอฟฟิลิเอต',
        description:
          'ให้ครีเอเตอร์ช่วยปักตะกร้าสินค้าของร้านและได้ค่าคอมมิชชันเมื่อขายได้ ตั้งอัตราคอมมิชชันที่ร้านยังมีกำไร เลือกสินค้าที่เหมาะกับแอฟฟิลิเอต ส่งตัวอย่างอย่างไรให้คุ้ม และติดตามว่าใครขายได้จริง ออกไปพร้อมข้อเสนอสำหรับชวนครีเอเตอร์และตารางติดตามผล',
        en: {
          name: 'Get Creators Selling for You Through Affiliates',
          description:
            'Have creators tag your products and earn commission on sales. We set a commission rate that keeps your margin, choose products that suit affiliates, decide how to send samples without waste, and track who really sells. You leave with an offer for creators and a tracking sheet.',
        },
        category: SHOP,
        photos: [photo(7480538), photo(17642672)],
        packages: [
          pkg(
            45,
            900,
            'ตั้งค่าคอมมิชชัน',
            'คำนวณอัตราคอมมิชชันและเลือกสินค้าที่จะเปิดแอฟฟิลิเอต',
            'Set the Commission',
            'Work out commission rates and choose which products to open to affiliates.',
          ),
          pkg(
            90,
            1800,
            'แผนแอฟฟิลิเอตครบ',
            'ตั้งค่าคอมมิชชัน เขียนข้อเสนอ และวางวิธีคัดและติดตามครีเอเตอร์',
            'Full Affiliate Plan',
            'Set commission, write the offer, and plan how to pick and track creators.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.ratchanee.t@advisory.demo',
    displayName: 'รัชนี ตั้งเจริญ',
    fullName: 'รัชนี ตั้งเจริญ',
    portrait: portrait(21044845),
    headline: 'ที่ปรึกษานำเข้าสินค้าและผลิตแบรนด์ตัวเอง',
    bio: 'ทำธุรกิจนำเข้าสินค้าจากจีนมา 10 ปี ทั้งของใช้ในบ้านและเครื่องสำอาง และผลิตสินค้าแบรนด์ตัวเองกับโรงงาน OEM มาแล้วกว่า 20 รายการ ช่วยแม่ค้าที่อยากเลิกรับของต่อจากคนอื่น หันมานำเข้าเองหรือทำแบรนด์ของตัวเอง โดยไม่ต้องลองผิดลองถูกด้วยเงินก้อนแรก',
    en: {
      headline: 'Import and Private-Label Advisor',
      bio: 'Has imported goods from China for 10 years, from homeware to cosmetics, and produced more than 20 private-label products with OEM factories. Helps sellers stop buying from middlemen and import directly or launch their own brand, without gambling their first big sum on trial and error.',
    },
    services: [
      service({
        name: 'สั่งสินค้าจากจีนครั้งแรกผ่านเว็บค้าส่ง',
        description:
          'อยากสั่งของจากเว็บค้าส่งจีนเองแต่กลัวโดนโกงหรือของไม่ตรงปก ไล่วิธีคัดร้านค้า ขอตัวอย่าง ใช้บริการฝากสั่งและขนส่งเข้าไทย และเช็กของก่อนจ่ายเต็มจำนวน ออกไปพร้อมรายการตรวจก่อนสั่งล็อตแรก',
        en: {
          name: 'Your First Order From a Chinese Wholesale Site',
          description:
            "Want to order from Chinese wholesale sites yourself but worried about scams or goods that don't match the photos? We go through vetting suppliers, ordering samples, using an agent and freight into Thailand, and checking goods before paying in full. You leave with a checklist for your first order.",
        },
        category: SHOP,
        trialMinutes: 15,
        photos: [photo(6595779), photo(3057963)],
        packages: [
          pkg(
            45,
            900,
            'เริ่มสั่งของ',
            'อธิบายขั้นตอนสั่งและนำเข้าตั้งแต่เลือกร้านจนของถึงมือ',
            'Start Ordering',
            'Walk through ordering and importing, from choosing a supplier to receiving the goods.',
          ),
          pkg(
            90,
            1800,
            'คัดร้านด้วยกัน',
            'คัดผู้ขาย 3 รายสำหรับสินค้าที่คุณจะสั่งจริงและเทียบเงื่อนไข',
            'Vet Suppliers Together',
            'Vet three suppliers for the product you plan to order and compare their terms.',
          ),
        ],
      }),
      service({
        name: 'คำนวณต้นทุนนำเข้าและภาษีอากรก่อนสั่งล็อตแรก',
        description:
          'ราคาหน้าเว็บยังไม่ใช่ต้นทุนจริง รวมค่าขนส่งทางรถหรือทางเรือ ภาษีอากร ภาษีมูลค่าเพิ่ม ค่าฝากสั่ง และของเสียหายเข้าไปในต้นทุนต่อชิ้น แล้วตั้งราคาขายที่ยังมีกำไร ออกไปพร้อมไฟล์คำนวณต้นทุนที่ใช้กับสินค้าตัวถัดไปได้',
        en: {
          name: 'Work Out Landed Cost and Duties Before Your First Order',
          description:
            "The website price isn't your real cost. We add road or sea freight, import duty, VAT, agent fees and damaged goods into a cost per unit, then set a selling price that still makes money. You leave with a costing sheet you can reuse for the next product.",
        },
        category: SHOP,
        photos: [photo(29822711), photo(36652835)],
        packages: [
          pkg(
            30,
            600,
            'คิดสินค้าเดียว',
            'คำนวณต้นทุนนำเข้าจริงของสินค้าหนึ่งรายการ',
            'One Product',
            'Work out the real landed cost of one product.',
          ),
          pkg(
            60,
            1200,
            'ไฟล์ต้นทุนครบ',
            'ทำไฟล์คำนวณต้นทุนและราคาขายที่ใช้ได้กับทุกสินค้า',
            'Full Costing Sheet',
            'Build a cost and price sheet that works for every product.',
          ),
        ],
      }),
      service({
        name: 'หาโรงงาน OEM ผลิตเครื่องสำอางแบรนด์ตัวเอง',
        description:
          'อยากมีครีมหรือเซรั่มแบรนด์ของตัวเอง คุยเรื่องการเลือกโรงงาน ขั้นต่ำการผลิต การพัฒนาสูตร และค่าใช้จ่ายทั้งหมดก่อนได้ของล็อตแรก พร้อมคำถามที่ต้องถามโรงงานก่อนเซ็นสัญญา ออกไปพร้อมงบประมาณและไทม์ไลน์ที่เป็นไปได้จริง',
        en: {
          name: 'Find an OEM Factory for Your Own Cosmetics Brand',
          description:
            'Want your own cream or serum? We cover choosing a factory, minimum order quantities, formula development and every cost before your first batch arrives, plus the questions to ask before signing. You leave with a realistic budget and timeline.',
        },
        category: SHOP,
        screeningRequired: true,
        photos: [photo(7797009), photo(8101520), photo(16378444)],
        packages: [
          pkg(
            60,
            1500,
            'วางงบและไทม์ไลน์',
            'ประเมินงบและเวลาตั้งแต่พัฒนาสูตรจนได้สินค้าล็อตแรก',
            'Budget and Timeline',
            'Estimate the budget and time from formula to first batch.',
          ),
          pkg(
            120,
            3200,
            'เทียบโรงงาน',
            'วางงบ ไทม์ไลน์ และเทียบใบเสนอราคาของโรงงาน 2–3 แห่งด้วยกัน',
            'Compare Factories',
            "Plan budget and timeline, and compare two or three factories' quotes together.",
          ),
        ],
      }),
      service({
        name: 'เตรียมเอกสารจดแจ้งเครื่องสำอางและขอเลข อย.',
        description:
          'ก่อนวางขายเครื่องสำอางหรืออาหารเสริมต้องมีเลขจดแจ้งหรือเลข อย. ให้ถูกประเภท ไล่ว่าสินค้าของคุณเข้าข่ายแบบไหน ใครเป็นผู้ยื่น เอกสารจากโรงงานที่ต้องมี และข้อความบนฉลากที่ห้ามใช้ ออกไปพร้อมรายการเอกสารและข้อความฉลากที่ตรวจแล้ว',
        en: {
          name: 'Prepare Cosmetic Notification and FDA Registration',
          description:
            'Cosmetics and supplements need the right notification or Thai FDA number before you sell. We work out which category your product falls under, who files, the factory documents you need, and the claims your label must not make. You leave with a document list and checked label wording.',
        },
        category: SHOP,
        screeningRequired: true,
        photos: [photo(6167442), photo(8100816)],
        packages: [
          pkg(
            45,
            900,
            'เช็กประเภทสินค้า',
            'ดูว่าสินค้าต้องจดแจ้งแบบไหนและต้องใช้เอกสารอะไร',
            'Check the Category',
            'Find out which registration your product needs and what documents.',
          ),
          pkg(
            90,
            1900,
            'ตรวจฉลากและเอกสาร',
            'ไล่เอกสารครบชุดและตรวจข้อความบนฉลากทีละบรรทัด',
            'Label and Document Review',
            'Go through the full document set and check the label line by line.',
          ),
        ],
      }),
    ],
  },

  // ─── Freelancing ───────────────────────────────────────────────────────
  {
    email: 'biz.thidarat.m@advisory.demo',
    displayName: 'ธิดารัตน์ มีสุข',
    fullName: 'ธิดารัตน์ มีสุข',
    portrait: portrait(8278980),
    headline: 'นักออกแบบกราฟิกฟรีแลนซ์และโค้ชฟรีแลนซ์สายครีเอทีฟ',
    bio: 'รับงานออกแบบโลโก้และบรรจุภัณฑ์แบบฟรีแลนซ์มา 9 ปี มีลูกค้าประจำทั้งร้านค้าและเอเจนซี ช่วยฟรีแลนซ์สายออกแบบในเรื่องที่โรงเรียนไม่ได้สอน ทั้งการคุยบรีฟ การตั้งราคา และการคุมรอบแก้งาน คุยจากงานจริงที่คุณกำลังเจออยู่',
    en: {
      headline: 'Freelance Graphic Designer and Creative Freelance Coach',
      bio: "Has designed logos and packaging as a freelancer for 9 years, with regular clients among shops and agencies. Helps design freelancers with what school didn't teach: taking a brief, pricing, and keeping revisions under control, working from the jobs you have on right now.",
    },
    services: [
      service({
        name: 'ทำใบเสนอราคาฟรีแลนซ์ให้ลูกค้าไม่ต่อราคา',
        description:
          'ลูกค้าต่อราคาเพราะใบเสนอราคาบอกแค่ตัวเลข ปรับใบเสนอราคาของคุณให้มีขอบเขตงาน จำนวนรอบแก้ ไฟล์ที่ส่งมอบ และตัวเลือกราคา 3 ระดับ ให้ลูกค้าเลือกแทนการต่อ ออกไปพร้อมแม่แบบใบเสนอราคาที่ใช้ได้ทุกงาน',
        en: {
          name: "Freelance Quotes Clients Don't Haggle Over",
          description:
            'Clients haggle when a quote shows nothing but a number. We rework yours to set out the scope, number of revisions, files delivered and three price tiers, so the client chooses instead of bargaining. You leave with a quote template for every job.',
        },
        category: FREELANCE,
        trialMinutes: 15,
        photos: [photo(7651555), photo(7688187)],
        packages: [
          pkg(
            30,
            500,
            'ตรวจใบเสนอราคา',
            'ตรวจใบเสนอราคาที่ใช้อยู่และชี้จุดที่ชวนให้ลูกค้าต่อ',
            'Quote Check',
            'Review your current quote and show what invites haggling.',
          ),
          pkg(
            60,
            1000,
            'ทำแม่แบบใหม่',
            'ทำแม่แบบใบเสนอราคา 3 ระดับพร้อมข้อความส่งลูกค้า',
            'New Template',
            'Build a three-tier quote template and the message to send with it.',
          ),
        ],
      }),
      service({
        name: 'คุยบรีฟและคุมรอบแก้งานไม่ให้ลากยาว',
        description:
          'งานที่แก้ไม่จบมักเริ่มจากบรีฟที่ไม่ชัด ฝึกถามบรีฟให้ได้สิ่งที่ลูกค้าต้องการจริง ตั้งกติการอบแก้ตั้งแต่ก่อนเริ่มงาน และรับมือเมื่อลูกค้าขอแก้นอกขอบเขต ออกไปพร้อมแบบฟอร์มรับบรีฟและข้อความตอบลูกค้าเมื่อขอแก้เพิ่ม',
        en: {
          name: 'Take a Clear Brief and Keep Revisions in Check',
          description:
            'Endless revisions usually start with a vague brief. We practise asking the questions that get at what the client really wants, set revision rules before work begins, and handle requests that go beyond scope. You leave with a brief form and replies for extra revision requests.',
        },
        category: FREELANCE,
        photos: [photo(7147737), photo(7147701)],
        packages: [
          pkg(
            45,
            700,
            'ฟอร์มรับบรีฟ',
            'ทำแบบฟอร์มรับบรีฟที่เหมาะกับงานของคุณ',
            'Brief Form',
            'Build a brief form that suits your kind of work.',
          ),
          pkg(
            60,
            1100,
            'บรีฟและรอบแก้',
            'ทำฟอร์มบรีฟ กติการอบแก้ และซ้อมคุยกับลูกค้าที่ขอแก้ไม่จบ',
            'Brief and Revisions',
            'Build the brief form and revision rules, and practise with a never-satisfied client.',
          ),
        ],
      }),
      service({
        name: 'จัดพอร์ตงานออกแบบให้ได้ลูกค้าที่จ่ายดีขึ้น',
        description:
          'พอร์ตที่ใส่ทุกงานที่เคยทำมักดึงลูกค้าแบบเดิมกลับมา เลือกงานที่ตรงกับลูกค้าที่อยากได้ เขียนเล่าโจทย์และผลลัพธ์ของแต่ละงาน และจัดลำดับให้คนดูเข้าใจใน 1 นาที ออกไปพร้อมรายการงานที่ควรใส่และโครงหน้าพอร์ตใหม่',
        en: {
          name: 'Rework Your Design Portfolio for Better-Paying Clients',
          description:
            "A portfolio with everything you've ever done brings back the same kind of client. We choose work that matches the clients you want, write up the brief and the outcome for each piece, and order it so a viewer gets it in a minute. You leave with a shortlist of pieces and a new portfolio outline.",
        },
        category: FREELANCE,
        photos: [photo(12903003), photo(9414330)],
        packages: [
          pkg(
            45,
            800,
            'คัดงานใส่พอร์ต',
            'ดูพอร์ตปัจจุบันและเลือกงานที่ควรเก็บและควรเอาออก',
            'Choose What Stays',
            'Review your portfolio and decide what stays and what goes.',
          ),
          pkg(
            90,
            1600,
            'จัดพอร์ตใหม่',
            'คัดงาน เขียนคำอธิบาย และวางโครงหน้าพอร์ตใหม่ไปด้วยกัน',
            'Portfolio Rebuild',
            'Choose work, write the descriptions and plan the new layout together.',
          ),
        ],
      }),
      service({
        name: 'ตั้งราคางานออกแบบโลโก้และอัตลักษณ์แบรนด์',
        description:
          'งานโลโก้ราคาในตลาดตั้งแต่หลักร้อยถึงหลักแสน หาว่างานของคุณควรอยู่ตรงไหน แยกโลโก้ ชุดอัตลักษณ์ และคู่มือแบรนด์เป็นแพ็กเกจ และคิดราคาจากเวลาที่ใช้จริง ออกไปพร้อมเรตราคาที่อธิบายกับลูกค้าได้อย่างมั่นใจ',
        en: {
          name: 'Price Logo and Brand Identity Work',
          description:
            'Logo design sells for anything from a few hundred baht to six figures. We find where your work belongs, split logo, identity set and brand guide into packages, and price them from the time you really spend. You leave with rates you can explain to clients with confidence.',
        },
        category: FREELANCE,
        photos: [photo(8546649), photo(37663439), photo(6583349)],
        packages: [
          pkg(
            30,
            500,
            'เช็กเรตปัจจุบัน',
            'ดูเรตที่ใช้อยู่เทียบกับเวลาที่ใช้จริง',
            'Check Your Rates',
            'Compare your current rates with the time you actually spend.',
          ),
          pkg(
            60,
            1000,
            'วางแพ็กเกจราคา',
            'แยกงานเป็นแพ็กเกจและตั้งราคาแต่ละระดับ',
            'Build Price Packages',
            'Split your work into packages and price each tier.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.phumiphat.s@advisory.demo',
    displayName: 'ภูมิพัฒน์ ศรีอ่อน',
    fullName: 'ภูมิพัฒน์ ศรีอ่อน',
    portrait: portrait(18165006),
    headline: 'นักพัฒนาเว็บฟรีแลนซ์ที่รับงานลูกค้าต่างประเทศ',
    bio: 'นักพัฒนาเว็บที่รับงานฟรีแลนซ์ให้ลูกค้าในออสเตรเลียและยุโรปมา 7 ปี ทั้งผ่านแพลตฟอร์มหางานต่างประเทศและลูกค้าที่บอกต่อกัน ช่วยนักพัฒนาและนักออกแบบไทยเริ่มรับงานต่างประเทศ ตั้งแต่เขียนโปรไฟล์ ยื่นข้อเสนอ ไปจนถึงรับเงินข้ามประเทศ',
    en: {
      headline: 'Freelance Web Developer Working With Overseas Clients',
      bio: 'Web developer who has freelanced for clients in Australia and Europe for 7 years, through international job platforms and referrals. Helps Thai developers and designers start working with overseas clients, from writing a profile and sending proposals to getting paid across borders.',
    },
    services: [
      service({
        name: 'เริ่มรับงานต่างประเทศผ่านแพลตฟอร์มฟรีแลนซ์',
        description:
          'สมัครแพลตฟอร์มแล้วแต่ยื่นงานไปไม่มีใครตอบ ปรับโปรไฟล์ หัวข้อ และพอร์ตให้ลูกค้าต่างชาติเชื่อใจ เลือกงานที่มีโอกาสได้จริงสำหรับคนที่ยังไม่มีรีวิว และวางเรตเริ่มต้นที่ไม่ต่ำจนเสียตลาด ออกไปพร้อมโปรไฟล์ที่แก้แล้วและเกณฑ์เลือกงาน',
        en: {
          name: 'Start Winning Overseas Work on Freelance Platforms',
          description:
            "Signed up but nobody answers your bids? We rework your profile, headline and portfolio so overseas clients trust you, pick jobs you can realistically win without reviews, and set a starting rate that isn't too low. You leave with an improved profile and rules for choosing jobs.",
        },
        category: FREELANCE,
        trialMinutes: 15,
        photos: [photo(4974907), photo(5474282)],
        packages: [
          pkg(
            45,
            800,
            'ตรวจโปรไฟล์',
            'ตรวจโปรไฟล์และพอร์ตบนแพลตฟอร์มพร้อมจุดที่ต้องแก้',
            'Profile Review',
            'Review your platform profile and portfolio, with fixes.',
          ),
          pkg(
            90,
            1700,
            'ปรับโปรไฟล์ด้วยกัน',
            'เขียนโปรไฟล์ใหม่และเลือกงานแรกที่จะยื่นไปพร้อมกัน',
            'Rewrite It Together',
            'Rewrite your profile and choose the first jobs to bid on together.',
          ),
        ],
      }),
      service({
        name: 'เขียนข้อเสนองานภาษาอังกฤษให้ลูกค้าตอบกลับ',
        description:
          'ข้อเสนอที่ขึ้นต้นด้วยการแนะนำตัวยาวๆ มักไม่ถูกอ่าน ฝึกเขียนข้อเสนอที่เปิดด้วยปัญหาของลูกค้า เสนอวิธีทำ และปิดด้วยคำถามที่ชวนคุยต่อ ออกไปพร้อมแม่แบบข้อเสนอ 3 แบบสำหรับงานที่คุณรับบ่อย',
        en: {
          name: 'Write English Proposals Clients Reply To',
          description:
            "Proposals that open with a long self-introduction rarely get read. We practise writing ones that open with the client's problem, suggest how you'd tackle it, and close with a question that invites a reply. You leave with three proposal templates for the jobs you take most.",
        },
        category: FREELANCE,
        photos: [photo(12899188), photo(5952738)],
        packages: [
          pkg(
            30,
            500,
            'แก้ข้อเสนอหนึ่งฉบับ',
            'แก้ข้อเสนอที่คุณกำลังจะส่งให้พร้อมยื่น',
            'Fix One Proposal',
            'Fix a proposal you are about to send.',
          ),
          pkg(
            60,
            1000,
            'แม่แบบข้อเสนอ',
            'เขียนแม่แบบข้อเสนอ 3 แบบสำหรับงานประเภทที่รับบ่อย',
            'Proposal Templates',
            'Write three proposal templates for the work you take most.',
          ),
        ],
      }),
      service({
        name: 'ตั้งเรตเป็นดอลลาร์และรับเงินจากลูกค้าต่างประเทศ',
        description:
          'ตั้งเรตงานเป็นดอลลาร์อย่างไรให้แข่งได้และไม่ขายถูกเกินไป เทียบช่องทางรับเงินจากต่างประเทศทั้งค่าธรรมเนียมและอัตราแลกเปลี่ยน และเก็บหลักฐานรายได้ไว้ยื่นภาษี ออกไปพร้อมเรตรายชั่วโมงและช่องทางรับเงินที่เหมาะกับคุณ',
        en: {
          name: 'Set Dollar Rates and Get Paid by Overseas Clients',
          description:
            'How to set a dollar rate that competes without underselling, compare ways to receive money from abroad by fees and exchange rate, and keep records of income for tax. You leave with an hourly rate and a payment route that suits you.',
        },
        category: FREELANCE,
        photos: [photo(6694543), photo(34639577)],
        packages: [
          pkg(
            30,
            500,
            'เทียบช่องทางรับเงิน',
            'เทียบค่าธรรมเนียมและอัตราแลกเปลี่ยนของช่องทางรับเงินหลัก',
            'Compare Payment Routes',
            'Compare fees and exchange rates on the main payment routes.',
          ),
          pkg(
            60,
            1000,
            'ตั้งเรตและรับเงิน',
            'ตั้งเรตเป็นดอลลาร์และเลือกช่องทางรับเงินพร้อมวิธีเก็บหลักฐาน',
            'Rates and Payments',
            'Set your dollar rate, choose how to get paid and how to keep records.',
          ),
        ],
      }),
      service({
        name: 'คุยงานกับลูกค้าต่างชาติผ่านวิดีโอคอลให้ปิดงานได้',
        description:
          'ได้นัดคุยกับลูกค้าแล้วแต่ตื่นเต้นจนพูดไม่ออก ซ้อมคอลจริงเป็นภาษาอังกฤษ ตั้งแต่ถามความต้องการ เสนอขอบเขต ไปจนถึงคุยเรื่องราคาและกำหนดส่ง ออกไปพร้อมลำดับคำถามสำหรับคอลแรกและประโยคที่ใช้ได้ทันที',
        en: {
          name: 'Close the Deal on Video Calls With Overseas Clients',
          description:
            'Got a call booked but freeze up when it starts? We rehearse a real call in English, from asking what the client needs and proposing a scope to talking price and deadlines. You leave with a question sequence for first calls and phrases you can use right away.',
        },
        category: FREELANCE,
        photos: [photo(5145191), photo(12911769)],
        packages: [
          pkg(
            30,
            600,
            'ซ้อมคอลสั้น',
            'ซ้อมคอลแรกกับลูกค้า 20 นาทีพร้อมฟีดแบ็ก',
            'Short Practice Call',
            'A 20-minute practice first call with feedback.',
          ),
          pkg(
            60,
            1100,
            'ซ้อมเต็มรอบ',
            'ซ้อมตั้งแต่ถามความต้องการจนคุยราคา และสรุปประโยคที่ควรใช้',
            'Full Practice',
            'Rehearse from discovery to pricing, and note the phrases to use.',
          ),
        ],
      }),
      service({
        name: 'แบ่งงวดงานและเงื่อนไขส่งมอบงานพัฒนาเว็บ',
        description:
          'งานเว็บที่จ่ายก้อนเดียวตอนจบมักจบที่ลูกค้าเงียบ แบ่งงานเป็นงวดตามสิ่งที่ส่งมอบได้จริง ตั้งเงื่อนไขตรวจรับ และระบุว่าอะไรนับเป็นงานเพิ่ม ออกไปพร้อมตารางงวดงานและข้อความเงื่อนไขที่ใส่ในสัญญาหรือใบเสนอราคาได้',
        en: {
          name: 'Milestones and Delivery Terms for Web Projects',
          description:
            'Web jobs paid in one lump at the end tend to end with a silent client. We split the work into milestones tied to real deliverables, set acceptance terms, and define what counts as extra work. You leave with a milestone table and wording to drop into your contract or quote.',
        },
        category: FREELANCE,
        photos: [photo(16129703), photo(4974914)],
        packages: [
          pkg(
            45,
            800,
            'แบ่งงวดงาน',
            'แบ่งงานโปรเจกต์ปัจจุบันเป็นงวดพร้อมสิ่งที่ส่งมอบ',
            'Split Into Milestones',
            'Split your current project into milestones with deliverables.',
          ),
          pkg(
            90,
            1600,
            'งวดพร้อมเงื่อนไข',
            'แบ่งงวด ตั้งเงื่อนไขตรวจรับ และเขียนข้อความสำหรับสัญญา',
            'Milestones and Terms',
            'Set milestones and acceptance terms, and write the contract wording.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.kamonchanok.r@advisory.demo',
    displayName: 'กมลชนก เรืองศรี',
    fullName: 'กมลชนก เรืองศรี',
    portrait: portrait(31497519),
    headline: 'นักแปลและนักเขียนอิสระ',
    bio: 'นักแปลอังกฤษ–ไทยอิสระมา 10 ปี แปลทั้งเอกสารธุรกิจ คู่มือสินค้า และซับไตเติลให้สำนักแปลในไทยและเอเจนซีต่างประเทศ ช่วยคนที่อยากรับงานแปลหรืองานเขียนเป็นรายได้หลัก ตั้งแต่หางานแรกไปจนถึงจัดเวลาให้รับลูกค้าหลายรายพร้อมกันได้',
    en: {
      headline: 'Freelance Translator and Writer',
      bio: 'Freelance English–Thai translator for 10 years, working on business documents, product manuals and subtitles for Thai and overseas agencies. Helps people make translation or writing their main income, from finding the first job to managing time across several clients at once.',
    },
    services: [
      service({
        name: 'เริ่มรับงานแปลกับสำนักแปลต่างประเทศ',
        description:
          'สำนักแปลต่างประเทศมีงานเยอะแต่คัดคนเข้มงวด ไล่วิธีหาสำนักแปลที่รับคู่ภาษาอังกฤษ–ไทย เตรียมประวัติงานแปล ทำแบบทดสอบให้ผ่าน และเลือกโปรแกรมช่วยแปลที่ลูกค้ามักขอ ออกไปพร้อมรายชื่อที่ควรสมัครและประวัติงานแปลที่แก้แล้ว',
        en: {
          name: 'Start Translating for Overseas Agencies',
          description:
            'Overseas agencies have plenty of work but screen hard. We cover finding agencies that need English–Thai, preparing a translator CV, passing their tests, and the CAT tools clients usually ask for. You leave with a list of places to apply and a revised CV.',
        },
        category: FREELANCE,
        trialMinutes: 15,
        photos: [photo(5238140), photo(5238126)],
        packages: [
          pkg(
            45,
            800,
            'วางแผนสมัครงาน',
            'เลือกสำนักแปลที่ควรสมัครและสิ่งที่ต้องเตรียม',
            'Application Plan',
            'Choose agencies to apply to and what to prepare.',
          ),
          pkg(
            90,
            1600,
            'แก้ประวัติและซ้อมแบบทดสอบ',
            'แก้ประวัติงานแปลและลองทำแบบทดสอบพร้อมฟีดแบ็ก',
            'CV and Test Practice',
            'Revise your CV and try a sample test with feedback.',
          ),
        ],
      }),
      service({
        name: 'คิดเรตงานแปลต่อคำและต่อหน้าให้ไม่ขาดทุน',
        description:
          'รับงานแปลแล้วนั่งทำทั้งคืนแต่ได้เงินไม่คุ้ม คำนวณความเร็วแปลจริงของคุณ แปลงเป็นเรตต่อคำ ต่อหน้า และต่อนาทีซับไตเติล พร้อมเงื่อนไขงานด่วนและงานเทคนิค ออกไปพร้อมตารางเรตที่ส่งให้ลูกค้าได้',
        en: {
          name: 'Set Per-Word and Per-Page Translation Rates That Pay',
          description:
            "Translating all night for money that doesn't add up? We measure your real translation speed and turn it into rates per word, per page and per subtitle minute, with surcharges for rush and technical work. You leave with a rate card to send to clients.",
        },
        category: FREELANCE,
        photos: [photo(7034453), photo(3059747)],
        packages: [
          pkg(
            30,
            500,
            'ตั้งเรตพื้นฐาน',
            'คำนวณเรตต่อคำจากความเร็วแปลจริง',
            'Base Rate',
            'Work out a per-word rate from your actual speed.',
          ),
          pkg(
            60,
            900,
            'ตารางเรตครบ',
            'ทำตารางเรตทุกประเภทงานพร้อมเงื่อนไขงานด่วน',
            'Full Rate Card',
            'Build a rate card for every job type, with rush terms.',
          ),
        ],
      }),
      service({
        name: 'จัดตารางงานฟรีแลนซ์ให้รับลูกค้า 5 รายพร้อมกันได้',
        description:
          'รับงานหลายเจ้าแล้วส่งช้า ลืมกำหนดส่ง หรือทำงานทุกวันไม่มีวันหยุด วางระบบรับงาน ประเมินเวลา และกันเวลาว่างให้ตัวเอง ด้วยเครื่องมือที่ใช้ฟรี ออกไปพร้อมตารางงานรายสัปดาห์และกติการับงานใหม่',
        en: {
          name: 'Plan Your Week to Handle Five Clients at Once',
          description:
            'Juggling several clients, missing deadlines, or working every day without a break? We set up how you take on work, estimate time and protect time off, using free tools. You leave with a weekly schedule and rules for accepting new jobs.',
        },
        category: FREELANCE,
        photos: [photo(4240587), photo(4240571)],
        packages: [
          pkg(
            45,
            700,
            'วางตารางสัปดาห์',
            'จัดงานที่มีอยู่ลงตารางและหาจุดที่ล้น',
            'Weekly Schedule',
            'Put your current jobs on a schedule and find the overload.',
          ),
          pkg(
            90,
            1400,
            'วางระบบรับงาน',
            'วางระบบรับงาน ประเมินเวลา และเครื่องมือที่ใช้ติดตามงาน',
            'Work Intake System',
            'Set up how you take jobs, estimate time and track work.',
          ),
        ],
      }),
      service({
        name: 'รับงานเขียนคอนเทนต์ให้แบรนด์แบบรายเดือน',
        description:
          'งานเขียนเป็นชิ้นทำให้รายได้ขึ้นลง เปลี่ยนเป็นสัญญารายเดือนด้วยการเสนอแพ็กเกจคอนเทนต์ที่ตอบโจทย์แบรนด์ กำหนดจำนวนชิ้น รอบแก้ และรายงานผล ออกไปพร้อมข้อเสนอแพ็กเกจรายเดือนที่ส่งลูกค้าได้ทันที',
        en: {
          name: 'Turn Content Writing Into a Monthly Retainer',
          description:
            "Writing by the piece means income that swings up and down. We turn it into a monthly retainer by offering a content package that meets the brand's goals, with a set number of pieces, revisions and reporting. You leave with a retainer proposal ready to send.",
        },
        category: FREELANCE,
        photos: [photo(1766604), photo(6893832)],
        packages: [
          pkg(
            45,
            800,
            'ออกแบบแพ็กเกจ',
            'ออกแบบแพ็กเกจรายเดือนและราคาให้เหมาะกับลูกค้าเป้าหมาย',
            'Design the Package',
            'Design a monthly package and price for your target clients.',
          ),
          pkg(
            90,
            1500,
            'แพ็กเกจพร้อมข้อเสนอ',
            'ออกแบบแพ็กเกจและเขียนข้อเสนอสำหรับลูกค้ารายแรก',
            'Package and Proposal',
            'Design the package and write the proposal for your first client.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.anan.t@advisory.demo',
    displayName: 'อนันต์ ทองดี',
    fullName: 'อนันต์ ทองดี',
    portrait: portrait(17431209),
    headline: 'ช่างภาพงานแต่งงานและอีเวนต์อิสระ',
    bio: 'ช่างภาพอิสระที่ถ่ายงานแต่งงาน งานบวช และงานอีเวนต์บริษัทมา 16 ปี ปีละกว่า 60 งาน ช่วยช่างภาพที่เพิ่งเริ่มรับงานตั้งราคาแพ็กเกจ เก็บมัดจำ และทำข้อตกลงกับลูกค้าให้ไม่เจ็บตัว รวมถึงเลือกอุปกรณ์ให้คุ้มก่อนลงทุนก้อนใหญ่',
    en: {
      headline: 'Freelance Wedding and Event Photographer',
      bio: 'Independent photographer who has shot weddings, ordination ceremonies and corporate events for 16 years, more than 60 jobs a year. Helps new photographers price their packages, take deposits and agree terms with clients without getting burned, and choose gear wisely before a big spend.',
    },
    services: [
      service({
        name: 'ตั้งราคาแพ็กเกจถ่ายงานแต่งงานให้คุ้มเวลาที่ใช้จริง',
        description:
          'งานแต่งหนึ่งงานไม่ได้จบแค่วันถ่าย รวมเวลาคุยลูกค้า เดินทาง คัดและแต่งภาพ เข้าไปในต้นทุน แล้วจัดแพ็กเกจครึ่งวัน เต็มวัน และพรีเวดดิ้งให้ลูกค้าเลือกง่าย ออกไปพร้อมตารางแพ็กเกจและราคาที่ใช้ได้ทันที',
        en: {
          name: 'Price Wedding Photography Packages for the Hours You Really Put In',
          description:
            "A wedding doesn't end when the shoot does. We add client meetings, travel, culling and editing into your costs, then build half-day, full-day and pre-wedding packages that are easy to choose from. You leave with a package and price table ready to use.",
        },
        category: FREELANCE,
        trialMinutes: 15,
        photos: [photo(17057198), photo(13470038), photo(9252721)],
        packages: [
          pkg(
            30,
            600,
            'เช็กราคาปัจจุบัน',
            'คำนวณว่าราคาที่ใช้อยู่ได้ค่าแรงต่อชั่วโมงเท่าไร',
            'Check Your Prices',
            'Work out the hourly pay your current prices really give you.',
          ),
          pkg(
            60,
            1200,
            'จัดแพ็กเกจใหม่',
            'จัดแพ็กเกจงานแต่งและตั้งราคาใหม่ทั้งชุด',
            'New Packages',
            'Rebuild your wedding packages and prices.',
          ),
        ],
      }),
      service({
        name: 'ทำข้อตกลงและเงื่อนไขมัดจำงานถ่ายภาพ',
        description:
          'ลูกค้าเลื่อนวัน ยกเลิกงาน หรือขอไฟล์ดิบเพิ่มหลังถ่ายเสร็จ เขียนข้อตกลงงานถ่ายภาพที่ครอบคลุมมัดจำ การเลื่อนและยกเลิก กำหนดส่งภาพ และสิทธิ์ใช้ภาพ ออกไปพร้อมแม่แบบข้อตกลงที่ส่งให้ลูกค้าเซ็นได้',
        en: {
          name: 'Booking Terms and Deposits for Photography Jobs',
          description:
            'Clients postpone, cancel, or ask for the raw files after the shoot. We write booking terms that cover the deposit, postponement and cancellation, delivery dates and image rights. You leave with a terms template clients can sign.',
        },
        category: FREELANCE,
        photos: [photo(3637863), photo(3673469)],
        packages: [
          pkg(
            45,
            800,
            'เงื่อนไขมัดจำ',
            'วางเงื่อนไขมัดจำ เลื่อน และยกเลิกงาน',
            'Deposit Terms',
            'Set deposit, postponement and cancellation terms.',
          ),
          pkg(
            90,
            1600,
            'ข้อตกลงฉบับเต็ม',
            'เขียนข้อตกลงครบทุกข้อพร้อมสิทธิ์การใช้ภาพ',
            'Full Agreement',
            'Write the complete agreement, including image rights.',
          ),
        ],
      }),
      service({
        name: 'เลือกอุปกรณ์ถ่ายภาพให้คุ้มก่อนรับงานเต็มตัว',
        description:
          'ก่อนลงเงินกับกล้องและเลนส์ชุดใหญ่ ดูว่างานที่จะรับต้องใช้อะไรจริง อะไรเช่าได้ และอะไรต้องมีสำรอง ออกไปพร้อมรายการอุปกรณ์เรียงตามลำดับการซื้อ และงบที่ต้องเตรียมในแต่ละช่วง',
        en: {
          name: 'Choose Camera Gear Wisely Before Going Full Time',
          description:
            "Before spending big on cameras and lenses, we look at what the jobs you'll take really need, what you can rent, and what needs a backup. You leave with a gear list in order of purchase and the budget for each stage.",
        },
        category: FREELANCE,
        photos: [photo(12096469), photo(220247), photo(32822409)],
        packages: [
          pkg(
            30,
            500,
            'เช็กชุดที่มี',
            'ดูอุปกรณ์ที่มีอยู่และบอกว่าขาดอะไร',
            'Check Your Kit',
            'Review the gear you have and what is missing.',
          ),
          pkg(
            60,
            1000,
            'วางแผนซื้ออุปกรณ์',
            'วางรายการซื้อและงบตามงานที่จะรับในปีแรก',
            'Gear Buying Plan',
            'Plan purchases and budget around the jobs for your first year.',
          ),
        ],
      }),
      service({
        name: 'หาลูกค้าองค์กรสำหรับงานถ่ายภาพอีเวนต์',
        description:
          'งานองค์กรจ่ายตรงเวลาและมีงานซ้ำทุกปี วางวิธีเข้าหาบริษัทจัดงานและฝ่ายสื่อสารองค์กร จัดพอร์ตงานอีเวนต์ และเขียนข้อเสนอที่ฝ่ายจัดซื้อพิจารณาได้ ออกไปพร้อมรายชื่อกลุ่มลูกค้าที่ควรติดต่อและข้อความแนะนำตัว',
        en: {
          name: 'Win Corporate Clients for Event Photography',
          description:
            'Corporate clients pay on time and book again every year. We plan how to approach event organisers and corporate communications teams, put together an event portfolio, and write proposals procurement can process. You leave with a target client list and an introduction message.',
        },
        category: FREELANCE,
        photos: [photo(8761674), photo(261013)],
        packages: [
          pkg(
            45,
            900,
            'วางกลุ่มลูกค้า',
            'เลือกกลุ่มลูกค้าองค์กรและช่องทางเข้าหา',
            'Pick Target Clients',
            'Choose corporate client groups and how to reach them.',
          ),
          pkg(
            90,
            1800,
            'พอร์ตและข้อเสนอ',
            'จัดพอร์ตงานอีเวนต์และเขียนข้อเสนอสำหรับลูกค้าองค์กร',
            'Portfolio and Proposal',
            'Assemble an event portfolio and write a proposal for corporate clients.',
          ),
        ],
      }),
    ],
  },

  // ─── HR and hiring ─────────────────────────────────────────────────────
  {
    email: 'biz.sudarat.w@advisory.demo',
    displayName: 'สุดารัตน์ วิเศษศักดิ์',
    fullName: 'สุดารัตน์ วิเศษศักดิ์',
    portrait: portrait(8278999),
    headline: 'ที่ปรึกษาระบบบุคคลสำหรับธุรกิจ 10–100 คน',
    bio: 'อดีตผู้จัดการฝ่ายบุคคลบริษัทค้าปลีกที่มีพนักงานกว่า 800 คน ทำงานสายบุคคลมา 22 ปี ปัจจุบันช่วยเจ้าของกิจการขนาดเล็กและกลางวางโครงสร้างเงินเดือน ข้อบังคับการทำงาน และระบบประเมินผลที่ใช้ได้จริง ไม่ซับซ้อนเกินขนาดบริษัท',
    en: {
      headline: 'HR Systems Advisor for Businesses of 10 to 100 People',
      bio: 'Former HR manager at a retail company with more than 800 staff, with 22 years in HR. Now helps small and mid-sized business owners set up salary structures, work rules and performance reviews that work in practice and are no more complicated than the company needs.',
    },
    services: [
      service({
        name: 'วางโครงสร้างเงินเดือนบริษัท 20 คน',
        description:
          'เงินเดือนที่ตั้งตามการต่อรองของแต่ละคนทำให้ทีมเริ่มเทียบกันเอง จัดกลุ่มตำแหน่งตามความรับผิดชอบ วางกระบอกเงินเดือนแต่ละระดับโดยเทียบกับตลาด และวางเกณฑ์ขึ้นเงินเดือนประจำปี ออกไปพร้อมตารางโครงสร้างเงินเดือนที่ใช้ได้กับคนปัจจุบันและคนที่จะรับเพิ่ม',
        en: {
          name: 'Build a Salary Structure for a 20-Person Company',
          description:
            'Salaries set by whoever negotiated hardest leave the team comparing notes. We group roles by responsibility, set a salary band for each level against the market, and agree the annual raise criteria. You leave with a salary table that works for current staff and future hires.',
        },
        category: HR,
        screeningRequired: true,
        photos: [photo(6963030)],
        packages: [
          pkg(
            60,
            1800,
            'จัดกลุ่มตำแหน่ง',
            'จัดกลุ่มตำแหน่งงานและเทียบเงินเดือนปัจจุบันกับตลาด',
            'Group the Roles',
            'Group your roles and compare current pay with the market.',
          ),
          pkg(
            120,
            4200,
            'โครงสร้างเงินเดือนครบ',
            'วางกระบอกเงินเดือนทุกระดับและเกณฑ์ขึ้นเงินเดือนประจำปี',
            'Full Salary Structure',
            'Set bands for every level and the annual raise criteria.',
          ),
          pkg(
            180,
            6500,
            'โครงสร้างพร้อมแผนปรับ',
            'วางโครงสร้าง คำนวณงบที่ต้องใช้ปรับ และวางวิธีแจ้งพนักงาน',
            'Structure and Rollout',
            'Build the structure, cost the adjustments, and plan how to tell staff.',
          ),
        ],
      }),
      service({
        name: 'เขียนข้อบังคับการทำงานและคู่มือพนักงาน',
        description:
          'นายจ้างที่มีลูกจ้างตั้งแต่ 10 คนต้องมีข้อบังคับเกี่ยวกับการทำงานเป็นภาษาไทย ไล่หัวข้อที่กฎหมายกำหนด เช่น เวลาทำงาน วันหยุด วันลา และวินัย แล้วเติมระเบียบที่ร้านหรือบริษัทใช้จริง ออกไปพร้อมโครงข้อบังคับและคู่มือพนักงานที่เขียนต่อให้จบได้',
        en: {
          name: 'Write Your Work Rules and Employee Handbook',
          description:
            'Employers with ten or more staff must have written work rules in Thai. We go through the topics the law requires, such as working hours, holidays, leave and discipline, then add the rules your business actually uses. You leave with an outline of the work rules and handbook ready to complete.',
        },
        category: HR,
        screeningRequired: true,
        photos: [photo(6169648), photo(6170191)],
        packages: [
          pkg(
            60,
            1500,
            'โครงข้อบังคับ',
            'วางหัวข้อที่กฎหมายกำหนดและที่ธุรกิจคุณต้องมี',
            'Rules Outline',
            'Outline the topics the law requires and those your business needs.',
          ),
          pkg(
            120,
            3500,
            'ร่างฉบับใช้งาน',
            'ร่างข้อบังคับและคู่มือพนักงานฉบับแรกไปด้วยกัน',
            'Working Draft',
            'Draft the first version of the work rules and handbook together.',
          ),
        ],
      }),
      service({
        name: 'ออกแบบการประเมินผลงานประจำปีที่ทีมยอมรับ',
        description:
          'ประเมินผลแบบให้คะแนนตามความรู้สึกทำให้คนเก่งลาออก วางเกณฑ์ประเมินที่วัดได้สำหรับแต่ละกลุ่มงาน ออกแบบแบบฟอร์มที่หัวหน้ากรอกได้ไม่เกิน 20 นาที และเชื่อมผลประเมินกับการขึ้นเงินเดือนและโบนัส ออกไปพร้อมแบบประเมินและปฏิทินรอบประเมินของปีหน้า',
        en: {
          name: 'Design an Annual Performance Review Your Team Accepts',
          description:
            "Reviews scored on gut feeling drive good people away. We set measurable criteria for each job group, design a form a manager can fill in within 20 minutes, and link the results to raises and bonuses. You leave with a review form and next year's review calendar.",
        },
        category: HR,
        photos: [photo(4344878), photo(8518623)],
        packages: [
          pkg(
            60,
            1600,
            'วางเกณฑ์ประเมิน',
            'วางเกณฑ์ประเมินที่วัดได้สำหรับกลุ่มงานหลัก',
            'Set the Criteria',
            'Set measurable criteria for your main job groups.',
          ),
          pkg(
            120,
            3600,
            'ระบบประเมินครบ',
            'วางเกณฑ์ แบบฟอร์ม และวิธีเชื่อมกับเงินเดือนและโบนัส',
            'Full Review System',
            'Criteria, forms, and the link to pay and bonus.',
          ),
        ],
      }),
      service({
        name: 'จัดสวัสดิการให้เหมาะกับงบและรักษาคนไว้ได้',
        description:
          'สวัสดิการที่ให้ไปอาจไม่ใช่สิ่งที่พนักงานให้ค่า ดูสวัสดิการที่มีอยู่และค่าใช้จ่ายต่อหัว เทียบกับสิ่งที่คนในธุรกิจเดียวกันได้ แล้วเลือกจัดใหม่ภายใต้งบเดิม ออกไปพร้อมชุดสวัสดิการที่ประกาศใช้ได้และวิธีสื่อสารกับทีม',
        en: {
          name: 'Benefits That Fit Your Budget and Keep People',
          description:
            'The benefits you offer may not be what your staff value. We review current benefits and their cost per head, compare them with what others in your industry get, then rebuild the package within the same budget. You leave with a benefits package to announce and a way to explain it to the team.',
        },
        category: HR,
        trialMinutes: 15,
        photos: [photo(8102212), photo(8102204)],
        packages: [
          pkg(
            45,
            900,
            'ตรวจสวัสดิการเดิม',
            'ดูสวัสดิการที่มีและค่าใช้จ่ายต่อหัว',
            'Review Current Benefits',
            'Review what you offer and what it costs per head.',
          ),
          pkg(
            90,
            2000,
            'จัดชุดสวัสดิการใหม่',
            'จัดสวัสดิการใหม่ภายใต้งบเดิมพร้อมแผนสื่อสาร',
            'Rebuild the Package',
            'Rebuild benefits within the same budget, with a plan to announce it.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.ekkachai.r@advisory.demo',
    displayName: 'เอกชัย รุ่งเรืองกิจ',
    fullName: 'เอกชัย รุ่งเรืองกิจ',
    portrait: portrait(26336876),
    headline: 'ที่ปรึกษาสรรหาและคัดเลือกพนักงาน',
    bio: 'ทำงานสรรหาบุคลากรทั้งในบริษัทจัดหางานและฝ่ายบุคคลของเครือร้านอาหารรวม 10 ปี เคยเปิดรับพนักงานสาขาพร้อมกันกว่า 300 ตำแหน่ง ช่วยธุรกิจที่หาคนไม่ได้ หรือได้คนแล้วอยู่ไม่นาน เลือกช่องทางประกาศ ออกแบบการสัมภาษณ์ และวางขั้นตอนรับคนเข้าทำงาน',
    en: {
      headline: 'Recruitment and Selection Advisor',
      bio: "Has worked in recruitment for 10 years, at a recruitment agency and in a restaurant group's HR team, once hiring for more than 300 branch roles at once. Helps businesses that can't find people, or can't keep them, choose where to advertise, design interviews and set up how new hires join.",
    },
    services: [
      service({
        name: 'หาพนักงานหน้าร้านให้ได้ภายในเดือนเดียว',
        description:
          'ประกาศรับสมัครไปหลายที่แต่ไม่มีคนมา เขียนประกาศใหม่ให้ตรงกับสิ่งที่คนหางานหน้าร้านสนใจ เลือกช่องทางที่ได้ผลในพื้นที่ของคุณ และวางขั้นตอนนัดสัมภาษณ์ให้จบใน 3 วัน ออกไปพร้อมประกาศรับสมัครและแผนหาคน 4 สัปดาห์',
        en: {
          name: 'Hire Shop-Floor Staff Within a Month',
          description:
            'Advertised everywhere and nobody turns up? We rewrite your job ad around what shop-floor job seekers care about, choose the channels that work in your area, and set up interviews that wrap up in three days. You leave with a job ad and a four-week hiring plan.',
        },
        category: HR,
        trialMinutes: 15,
        photos: [photo(3769740), photo(25809274)],
        packages: [
          pkg(
            30,
            600,
            'แก้ประกาศรับสมัคร',
            'เขียนประกาศรับสมัครใหม่หนึ่งตำแหน่ง',
            'Fix the Job Ad',
            'Rewrite the job ad for one role.',
          ),
          pkg(
            60,
            1300,
            'แผนหาคน 4 สัปดาห์',
            'เขียนประกาศ เลือกช่องทาง และวางขั้นตอนนัดสัมภาษณ์',
            'Four-Week Hiring Plan',
            'Write the ad, choose channels and set up the interview process.',
          ),
        ],
      }),
      service({
        name: 'ตั้งคำถามสัมภาษณ์เชิงพฤติกรรมให้คัดคนตรงงาน',
        description:
          'คำถามแบบ "จุดแข็งของคุณคืออะไร" ไม่ช่วยให้รู้ว่าใครทำงานได้จริง ตั้งคำถามที่ให้ผู้สมัครเล่าเหตุการณ์ที่เคยเจอ วางเกณฑ์ให้คะแนนคำตอบ และซ้อมสัมภาษณ์ไปด้วยกัน ออกไปพร้อมชุดคำถามและแบบให้คะแนนสำหรับตำแหน่งที่กำลังเปิด',
        en: {
          name: 'Behavioural Interview Questions That Find the Right Fit',
          description:
            'Questions like "what are your strengths?" won\'t tell you who can do the job. We write questions that ask candidates to describe real situations, set a scoring guide for the answers, and practise interviewing together. You leave with a question set and scoring sheet for the role you are hiring.',
        },
        category: HR,
        photos: [photo(7644155), photo(5673502)],
        packages: [
          pkg(
            45,
            900,
            'ชุดคำถามหนึ่งตำแหน่ง',
            'ตั้งคำถามและเกณฑ์ให้คะแนนสำหรับตำแหน่งเดียว',
            'One Role',
            'Questions and a scoring guide for one role.',
          ),
          pkg(
            90,
            1800,
            'คำถามพร้อมซ้อมสัมภาษณ์',
            'ตั้งคำถามและซ้อมสัมภาษณ์กับผู้สมัครสมมติพร้อมฟีดแบ็ก',
            'Questions and Practice',
            'Write the questions and practise on a mock candidate, with feedback.',
          ),
        ],
      }),
      service({
        name: 'วางขั้นตอนต้อนรับพนักงานใหม่ใน 30 วันแรก',
        description:
          'พนักงานใหม่ลาออกในเดือนแรกมักเพราะไม่มีใครดูแล วางแผนวันแรก สัปดาห์แรก และเดือนแรก ตั้งพี่เลี้ยง และกำหนดจุดคุยติดตามผล ออกไปพร้อมแผนต้อนรับพนักงานใหม่และรายการตรวจที่หัวหน้าใช้ได้',
        en: {
          name: 'Plan the First 30 Days for New Hires',
          description:
            'New staff who quit in the first month usually did so because nobody looked after them. We plan the first day, first week and first month, assign a buddy, and set check-in points. You leave with an onboarding plan and a checklist for managers.',
        },
        category: HR,
        photos: [photo(5668842), photo(5668839)],
        packages: [
          pkg(
            45,
            900,
            'แผนวันแรกและสัปดาห์แรก',
            'วางแผนต้อนรับวันแรกและสัปดาห์แรก',
            'First Day and Week',
            'Plan the first day and the first week.',
          ),
          pkg(
            90,
            1800,
            'แผน 30 วันครบ',
            'วางแผน 30 วัน ระบบพี่เลี้ยง และจุดคุยติดตามผล',
            'Full 30-Day Plan',
            'A 30-day plan with a buddy system and check-ins.',
          ),
        ],
      }),
      service({
        name: 'ลดการลาออกของพนักงานในช่วงทดลองงาน',
        description:
          'รับคนมาแล้วออกก่อนผ่านทดลองงานซ้ำๆ ไล่ดูข้อมูลคนที่ออกในปีที่ผ่านมา หาว่าปัญหาอยู่ที่การคัดเลือก การบอกงานไม่ตรง หรือหัวหน้างาน แล้ววางวิธีแก้ทีละจุด ออกไปพร้อมสาเหตุหลักและแผนแก้ไข 3 เดือน',
        en: {
          name: 'Stop New Hires Leaving During Probation',
          description:
            "People keep leaving before passing probation? We look at last year's leavers to find whether the problem is selection, a job that wasn't what they were told, or the supervisor, then fix each point in turn. You leave with the main causes and a three-month plan.",
        },
        category: HR,
        screeningRequired: true,
        photos: [photo(7644004), photo(7640819)],
        packages: [
          pkg(
            60,
            1500,
            'หาสาเหตุ',
            'วิเคราะห์ข้อมูลคนลาออกและหาสาเหตุหลัก',
            'Find the Cause',
            'Analyse leaver data and find the main cause.',
          ),
          pkg(
            120,
            3200,
            'สาเหตุพร้อมแผนแก้',
            'หาสาเหตุและวางแผนแก้ไข 3 เดือนพร้อมตัวชี้วัด',
            'Cause and Fix',
            'Find the cause and plan three months of fixes with measures.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.nanthana.s@advisory.demo',
    displayName: 'นันทนา สายบุญ',
    fullName: 'นันทนา สายบุญ',
    portrait: portrait(8101613),
    headline: 'ที่ปรึกษาเงินเดือน ประกันสังคม และงานธุรการบุคคล',
    bio: 'ดูแลงานเงินเดือนและประกันสังคมให้บริษัทลูกค้ากว่า 30 แห่งมา 7 ปี ในฐานะผู้ให้บริการงานบุคคลภายนอก รู้ว่ากฎหมายกำหนดเรื่องค่าล่วงเวลา วันหยุด และเงินสมทบไว้อย่างไร ช่วยร้านและบริษัทเล็กทำให้ถูกตั้งแต่เดือนแรก ก่อนเจอค่าปรับย้อนหลัง',
    en: {
      headline: 'Payroll, Social Security and HR Admin Advisor',
      bio: 'Has run payroll and social security for more than 30 client companies as an outsourced HR provider for 7 years. Knows what the law says about overtime, holidays and contributions, and helps shops and small companies get it right from the first month, before back penalties arrive.',
    },
    services: [
      service({
        name: 'ขึ้นทะเบียนนายจ้างและส่งเงินสมทบประกันสังคมให้ถูกต้อง',
        description:
          'เพิ่งรับลูกจ้างคนแรกหรือเคยส่งประกันสังคมผิดๆ ถูกๆ ไล่ขั้นตอนขึ้นทะเบียนนายจ้าง แจ้งเข้าและแจ้งออกลูกจ้าง คำนวณเงินสมทบ และกำหนดส่งแต่ละเดือนผ่านระบบออนไลน์ ออกไปพร้อมปฏิทินงานประกันสังคมทั้งปี',
        en: {
          name: 'Register as an Employer and File Social Security Correctly',
          description:
            'Just hired your first employee, or been filing social security hit and miss? We go through employer registration, reporting staff joining and leaving, calculating contributions, and the monthly online filing deadline. You leave with a full-year social security calendar.',
        },
        category: HR,
        trialMinutes: 15,
        photos: [photo(7821577), photo(7821682)],
        packages: [
          pkg(
            30,
            500,
            'ถามเฉพาะเรื่อง',
            'ตอบคำถามประกันสังคมเรื่องที่คุณติดอยู่',
            'One Question',
            'Answer the one social security question you are stuck on.',
          ),
          pkg(
            60,
            1100,
            'ไล่ครบทุกขั้น',
            'ไล่ขั้นตอนทั้งหมดในระบบจริงพร้อมปฏิทินงานทั้งปี',
            'Every Step',
            'Go through every step in the real system, with a year-round calendar.',
          ),
        ],
      }),
      service({
        name: 'คิดค่าล่วงเวลาและค่าทำงานในวันหยุดให้ถูกกฎหมาย',
        description:
          'ค่าล่วงเวลาและค่าทำงานในวันหยุดคิดผิดบ่อยที่สุดและเป็นเรื่องที่ลูกจ้างร้องเรียนมากที่สุด อธิบายอัตราที่กฎหมายกำหนดสำหรับลูกจ้างรายเดือนและรายวัน แล้วตรวจสูตรที่ร้านใช้อยู่ ออกไปพร้อมสูตรคำนวณที่ถูกต้องและตัวอย่างจากเงินเดือนจริงของร้าน',
        en: {
          name: 'Calculate Overtime and Holiday Pay the Legal Way',
          description:
            'Overtime and holiday pay are the most common payroll mistakes and the most common employee complaints. We explain the legal rates for monthly and daily workers, then check the formula you use now. You leave with a correct formula and worked examples from your own payroll.',
        },
        category: HR,
        photos: [photo(7654163), photo(8428063)],
        packages: [
          pkg(
            30,
            500,
            'ตรวจสูตรเดิม',
            'ตรวจสูตรค่าล่วงเวลาที่ใช้อยู่และชี้จุดผิด',
            'Check Your Formula',
            'Check your overtime formula and flag mistakes.',
          ),
          pkg(
            60,
            1000,
            'ทำสูตรใหม่',
            'ทำสูตรคำนวณใหม่ทุกกรณีพร้อมตัวอย่าง',
            'New Formula',
            'Build a new formula for every case, with examples.',
          ),
        ],
      }),
      service({
        name: 'ตั้งระบบทำเงินเดือนรายเดือนด้วย Excel หรือโปรแกรม',
        description:
          'ทำเงินเดือนด้วยมือทุกเดือนแล้วผิดซ้ำ ตั้งไฟล์หรือเลือกโปรแกรมเงินเดือนให้เหมาะกับจำนวนพนักงาน รวมรายได้ รายการหัก ภาษีหัก ณ ที่จ่าย และประกันสังคมในที่เดียว ออกไปพร้อมระบบที่ใช้ทำเงินเดือนรอบถัดไปได้เลย',
        en: {
          name: 'Set Up Monthly Payroll in Excel or Software',
          description:
            'Doing payroll by hand and making the same mistakes every month? We build a spreadsheet or pick payroll software to suit your headcount, bringing earnings, deductions, withholding tax and social security into one place. You leave with a system ready for your next pay run.',
        },
        category: HR,
        photos: [photo(8296975), photo(8296982)],
        packages: [
          pkg(
            60,
            1300,
            'ไฟล์เงินเดือน Excel',
            'ตั้งไฟล์เงินเดือนพร้อมสูตรหักภาษีและประกันสังคม',
            'Excel Payroll',
            'Build a payroll spreadsheet with tax and social security formulas.',
          ),
          pkg(
            90,
            1900,
            'เลือกและตั้งโปรแกรม',
            'เทียบโปรแกรมเงินเดือน 2–3 ตัวและตั้งค่าตัวที่เลือก',
            'Choose and Set Up Software',
            'Compare two or three payroll tools and set up the one you choose.',
          ),
        ],
      }),
      service({
        name: 'จัดวันลาและวันหยุดประจำปีของพนักงานร้าน',
        description:
          'ร้านที่เปิดทุกวันมักวุ่นเรื่องวันหยุดและวันลา อธิบายสิทธิวันหยุดประจำสัปดาห์ วันหยุดตามประเพณี วันลาป่วย และลาพักร้อนตามกฎหมาย แล้ววางวิธีจัดตารางและบันทึกวันลาให้ไม่ตกหล่น ออกไปพร้อมแบบฟอร์มขอลาและตารางวันหยุดทั้งปี',
        en: {
          name: 'Manage Leave and Public Holidays for Shop Staff',
          description:
            'Shops that open every day often struggle with time off. We explain the legal rights to weekly days off, public holidays, sick leave and annual leave, then set up how to roster and record leave so nothing slips. You leave with a leave request form and a year-long holiday calendar.',
        },
        category: HR,
        photos: [photo(28353121), photo(28353120)],
        packages: [
          pkg(
            30,
            500,
            'สิทธิวันลา',
            'อธิบายสิทธิวันหยุดและวันลาที่พนักงานต้องได้',
            'Leave Rights',
            'Explain the time off your staff are entitled to.',
          ),
          pkg(
            60,
            1000,
            'ระบบวันลาครบ',
            'วางตารางวันหยุดทั้งปีและแบบฟอร์มบันทึกวันลา',
            'Full Leave System',
            'Plan the year of holidays and a leave record form.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.sombat.u@advisory.demo',
    displayName: 'สมบัติ อุดมผล',
    fullName: 'สมบัติ อุดมผล',
    portrait: portrait(7845165),
    headline: 'โค้ชพัฒนาหัวหน้างานและทีม',
    bio: 'อดีตผู้อำนวยการฝ่ายพัฒนาบุคลากรของบริษัทผลิตชิ้นส่วนยานยนต์ ทำงานด้านพัฒนาคนมากว่า 25 ปี และอบรมหัวหน้างานมาแล้วหลายพันคน เน้นคุยจากสถานการณ์จริงในทีมของคุณแทนทฤษฎี และให้การบ้านที่ลองทำได้ตั้งแต่วันรุ่งขึ้น',
    en: {
      headline: 'Supervisor and Team Development Coach',
      bio: 'Former head of learning and development at an auto parts manufacturer, with more than 25 years developing people and thousands of supervisors trained. Works from real situations in your team rather than theory, and gives you something to try the very next day.',
    },
    services: [
      service({
        name: 'เตรียมตัวเป็นหัวหน้างานครั้งแรก',
        description:
          'จากเพื่อนร่วมทีมกลายเป็นหัวหน้าในชั่วข้ามคืน คุยเรื่องการวางตัวกับเพื่อนเก่า การมอบหมายงาน และการพูดเรื่องยากโดยไม่เสียความสัมพันธ์ ออกไปพร้อมแผน 90 วันแรกในตำแหน่งหัวหน้า',
        en: {
          name: 'Get Ready for Your First Supervisor Role',
          description:
            'Went from teammate to boss overnight? We talk about handling former peers, delegating, and having hard conversations without damaging relationships. You leave with a plan for your first 90 days as a supervisor.',
        },
        category: HR,
        trialMinutes: 15,
        photos: [photo(18935245), photo(8345975)],
        packages: [
          pkg(
            60,
            1200,
            'เริ่มต้นเป็นหัวหน้า',
            'คุยเรื่องที่กังวลที่สุดและวางแผน 90 วันแรก',
            'Starting Out',
            'Talk through your biggest worries and plan the first 90 days.',
          ),
          pkg(
            90,
            1800,
            'แผนพร้อมซ้อมสถานการณ์',
            'วางแผน 90 วันและซ้อมสถานการณ์ยากที่น่าจะเจอ',
            'Plan and Practice',
            'Plan the 90 days and rehearse the tough situations you expect.',
          ),
        ],
      }),
      service({
        name: 'คุยกับพนักงานที่มีปัญหาผลงานหรือพฤติกรรม',
        description:
          'มีลูกทีมที่ผลงานตกหรือมาสายซ้ำแต่ไม่รู้จะเริ่มคุยอย่างไร วางโครงการคุยที่พูดจากข้อเท็จจริง ฟังเหตุผลของอีกฝ่าย และตกลงสิ่งที่ต้องเปลี่ยนพร้อมกำหนดเวลา แล้วซ้อมคุยจริงหนึ่งรอบ ออกไปพร้อมบทพูดและบันทึกการคุยที่ใช้อ้างอิงต่อได้',
        en: {
          name: 'Talk to an Employee About Performance or Behaviour',
          description:
            "Someone in your team is slipping or keeps turning up late, and you don't know how to start? We plan a conversation built on facts, listening to their side, and agreeing what must change and by when, then rehearse it once. You leave with talking points and a meeting record you can refer back to.",
        },
        category: HR,
        photos: [photo(5439141), photo(5439148)],
        packages: [
          pkg(
            45,
            900,
            'วางบทพูด',
            'วางโครงการคุยสำหรับกรณีของคุณ',
            'Plan the Talk',
            'Outline the conversation for your case.',
          ),
          pkg(
            90,
            1700,
            'วางบทและซ้อมคุย',
            'วางโครงการคุยแล้วซ้อมจริงโดยมีคนเล่นเป็นพนักงาน',
            'Plan and Rehearse',
            'Plan the talk, then rehearse it with someone playing the employee.',
          ),
        ],
      }),
      service({
        name: 'ทำประชุมทีมรายสัปดาห์ให้จบภายใน 30 นาที',
        description:
          'ประชุมทุกสัปดาห์แต่ไม่มีอะไรคืบ วางวาระประชุมที่ใช้ซ้ำได้ แยกเรื่องที่ต้องตัดสินใจออกจากเรื่องแจ้งให้ทราบ และวิธีติดตามงานที่ตกลงกันไว้ ออกไปพร้อมวาระประชุมแม่แบบและบันทึกติดตามงาน',
        en: {
          name: 'Weekly Team Meetings That Finish in 30 Minutes',
          description:
            'Meeting every week and nothing moves? We design a reusable agenda, separate decisions from updates, and set up a way to track what was agreed. You leave with an agenda template and an action log.',
        },
        category: HR,
        photos: [photo(8101931), photo(8101928)],
        packages: [
          pkg(
            30,
            500,
            'วาระประชุมแม่แบบ',
            'วางวาระประชุมรายสัปดาห์ที่ใช้ซ้ำได้',
            'Agenda Template',
            'Design a reusable weekly agenda.',
          ),
          pkg(
            60,
            1000,
            'ระบบประชุมครบ',
            'วางวาระ บทบาทในที่ประชุม และวิธีติดตามงาน',
            'Full Meeting System',
            'Agenda, roles in the room, and how to follow up.',
          ),
        ],
      }),
      service({
        name: 'วางแผนส่งต่อตำแหน่งในธุรกิจครอบครัว',
        description:
          'สำหรับเจ้าของกิจการที่อยากให้ลูกหรือพนักงานคนสำคัญรับช่วงต่อ ไล่ดูว่าตำแหน่งไหนพึ่งคนคนเดียว ใครพร้อมรับช่วงงานไหน และต้องพัฒนาอะไรภายในกี่ปี ออกไปพร้อมแผนส่งต่อตำแหน่งสำคัญและแผนพัฒนาผู้สืบทอด',
        en: {
          name: 'Succession Planning for a Family Business',
          description:
            'For owners who want a son or daughter, or a key employee, to take over. We find which roles depend on one person, who is ready to take on what, and what needs developing over how many years. You leave with a succession plan for key roles and a development plan for successors.',
        },
        category: HR,
        screeningRequired: true,
        photos: [photo(5668795), photo(5668856)],
        packages: [
          pkg(
            60,
            1800,
            'ประเมินตำแหน่งสำคัญ',
            'หาตำแหน่งที่เสี่ยงและผู้ที่มีแววรับช่วงต่อ',
            'Assess Key Roles',
            'Find at-risk roles and likely successors.',
          ),
          pkg(
            120,
            4000,
            'แผนส่งต่อครบ',
            'วางแผนส่งต่อและแผนพัฒนาผู้สืบทอดแต่ละคน',
            'Full Succession Plan',
            'A succession plan and a development plan for each successor.',
          ),
        ],
      }),
    ],
  },

  // ─── Law and contracts ─────────────────────────────────────────────────
  {
    email: 'biz.piyanut.w@advisory.demo',
    displayName: 'ปิยนุช วรรณศิลป์',
    fullName: 'ปิยนุช วรรณศิลป์',
    portrait: portrait(6077567),
    headline: 'ทนายความด้านสัญญาธุรกิจ การติดตามหนี้ และเครื่องหมายการค้า',
    bio: 'ทนายความ ใบอนุญาตว่าความ ทำงานด้านสัญญาธุรกิจ คดีแพ่ง และทรัพย์สินทางปัญญามา 12 ปี เคยอยู่สำนักงานกฎหมายต่างประเทศในกรุงเทพฯ ยื่นจดเครื่องหมายการค้าให้ลูกค้ามาแล้วกว่า 600 คำขอ ดูแลสัญญาให้ร้านอาหาร ร้านค้า และผู้รับเหมาขนาดเล็ก แปลภาษากฎหมายเป็นภาษาที่เข้าใจง่าย และบอกตรงๆ ว่าเรื่องไหนควรเจรจา เรื่องไหนควรเดินตามขั้นตอนกฎหมาย',
    en: {
      headline: 'Business Contracts, Debt Recovery, and Trademark Lawyer',
      bio: 'Licensed lawyer who has worked in business contracts, civil cases, and intellectual property for 12 years, previously at an international law firm in Bangkok, filing more than 600 trademark applications. Handles contracts for restaurants, shops and small contractors, turns legal language into plain words, and tells you straight which matters to negotiate and which to take through legal channels.',
    },
    services: [
      service({
        name: 'ร่างสัญญาหุ้นส่วนก่อนเปิดร้าน',
        description:
          'เปิดร้านกับเพื่อนหรือญาติโดยไม่มีสัญญา มักมีปัญหาตอนร้านขายดีหรือตอนขาดทุน คุยเรื่องเงินลงทุน สัดส่วนกำไร หน้าที่ของแต่ละคน การถอนตัว และการตัดสินใจเรื่องใหญ่ แล้วร่างเป็นสัญญาที่ทุกฝ่ายเข้าใจตรงกัน ออกไปพร้อมร่างสัญญาหุ้นส่วนฉบับแรก',
        en: {
          name: 'Draft a Partnership Agreement Before You Open',
          description:
            'Opening a shop with friends or family without a contract tends to go wrong when the shop does well, or badly. We cover the capital each puts in, profit split, responsibilities, leaving the partnership and how big decisions are made, then draft it into an agreement everyone reads the same way. You leave with a first draft.',
        },
        category: LAW,
        screeningRequired: true,
        photos: [photo(8730987), photo(5387261)],
        packages: [
          pkg(
            60,
            2500,
            'วางข้อตกลงหลัก',
            'คุยและสรุปข้อตกลงสำคัญระหว่างหุ้นส่วน',
            'Key Terms',
            'Discuss and summarise the key terms between partners.',
          ),
          pkg(
            120,
            5500,
            'ร่างสัญญาฉบับแรก',
            'สรุปข้อตกลงและร่างสัญญาหุ้นส่วนฉบับแรกให้ทุกฝ่ายอ่าน',
            'First Draft',
            'Agree the terms and produce a first draft for every partner to read.',
          ),
        ],
      }),
      service({
        name: 'ตรวจสัญญาเช่าพื้นที่ร้านในห้างและอาคารพาณิชย์',
        description:
          'สัญญาเช่าพื้นที่ร้านมักมีข้อที่ผู้เช่าเสียเปรียบ เช่น ค่าส่วนกลาง การปรับค่าเช่า เงินประกัน และการคืนพื้นที่ ส่งสัญญามาก่อนนัด แล้วไล่ดูทีละข้อว่าข้อไหนควรขอแก้ ออกไปพร้อมรายการข้อที่ควรต่อรองและถ้อยคำที่เสนอแก้',
        en: {
          name: 'Review a Shop Lease in a Mall or Shophouse',
          description:
            'Retail leases often contain terms that work against the tenant: service charges, rent reviews, deposits and handover conditions. Send the lease ahead, and we go through it clause by clause to decide what to push back on. You leave with a list of points to negotiate and suggested wording.',
        },
        category: LAW,
        screeningRequired: true,
        photos: [photo(11077585), photo(31878042)],
        packages: [
          pkg(
            45,
            1500,
            'ชี้ข้อเสี่ยง',
            'อ่านสัญญาและชี้ข้อที่เสี่ยงที่สุด',
            'Flag the Risks',
            'Read the lease and flag the riskiest clauses.',
          ),
          pkg(
            90,
            3200,
            'ตรวจครบพร้อมถ้อยคำแก้',
            'ตรวจทุกข้อและเขียนถ้อยคำที่เสนอแก้ให้ส่งผู้ให้เช่า',
            'Full Review and Redlines',
            'Review every clause and write the changes to send the landlord.',
          ),
        ],
      }),
      service({
        name: 'ส่งหนังสือทวงถามลูกค้าที่ค้างชำระ',
        description:
          'ลูกค้าค้างจ่ายนานจนตามเองไม่ไหว ดูหลักฐานการซื้อขายและการส่งมอบที่มีอยู่ ประเมินว่าเรื่องนี้ควรเจรจา ส่งหนังสือทวงถาม หรือเตรียมฟ้อง และค่าใช้จ่ายของแต่ละทาง ออกไปพร้อมร่างหนังสือทวงถามและขั้นตอนถัดไปที่ชัดเจน',
        en: {
          name: "Send a Formal Demand to a Customer Who Hasn't Paid",
          description:
            "A customer has owed you so long you can't chase it yourself? We look at the evidence of sale and delivery you have, assess whether to negotiate, send a formal demand, or prepare to sue, and the cost of each route. You leave with a draft demand letter and clear next steps.",
        },
        category: LAW,
        trialMinutes: 15,
        photos: [photo(8693379), photo(37726687)],
        packages: [
          pkg(
            30,
            900,
            'ประเมินเรื่องหนี้',
            'ดูหลักฐานและบอกทางเลือกที่เหมาะสม',
            'Assess the Debt',
            'Look at the evidence and lay out your options.',
          ),
          pkg(
            60,
            2000,
            'ร่างหนังสือทวงถาม',
            'ประเมินเรื่องและร่างหนังสือทวงถามที่ส่งได้ทันที',
            'Draft the Demand',
            'Assess the case and draft a demand letter ready to send.',
          ),
        ],
      }),
      service({
        name: 'ตรวจสัญญาจ้างเหมาตกแต่งร้านก่อนจ่ายมัดจำ',
        description:
          'งานตกแต่งร้านที่ช้ากว่ากำหนดหรือทิ้งงานกลางทางมักมาจากสัญญาที่เขียนหลวมๆ ตรวจขอบเขตงาน งวดจ่ายเงิน ค่าปรับเมื่อส่งงานช้า และการรับประกันผลงาน ก่อนจ่ายมัดจำงวดแรก ออกไปพร้อมข้อที่ต้องเพิ่มในสัญญา',
        en: {
          name: 'Check a Shop Fit-Out Contract Before Paying the Deposit',
          description:
            'Fit-outs that run late or get abandoned halfway usually trace back to a loosely written contract. We check the scope, payment stages, late-delivery penalties and workmanship warranty before you pay the first deposit. You leave with the clauses to add.',
        },
        category: LAW,
        screeningRequired: true,
        photos: [photo(6814539), photo(7054505)],
        packages: [
          pkg(
            45,
            1500,
            'ตรวจข้อสำคัญ',
            'ตรวจงวดเงิน ค่าปรับ และการรับประกันงาน',
            'Check Key Clauses',
            'Check payment stages, penalties and warranty.',
          ),
          pkg(
            90,
            3000,
            'ตรวจครบพร้อมข้อเพิ่ม',
            'ตรวจทั้งสัญญาและเขียนข้อที่ต้องเพิ่มก่อนเซ็น',
            'Full Review With Additions',
            'Review the whole contract and write the clauses to add before signing.',
          ),
        ],
      }),
      service({
        name: 'เตรียมตัวก่อนขึ้นศาลคดีผู้บริโภคหรือคดีมโนสาเร่',
        description:
          'ถูกฟ้องหรือจะฟ้องในคดีเล็กที่ไม่อยากจ้างทนายตลอดคดี อธิบายขั้นตอนในศาล เอกสารและพยานที่ต้องเตรียม และสิ่งที่ควรพูดหรือไม่ควรพูดในวันนัด เป็นการให้คำปรึกษาเพื่อเตรียมตัว ไม่ใช่การรับประกันผลคดี ออกไปพร้อมรายการเตรียมเอกสารสำหรับวันนัดแรก',
        en: {
          name: 'Prepare for a Consumer or Small Claims Hearing',
          description:
            "Suing or being sued in a small case and don't want a lawyer for the whole thing? We explain the court process, the documents and witnesses to prepare, and what to say and not say on the day. This is advice to help you prepare, not a promise about the outcome. You leave with a document checklist for the first hearing.",
        },
        category: LAW,
        photos: [photo(5669619), photo(6077326), photo(5668473)],
        packages: [
          pkg(
            45,
            1500,
            'อธิบายขั้นตอน',
            'อธิบายขั้นตอนคดีและสิ่งที่ต้องเตรียม',
            'Explain the Process',
            'Explain the process and what to prepare.',
          ),
          pkg(
            90,
            3200,
            'เตรียมคดีด้วยกัน',
            'ไล่เอกสารและพยานของคุณ และซ้อมตอบคำถามในวันนัด',
            'Prepare Together',
            'Go through your documents and witnesses, and rehearse for the hearing.',
          ),
        ],
      }),
      service({
        name: 'ตรวจและยื่นจดเครื่องหมายการค้าก่อนเปิดแบรนด์',
        description:
          'ทำโลโก้และสั่งผลิตบรรจุภัณฑ์ไปแล้วค่อยรู้ว่าชื่อซ้ำกับคนอื่นเป็นเรื่องที่เกิดบ่อย ตรวจความเหมือนกับเครื่องหมายที่จดไว้แล้ว เลือกจำพวกสินค้าและบริการให้ครอบคลุม และเตรียมคำขอยื่นต่อกรมทรัพย์สินทางปัญญา ออกไปพร้อมผลการตรวจและรายการจำพวกที่ควรยื่น',
        en: {
          name: 'Search and File Your Trademark Before Launch',
          description:
            "Ordering logos and packaging, then finding out the name clashes with someone else's, happens all the time. We search existing registrations for conflicts, choose the classes of goods and services to cover, and prepare the application to the Department of Intellectual Property. You leave with search results and the classes to file in.",
        },
        category: LAW,
        trialMinutes: 15,
        photos: [photo(6322367), photo(7821566)],
        packages: [
          pkg(
            45,
            1500,
            'ตรวจชื่อแบรนด์',
            'ตรวจความเหมือนกับเครื่องหมายที่จดไว้แล้วและประเมินความเสี่ยง',
            'Name Search',
            'Search for conflicting marks and assess the risk.',
          ),
          pkg(
            90,
            3500,
            'ตรวจและเตรียมยื่น',
            'ตรวจชื่อ เลือกจำพวก และเตรียมคำขอจดทะเบียนให้พร้อมยื่น',
            'Search and Prepare to File',
            'Search, choose classes and prepare the application ready to file.',
          ),
        ],
      }),
      service({
        name: 'รับมือเมื่อถูกลอกแบรนด์หรือรูปสินค้าบนแพลตฟอร์มออนไลน์',
        description:
          'เจอร้านอื่นใช้ชื่อแบรนด์ โลโก้ หรือรูปสินค้าของคุณบนแพลตฟอร์มขายของ ดูว่าสิทธิของคุณมีหลักฐานแค่ไหน แจ้งลบผ่านระบบของแพลตฟอร์มอย่างไร และเมื่อไรควรส่งหนังสือเตือนหรือดำเนินคดี ออกไปพร้อมขั้นตอนที่ทำได้ทันทีและเอกสารที่ต้องรวบรวม',
        en: {
          name: 'Deal With Copycats Using Your Brand or Photos Online',
          description:
            'Found another shop using your brand name, logo or product photos on a marketplace? We look at how well your rights are documented, how to file a takedown through the platform, and when to send a warning letter or take legal action. You leave with steps you can take today and the evidence to gather.',
        },
        category: LAW,
        photos: [photo(7857528), photo(7674983)],
        packages: [
          pkg(
            45,
            1400,
            'ประเมินและแจ้งลบ',
            'ประเมินหลักฐานและวางขั้นตอนแจ้งลบบนแพลตฟอร์ม',
            'Assess and Take Down',
            'Assess your evidence and plan the platform takedown.',
          ),
          pkg(
            90,
            3200,
            'แจ้งลบและร่างหนังสือเตือน',
            'วางขั้นตอนแจ้งลบและร่างหนังสือเตือนผู้ละเมิด',
            'Takedown and Warning Letter',
            'Plan the takedown and draft a warning letter to the infringer.',
          ),
        ],
      }),
      service({
        name: 'ทำสัญญาอนุญาตใช้ภาพ เพลง และงานออกแบบ',
        description:
          'ใช้ภาพจากช่างภาพ เพลงในคลิป หรืองานออกแบบของคนอื่นในงานโฆษณา ต้องรู้ว่าได้สิทธิ์แค่ไหน ร่างหรือตรวจสัญญาอนุญาตให้ระบุขอบเขตการใช้ ระยะเวลา ช่องทาง และค่าตอบแทนให้ชัด ออกไปพร้อมสัญญาอนุญาตที่ใช้กับงานจริงได้',
        en: {
          name: 'Licence Agreements for Photos, Music and Design Work',
          description:
            "Using a photographer's images, music in your videos, or someone else's design in ads means knowing exactly what you're allowed to do. We draft or review the licence to spell out scope, term, channels and fees. You leave with a licence agreement you can use on a real job.",
        },
        category: LAW,
        screeningRequired: true,
        photos: [photo(7147712), photo(7147720)],
        packages: [
          pkg(
            45,
            1500,
            'ตรวจสัญญาอนุญาต',
            'ตรวจสัญญาที่ได้รับมาและชี้ข้อที่ต้องแก้',
            'Review a Licence',
            'Review a licence you received and mark what to change.',
          ),
          pkg(
            90,
            3400,
            'ร่างสัญญาอนุญาต',
            'ร่างสัญญาอนุญาตใช้งานตามงานจริงของคุณ',
            'Draft a Licence',
            'Draft a licence agreement for your actual project.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.kritsada.m@advisory.demo',
    displayName: 'กฤษดา มั่นคง',
    fullName: 'กฤษดา มั่นคง',
    portrait: portrait(749091),
    headline: 'ที่ปรึกษากฎหมายธุรกิจออนไลน์ PDPA และลิขสิทธิ์',
    bio: 'นักกฎหมายที่ทำงานด้านคุ้มครองข้อมูลส่วนบุคคลและกฎหมายดิจิทัลมา 8 ปี เคยเป็นนิติกรประจำบริษัทอีคอมเมิร์ซ ช่วยร้านออนไลน์และสตาร์ตอัปทำเอกสารให้ครบตามกฎหมาย รวมถึงสิทธิ์ในงานออกแบบที่จ้างทำและการรับมือหนังสือแจ้งเตือนเรื่องละเมิด โดยเลือกทำเฉพาะสิ่งที่ธุรกิจขนาดนั้นต้องมีจริง',
    en: {
      headline: 'Online Business Law, PDPA, and Copyright Advisor',
      bio: 'Legal specialist in data protection and digital law for 8 years, formerly in-house counsel at an e-commerce company. Helps online shops and startups get their legal paperwork in order, including rights to commissioned design work and replies to infringement notices, doing only what a business their size really needs.',
    },
    services: [
      service({
        name: 'ตรวจสัญญาจ้างออกแบบโลโก้ให้สิทธิ์เป็นของแบรนด์',
        description:
          'จ้างนักออกแบบทำโลโก้แล้วไม่ได้ระบุเรื่องลิขสิทธิ์ อาจจดเครื่องหมายการค้าไม่ได้หรือมีปัญหาภายหลัง ตรวจสัญญาจ้างหรือข้อตกลงที่มีอยู่ และเพิ่มข้อโอนสิทธิ์ให้ครบ ออกไปพร้อมข้อความโอนลิขสิทธิ์ที่ใส่ในสัญญาได้ทันที',
        en: {
          name: 'Make Sure Your Logo Design Contract Gives You the Rights',
          description:
            'Hire a designer for your logo without settling copyright and you may struggle to register it, or face problems later. We review the contract or agreement you have and add a full assignment of rights. You leave with assignment wording ready to put in the contract.',
        },
        category: LAW,
        photos: [photo(3760615), photo(4989696)],
        packages: [
          pkg(
            30,
            900,
            'ตรวจข้อลิขสิทธิ์',
            'ตรวจข้อลิขสิทธิ์ในสัญญาจ้างที่มีอยู่',
            'Check the Copyright Clause',
            'Check the copyright clause in your current contract.',
          ),
          pkg(
            60,
            1900,
            'ตรวจพร้อมร่างข้อโอนสิทธิ์',
            'ตรวจสัญญาและร่างข้อโอนลิขสิทธิ์ให้ครบ',
            'Review and Draft Assignment',
            'Review the contract and draft a complete assignment clause.',
          ),
        ],
      }),
      service({
        name: 'ตอบหนังสือแจ้งเตือนเรื่องละเมิดที่ได้รับ',
        description:
          'ได้รับหนังสือจากทนายของอีกฝ่ายว่าแบรนด์หรือสินค้าของคุณละเมิดสิทธิ อย่าเพิ่งตอบหรือเพิกเฉย อ่านข้อกล่าวหาด้วยกัน ดูว่ามีข้อต่อสู้อะไร และเลือกระหว่างเจรจา ปรับเปลี่ยน หรือโต้แย้ง เป็นการให้คำปรึกษาและไม่รับประกันผลของข้อพิพาท ออกไปพร้อมแนวทางตอบที่ชัดเจน',
        en: {
          name: 'Respond to an Infringement Letter You Received',
          description:
            "Received a lawyer's letter saying your brand or product infringes their rights? Don't reply or ignore it yet. We read the claims together, look at your defences, and choose between negotiating, changing course or disputing. This is advice, not a guarantee of how the dispute ends. You leave with a clear plan for your reply.",
        },
        category: LAW,
        screeningRequired: true,
        photos: [photo(7876191), photo(8112166)],
        packages: [
          pkg(
            45,
            1800,
            'อ่านหนังสือด้วยกัน',
            'อ่านข้อกล่าวหาและประเมินความเสี่ยง',
            'Read the Letter',
            'Read the claims and assess the risk.',
          ),
          pkg(
            90,
            3800,
            'วางแนวทางตอบ',
            'ประเมินข้อต่อสู้และวางแนวทางพร้อมโครงหนังสือตอบ',
            'Plan the Response',
            'Assess your defences and plan the reply, with an outline letter.',
          ),
        ],
      }),
      service({
        name: 'ทำ PDPA ให้ร้านออนไลน์ที่เก็บชื่อและที่อยู่ลูกค้า',
        description:
          'ร้านที่เก็บชื่อ เบอร์โทร และที่อยู่ลูกค้าไว้ส่งของต้องทำตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล ไล่ดูว่าร้านเก็บข้อมูลอะไร ที่ไหน ส่งต่อให้ใคร แล้วจัดลำดับสิ่งที่ต้องทำก่อน ออกไปพร้อมบันทึกรายการข้อมูลและรายการสิ่งที่ต้องทำให้ครบ',
        en: {
          name: 'PDPA Compliance for Online Shops Holding Customer Addresses',
          description:
            'Shops that keep customer names, phone numbers and addresses for delivery must follow the Personal Data Protection Act. We map what data you collect, where it is kept and who it goes to, then put the work in order of priority. You leave with a data inventory and a compliance to-do list.',
        },
        category: LAW,
        trialMinutes: 15,
        photos: [photo(7857542), photo(7857532)],
        packages: [
          pkg(
            45,
            1200,
            'สำรวจข้อมูล',
            'สำรวจข้อมูลลูกค้าที่ร้านเก็บและความเสี่ยงหลัก',
            'Data Survey',
            'Map the customer data you hold and the main risks.',
          ),
          pkg(
            90,
            2600,
            'แผน PDPA ครบ',
            'ทำบันทึกรายการข้อมูลและแผนทำตามกฎหมายทั้งหมด',
            'Full PDPA Plan',
            'Build the data inventory and a complete compliance plan.',
          ),
        ],
      }),
      service({
        name: 'เขียนนโยบายความเป็นส่วนตัวและแบบขอความยินยอม',
        description:
          'นโยบายความเป็นส่วนตัวที่ลอกมาจากเว็บอื่นมักไม่ตรงกับสิ่งที่ธุรกิจทำจริง เขียนนโยบายจากข้อมูลที่ธุรกิจของคุณเก็บจริง แยกเรื่องที่ต้องขอความยินยอมกับเรื่องที่ไม่ต้อง และวางแบบขอความยินยอมบนเว็บหรือฟอร์ม ออกไปพร้อมร่างนโยบายและข้อความขอความยินยอมที่ใช้ได้เลย',
        en: {
          name: 'Write Your Privacy Policy and Consent Forms',
          description:
            "A privacy policy copied from another site rarely matches what your business does. We write one from the data you actually collect, separate what needs consent from what doesn't, and design the consent wording for your website or forms. You leave with a draft policy and consent text ready to use.",
        },
        category: LAW,
        photos: [photo(2882638), photo(36740854)],
        packages: [
          pkg(
            60,
            1800,
            'ร่างนโยบาย',
            'ร่างนโยบายความเป็นส่วนตัวจากข้อมูลที่ธุรกิจเก็บจริง',
            'Draft the Policy',
            'Draft a privacy policy based on the data you really collect.',
          ),
          pkg(
            90,
            2800,
            'นโยบายและแบบยินยอม',
            'ร่างนโยบายและข้อความขอความยินยอมสำหรับทุกช่องทาง',
            'Policy and Consent',
            'Draft the policy and consent wording for every channel.',
          ),
        ],
      }),
      service({
        name: 'ติดกล้องวงจรปิดในร้านและสำนักงานให้ถูก PDPA',
        description:
          'กล้องวงจรปิดเก็บภาพบุคคลซึ่งเป็นข้อมูลส่วนบุคคล คุยเรื่องการติดป้ายแจ้ง ระยะเวลาเก็บภาพ ใครดูได้ และการให้ภาพเมื่อมีคนขอ ออกไปพร้อมข้อความป้ายแจ้งและแนวปฏิบัติการใช้กล้องสำหรับพนักงาน',
        en: {
          name: 'CCTV in Your Shop or Office, PDPA-Compliant',
          description:
            'CCTV footage of people is personal data. We cover the notice signs, how long to keep footage, who may view it, and how to handle requests for it. You leave with sign wording and a CCTV policy for staff.',
        },
        category: LAW,
        photos: [photo(13422379), photo(13156207), photo(7463021)],
        packages: [
          pkg(
            30,
            900,
            'ป้ายและระยะเก็บภาพ',
            'วางข้อความป้ายแจ้งและระยะเวลาเก็บภาพ',
            'Signs and Retention',
            'Write the notice sign and set the retention period.',
          ),
          pkg(
            60,
            1800,
            'แนวปฏิบัติครบ',
            'วางป้าย ระยะเก็บภาพ สิทธิ์การเข้าดู และขั้นตอนขอภาพ',
            'Full CCTV Policy',
            'Signs, retention, viewing rights and the request procedure.',
          ),
        ],
      }),
      service({
        name: 'ตรวจข้อตกลงการใช้งานเว็บไซต์และแอป',
        description:
          'สำหรับสตาร์ตอัปและธุรกิจที่มีเว็บหรือแอปให้ลูกค้าสมัครใช้งาน ตรวจข้อตกลงการใช้งานเรื่องการชำระเงิน การยกเลิก การคืนเงิน และการจำกัดความรับผิด ให้สอดคล้องกับกฎหมายคุ้มครองผู้บริโภค ออกไปพร้อมรายการแก้ไขและถ้อยคำที่เสนอ',
        en: {
          name: 'Review the Terms of Use for Your Website or App',
          description:
            'For startups and businesses whose customers sign up on a site or app. We review your terms on payment, cancellation, refunds and limitation of liability so they sit right with consumer protection law. You leave with a list of changes and suggested wording.',
        },
        category: LAW,
        screeningRequired: true,
        photos: [photo(15399856), photo(6669784)],
        packages: [
          pkg(
            60,
            1800,
            'ตรวจข้อหลัก',
            'ตรวจข้อชำระเงิน ยกเลิก และคืนเงิน',
            'Key Clauses',
            'Check the payment, cancellation and refund clauses.',
          ),
          pkg(
            120,
            4500,
            'ตรวจทั้งฉบับ',
            'ตรวจข้อตกลงทั้งฉบับและเขียนถ้อยคำแก้ไข',
            'Full Review',
            'Review the whole document and write the changes.',
          ),
        ],
      }),
      service({
        name: 'ตั้งนโยบายคืนสินค้าให้ถูกกฎหมายคุ้มครองผู้บริโภค',
        description:
          'เขียนว่า "ซื้อแล้วไม่รับคืน" อาจขัดกับกฎหมาย วางนโยบายคืนสินค้าและคืนเงินที่ร้านรับได้และไม่ขัดกับสิทธิของผู้บริโภค ตั้งแต่สินค้าชำรุด ส่งผิด จนถึงลูกค้าเปลี่ยนใจ ออกไปพร้อมข้อความนโยบายสำหรับหน้าร้านและข้อความตอบลูกค้า',
        en: {
          name: 'A Return Policy That Complies With Consumer Law',
          description:
            'Writing "no returns" may conflict with the law. We set a return and refund policy your shop can live with that respects consumer rights, covering damaged items, wrong items and changes of mind. You leave with policy text for your store page and replies for customers.',
        },
        category: SHOP,
        photos: [photo(7190885), photo(6347543)],
        packages: [
          pkg(
            30,
            700,
            'ตรวจนโยบายเดิม',
            'ตรวจนโยบายคืนสินค้าที่ใช้อยู่และชี้ข้อที่เสี่ยง',
            'Check Your Policy',
            'Check your current return policy and flag risky wording.',
          ),
          pkg(
            60,
            1400,
            'เขียนนโยบายใหม่',
            'เขียนนโยบายคืนสินค้าและข้อความตอบลูกค้าทุกกรณี',
            'New Policy',
            'Write a new return policy and replies for every case.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.anchalee.s@advisory.demo',
    displayName: 'อัญชลี ศรีสวัสดิ์',
    fullName: 'อัญชลี ศรีสวัสดิ์',
    portrait: portrait(7120873),
    headline: 'ทนายความด้านแรงงานฝั่งนายจ้าง',
    bio: 'ทนายความ ใบอนุญาตว่าความ ที่ว่าความคดีแรงงานมา 9 ปี ส่วนใหญ่ฝั่งนายจ้างที่เป็นธุรกิจขนาดเล็กและกลาง ช่วยเจ้าของกิจการเลิกจ้าง ออกหนังสือตักเตือน และเปลี่ยนเงื่อนไขการจ้างให้ถูกขั้นตอน ก่อนเรื่องจะไปถึงศาลแรงงาน',
    en: {
      headline: 'Employment Lawyer for Employers',
      bio: 'Licensed lawyer who has argued labour cases for 9 years, mostly for small and mid-sized employers. Helps owners handle dismissals, written warnings and changes to employment terms by the book, before matters reach the Labour Court.',
    },
    services: [
      service({
        name: 'เลิกจ้างพนักงานให้ถูกขั้นตอนและจ่ายค่าชดเชยครบ',
        description:
          'ก่อนเลิกจ้างต้องรู้ว่ามีเหตุตามกฎหมายหรือไม่ ต้องบอกกล่าวล่วงหน้าเท่าไร และค่าชดเชยตามอายุงานคือเท่าไร ไล่กรณีของคุณทีละขั้นและคำนวณเงินที่ต้องจ่าย เป็นการให้คำปรึกษาเพื่อลดความเสี่ยง ไม่ได้รับประกันว่าจะไม่มีการฟ้องร้อง ออกไปพร้อมขั้นตอนและร่างหนังสือเลิกจ้าง',
        en: {
          name: 'Dismiss an Employee Correctly and Pay Full Severance',
          description:
            'Before dismissing someone you need to know whether you have legal grounds, how much notice is due, and the severance owed for their length of service. We go through your case step by step and calculate the payments. This advice reduces risk; it cannot guarantee no claim is filed. You leave with the steps and a draft termination letter.',
        },
        category: LAW,
        screeningRequired: true,
        photos: [photo(8112231), photo(34066105)],
        packages: [
          pkg(
            45,
            1500,
            'ประเมินกรณี',
            'ประเมินเหตุเลิกจ้างและคำนวณเงินที่ต้องจ่าย',
            'Assess the Case',
            'Assess the grounds and calculate what is owed.',
          ),
          pkg(
            90,
            3200,
            'ขั้นตอนพร้อมเอกสาร',
            'วางขั้นตอนเลิกจ้างและร่างหนังสือเลิกจ้างกับบันทึกการจ่ายเงิน',
            'Steps and Documents',
            'Plan the dismissal and draft the letter and payment record.',
          ),
        ],
      }),
      service({
        name: 'ออกหนังสือตักเตือนที่ใช้อ้างอิงได้จริง',
        description:
          'หนังสือตักเตือนที่เขียนกว้างๆ มักใช้อ้างอิงไม่ได้เมื่อจำเป็นต้องเลิกจ้าง ดูว่าการกระทำนั้นผิดข้อบังคับข้อไหน เขียนข้อเท็จจริงให้ชัด และวางขั้นตอนแจ้งและเก็บหลักฐาน ออกไปพร้อมแม่แบบหนังสือตักเตือนสำหรับกรณีที่เจอบ่อย',
        en: {
          name: 'Written Warnings That Will Hold Up',
          description:
            "Vaguely worded warnings often can't be relied on when a dismissal becomes necessary. We identify which work rule the conduct breaches, set out the facts clearly, and plan how to deliver it and keep proof. You leave with warning letter templates for the most common cases.",
        },
        category: LAW,
        photos: [photo(8730982), photo(7567600)],
        packages: [
          pkg(
            30,
            900,
            'ตรวจหนังสือหนึ่งฉบับ',
            'ตรวจหนังสือตักเตือนที่กำลังจะออก',
            'Check One Warning',
            'Check a warning letter you are about to issue.',
          ),
          pkg(
            60,
            1800,
            'แม่แบบหนังสือตักเตือน',
            'ทำแม่แบบหนังสือตักเตือนสำหรับกรณีที่เจอบ่อย',
            'Warning Templates',
            'Build warning templates for the common cases.',
          ),
        ],
      }),
      service({
        name: 'รับมือเมื่อลูกจ้างยื่นคำร้องต่อพนักงานตรวจแรงงาน',
        description:
          'ได้รับหนังสือเรียกจากสำนักงานสวัสดิการและคุ้มครองแรงงานเพราะลูกจ้างร้องเรียน ไล่ข้อร้องเรียน เอกสารเงินเดือนและเวลาทำงานที่ต้องเตรียม และสิ่งที่ควรชี้แจงในวันนัด เป็นการให้คำปรึกษาเพื่อเตรียมตัว ไม่ใช่การรับประกันผลคำสั่ง ออกไปพร้อมรายการเอกสารและแนวทางชี้แจง',
        en: {
          name: 'Respond When an Employee Complains to a Labour Inspector',
          description:
            'Summoned by the labour protection office after a staff complaint? We go through the complaint, the payroll and time records to prepare, and what to explain at the meeting. This is advice to help you prepare, not a guarantee of the decision. You leave with a document list and the points to make.',
        },
        category: LAW,
        screeningRequired: true,
        photos: [photo(955389), photo(5668484)],
        packages: [
          pkg(
            45,
            1500,
            'อ่านคำร้อง',
            'อ่านคำร้องและบอกสิ่งที่ต้องเตรียม',
            'Read the Complaint',
            'Read the complaint and list what to prepare.',
          ),
          pkg(
            90,
            3000,
            'เตรียมชี้แจง',
            'ไล่เอกสารและวางแนวทางชี้แจงพร้อมซ้อมตอบ',
            'Prepare Your Response',
            'Go through the documents, plan your explanation and rehearse.',
          ),
        ],
      }),
      service({
        name: 'จ้างแรงงานต่างด้าวผ่าน MOU ให้ถูกกฎหมาย',
        description:
          'สำหรับร้านอาหาร โรงงาน และผู้รับเหมาที่ต้องการแรงงานจากเมียนมา กัมพูชา หรือลาว อธิบายขั้นตอนนำเข้าแรงงานตามบันทึกความเข้าใจระหว่างรัฐ ค่าใช้จ่าย ระยะเวลา และหน้าที่ของนายจ้างหลังแรงงานเริ่มงาน ออกไปพร้อมปฏิทินขั้นตอนและงบที่ต้องเตรียม',
        en: {
          name: 'Hire Migrant Workers Legally Through the MOU System',
          description:
            "For restaurants, factories and contractors needing workers from Myanmar, Cambodia or Laos. We explain the government-to-government MOU process, the costs, the timeline, and an employer's duties once workers start. You leave with a step-by-step timeline and the budget to set aside.",
        },
        category: HR,
        photos: [photo(17937671), photo(23232403)],
        packages: [
          pkg(
            45,
            1200,
            'ภาพรวมขั้นตอน',
            'อธิบายขั้นตอน MOU และค่าใช้จ่ายทั้งหมด',
            'Process Overview',
            'Explain the MOU process and the full cost.',
          ),
          pkg(
            90,
            2500,
            'วางแผนนำเข้าแรงงาน',
            'วางปฏิทินขั้นตอน งบ และหน้าที่นายจ้างตามจำนวนแรงงานที่ต้องการ',
            'Hiring Plan',
            'Plan the timeline, budget and employer duties for the number of workers you need.',
          ),
        ],
      }),
    ],
  },

  // ─── Restaurants and cafés ─────────────────────────────────────────────
  {
    email: 'biz.siriporn.c@advisory.demo',
    displayName: 'ศิริพร จันทร์หอม',
    fullName: 'ศิริพร จันทร์หอม',
    portrait: portrait(26425577),
    headline: 'เจ้าของร้านกาแฟ 3 สาขาและที่ปรึกษาเปิดคาเฟ่',
    bio: 'เจ้าของร้านกาแฟ 3 สาขาในขอนแก่น เปิดร้านแรกเมื่อ 9 ปีก่อนด้วยเครื่องชงมือสอง ช่วยคนที่อยากเปิดคาเฟ่คิดต้นทุนให้ละเอียดก่อนลงเงิน และช่วยร้านที่เปิดแล้วแต่กำไรไม่เหลือหาว่าเงินหายไปตรงไหน ทุกตัวเลขที่ใช้มาจากร้านของตัวเอง',
    en: {
      headline: 'Owner of Three Coffee Shops and Café Start-Up Advisor',
      bio: 'Owns three coffee shops in Khon Kaen, the first opened nine years ago with a second-hand machine. Helps would-be café owners cost everything properly before they spend, and helps open cafés with no profit left over find where the money goes, using figures from her own shops.',
    },
    services: [
      service({
        name: 'คำนวณต้นทุนเมนูกาแฟให้มีกำไรทุกแก้ว',
        description:
          'ขายดีแต่สิ้นเดือนไม่เหลือ มักเพราะไม่รู้ต้นทุนจริงต่อแก้ว ไล่ต้นทุนเมล็ด นม น้ำเชื่อม แก้ว ฝา และของเสีย ของเมนูขายดีทีละตัว แล้วตั้งราคาที่ยังแข่งได้ในย่านของคุณ ออกไปพร้อมไฟล์ต้นทุนเมนูที่อัปเดตเองได้เมื่อราคาวัตถุดิบขึ้น',
        en: {
          name: 'Cost Your Coffee Menu So Every Cup Makes Money',
          description:
            "Busy but nothing left at month's end? Usually it's not knowing the real cost per cup. We cost beans, milk, syrup, cups, lids and waste for each best-seller, then set prices that still compete in your area. You leave with a menu costing sheet you can update yourself when prices rise.",
        },
        category: FOOD,
        trialMinutes: 15,
        photos: [photo(30226594), photo(302891), photo(24613535)],
        packages: [
          pkg(
            30,
            500,
            'คิดต้นทุน 5 เมนู',
            'คำนวณต้นทุนต่อแก้วของเมนูขายดี 5 ตัว',
            'Five Drinks Costed',
            'Cost your five best-selling drinks per cup.',
          ),
          pkg(
            60,
            1100,
            'ต้นทุนทั้งเมนู',
            'ทำไฟล์ต้นทุนทั้งเมนูและปรับราคาที่ขาดทุน',
            'Whole Menu Costing',
            'Cost the whole menu and fix the prices that lose money.',
          ),
          pkg(
            90,
            1700,
            'ต้นทุนพร้อมจุดคุ้มทุนร้าน',
            'ทำต้นทุนทั้งเมนูและคำนวณยอดขายต่อวันที่ร้านต้องทำให้ได้',
            'Menu Costs and Break-Even',
            'Cost the menu and work out the daily sales the shop needs.',
          ),
        ],
      }),
      service({
        name: 'เลือกเครื่องชง เครื่องบด และเมล็ดกาแฟให้เหมาะกับยอดขาย',
        description:
          'เครื่องชงแพงไม่ได้แปลว่าเหมาะกับร้าน ประเมินจำนวนแก้วต่อวันที่คาดว่าจะขาย เทียบเครื่องชงและเครื่องบดในงบที่มี และเลือกเมล็ดหรือโรงคั่วที่ส่งได้สม่ำเสมอ ออกไปพร้อมรายการอุปกรณ์และงบที่เหมาะกับร้านของคุณ',
        en: {
          name: 'Choose the Right Espresso Machine, Grinder and Beans',
          description:
            "An expensive machine isn't necessarily right for your shop. We estimate the cups you expect to sell each day, compare machines and grinders within your budget, and choose beans or a roaster that delivers consistently. You leave with an equipment list and budget that suit your café.",
        },
        category: FOOD,
        photos: [photo(8429813), photo(20123607), photo(16309237)],
        packages: [
          pkg(
            45,
            800,
            'เลือกเครื่อง',
            'เทียบเครื่องชงและเครื่องบดตามยอดขายและงบ',
            'Choose the Machine',
            'Compare machines and grinders against your volume and budget.',
          ),
          pkg(
            90,
            1600,
            'ชุดอุปกรณ์ครบ',
            'เลือกเครื่อง อุปกรณ์บาร์ และเมล็ดกาแฟพร้อมงบรวม',
            'Full Bar Set-Up',
            'Choose the machine, bar tools and beans, with a total budget.',
          ),
        ],
      }),
      service({
        name: 'วางเมนูซิกเนเจอร์ที่ขายได้และชงซ้ำได้ทุกแก้ว',
        description:
          'เมนูซิกเนเจอร์ดีคือเมนูที่ถ่ายรูปสวย ขายได้กำไร และบาริสต้าทุกคนชงได้เหมือนกัน คิดเมนูจากวัตถุดิบที่ร้านมีอยู่ ตั้งสูตรเป็นกรัมและมิลลิลิตร และคำนวณราคาขาย ออกไปพร้อมสูตรมาตรฐาน 2–3 เมนูและการ์ดสูตรสำหรับหน้าบาร์',
        en: {
          name: 'Signature Drinks That Sell and Taste the Same Every Time',
          description:
            'A good signature drink photographs well, makes a profit, and every barista can make it the same way. We design drinks around ingredients you already stock, write recipes in grams and millilitres, and price them. You leave with two or three standard recipes and recipe cards for the bar.',
        },
        category: FOOD,
        photos: [photo(33537453), photo(1924951)],
        packages: [
          pkg(
            60,
            1200,
            'คิดเมนูใหม่',
            'คิดเมนูซิกเนเจอร์และตั้งราคาขาย',
            'New Drinks',
            'Design signature drinks and set their prices.',
          ),
          pkg(
            90,
            1800,
            'เมนูพร้อมสูตรมาตรฐาน',
            'คิดเมนู ตั้งสูตรมาตรฐาน และทำการ์ดสูตรสำหรับบาร์',
            'Drinks and Standard Recipes',
            'Design the drinks, set standard recipes and make bar cards.',
          ),
        ],
      }),
      service({
        name: 'เปิดคาเฟ่เล็กด้วยงบไม่เกิน 5 แสนบาท',
        description:
          'งบ 5 แสนเปิดคาเฟ่ได้ถ้ารู้ว่าควรจ่ายตรงไหนและประหยัดตรงไหน ไล่งบตั้งแต่ค่าเช่า มัดจำ ตกแต่ง อุปกรณ์ จนถึงเงินสำรองช่วงที่ยังไม่มีกำไร พร้อมเกณฑ์เลือกทำเล ออกไปพร้อมงบเปิดร้านแยกรายการและรายการสิ่งที่ต้องทำก่อนวันเปิด',
        en: {
          name: 'Open a Small Café on Under 500,000 Baht',
          description:
            "Half a million baht can open a café if you know where to spend and where to save. We budget rent, deposit, fit-out and equipment through to the cash reserve you'll need before you're profitable, plus how to judge a location. You leave with an itemised opening budget and a pre-opening checklist.",
        },
        category: FOOD,
        screeningRequired: true,
        photos: [photo(1833586), photo(16173672), photo(19561080)],
        packages: [
          pkg(
            60,
            1300,
            'งบเปิดร้าน',
            'แตกงบเปิดร้านทุกรายการตามแผนของคุณ',
            'Opening Budget',
            'Itemise the opening budget for your plan.',
          ),
          pkg(
            120,
            2800,
            'งบและแผนก่อนเปิด',
            'แตกงบ เลือกทำเล และวางรายการงานจนถึงวันเปิดร้าน',
            'Budget and Pre-Opening Plan',
            'Budget, location choice, and every task up to opening day.',
          ),
        ],
      }),
      service({
        name: 'เทรนบาริสต้าใหม่ให้ชงได้มาตรฐานใน 2 สัปดาห์',
        description:
          'ร้านที่รสชาติเปลี่ยนตามคนชงจะเสียลูกค้าประจำ วางแผนเทรนบาริสต้าใหม่ 2 สัปดาห์ ตั้งแต่ตั้งค่าเครื่องบด ช็อตเอสเปรสโซ สตีมนม จนถึงความเร็วช่วงคนแน่น พร้อมเกณฑ์ทดสอบก่อนให้ชงเอง ออกไปพร้อมแผนเทรนและแบบทดสอบบาริสต้า',
        en: {
          name: 'Train a New Barista to Your Standard in Two Weeks',
          description:
            "When the taste changes with whoever's on the bar, regulars drift away. We plan two weeks of training, from grinder settings, espresso shots and milk steaming to speed at rush hour, with a test before they work solo. You leave with a training plan and a barista skills test.",
        },
        category: FOOD,
        photos: [photo(26590808), photo(36719854), photo(6829511)],
        packages: [
          pkg(
            45,
            800,
            'แผนเทรน',
            'วางแผนเทรน 2 สัปดาห์สำหรับบาริสต้าใหม่',
            'Training Plan',
            'A two-week training plan for a new barista.',
          ),
          pkg(
            90,
            1600,
            'แผนเทรนพร้อมแบบทดสอบ',
            'วางแผนเทรน เกณฑ์ทดสอบ และการ์ดสูตรมาตรฐานของร้าน',
            'Plan and Skills Test',
            'Training plan, skills test and standard recipe cards.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.prawit.l@advisory.demo',
    displayName: 'ประวิทย์ ลิ้มสกุล',
    fullName: 'ประวิทย์ ลิ้มสกุล',
    portrait: portrait(8879388),
    headline: 'เชฟและที่ปรึกษาครัวร้านอาหาร',
    bio: 'เชฟที่ทำงานในครัวโรงแรมและร้านอาหารไทยมา 18 ปี ก่อนเปิดร้านอาหารตามสั่งของตัวเองในนนทบุรี ช่วยร้านอาหารวางเมนูให้ครัวทำทัน คุมต้นทุนวัตถุดิบ และจัดครัวให้คนน้อยแต่ออกอาหารได้เร็ว คุยแบบคนครัวด้วยกัน',
    en: {
      headline: 'Chef and Restaurant Kitchen Advisor',
      bio: 'Chef who worked in hotel kitchens and Thai restaurants for 18 years before opening his own made-to-order restaurant in Nonthaburi. Helps restaurants plan menus the kitchen can keep up with, control food costs, and set up a small team that still gets food out fast. Talks shop, cook to cook.',
    },
    services: [
      service({
        name: 'คุมต้นทุนวัตถุดิบให้ไม่เกิน 35% ของราคาขาย',
        description:
          'ราคาผัก หมู และน้ำมันขึ้นตลอดแต่ราคาอาหารขึ้นตามไม่ได้ คำนวณต้นทุนต่อจานของเมนูหลัก หาว่าเมนูไหนกินกำไร วางวิธีสั่งของและรับของที่ลดการโดนโกงน้ำหนัก ออกไปพร้อมตารางต้นทุนต่อจานและเมนูที่ควรปรับ',
        en: {
          name: 'Keep Food Costs Under 35% of the Menu Price',
          description:
            "Vegetables, pork and oil keep going up, but your prices can't follow every time. We cost your main dishes per plate, find which ones eat your margin, and set up ordering and receiving that stops short weights. You leave with a cost-per-plate table and the dishes to adjust.",
        },
        category: FOOD,
        trialMinutes: 15,
        photos: [photo(5622189), photo(13965307), photo(17302468)],
        packages: [
          pkg(
            45,
            800,
            'ต้นทุนเมนูหลัก',
            'คำนวณต้นทุนต่อจานของเมนูขายดี 10 รายการ',
            'Main Dishes Costed',
            'Cost your ten best-selling dishes per plate.',
          ),
          pkg(
            90,
            1700,
            'ระบบคุมต้นทุน',
            'คำนวณต้นทุนทั้งเมนูและวางระบบสั่งและรับวัตถุดิบ',
            'Food Cost System',
            'Cost the full menu and set up ordering and receiving.',
          ),
        ],
      }),
      service({
        name: 'ออกแบบเมนูร้านอาหารตามสั่งให้ครัวทำทันช่วงพีก',
        description:
          'เมนูยาวสามหน้าทำให้ครัวช้าและวัตถุดิบเหลือทิ้ง คัดเมนูโดยดูยอดขายและความยากในการทำ จัดกลุ่มเมนูที่ใช้วัตถุดิบร่วมกัน และวางลำดับทำให้ออกจานได้เร็วช่วงเที่ยง ออกไปพร้อมเมนูฉบับใหม่ที่สั้นลงและทำกำไรมากขึ้น',
        en: {
          name: 'A Made-to-Order Menu the Kitchen Can Keep Up With at Rush Hour',
          description:
            'A three-page menu slows the kitchen and leaves ingredients to waste. We cut the menu by sales and difficulty, group dishes that share ingredients, and set a cooking order that gets plates out fast at lunchtime. You leave with a shorter, more profitable menu.',
        },
        category: FOOD,
        photos: [photo(175754), photo(20994429), photo(12561890)],
        packages: [
          pkg(
            60,
            1200,
            'คัดเมนู',
            'คัดเมนูจากยอดขายและเวลาที่ใช้ทำ',
            'Trim the Menu',
            'Trim the menu by sales and cooking time.',
          ),
          pkg(
            90,
            1900,
            'เมนูใหม่พร้อมลำดับครัว',
            'คัดเมนู จัดกลุ่มวัตถุดิบ และวางลำดับทำช่วงพีก',
            'New Menu and Kitchen Flow',
            'Trim the menu, group ingredients and plan the rush-hour flow.',
          ),
        ],
      }),
      service({
        name: 'จัดผังครัวและสถานีทำอาหารสำหรับร้านเล็ก',
        description:
          'ครัวแคบที่จัดผิดทำให้คนเดินชนกันและอาหารออกช้า ส่งรูปและขนาดครัวมาก่อนนัด แล้ววางตำแหน่งเตา ที่เตรียมของ ตู้เย็น และจุดล้าง ตามลำดับการทำงานจริง ออกไปพร้อมผังครัวใหม่และรายการสิ่งที่ต้องย้ายหรือซื้อเพิ่ม',
        en: {
          name: 'Lay Out a Small Restaurant Kitchen and Its Stations',
          description:
            'A badly arranged narrow kitchen means people bumping into each other and slow plates. Send photos and measurements before the session, and we place the stoves, prep area, fridges and washing point in the order the work actually flows. You leave with a new layout and a list of what to move or buy.',
        },
        category: FOOD,
        screeningRequired: true,
        photos: [photo(2544829), photo(15671274)],
        packages: [
          pkg(
            60,
            1500,
            'ตรวจผังครัว',
            'ดูผังครัวปัจจุบันและชี้จุดที่ทำให้ช้า',
            'Kitchen Check',
            'Review your current layout and find what slows you down.',
          ),
          pkg(
            120,
            3200,
            'ผังครัวใหม่',
            'วางผังครัวใหม่ทั้งหมดพร้อมรายการปรับปรุงและงบ',
            'New Kitchen Layout',
            'A complete new layout, with a list of changes and a budget.',
          ),
        ],
      }),
      service({
        name: 'ทำสูตรมาตรฐานให้รสชาติเหมือนกันทุกจาน',
        description:
          'รสชาติเปลี่ยนทุกครั้งที่เปลี่ยนคนทำ เปลี่ยนสูตรในหัวของเจ้าของร้านเป็นสูตรที่ชั่งตวงได้ ตั้งแต่น้ำซอสไปจนถึงปริมาณต่อจาน พร้อมรูปจานมาตรฐานให้ลูกมือเทียบ ออกไปพร้อมการ์ดสูตรมาตรฐานของเมนูหลัก',
        en: {
          name: 'Standard Recipes So Every Plate Tastes the Same',
          description:
            "The taste changes whenever the cook changes? We turn the recipes in the owner's head into measured ones, from sauces to portion sizes, with a reference photo of each plate for the team to match. You leave with standard recipe cards for your main dishes.",
        },
        category: FOOD,
        photos: [photo(38127716), photo(6937464), photo(2827263)],
        packages: [
          pkg(
            60,
            1300,
            'สูตรน้ำซอสหลัก',
            'ทำสูตรมาตรฐานของน้ำซอสและเครื่องปรุงหลัก',
            'Core Sauces',
            'Standard recipes for your core sauces and seasonings.',
          ),
          pkg(
            120,
            2800,
            'สูตรมาตรฐานทั้งเมนู',
            'ทำการ์ดสูตรมาตรฐานของเมนูหลักทั้งหมดพร้อมปริมาณต่อจาน',
            'Whole Menu Standards',
            'Recipe cards for every main dish, with portion sizes.',
          ),
        ],
      }),
      service({
        name: 'ลดวัตถุดิบเหลือทิ้งในครัว',
        description:
          'ของเสียในครัวคือกำไรที่ทิ้งลงถังทุกวัน ไล่ดูว่าของเสียเกิดจากการสั่งเกิน การเก็บผิดวิธี หรือการเตรียมมากไป วางวิธีนับสต็อกรายวัน การหมุนเวียนวัตถุดิบ และเมนูที่ใช้ของเหลือ ออกไปพร้อมแบบบันทึกของเสียและเกณฑ์สั่งของใหม่',
        en: {
          name: 'Cut Food Waste in Your Kitchen',
          description:
            'Kitchen waste is profit thrown in the bin every day. We find whether it comes from over-ordering, poor storage or prepping too much, then set up daily stock counts, first-in-first-out rotation and dishes that use up leftovers. You leave with a waste log and new ordering rules.',
        },
        category: FOOD,
        photos: [photo(5622193), photo(319798)],
        packages: [
          pkg(
            45,
            800,
            'หาต้นเหตุของเสีย',
            'ไล่ขั้นตอนในครัวและหาว่าของเสียมาจากไหน',
            'Find the Waste',
            'Walk through the kitchen and find where waste comes from.',
          ),
          pkg(
            90,
            1600,
            'ระบบลดของเสีย',
            'วางแบบบันทึกของเสีย การนับสต็อก และเกณฑ์สั่งของ',
            'Waste Reduction System',
            'Waste log, stock counts and ordering rules.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.phannee.s@advisory.demo',
    displayName: 'พรรณี สุขเกษม',
    fullName: 'พรรณี สุขเกษม',
    portrait: portrait(13736386),
    headline: 'เจ้าของร้านเบเกอรี่และที่ปรึกษาธุรกิจขนม',
    bio: 'เริ่มทำขนมขายจากครัวที่บ้านจนเปิดร้านเบเกอรี่ของตัวเองในนครปฐมมา 11 ปี ส่งขนมให้คาเฟ่กว่า 20 ร้าน ช่วยคนทำขนมโฮมเมดคิดราคา ยืดอายุสินค้า และขยายจากขายให้คนรู้จักไปเป็นธุรกิจที่มีลูกค้าประจำ',
    en: {
      headline: 'Bakery Owner and Home Baking Business Advisor',
      bio: 'Started baking to sell from her home kitchen and has run her own bakery in Nakhon Pathom for 11 years, supplying more than 20 cafés. Helps home bakers price their goods, extend shelf life, and grow from selling to friends into a business with regular customers.',
    },
    services: [
      service({
        name: 'คิดราคาขนมโฮมเมดให้คุ้มค่าแรงและค่าแก๊ส',
        description:
          'ขนมขายหมดทุกรอบแต่คิดแล้วได้ค่าแรงไม่ถึงชั่วโมงละร้อย คำนวณต้นทุนวัตถุดิบ บรรจุภัณฑ์ ค่าไฟ ค่าแก๊ส และเวลาที่ใช้ทำต่อชิ้น แล้วตั้งราคาที่ลูกค้ายังซื้อ ออกไปพร้อมไฟล์คิดราคาที่ใช้กับขนมตัวใหม่ได้',
        en: {
          name: 'Price Home-Baked Goods to Cover Your Time and Gas',
          description:
            'Selling out every batch but earning less than 100 baht an hour? We cost ingredients, packaging, electricity, gas and your time per piece, then set prices customers will still pay. You leave with a pricing sheet to use for every new bake.',
        },
        category: FOOD,
        trialMinutes: 15,
        photos: [photo(5907557), photo(5907536)],
        packages: [
          pkg(
            30,
            400,
            'คิดราคาขนม 3 อย่าง',
            'คำนวณต้นทุนและราคาขายของขนม 3 รายการ',
            'Three Items Priced',
            'Cost and price three of your bakes.',
          ),
          pkg(
            60,
            900,
            'ไฟล์คิดราคาครบ',
            'ทำไฟล์คิดราคาที่รวมค่าแรงและค่าพลังงานสำหรับทุกเมนู',
            'Full Pricing Sheet',
            'A pricing sheet including labour and energy for every item.',
          ),
        ],
      }),
      service({
        name: 'ส่งขนมเข้าคาเฟ่และร้านกาแฟแบบฝากขาย',
        description:
          'ฝากขายในคาเฟ่ช่วยให้มีรายได้สม่ำเสมอ ถ้าตกลงเงื่อนไขดี คุยเรื่องการคัดร้านที่ลูกค้าตรงกลุ่ม ส่วนแบ่งที่เหมาะสม การรับคืนของที่ขายไม่หมด และรอบส่งของ ออกไปพร้อมข้อเสนอสำหรับคาเฟ่และตารางรอบส่ง',
        en: {
          name: 'Supply Your Bakes to Cafés on Consignment',
          description:
            'Consignment in cafés brings steady income if the terms are right. We cover choosing cafés with the right customers, a fair revenue split, taking back unsold items and delivery rounds. You leave with an offer to send cafés and a delivery schedule.',
        },
        category: FOOD,
        photos: [photo(20634400), photo(20140442)],
        packages: [
          pkg(
            45,
            700,
            'วางเงื่อนไขฝากขาย',
            'วางส่วนแบ่งและเงื่อนไขรับคืนสินค้า',
            'Consignment Terms',
            'Set the revenue split and returns terms.',
          ),
          pkg(
            90,
            1400,
            'ข้อเสนอและรอบส่ง',
            'วางเงื่อนไข เขียนข้อเสนอสำหรับคาเฟ่ และจัดรอบส่งของ',
            'Offer and Delivery Rounds',
            'Set terms, write the café offer and plan deliveries.',
          ),
        ],
      }),
      service({
        name: 'ขายขนมออนไลน์และส่งพัสดุไม่ให้เสียหาย',
        description:
          'ขนมบางอย่างส่งไกลได้ บางอย่างไม่ควรส่ง เลือกเมนูที่เหมาะกับการส่งพัสดุ เลือกกล่องและวิธีแพ็ก ยืดอายุโดยไม่ใส่สารกันเสียเกินจำเป็น และตั้งรอบอบรอบส่ง ออกไปพร้อมรายการเมนูที่ขายออนไลน์ได้และวิธีแพ็กของแต่ละแบบ',
        en: {
          name: 'Sell Baked Goods Online and Ship Them Intact',
          description:
            "Some bakes travel well and some shouldn't be posted at all. We choose which items suit parcel delivery, pick boxes and packing methods, extend shelf life without unnecessary preservatives, and set baking and shipping days. You leave with a list of online-friendly items and how to pack each.",
        },
        category: FOOD,
        photos: [photo(7669757), photo(6347544)],
        packages: [
          pkg(
            45,
            700,
            'เลือกเมนูส่งได้',
            'เลือกเมนูที่เหมาะกับการส่งพัสดุ',
            'Pick What Ships',
            'Choose which items suit parcel delivery.',
          ),
          pkg(
            90,
            1400,
            'ระบบขายออนไลน์',
            'เลือกเมนู วิธีแพ็ก และรอบอบรอบส่งให้เป็นระบบ',
            'Online Sales Set-Up',
            'Choose items, packing methods and baking and shipping days.',
          ),
        ],
      }),
      service({
        name: 'ขอใบอนุญาตครัวและมาตรฐานสำหรับขนมทำที่บ้าน',
        description:
          'เมื่อเริ่มขายจริงจังหรือจะส่งเข้าร้านใหญ่ มักถูกถามหาใบอนุญาตและเลขสารบบอาหาร ไล่ว่าธุรกิจขนาดคุณต้องมีอะไร ขอที่ไหน และต้องปรับครัวอย่างไร ออกไปพร้อมรายการเอกสารและสิ่งที่ต้องปรับในครัว',
        en: {
          name: 'Licences and Standards for Baking From Home',
          description:
            "Once you sell seriously or supply bigger shops, you'll be asked for licences and a food registration number. We work out what a business your size needs, where to apply, and how to adapt your kitchen. You leave with a document list and the kitchen changes to make.",
        },
        category: FOOD,
        photos: [photo(3992206), photo(6996205)],
        packages: [
          pkg(
            45,
            800,
            'เช็กสิ่งที่ต้องมี',
            'ดูว่าธุรกิจของคุณต้องมีใบอนุญาตและมาตรฐานอะไร',
            'What You Need',
            'Find out which licences and standards apply to you.',
          ),
          pkg(
            90,
            1600,
            'แผนขอใบอนุญาต',
            'วางขั้นตอนขอใบอนุญาตและรายการปรับครัวพร้อมงบ',
            'Licensing Plan',
            'Plan the applications and kitchen changes, with a budget.',
          ),
        ],
      }),
    ],
  },
  {
    email: 'biz.jirayu.p@advisory.demo',
    displayName: 'จิรายุ เพชรรัตน์',
    fullName: 'จิรายุ เพชรรัตน์',
    portrait: portrait(5384445),
    headline: 'ที่ปรึกษาเดลิเวอรีและการตลาดร้านอาหาร',
    bio: 'เคยทำงานฝ่ายดูแลร้านค้าพันธมิตรของแอปสั่งอาหาร 5 ปี ดูแลร้านอาหารในกรุงเทพฯ กว่า 400 ร้าน ช่วยร้านที่ขายผ่านแอปตั้งราคาหลังหักค่าคอมมิชชัน จัดหน้าร้านในแอปให้คนกดสั่ง และทำโปรโมชันที่ไม่ขาดทุน',
    en: {
      headline: 'Delivery and Restaurant Marketing Advisor',
      bio: "Spent 5 years on the merchant team of a food delivery app, looking after more than 400 Bangkok restaurants. Helps restaurants selling through apps price after commission, set up their in-app store so people order, and run promotions that don't lose money.",
    },
    services: [
      service({
        name: 'ตั้งราคาเมนูเดลิเวอรีหลังหักค่าคอมมิชชันแอป',
        description:
          'ขายผ่านแอปได้เยอะแต่หักค่าคอมมิชชันแล้วแทบไม่เหลือ คำนวณกำไรต่อจานหลังหักส่วนแบ่ง ค่าบรรจุภัณฑ์ และส่วนลดที่ร่วมกับแอป แล้วตั้งราคาเดลิเวอรีแยกจากหน้าร้าน ออกไปพร้อมตารางราคาเดลิเวอรีของทุกเมนู',
        en: {
          name: "Price Delivery Menus After the App's Commission",
          description:
            "Selling plenty through apps but almost nothing left after commission? We work out profit per dish after the app's share, packaging and co-funded discounts, then set delivery prices separate from your dine-in menu. You leave with a delivery price table for every dish.",
        },
        category: FOOD,
        trialMinutes: 15,
        photos: [photo(7362948), photo(12203654)],
        packages: [
          pkg(
            30,
            500,
            'คิดกำไรต่อจาน',
            'คำนวณกำไรหลังหักค่าคอมมิชชันของเมนูขายดี',
            'Profit per Dish',
            'Work out profit after commission on your best-sellers.',
          ),
          pkg(
            60,
            1000,
            'ตารางราคาเดลิเวอรี',
            'ตั้งราคาเดลิเวอรีใหม่ทั้งเมนู',
            'Delivery Price Table',
            'Reprice the whole menu for delivery.',
          ),
        ],
      }),
      service({
        name: 'เปิดร้านบนแอปสั่งอาหารให้มีออเดอร์ในเดือนแรก',
        description:
          'เปิดร้านในแอปแล้วไม่มีใครเห็น จัดหน้าร้าน รูปเมนู ชื่อเมนู และหมวดหมู่ให้คนเลื่อนผ่านแล้วกดเข้า เลือกโปรโมชันช่วงเปิดตัว และตั้งเวลาเปิดให้ตรงกับช่วงที่คนสั่ง ออกไปพร้อมหน้าร้านที่ปรับแล้วและแผน 30 วันแรก',
        en: {
          name: 'Get Orders in Your First Month on a Delivery App',
          description:
            'Listed on the app but nobody sees you? We set up your store page, menu photos, dish names and categories so people stop scrolling and tap in, choose launch promotions, and set opening hours to match when people order. You leave with an improved store page and a 30-day plan.',
        },
        category: FOOD,
        photos: [photo(14140792), photo(12725456)],
        packages: [
          pkg(
            45,
            800,
            'ปรับหน้าร้านในแอป',
            'ปรับชื่อเมนู หมวดหมู่ และรูปให้ดึงคนกดสั่ง',
            'Store Page Fix',
            'Rework dish names, categories and photos to draw orders.',
          ),
          pkg(
            90,
            1600,
            'หน้าร้านและแผนเปิดตัว',
            'ปรับหน้าร้านและวางโปรโมชันกับเวลาเปิดของเดือนแรก',
            'Store Page and Launch Plan',
            'Fix the store page and plan first-month promotions and hours.',
          ),
        ],
      }),
      service({
        name: 'แพ็กอาหารเดลิเวอรีให้ถึงมือลูกค้าแล้วยังน่ากิน',
        description:
          'รีวิวแย่ส่วนใหญ่มาจากอาหารหก เย็น หรือแฉะ เลือกบรรจุภัณฑ์ให้เหมาะกับแต่ละเมนู แยกน้ำซอสและของกรอบ และวางขั้นตอนแพ็กที่ทำเร็วช่วงออเดอร์เข้าเยอะ ออกไปพร้อมรายการบรรจุภัณฑ์ต่อเมนูและต้นทุนต่อชุด',
        en: {
          name: 'Pack Delivery Food So It Arrives Looking Good',
          description:
            'Most bad reviews come from food that spilled, went cold or turned soggy. We choose packaging for each dish, separate sauces and crispy parts, and set up packing steps that stay fast when orders pile in. You leave with a packaging list per dish and the cost per set.',
        },
        category: FOOD,
        photos: [photo(4393657), photo(4393660), photo(6613050)],
        packages: [
          pkg(
            30,
            500,
            'เลือกบรรจุภัณฑ์',
            'เลือกบรรจุภัณฑ์สำหรับเมนูขายดี 5 รายการ',
            'Choose Packaging',
            'Choose packaging for five best-sellers.',
          ),
          pkg(
            60,
            1000,
            'ระบบแพ็กครบ',
            'เลือกบรรจุภัณฑ์ทั้งเมนูและวางขั้นตอนแพ็ก',
            'Full Packing System',
            'Packaging for the whole menu and the packing steps.',
          ),
        ],
      }),
      service({
        name: 'ทำโปรโมชันร้านอาหารที่ได้ลูกค้าใหม่โดยไม่ขาดทุน',
        description:
          'ลดราคาแล้วคนมาเฉพาะช่วงโปร เลือกรูปแบบโปรโมชันที่ดึงลูกค้าใหม่ให้กลับมาซ้ำ เช่น ชุดเมนู บัตรสะสม หรือโปรช่วงเวลาเงียบ คำนวณกำไรของแต่ละแบบก่อนปล่อย ออกไปพร้อมแผนโปรโมชัน 3 เดือนที่คิดกำไรแล้ว',
        en: {
          name: 'Restaurant Promotions That Win New Customers Without Losses',
          description:
            'Discounts that only bring people in while the deal lasts? We choose promotions that turn new customers into regulars, such as set menus, loyalty cards or quiet-hour deals, and check the profit on each before launch. You leave with a three-month promotion plan with the numbers done.',
        },
        category: FOOD,
        photos: [photo(30729111), photo(4921033)],
        packages: [
          pkg(
            45,
            800,
            'เลือกรูปแบบโปร',
            'เลือกรูปแบบโปรโมชันที่เหมาะกับร้านและคิดกำไร',
            'Choose the Promotion',
            'Pick promotions that suit your restaurant and check the profit.',
          ),
          pkg(
            90,
            1600,
            'แผนโปร 3 เดือน',
            'วางแผนโปรโมชัน 3 เดือนพร้อมวิธีวัดผล',
            'Three-Month Plan',
            'A three-month promotion plan with how to measure it.',
          ),
        ],
      }),
      service({
        name: 'เลือกระบบ POS และระบบสต็อกให้ร้านอาหาร',
        description:
          'ยังจดออเดอร์ด้วยมือหรือใช้ระบบที่ไม่มีใครใช้เป็น เทียบระบบขายหน้าร้านที่เหมาะกับร้านขนาดคุณ ทั้งการรับออเดอร์ ส่งเข้าครัว ตัดสต็อก และรายงานยอดขาย พร้อมค่าใช้จ่ายรายเดือน ออกไปพร้อมระบบที่ควรเลือกและแผนเริ่มใช้งาน',
        en: {
          name: 'Choose a POS and Stock System for Your Restaurant',
          description:
            'Still writing orders by hand, or using a system nobody knows how to use? We compare POS systems suited to your size for taking orders, sending them to the kitchen, deducting stock and sales reports, plus the monthly cost. You leave with a recommendation and a rollout plan.',
        },
        category: FOOD,
        photos: [photo(12935048), photo(12935069), photo(38325323)],
        packages: [
          pkg(
            45,
            800,
            'เทียบระบบ',
            'เทียบระบบ POS 3 ตัวตามขนาดร้าน',
            'Compare Systems',
            'Compare three POS systems for your size.',
          ),
          pkg(
            90,
            1500,
            'เลือกและวางแผนเริ่มใช้',
            'เลือกระบบ ตั้งเมนูและสต็อก และวางแผนสอนพนักงาน',
            'Choose and Roll Out',
            'Choose the system, set up menu and stock, and plan staff training.',
          ),
        ],
      }),
    ],
  },
];
