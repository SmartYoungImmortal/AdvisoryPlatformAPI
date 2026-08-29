import type { estypes } from '@elastic/elasticsearch';

type Scalar = boolean | number | string;

export type ElasticsearchFilter =
  | { kind: 'term'; field: string; value: Scalar }
  | { kind: 'range'; field: string; gte?: number; lte?: number };

export interface ElasticsearchTextQuery {
  fields: readonly string[];
  value: string;
}

/** Features map DTOs to explicit fields; arbitrary query-string keys never reach Elasticsearch. */
export function buildElasticsearchQuery({
  text,
  filters = [],
}: {
  text?: ElasticsearchTextQuery;
  filters?: readonly ElasticsearchFilter[];
}): estypes.QueryDslQueryContainer {
  return {
    bool: {
      must: text
        ? [
            {
              multi_match: {
                query: text.value,
                fields: [...text.fields],
              },
            },
          ]
        : [],
      filter: filters.map((filter) => {
        if (filter.kind === 'term') {
          return { term: { [filter.field]: filter.value } };
        }
        return {
          range: {
            [filter.field]: {
              ...(filter.gte !== undefined ? { gte: filter.gte } : {}),
              ...(filter.lte !== undefined ? { lte: filter.lte } : {}),
            },
          },
        };
      }),
    },
  };
}
