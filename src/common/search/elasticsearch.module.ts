import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { ENV_KEYS } from '@/config/env.constants';
import type { Env } from '@/config/env.schema';
import { ELASTICSEARCH_CLIENT } from './elasticsearch.client';
import { ElasticsearchGateway } from './elasticsearch.service';

@Module({
  providers: [
    {
      provide: ELASTICSEARCH_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Client => {
        const apiKey = config.get(ENV_KEYS.ELASTICSEARCH_API_KEY, {
          infer: true,
        });
        return new Client({
          node: config.get(ENV_KEYS.ELASTICSEARCH_NODE, { infer: true }),
          requestTimeout: config.get(
            ENV_KEYS.ELASTICSEARCH_REQUEST_TIMEOUT_MS,
            { infer: true },
          ),
          ...(apiKey ? { auth: { apiKey } } : {}),
        });
      },
    },
    ElasticsearchGateway,
  ],
  exports: [ELASTICSEARCH_CLIENT, ElasticsearchGateway],
})
export class ElasticsearchModule {}
