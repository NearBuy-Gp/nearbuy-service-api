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
import { CatalogBundle, CatalogItem, fakerBundle, fakerBusinessContent, fakerUniqueItems } from './catalog.faker';

// Model id is env-configurable via SEED_AI_MODEL so it can be swapped without a
// code change when an OpenRouter model is retired. Default is a current free model.
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';

export class AiCatalogGenerator {
  private client: OpenAI | null = null;
  private readonly model: string;
  private readonly cache = new Map<BusinessType, CatalogBundle>();
  // Pool of UNIQUE items per type, sized for ALL instances of that type, so the
  // seeder can hand every business a disjoint slice (no repeated item name
  // across branches/locations). Keyed by `${type}:${total}`.
  private readonly poolCache = new Map<string, CatalogItem[]>();
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
        bundle = await this.generate(type, category, itemType, count, []);
      } catch (err) {
        log.warn(`AI catalog failed for "${type}" (${(err as Error).message}); falling back to faker.`);
        bundle = fakerBundle(type, category, itemType, count);
      }
    }
    this.cache.set(type, bundle);
    return bundle;
  }

  /**
   * Build one bundle PER business instance of a type, each with a DISJOINT slice
   * of a single unique item pool and its own business name. This is what fixes
   * the "same item seeded in different locations" problem: every branch gets
   * distinct item names (still on-theme for the type), never exact duplicates.
   *
   * Cost is unchanged vs. the old per-type call — still one AI request per type,
   * it just asks for `itemsPerBusiness × instances` items in a single shot.
   */
  async getInstanceBundles(
    type: BusinessType,
    category: BusinessCategory,
    itemType: ItemType,
    itemsPerBusiness: number,
    instances: number,
    categoryNames: string[] = [],
  ): Promise<CatalogBundle[]> {
    const total = Math.max(itemsPerBusiness * Math.max(instances, 1), itemsPerBusiness);
    const pool = await this.getUniquePool(type, category, itemType, total, categoryNames);

    const bundles: CatalogBundle[] = [];
    for (let i = 0; i < instances; i++) {
      const slice = pool.slice(i * itemsPerBusiness, i * itemsPerBusiness + itemsPerBusiness);
      bundles.push({
        // Fresh business content per instance → distinct names; the index lets
        // a slice of each type adopt a real CSV brand (Carrefour, El Ezaby, …).
        business: fakerBusinessContent(type, category, i),
        items: slice,
      });
    }
    return bundles;
  }

  /** Unique item pool sized for all instances of a type (AI, faker fallback). */
  private async getUniquePool(type: BusinessType, category: BusinessCategory, itemType: ItemType, total: number, categoryNames: string[]): Promise<CatalogItem[]> {
    const key = `${type}:${total}`;
    const cached = this.poolCache.get(key);
    if (cached) return cached;

    let items: CatalogItem[];
    if (this.disabled || !this.client) {
      items = fakerUniqueItems(type, itemType, total, categoryNames);
    } else {
      try {
        const generated = await this.generate(type, category, itemType, total, categoryNames);
        items = generated.items;
      } catch (err) {
        log.warn(`AI catalog failed for "${type}" (${(err as Error).message}); falling back to faker.`);
        items = fakerUniqueItems(type, itemType, total, categoryNames);
      }
    }
    this.poolCache.set(key, items);
    return items;
  }

  private async generate(type: BusinessType, category: BusinessCategory, itemType: ItemType, count: number, categoryNames: string[]): Promise<CatalogBundle> {
    const prompt = this.buildPrompt(type, category, count, categoryNames);

    const items = await retry(async () => {
      const completion = await this.client!.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a data generator. Reply with ONLY a valid JSON array, no prose, no markdown fences.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        // Scale the output budget to the requested item count — a flat cap
        // truncates large pools mid-array (finish_reason=length), which then
        // fails to parse and silently degrades to faker. ~90 tokens/item plus
        // headroom, bounded so we never request an absurd budget.
        max_tokens: Math.min(8000, 600 + count * 90),
      });
      const raw = completion.choices[0]?.message?.content ?? '';
      const parsed = this.parseItems(raw, categoryNames);
      if (parsed.length === 0) throw new Error('no valid items parsed');
      return parsed;
    }, 3, 500);

    const cleaned = this.repair(items, type, itemType, count, categoryNames);
    log.step(`AI catalog for ${type}: ${cleaned.length} items.`);
    return {
      business: fakerBusinessContent(type, category), // business name/desc/tags stay deterministic & safe
      items: cleaned,
    };
  }

  private buildPrompt(type: BusinessType, category: BusinessCategory, count: number, categoryNames: string[]): string {
    const lines = [
      `Generate ${count} realistic products or services offered across several DIFFERENT branches of "${type.replace(/_/g, ' ')}" businesses (each a ${category}) located in different districts of Cairo, EGYPT.`,
      `Return ONLY a JSON array. Each element: {"name": string, "description": string (one sentence), "price": number${categoryNames.length ? ', "category": string' : ''}}.`,
      'LOCALIZATION (critical): this is for an Egyptian marketplace. Use authentic items an everyday Egyptian shopper actually encounters in local commercial areas — e.g. koshary, hawawshi, baladi bread, kunafa, El Arosa tea, Juhayna milk, Panadol Extra, Vodafone/WE devices — NOT generic Western placeholders.',
      'SCRIPT (critical): the app does NOT render Arabic. Use ONLY Latin script. Write Egyptian item names transliterated (Franco-Arabic), e.g. "Koshary", "Hawawshi", "Shai bel Na3na3", optionally with a short English clarifier in parentheses. NEVER output Arabic letters.',
      'DESCRIPTION: one English sentence (Egyptian terms may be transliterated). Keep it Latin-script only.',
      `PRICE: a realistic number in EGYPTIAN POUNDS (EGP), reflecting 2025-2026 street pricing (e.g. a falafel sandwich ~25, a shawarma ~85, a doctor visit ~350, a flagship phone ~60000). Do NOT use US dollars.`,
      'Use real, specific, recognizable item names — not placeholders.',
      `CRITICAL: all ${count} names must be DISTINCT from each other — no repeats, no two items sharing the same name. They should be on-theme for this business type and may be similar in category, but each name must be unique.`,
    ];
    if (categoryNames.length) {
      lines.push(`Set "category" to EXACTLY one value from this list, choosing the best fit for each item: [${categoryNames.join(', ')}]. Do not invent other categories.`);
      lines.push(`Example: [{"name":"Koshary (Family Size)","description":"Classic Egyptian koshary with rice, pasta, lentils and crispy onions.","price":70,"category":"${categoryNames[0]}"}]`);
    } else {
      lines.push('Example: [{"name":"Koshary (Family Size)","description":"Classic Egyptian koshary with rice, pasta, lentils and crispy onions.","price":70}]');
    }
    return lines.join('\n');
  }

  private parseItems(raw: string, categoryNames: string[]): CatalogItem[] {
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
    // Canonicalize the model's category string against the allowed list so a
    // case/whitespace mismatch still resolves to a valid DB category.
    const canon = new Map(categoryNames.map((n) => [n.toLowerCase(), n]));
    const out: CatalogItem[] = [];
    for (const el of arr) {
      if (el && typeof el === 'object') {
        const name = String((el as any).name ?? '').trim();
        const description = String((el as any).description ?? '').trim();
        const priceNum = Number((el as any).price);
        const rawCat = String((el as any).category ?? '').trim().toLowerCase();
        if (name) {
          out.push({
            name,
            description: description || `${name}.`,
            price: Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum) : faker.number.int({ min: 5, max: 200 }),
            category: canon.get(rawCat), // undefined if the model returned an out-of-list value
          });
        }
      }
    }
    return out;
  }

  /** Dedupe by name and pad to `count` from faker if the model returned too few. */
  private repair(items: CatalogItem[], type: BusinessType, itemType: ItemType, count: number, categoryNames: string[]): CatalogItem[] {
    const seen = new Set<string>();
    const unique = items.filter((it) => {
      const key = it.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (unique.length >= count) return unique.slice(0, count);
    // Pad shortfalls from the unique faker generator and keep names distinct,
    // so a thin AI response never reintroduces duplicate item names.
    const filler = fakerUniqueItems(type, itemType, count, categoryNames).filter((it) => !seen.has(it.name.toLowerCase()));
    return [...unique, ...filler].slice(0, count);
  }
}
