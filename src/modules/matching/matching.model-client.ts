import Anthropic from '@anthropic-ai/sdk';
import type { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';

/** The Claude client `POST /matching/chat` asks: one for the app, `null` without a key. */
export const MATCHING_MODEL_CLIENT = Symbol('MATCHING_MODEL_CLIENT');

/** Long enough for a short structured answer; one retry, so a caller waits a minute at worst. */
const MODEL_TIMEOUT_MS = 30_000;
const MODEL_MAX_RETRIES = 1;

export function createMatchingModelClient(
  config: ConfigService,
): Anthropic | null {
  const apiKey = config.get<string>(ENV_KEYS.ANTHROPIC_API_KEY);
  return apiKey
    ? new Anthropic({
        apiKey,
        timeout: MODEL_TIMEOUT_MS,
        maxRetries: MODEL_MAX_RETRIES,
      })
    : null;
}
