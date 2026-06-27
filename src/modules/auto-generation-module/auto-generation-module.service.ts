import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { GenerateBusinessAiDto } from './dtos/request/business-ai-generation.dto';
import { CATEGORY_TYPES_MAP } from './constants/category-types.map';
import { buildPromptV1 } from './Prompts/v1/prompets-mapper';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AutoGenerationService {
  private openai: OpenAI;
  private readonly logger = new Logger(AutoGenerationService.name);

  // Ordered fallback chain of free OpenRouter models. Each ':free' model has its
  // own rate-limit pool, so when the primary is throttled (429) we fall through
  // to the next. These IDs were verified against the live OpenRouter models API
  // (https://openrouter.ai/api/v1/models) as valid and zero-priced — re-check
  // there if any start returning 404, as free model availability changes often.
  private static readonly MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-4-31b-it:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
  ] as const;

  // Per-model transient-retry budget (5xx / timeouts). Rate limits (429) are NOT
  // retried on the same model — we switch models instead, which is far more
  // productive than re-hitting a throttled pool.
  private static readonly MAX_ATTEMPTS = 2;
  private static readonly BASE_DELAY_MS = 500;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENROUTER_API_KEY'),
      baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
      defaultHeaders: {
        'HTTP-Referer': this.configService.get<string>('APP_HTTP_REFERER'),
        'X-Title': this.configService.get<string>('APP_X_TITLE'),
      },
      // Disable the SDK's built-in retries: it honors OpenRouter's
      // `Retry-After: ~60s` on 429s, which stacks on top of our own retry layer
      // and hangs the request for minutes. Our withRetry() is the single source
      // of retry truth. Cap each attempt so a stalled call fails fast.
      maxRetries: 0,
      timeout: 20000,
    });
  }

  async generateBusinessContent(dto: GenerateBusinessAiDto) {
    if (!CATEGORY_TYPES_MAP[dto.category]?.includes(dto.type)) {
      throw new BadRequestException('Invalid business type for selected category');
    }

    if (!dto.mainItems || dto.mainItems.length === 0) {
      throw new BadRequestException('mainItems must contain at least one item');
    }

    const prompt = buildPromptV1(dto);

    // DESCRIPTION
    const completion = await this.createCompletionWithFallback(
      {
        messages: [
          {
            role: 'system',
            content: 'You write concise, engaging local business descriptions. Focus on what makes the business unique. Avoid generic phrases. Use natural, customer-friendly language.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 200, // IMPORTANT for free tier
      },
      'description',
    );

    const description = completion?.choices[0]?.message?.content?.trim() ?? 'Professional business description is currently unavailable.';

    // TAGS
    const tagCompletion = await this.createCompletionWithFallback(
      {
        messages: [
          {
            role: 'user',
            content: `
Generate up to 10 SEO-friendly tags.
Return only comma-separated lowercase words.

Description:
${description}
`,
          },
        ],
        temperature: 0.4,
        max_tokens: 60,
      },
      'tags',
    );

    const rawTags = tagCompletion?.choices[0]?.message?.content ?? '';

    const tags = rawTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      description,
      tags,
    };
  }

  // Tries each model in the fallback chain in order. Per model, withRetry handles
  // transient hiccups; if the model still fails (e.g. it is rate-limited), we move
  // to the next model. If every model is exhausted, returns null so the caller
  // degrades to placeholder content instead of failing the whole request.
  private async createCompletionWithFallback(
    params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, 'model'>,
    label: string,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion | null> {
    for (const model of AutoGenerationService.MODELS) {
      try {
        return await this.withRetry(() => this.openai.chat.completions.create({ ...params, model }), `${label} (${model})`);
      } catch (err) {
        const status = (err as { status?: number })?.status;
        this.logger.warn(`OpenRouter "${label}" failed on ${model} (status ${status ?? 'unknown'}); trying next model.`);
      }
    }

    this.logger.error(`OpenRouter "${label}" exhausted all fallback models; using default content.`);
    return null;
  }

  // Runs a single model's call with bounded exponential-backoff retries for
  // transient failures only (timeouts / 5xx). Rate limits (429) and other 4xx
  // errors fail fast so the caller can fall through to the next model.
  private async withRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= AutoGenerationService.MAX_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;

        const status = (err as { status?: number })?.status;
        // Retry timeouts / server errors and SDK connection errors (which include
        // request-timeout aborts and have no HTTP status). 429s are intentionally
        // excluded — they are handled by switching models, not re-hitting the pool.
        const isRetryable =
          status === 408 ||
          (typeof status === 'number' && status >= 500) ||
          err instanceof OpenAI.APIConnectionError;

        if (!isRetryable || attempt === AutoGenerationService.MAX_ATTEMPTS) {
          break;
        }

        const delayMs = AutoGenerationService.BASE_DELAY_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
        this.logger.warn(`OpenRouter "${label}" call failed (status ${status ?? 'unknown'}); retry ${attempt}/${AutoGenerationService.MAX_ATTEMPTS - 1} in ${delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }
}
