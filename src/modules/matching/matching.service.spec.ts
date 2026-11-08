import type Anthropic from '@anthropic-ai/sdk';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdvisorServicesService } from '@/modules/advisor-services/advisor-services.service';
import { ServiceCategoriesService } from '@/modules/service-categories/service-categories.service';
import {
  CHAT_SYSTEM_PROMPT,
  type ChatAnswer,
  compactCatalogue,
  readChatAnswer,
  recentTurns,
} from './matching.chat';
import { MatchingChatRequestDto } from './matching.dto';
import {
  MATCHING_MODEL_CLIENT,
  createMatchingModelClient,
} from './matching.model-client';
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
      extraCategoryIds: ['c-law'],
      trialEnabled: true,
      trialDurationMinutes: 15,
      advisor: { name: 'คุณเอ', rating: 4.8, reviewCount: 12 },
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

/** A Messages API reply carrying `answer` as its structured text, after an empty thinking block. */
function modelMessage(
  answer: unknown,
  stop_reason: Anthropic.StopReason = 'end_turn',
) {
  return {
    stop_reason,
    stop_details:
      stop_reason === 'refusal'
        ? { type: 'refusal', category: 'general_harms', explanation: null }
        : null,
    usage: {
      input_tokens: 40,
      output_tokens: 120,
      cache_read_input_tokens: 900,
      cache_creation_input_tokens: 0,
    },
    content: [
      { type: 'thinking', thinking: '', signature: 'sig' },
      { type: 'text', text: JSON.stringify(answer) },
    ],
  };
}

/** A stand-in for the SDK client: only `messages.create`, never the network. */
function fakeModel(...replies: unknown[]) {
  const create = jest.fn();
  for (const reply of replies) {
    if (reply instanceof Error) create.mockRejectedValueOnce(reply);
    else create.mockResolvedValueOnce(reply);
  }
  return { create, client: { messages: { create } } as unknown as Anthropic };
}

function makeService(apiKey?: string, model: Anthropic | null = null) {
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
      model,
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

describe('MatchingService.chat', () => {
  const said = (content: string) => ({ role: 'user' as const, content });
  const replied = (content: string) => ({
    role: 'assistant' as const,
    content,
  });

  it('matches everything the person said by words when no key is set', async () => {
    const { service } = makeService();
    const result = await service.chat(
      {
        messages: [
          said('เป็นฟรีแลนซ์'),
          replied('อยากปรึกษาเรื่องอะไรคะ'),
          said('อยากรู้เรื่องยื่นภาษี'),
        ],
      },
      '2.2.2.1',
    );
    expect(result).toMatchObject({
      mode: 'keyword',
      reply: '',
      search: { title: '', topics: [] },
      suggestions: [],
    });
    expect(result.search?.matches.map((match) => match.serviceId)).toEqual([
      TAX,
    ]);
    // Words from the first message and the last are both found.
    expect(result.search?.matches[0]?.matched).toEqual(
      expect.arrayContaining(['ฟรีแลนซ์', 'ยื่นภาษี']),
    );
  });

  it('has no search in keyword mode when no word matched', async () => {
    const { service } = makeService();
    const result = await service.chat(
      { messages: [said('อาหารแมว')] },
      '2.2.2.2',
    );
    expect(result.search).toBeNull();
    expect(result.mode).toBe('keyword');
  });

  it('asks Claude through the SDK with a cached catalogue and keeps only catalogue services', async () => {
    // Sorted by id, TAX is s1 and LAW is s2.
    const model = fakeModel(
      modelMessage({
        search: {
          title: '  ภาษีสำหรับฟรีแลนซ์  ',
          topics: ['ภาษี', ' ', 'ภาษี', 'ฟรีแลนซ์'],
          matches: [
            { id: 's9', reason: 'not in the catalogue' },
            { id: 's1', reason: ' ตรงเรื่องภาษีฟรีแลนซ์ ' },
            { id: 's1', reason: 'twice' },
            { id: 's2', reason: '' },
          ],
        },
        reply: 'เจอบริการที่น่าจะช่วยได้ค่ะ',
        suggestions: ['งบไม่เกิน 1,000 บาท', 'งบไม่เกิน 1,000 บาท', ''],
      }),
    );
    const { service } = makeService('sk-test', model.client);
    const result = await service.chat(
      { messages: [said('ยื่นภาษีฟรีแลนซ์')] },
      '2.2.2.3',
    );

    expect(result).toEqual({
      mode: 'ai',
      reply: 'เจอบริการที่น่าจะช่วยได้ค่ะ',
      search: {
        title: 'ภาษีสำหรับฟรีแลนซ์',
        topics: ['ภาษี', 'ฟรีแลนซ์'],
        matches: [
          { serviceId: TAX, reason: 'ตรงเรื่องภาษีฟรีแลนซ์', matched: [] },
          { serviceId: LAW, reason: null, matched: [] },
        ],
      },
      suggestions: ['งบไม่เกิน 1,000 บาท'],
    });

    const [params] = model.create.mock.calls[0] as [
      Anthropic.MessageCreateParamsNonStreaming,
    ];
    expect(params.model).toBe('claude-haiku-5-5');
    expect(params.max_tokens).toBe(2000);
    expect(params.messages).toEqual([
      { role: 'user', content: 'ยื่นภาษีฟรีแลนซ์' },
    ]);
    expect(params.output_config?.effort).toBe('low');
    expect(params.output_config?.format?.type).toBe('json_schema');
    // No server-side fallback on Haiku 5.5, and thinking is left to the model.
    expect(params).not.toHaveProperty('fallbacks');
    expect(params).not.toHaveProperty('betas');
    expect(params).not.toHaveProperty('thinking');
    const system = params.system as Anthropic.TextBlockParam[];
    expect(system[0]).toEqual({ type: 'text', text: CHAT_SYSTEM_PROMPT });
    expect(system[1]?.cache_control).toEqual({ type: 'ephemeral' });
    expect(system[1]?.text).toContain(
      '"id":"s1","n":"วางแผนภาษีสำหรับฟรีแลนซ์","c":"การเงินและภาษี, กฎหมายและสัญญา","p":1200,"m":60,"r":4.8,"t":15',
    );
    expect(system[1]?.text).not.toContain(TAX);
    // The person's words name the tax service (s1), so it is hinted after the
    // cached catalogue, uncached itself.
    expect(system[2]?.text).toContain('s1');
    expect(system[2]?.text).not.toContain('s2');
    expect(system[2]).not.toHaveProperty('cache_control');
  });

  it('returns a clarifying question with no search', async () => {
    const model = fakeModel(
      modelMessage({
        search: null,
        reply: 'อยากปรึกษาเรื่องงาน เงิน หรือสุขภาพคะ',
        suggestions: ['เรื่องภาษี', 'เรื่องสัญญา'],
      }),
    );
    const { service } = makeService('sk-test', model.client);
    const result = await service.chat(
      { messages: [said('สวัสดีค่ะ')] },
      '2.2.2.4',
    );
    expect(result).toEqual({
      mode: 'ai',
      reply: 'อยากปรึกษาเรื่องงาน เงิน หรือสุขภาพคะ',
      search: null,
      suggestions: ['เรื่องภาษี', 'เรื่องสัญญา'],
    });
  });

  it.each<[string, unknown]>([
    [
      'declines',
      modelMessage({ search: null, reply: '', suggestions: [] }, 'refusal'),
    ],
    [
      'is cut off',
      {
        ...modelMessage({}),
        stop_reason: 'max_tokens',
        content: [{ type: 'text', text: '{"search":' }],
      },
    ],
    ['fails', new Error('529 overloaded')],
  ])(
    'falls back to words when Claude %s, and asks again next time',
    async (_, reply) => {
      const model = fakeModel(reply, reply);
      const { service } = makeService('sk-test', model.client);
      const dto = { messages: [said('ตรวจสัญญาจ้าง')] };
      const first = await service.chat(dto, '2.2.2.5');
      expect(first.mode).toBe('keyword');
      expect(first.search?.matches[0]?.serviceId).toBe(LAW);
      await service.chat(dto, '2.2.2.5');
      expect(model.create).toHaveBeenCalledTimes(2);
    },
  );

  it('answers a repeated conversation from memory', async () => {
    const model = fakeModel(
      modelMessage({ search: null, reply: 'เรื่องอะไรคะ', suggestions: [] }),
    );
    const { service } = makeService('sk-test', model.client);
    const dto = { messages: [said('ช่วยหน่อย')] };
    await service.chat(dto, '2.2.2.6');
    const again = await service.chat(dto, '2.2.2.6');
    expect(again.reply).toBe('เรื่องอะไรคะ');
    expect(model.create).toHaveBeenCalledTimes(1);
  });

  it('refuses a caller past sixty asks a day, minutes apart', async () => {
    const { service } = makeService();
    const start = Date.parse('2026-11-09T03:00:00Z');
    const now = jest.spyOn(Date, 'now');
    try {
      for (let i = 0; i < 60; i++) {
        now.mockReturnValue(start + i * 61_000);
        await service.chat({ messages: [said(`ภาษี ${i}`)] }, '7.7.7.7');
      }
      now.mockReturnValue(start + 60 * 61_000);
      await expect(
        service.chat({ messages: [said('ภาษี อีก')] }, '7.7.7.7'),
      ).rejects.toBeInstanceOf(HttpException);
      // Another caller is not held by it.
      await expect(
        service.chat({ messages: [said('ภาษี')] }, '7.7.7.8'),
      ).resolves.toBeDefined();
    } finally {
      now.mockRestore();
    }
  });

  it('answers by words once the day’s model calls are spent', async () => {
    const model = fakeModel(
      modelMessage({ search: null, reply: 'เรื่องอะไรคะ', suggestions: [] }),
    );
    const { service } = makeService('sk-test', model.client);
    const spent = service as unknown as {
      modelToday: { day: string; count: number };
    };
    spent.modelToday = {
      day: new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10),
      count: 1000,
    };
    const result = await service.chat(
      { messages: [said('สัญญาจ้าง')] },
      '6.6.6.6',
    );
    expect(model.create).not.toHaveBeenCalled();
    expect(result.mode).toBe('keyword');
  });

  it('shares the ten-a-minute limit with match', async () => {
    const { service } = makeService();
    for (let i = 0; i < 5; i++) {
      await service.match({ problem: `ภาษี ${i}` }, '8.8.8.8');
      await service.chat({ messages: [said(`ภาษี ${i}`)] }, '8.8.8.8');
    }
    await expect(
      service.chat({ messages: [said('ภาษี อีก')] }, '8.8.8.8'),
    ).rejects.toBeInstanceOf(HttpException);
  });
});

describe('readChatAnswer', () => {
  const ids = new Map(
    Array.from({ length: 12 }, (_, i) => [`s${i + 1}`, `id-${i + 1}`]),
  );
  const answer = (overrides: Partial<ChatAnswer>): ChatAnswer => ({
    search: null,
    reply: 'r',
    suggestions: [],
    ...overrides,
  });

  it('caps matches at four, topics at four, suggestions at three, and cuts long text', () => {
    const result = readChatAnswer(
      answer({
        search: {
          title: 'ก'.repeat(80),
          topics: ['a', 'b', 'c', 'd', 'e'],
          matches: [...ids.keys()].map((id) => ({ id, reason: 'x' })),
        },
        suggestions: ['1', '2', '3', '4'],
      }),
      ids,
    );
    expect(result.search?.matches.map((match) => match.serviceId)).toEqual(
      Array.from({ length: 4 }, (_, i) => `id-${i + 1}`),
    );
    expect(result.search?.topics).toEqual(['a', 'b', 'c', 'd']);
    expect(result.search?.title.length).toBeLessThanOrEqual(60);
    expect(result.suggestions).toEqual(['1', '2', '3']);
  });

  it('refuses a question with no words', () => {
    expect(() => readChatAnswer(answer({ reply: '   ' }), ids)).toThrow();
  });
});

describe('compactCatalogue and recentTurns', () => {
  it('names services by short refs in id order and leaves empty facts out', () => {
    const entry = {
      name: 'n',
      description: '  a\n\n b  ',
      categories: [],
      priceBaht: 500,
      minutes: 30,
      advisor: '',
      rating: null,
      reviews: 0,
      trialMinutes: null,
    };
    const { text, ids } = compactCatalogue([
      { ...entry, id: 'b' },
      { ...entry, id: 'a', description: 'ข'.repeat(300) },
    ]);
    const [first, second] = text
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(ids).toEqual(
      new Map([
        ['s1', 'a'],
        ['s2', 'b'],
      ]),
    );
    // No description and no advisor: the name, categories, price and length carry the choice.
    expect(first).toEqual({ id: 's1', n: 'n', p: 500, m: 30 });
    expect(second).toEqual({ id: 's2', n: 'n', p: 500, m: 30 });
  });

  it('reads at most the last ten turns, starting at one of the person’s', () => {
    const turns = Array.from({ length: 13 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: String(i),
    }));
    const recent = recentTurns(turns);
    expect(recent[0]).toEqual({ role: 'user', content: '4' });
    expect(recent.at(-1)).toEqual({ role: 'user', content: '12' });
    expect(recent.length).toBe(9);
  });
});

describe('createMatchingModelClient', () => {
  const configWith = (key?: string) =>
    ({ get: () => key }) as unknown as ConfigService;

  it('makes no client without a key, and one quick client with one', () => {
    expect(createMatchingModelClient(configWith())).toBeNull();
    const client = createMatchingModelClient(configWith('sk-test'));
    expect(client?.timeout).toBe(30_000);
    expect(client?.maxRetries).toBe(1);
  });

  it('is what Nest hands the service', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: AdvisorServicesService, useValue: {} },
        { provide: ServiceCategoriesService, useValue: {} },
        { provide: ConfigService, useValue: configWith() },
        {
          provide: MATCHING_MODEL_CLIENT,
          inject: [ConfigService],
          useFactory: createMatchingModelClient,
        },
      ],
    }).compile();
    expect(moduleRef.get(MatchingService)).toBeInstanceOf(MatchingService);
    expect(moduleRef.get(MATCHING_MODEL_CLIENT)).toBeNull();
  });
});

describe('MatchingChatRequestDto', () => {
  const check = (body: unknown) =>
    validate(plainToInstance(MatchingChatRequestDto, body));

  it('accepts a conversation that ends with the person', async () => {
    expect(
      await check({
        messages: [
          { role: 'user', content: 'สวัสดี' },
          { role: 'assistant', content: 'เรื่องอะไรคะ' },
          { role: 'user', content: 'ภาษี' },
        ],
      }),
    ).toEqual([]);
  });

  it.each([
    ['ends with the assistant', [{ role: 'assistant', content: 'x' }]],
    ['is empty', []],
    ['has a blank message', [{ role: 'user', content: '   ' }]],
    [
      'has an unknown role',
      [
        { role: 'system', content: 'x' },
        { role: 'user', content: 'y' },
      ],
    ],
    [
      'is too long',
      Array.from({ length: 21 }, () => ({ role: 'user', content: 'x' })),
    ],
  ])('refuses one that %s', async (_, messages) => {
    expect(await check({ messages })).not.toEqual([]);
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
