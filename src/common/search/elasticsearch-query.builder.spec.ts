import { buildElasticsearchQuery } from './elasticsearch-query.builder';

describe('buildElasticsearchQuery', () => {
  it('builds a typed query without mutating feature filters', () => {
    const filters = [
      { kind: 'term' as const, field: 'categoryId', value: 'category-id' },
      { kind: 'range' as const, field: 'priceSatang', gte: 100, lte: 200 },
    ];

    expect(
      buildElasticsearchQuery({
        text: { value: 'career', fields: ['name^3', 'description'] },
        filters,
      }),
    ).toEqual({
      bool: {
        must: [
          {
            multi_match: {
              query: 'career',
              fields: ['name^3', 'description'],
            },
          },
        ],
        filter: [
          { term: { categoryId: 'category-id' } },
          { range: { priceSatang: { gte: 100, lte: 200 } } },
        ],
      },
    });
    expect(filters).toHaveLength(2);
  });
});
