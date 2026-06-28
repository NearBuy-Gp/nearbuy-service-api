/**
 * CLI / env configuration for the NearBuy v2 seeder.
 *
 * Flags (all optional):
 *   --fresh                 Delete previously-seeded records (seeded-only) before seeding.
 *   --no-ai                 Use faker catalogs instead of the AI provider.
 *   --dry-run               Compute & print the plan + counts, write nothing.
 *   --count <n>             Businesses per business type (default 5).
 *   --location <name>       Location name to geocode (repeatable). Default: Cairo center.
 *   --consumers <n>         Number of consumer (role=user) accounts (default 12).
 *   --items <n>             Items per business (default 8).
 *   --concurrency <n>       Max concurrent embedding requests (default 5).
 *   --seed <int>            RNG seed for reproducibility (default 1337).
 *   --randomize             Ignore --seed and randomize.
 *   --no-embeddings         Skip NLP embedding calls entirely.
 *
 * Secrets (API keys, DB URI) are NEVER read here — they come from the app's
 * ConfigService / env, exactly like the running application.
 */

export interface SeederConfig {
  fresh: boolean;
  useAi: boolean;
  dryRun: boolean;
  countPerType: number;
  itemsPerBusiness: number;
  consumers: number;
  concurrency: number;
  locations: string[];
  seed: number;
  randomize: boolean;
  embeddings: boolean;
}

// Spread businesses across the Cairo/Giza districts the search training set
// queries most, so geospatial ("near me", "in Maadi", "tagamoa") search is
// testable by default. Override/extend with repeatable --location flags.
const DEFAULT_LOCATIONS = [
  'Nasr City, Cairo',
  'Maadi, Cairo',
  'New Cairo, Cairo',
  'Heliopolis, Cairo',
  'Mohandessin, Giza',
  '6th of October City, Giza',
  'Zamalek, Cairo',
  'Sheikh Zayed, Giza',
  'Abbassia, Cairo',
];

function readFlagValue(argv: string[], flag: string): string[] {
  const values: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === flag && argv[i + 1] !== undefined) {
      values.push(argv[i + 1]);
    } else if (argv[i].startsWith(`${flag}=`)) {
      values.push(argv[i].slice(flag.length + 1));
    }
  }
  return values;
}

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag) || argv.some((a) => a.startsWith(`${flag}=`));
}

function readInt(argv: string[], flag: string, fallback: number): number {
  const raw = readFlagValue(argv, flag)[0];
  if (raw === undefined) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function parseConfig(argv: string[] = process.argv.slice(2)): SeederConfig {
  const locations = readFlagValue(argv, '--location');

  return {
    fresh: hasFlag(argv, '--fresh'),
    useAi: !hasFlag(argv, '--no-ai'),
    dryRun: hasFlag(argv, '--dry-run'),
    countPerType: readInt(argv, '--count', 5),
    itemsPerBusiness: readInt(argv, '--items', 8),
    consumers: readInt(argv, '--consumers', 12),
    concurrency: readInt(argv, '--concurrency', 5),
    locations: locations.length > 0 ? locations : DEFAULT_LOCATIONS,
    seed: readInt(argv, '--seed', 1337),
    randomize: hasFlag(argv, '--randomize'),
    embeddings: !hasFlag(argv, '--no-embeddings'),
  };
}

export function describeConfig(cfg: SeederConfig): string {
  return [
    `fresh=${cfg.fresh}`,
    `ai=${cfg.useAi}`,
    `embeddings=${cfg.embeddings}`,
    `dryRun=${cfg.dryRun}`,
    `countPerType=${cfg.countPerType}`,
    `itemsPerBusiness=${cfg.itemsPerBusiness}`,
    `consumers=${cfg.consumers}`,
    `concurrency=${cfg.concurrency}`,
    `locations=[${cfg.locations.join(' | ')}]`,
    `seed=${cfg.randomize ? 'random' : cfg.seed}`,
  ].join(', ');
}
