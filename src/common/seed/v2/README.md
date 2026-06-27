# NearBuy v2 Database Seeder

A production-grade, re-runnable seeder that fills **every field at every level**,
covers **all 34 business types** and **all 5 categories**, generates realistic
AI catalogs, attaches real 384-dim semantic embeddings, and seeds the full
notification surface — finishing with an automated verification report.

It is modular: one file per domain object, composed by an orchestrator.

```
src/common/seed/v2/
  config.ts            CLI / env flag parsing
  rng.ts               Seeded faker + shared seed tags
  logger.ts            Phased progress logging
  concurrency.ts       mapLimit() + retry() (no deps)
  type-plan.ts         34-type → {category, itemType} coverage map
  reference.seeder.ts  Category reference data (upsert)
  geo.seeder.ts        Geocoding (reuses app's getCoordinates) + geohashes
  user.seeder.ts       Owners (1:1 with business) + consumers
  business.seeder.ts   Fully-populated Business builder
  catalog.faker.ts     Deterministic faker catalogs (--no-ai path / fallback)
  catalog.ai.ts        OpenRouter (Gemma) JSON catalogs w/ validate+retry+backfill
  item.seeder.ts       Items + type-specific attributes + embeddings
  notification.seeder.ts  Interests, subscriptions, deliveries
  cleanup.ts           --fresh seeded-only deletes (FK-safe order)
  verify.ts            Coverage / completeness / search / notification asserts
  orchestrator.ts      Entry point — composes all phases
```

## Prerequisites

- A reachable MongoDB (`MONGODB_URI`) — the seeder bootstraps the real
  `AppModule`, so Redis/BullMQ env must also be valid (the app needs it to boot).
- For AI catalogs (default): `OPENROUTER_API_KEY`, `OPENAI_BASE_URL`
  (and optionally `APP_HTTP_REFERER`, `APP_X_TITLE`). Missing keys → auto
  fallback to faker, with a warning.
- For semantic embeddings: the NLP microservice at `NLP_SERVICE_URL` must
  respond. Unreachable → items are created without embeddings (logged); the run
  still succeeds.
- For **full semantic vector search**: an Atlas Search index named
  `vector_index` on `items.embedding` (384 dims, cosine) must exist. Create it
  in the Atlas UI (see `seed:create-vector-index` for the JSON). Verification
  falls back to a deterministic non-vector query and warns if it's absent.

No secrets are read from code — everything comes from the app's `ConfigService`.

## Run

```bash
# Fast, deterministic, no token spend (recommended first run)
npm run seed:v2:no-ai

# Preview the plan + counts, write nothing
npm run seed:v2:dry

# Full run: AI catalogs + real embeddings, wiping prior seeded data first
npm run seed:v2:fresh

# Custom flags (note the -- separator)
npm run seed:v2 -- --fresh --count 5 --location "Nasr City, Cairo" --location "Maadi, Cairo"
```

## Flags

| Flag | Default | Meaning |
|------|---------|---------|
| `--fresh` | off | Delete previously-seeded records (seeded-only, FK-safe) first |
| `--no-ai` | off | Use faker catalogs instead of the AI provider |
| `--no-embeddings` | off | Skip NLP embedding calls entirely |
| `--dry-run` | off | Print the plan + counts, write nothing |
| `--count <n>` | 5 | Businesses per business type (34 types → 34×n businesses) |
| `--items <n>` | 8 | Items per business |
| `--consumers <n>` | 12 | Consumer (role=user) accounts for notifications |
| `--concurrency <n>` | 5 | Max concurrent embedding requests |
| `--location <name>` | Nasr City, Cairo | Location to geocode (repeatable) |
| `--seed <int>` | 1337 | RNG seed (reproducible runs) |
| `--randomize` | off | Ignore `--seed` and randomize |

## Behaviour & guarantees

- **Idempotent**: users upsert by email, businesses by `ownerId`, items by
  `{businessId,name}`, interests by `{userId,biz_type}`, subscriptions by their
  natural key; deliveries are cleared per-consumer (seeded-only) then reinserted.
  Re-running with the same `--seed` produces the same data with no duplicates.
- **`--fresh` is safe on shared databases**: it only ever deletes records tagged
  as seeded (email domain `@nearbuy.seed`, `attributes.seedTag`, "Seed " name
  prefix). It never truncates a whole collection.
- **Full coverage**: all 34 `BusinessType` values get ≥`--count` businesses.
  The 15 types absent from the app's `CATEGORY_TYPES_MAP` are force-assigned a
  best-guess category (see `type-plan.ts`) and flagged as `orphan` in `--dry-run`.
- **Notifications**: every consumer ends with ≥1 interest, ≥1 subscription, and
  ≥1 delivery; all 4 notification types and all 4 delivery statuses are present.
- **Verification** runs automatically at the end and exits non-zero if any hard
  assertion fails.
```
