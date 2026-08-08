import { ConfigService } from '@nestjs/config';
import { Env } from './env.schema';

export type TypedConfigService = ConfigService<Env, true>;
