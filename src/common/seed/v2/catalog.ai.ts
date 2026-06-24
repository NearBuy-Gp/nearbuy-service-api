/**
 * AI catalog generator. Reuses the app's OpenRouter (OpenAI SDK) configuration
 * — same provider/model as AutoGenerationService (`google/gemma-2-9b-it`).
 *
 * For each (category,type) it asks for a JSON array of realistic items
 * {name, description, price}, then:
 *   - parses defensively (strips code fences, extracts the first JSON array),
 *   - validates each entry, retrying up to 3× with backoff,
 *   - backfills/repairs from faker when fields are missing,
 *   - dedupes by name.
 * Enum-constrained attributes (menuCategory, sizes, …) are NOT asked of the
 * model — they are assigned deterministically by the item seeder to guarantee
 * schema-valid values. Results are cached per business type.
 *
 * Any failure (no key, network, invalid JSON after retries) degrades cleanly to
 * the faker catalog so a run never breaks on AI.
 */
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { BusinessType } from '../../../modules/business/enums/business-type.enum';
import { BusinessCategory } from '../../../modules/business/enums/business-category.enum';
import { ItemType } from '../../../modules/item/enums/item-type.enum';
import { retry } from './concurrency';
import { faker } from './rng';
import { log } from './logger';
import { CatalogBundle, CatalogItem, fakerBundle, fakerBusinessContent } from './catalog.faker';

// Model id is env-configurable via SEED_AI_MODEL so it can be swapped without a
// code change when an OpenRouter model is retired. Default is a current free model.
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

export class AiCatalogGenerator {
  private client: OpenAI | null = null;
  private readonly model: string;
  private readonly cache = new Map<BusinessType, CatalogBundle>();
  private disabled = false;

  constructor(config: ConfigService) {
    this.model = config.get<string>('SEED_AI_MODEL') ?? DEFAULT_MODEL;
    // The seeder's AI provider can be configured independently of the app's
    // (SEED_AI_API_KEY / SEED_AI_BASE_URL), so the seeder can target e.g. Groq
    // while the running app stays on OpenRouter. Falls back to the app's vars.
    const apiKey = config.get<string>('SEED_AI_API_KEY') ?? config.get<string>('OPENROUTER_API_KEY');
    const baseURL = config.get<string>('SEED_AI_BASE_URL') ?? config.get<string>('OPENAI_BASE_URL');
    if (!apiKey || !baseURL) {
      this.disabled = true;
      log.warn('No AI provider configured (SEED_AI_API_KEY/SEED_AI_BASE_URL or OPENROUTER_API_KEY/OPENAI_BASE_URL) — AI catalogs disabled, using faker.');
      return;
    }
    this.client = new OpenAI({
      apiKey,
      baseURL,
      defaultHeaders: {
        'HTTP-Referer': config.get<string>('APP_HTTP_REFERER') ?? 'http://localhost:3000',
        'X-Title': config.get<string>('APP_X_TITLE') ?? 'NearBuy Seeder',
      },
    });
    log.step(`AI catalogs enabled via OpenRouter model "${this.model}" (override with SEED_AI_MODEL).`);
  }

  /** Cached per business type; varied per instance downstream. */
  async getBundle(type: BusinessType, category: BusinessCategory, itemType: ItemType, count: number): Promise<CatalogBundle> {
    if (this.cache.has(type)) return this.cache.get(type)!;

    let bundle: CatalogBundle;
    if (this.disabled || !this.client) {
      bundle = fakerBundle(type, category, itemType, count);
    } else {
      try {
        bundle = await this.generate(type, category, itemType, count);
      } catch (err) {
        log.warn(`AI catalog failed for "${type}" (${(err as Error).message}); falling back to faker.`);
        bundle = fakerBundle(type, category, itemType, count);
      }
    }
    this.cache.set(type, bundle);
    return bundle;
  }

  private async generate(type: BusinessType, category: BusinessCategory, itemType: ItemType, count: number): Promise<CatalogBundle> {
    const prompt = this.buildPrompt(type, category, count);

    const items = await retry(async () => {
      const completion = await this.client!.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a data generator. Reply with ONLY a valid JSON array, no prose, no markdown fences.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 900,
      });
      const raw = completion.choices[0]?.message?.content ?? '';
      const parsed = this.parseItems(raw);
      if (parsed.length === 0) throw new Error('no valid items parsed');
      return parsed;
    }, 3, 500);

    const cleaned = this.repair(items, type, itemType, count);
    log.step(`AI catalog for ${type}: ${cleaned.length} items.`);
    return {
      business: fakerBusinessContent(type, category), // business name/desc/tags stay deterministic & safe
      items: cleaned,
    };
  }

  private buildPrompt(type: BusinessType, category: BusinessCategory, count: number): string {
    return [
      `Generate ${count} realistic products or services that a real-world "${type.replace(/_/g, ' ')}" business (a ${category}) would actually offer.`,
      'Return ONLY a JSON array. Each element: {"name": string, "description": string (one sentence), "price": number (USD, realistic)}.',
      'Use real, specific, recognizable item names — not placeholders. No duplicates.',
      'Example: [{"name":"Margherita Pizza","description":"Wood-fired pizza with mozzarella and basil.","price":11}]',
    ].join('\n');
  }

  private parseItems(raw: string): CatalogItem[] {
    let text = raw.trim();
    // strip ```json ... ``` fences
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) return [];
    let arr: unknown;
    try {
      arr = JSON.parse(text.slice(start, end + 1));
    } catch {
      return [];
    }
    if (!Array.isArray(arr)) return [];
    const out: CatalogItem[] = [];
    for (const el of arr) {
      if (el && typeof el === 'object') {
        const name = String((el as any).name ?? '').trim();
        const description = String((el as any).description ?? '').trim();
        const priceNum = Number((el as any).price);
        if (name) {
          out.push({
            name,
            description: description || `${name}.`,
            price: Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum) : faker.number.int({ min: 5, max: 200 }),
          });
        }
      }
    }
    return out;
  }

  /** Dedupe by name and pad to `count` from faker if the model returned too few. */
  private repair(items: CatalogItem[], type: BusinessType, itemType: ItemType, count: number): CatalogItem[] {
    const seen = new Set<string>();
    const unique = items.filter((it) => {
      const key = it.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (unique.length >= count) return unique.slice(0, count);
    const filler = fakerBundle(type, BusinessCategory.STORE, itemType, count).items.filter((it) => !seen.has(it.name.toLowerCase()));
    return [...unique, ...filler].slice(0, count);
  }
}
