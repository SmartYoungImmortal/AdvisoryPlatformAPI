import type { Client } from '@elastic/elasticsearch';

export const ELASTICSEARCH_CLIENT = Symbol('ELASTICSEARCH_CLIENT');

export type ElasticsearchClient = Client;
