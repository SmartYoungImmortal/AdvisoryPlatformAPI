import { HttpException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { AdvisorServicesService } from '@/modules/advisor-services/advisor-services.service';
import type { ServiceCategoriesService } from '@/modules/service-categories/service-categories.service';
import { MatchingService, byKeywords, readAnswer } from './matching.service';

const TAX = '11111111-1111-4111-8111-111111111111';
const LAW = '22222222-2222-4222-8222-222222222222';

const published = {
  items: [
    {
      id: TAX,
      categoryId: 'c-tax',
      name: 'วางแผนภาษีสำหรับฟรีแลนซ์',
      description: 'ยื่นภาษีเงินได้ หักค่าใช้จ่าย',
      priceSatang: 120000,
      durationMinutes: 60,
    },
    {
      id: LAW,
      categoryId: 'c-law',
      name: 'ตรวจสัญญาจ้าง',
      description: 'อ่านสัญญาก่อนเซ็น',
      priceSatang: 90000,
      durationMinutes: 30,
    },
  ],
  total: 2,
};

function makeService(apiKey?: string) {
  const services = { findPublished: jest.fn().mockResolvedValue(published) };
  const categories = {
    findMany: jest.fn().mockResolvedValue({
      items: [
        { id: 'c-tax', name: 'การเงินและภาษี' },
        { id: 'c-law', name: 'กฎหมายและสัญญา' },
      ],
    }),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'ANTHROPIC_API_KEY'
        ? apiKey
        : key === 'MATCHING_MODEL'
          ? 'claude-haiku-5-5'
          : undefined,
    ),
  };
  return {
    services,
    service: new MatchingService(
      services as unknown as AdvisorServicesService,
      categories as unknown as ServiceCategoriesService,
      config as unknown as ConfigService,
    ),
  };
}

describe('MatchingService', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('matches by words when no model key is set, Thai split whole', async () => {
    const { service } = makeService();
    const result = await service.match(
      { problem: 'เป็นฟรีแลนซ์ อยากรู้เรื่องยื่นภาษี' },
      '1.1.1.1',
    );
    expect(result.mode).toBe('keyword');
    expect(result.matches[0]?.serviceId).toBe(TAX);
    // "ยื่นภาษี" is found whole, so the shorter "ภาษี" inside it is not listed again.
    expect(result.matches[0]?.matched).toEqual(
      expect.arrayContaining(['ฟรีแลนซ์', 'ยื่นภาษี']),
    );
  });

  it('passes the chosen topic and budget to the catalogue read', async () => {
    const { service, services } = makeService();
    await service.match(
      { problem: 'ภาษี', categoryId: 'c-tax', maxPriceSatang: 150000 },
      '1.1.1.2',
    );
    expect(services.findPublished).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'c-tax',
        maxPriceSatang: 150000,
        limit: 100,
      }),
    );
  });

  it('asks the model when a key is set and keeps only catalogue ids', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                understanding: 'อยากรู้วิธียื่นภาษีของฟรีแลนซ์',
                topics: ['ภาษี'],
                matches: [
                  { serviceId: 'not-in-catalogue', reason: 'x' },
                  { serviceId: TAX, reason: 'ตรงเรื่องภาษีฟรีแลนซ์' },
                  { serviceId: TAX, reason: 'ซ้ำ' },
                ],
              }),
            },
          ],
        }),
    });
    const { service } = makeService('sk-test');
    const result = await service.match(
      { problem: 'ยื่นภาษีฟรีแลนซ์' },
      '1.1.1.3',
    );
    expect(result.mode).toBe('ai');
    expect(result.understanding).toBe('อยากรู้วิธียื่นภาษีของฟรีแลนซ์');
    expect(result.matches).toEqual([
      { serviceId: TAX, reason: 'ตรงเรื่องภาษีฟรีแลนซ์', matched: [] },
    ]);
  });

  it('falls back to words when the model call fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 529 });
    const { service } = makeService('sk-test');
    const result = await service.match({ problem: 'สัญญาจ้าง' }, '1.1.1.4');
    expect(result.mode).toBe('keyword');
    expect(result.matches[0]?.serviceId).toBe(LAW);
  });

  it('refuses a caller past ten asks a minute', async () => {
    const { service } = makeService();
    for (let i = 0; i < 10; i++)
      await service.match({ problem: `ภาษี ${i}` }, '9.9.9.9');
    await expect(
      service.match({ problem: 'ภาษี อีก' }, '9.9.9.9'),
    ).rejects.toBeInstanceOf(HttpException);
  });
});

describe('readAnswer', () => {
  it('reads JSON wrapped in prose and refuses an answer without any', () => {
    const ids = new Set([TAX]);
    expect(
      readAnswer(
        `ok: {"matches":[{"serviceId":"${TAX}","reason":"r"}]} done`,
        ids,
      ).matches,
    ).toHaveLength(1);
    expect(() => readAnswer('no json here', ids)).toThrow();
  });
});

describe('byKeywords', () => {
  it('returns nothing when no word is found', () => {
    expect(
      byKeywords('อาหารแมว', [
        {
          id: TAX,
          name: 'ภาษี',
          description: '',
          category: '',
          priceBaht: 1,
          minutes: 30,
        },
      ]).matches,
    ).toEqual([]);
  });
});
