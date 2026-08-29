import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import type { estypes } from '@elastic/elasticsearch';
import {
  ELASTICSEARCH_CLIENT,
  type ElasticsearchClient,
} from './elasticsearch.client';

export interface ElasticsearchPage<TDocument> {
  documents: TDocument[];
  total: number;
}

@Injectable()
export class ElasticsearchGateway implements OnApplicationShutdown {
  constructor(
    @Inject(ELASTICSEARCH_CLIENT)
    private readonly client: ElasticsearchClient,
  ) {}

  async search<TDocument>({
    index,
    query,
    from,
    size,
    sort,
  }: {
    index: string;
    query: estypes.QueryDslQueryContainer;
    from: number;
    size: number;
    sort?: estypes.SortCombinations;
  }): Promise<ElasticsearchPage<TDocument>> {
    const result = await this.client.search<TDocument>({
      index,
      query,
      from,
      size,
      ...(sort ? { sort } : {}),
    });
    return {
      documents: result.hits.hits.flatMap((hit) =>
        hit._source ? [hit._source] : [],
      ),
      total:
        typeof result.hits.total === 'number'
          ? result.hits.total
          : (result.hits.total?.value ?? 0),
    };
  }

  indexExists(index: string): Promise<boolean> {
    return this.client.indices.exists({ index });
  }

  createIndex({
    index,
    mappings,
  }: {
    index: string;
    mappings: estypes.MappingTypeMapping;
  }): Promise<void> {
    return this.client.indices
      .create({ index, mappings })
      .then(() => undefined);
  }

  deleteIndex(index: string): Promise<void> {
    return this.client.indices.delete({ index }).then(() => undefined);
  }

  async indexDocument<TDocument>({
    index,
    id,
    document,
  }: {
    index: string;
    id: string;
    document: TDocument;
  }): Promise<void> {
    await this.client.index({ index, id, document, refresh: 'wait_for' });
  }

  async deleteDocument({
    index,
    id,
  }: {
    index: string;
    id: string;
  }): Promise<void> {
    await this.client.delete({ index, id, refresh: 'wait_for' });
  }

  async bulkIndex<TDocument extends { id: string }>({
    index,
    documents,
  }: {
    index: string;
    documents: readonly TDocument[];
  }): Promise<void> {
    if (documents.length === 0) {
      return;
    }
    await this.client.bulk({
      refresh: 'wait_for',
      operations: documents.flatMap((document) => [
        { index: { _index: index, _id: document.id } },
        document,
      ]),
    });
  }

  close(): Promise<void> {
    return this.client.close();
  }

  onApplicationShutdown(): Promise<void> {
    return this.close();
  }
}
