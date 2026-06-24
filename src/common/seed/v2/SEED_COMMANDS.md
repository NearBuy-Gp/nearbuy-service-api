# NearBuy Seeder (v2) — Commands & Flags

How to populate the database with realistic test data: owners, consumers,
businesses, items, categories, and semantic embeddings.

> Secrets (DB URI, API keys) are **never** passed on the command line — they are
> read from your env file (`.env.development` / `.env.production`) exactly like
> the running app.

---

## npm scripts

| Script | What it does |
|---|---|
| `npm run seed:v2` | Run the v2 seeder with defaults. **Adds/updates** seeded data (idempotent upsert); does **not** delete anything. |
| `npm run seed:v2:fresh` | Same as above, but first **deletes all previously-seeded records** (seeded-only), then re-seeds. Use for a clean, known dataset. |
| `npm run seed:v2:no-ai` | Run with faker-generated catalogs instead of calling the AI provider. Fastest; no API key needed. |
| `npm run seed:v2:dry` | **Dry run** — computes and prints the plan + counts, **writes nothing** to the DB. Safe to preview. |

All four are the same underlying script ([orchestrator.ts](./orchestrator.ts)) with different default flags. You can pass any extra flag after `--` (see below).

### Legacy / v1 scripts (separate, older seeder — not v2)

| Script | What it does |
|---|---|
| `npm run seed` | v1 business seeder. |
| `npm run seed:categories` | Seed item categories only. |
| `npm run seed:combined` | v1 combined seed. |
| `npm run seed:remove` | Remove v1 combined-seed data. |
| `npm run seed:create-vector-index` | Create the Atlas vector search index for embeddings. |

> `--fresh` cleanup in **v2** only removes **v2-seeded** records (by seed email
> domain `@nearbuy.seed` and `attributes.seedTag = "nb-seed-v2"`). It never
> touches v1/legacy data or real data.

---

## Flags

Pass after `--`, e.g. `npm run seed:v2 -- --count 10 --location "Maadi, Cairo"`.

| Flag | Default | Description |
|---|---|---|
| `--fresh` | off | Delete previously-seeded (v2-only) records before seeding. |
| `--no-ai` | off (AI on) | Use faker catalogs instead of the AI provider. |
| `--no-embeddings` | off (embeddings on) | Skip all NLP `/index` embedding calls. Much faster; items won't be semantically searchable. |
| `--dry-run` | off | Print the plan + counts, write nothing. |
| `--count <n>` | `5` | Businesses **per business type** (34 types → `5` = 170 businesses). |
| `--items <n>` | `8` | Items per business. |
| `--consumers <n>` | `12` | Consumer (`role=user`) accounts created. |
| `--location <name>` | `Nasr City, Cairo` | Location to geocode. **Repeatable** — businesses are scattered round-robin across all given centers (~6 km radius each). |
| `--concurrency <n>` | `5` | Max concurrent embedding requests. Lower it on flaky networks. |
| `--seed <int>` | `1337` | RNG seed — same seed ⇒ reproducible data. |
| `--randomize` | off | Ignore `--seed` and randomize each run. |

---

## Key differences at a glance

- **`seed:v2` vs `seed:v2:fresh`** — `:v2` keeps existing seeded data and upserts on top; `:fresh` wipes seeded data first. **`:fresh` is location-agnostic** — it deletes *all* seeded records regardless of which location they were seeded at.
- **AI on (default) vs `--no-ai` / `:no-ai`** — AI generates realistic item names/descriptions via the configured provider; faker is offline, instant, and needs no key. On AI failure, it auto-falls back to faker per category.
- **embeddings on (default) vs `--no-embeddings`** — embeddings make items work in semantic search (calls the NLP service ~`businesses × items` times). Skipping is much faster for quick data-shape testing.
- **`:dry` vs the rest** — dry-run never connects-to-write; use it to confirm counts/locations before a real run.

---

## AI provider config (env)

The seeder's AI provider is **independent** of the app's, so you can point the
seeder at a different provider (e.g. Groq) while the app stays on OpenRouter.

```env
# Seeder AI provider (falls back to the app's OPENROUTER_API_KEY / OPENAI_BASE_URL if unset)
SEED_AI_BASE_URL=https://api.groq.com/openai/v1
SEED_AI_API_KEY=gsk_...                 # provider key
SEED_AI_MODEL=llama-3.3-70b-versatile   # a model id valid for that provider
```

- `SEED_AI_MODEL` must be a **model id**, not an API key (e.g. `llama-3.3-70b-versatile` for Groq, `google/gemma-2-9b-it` for OpenRouter).
- If no AI provider is configured, or a call fails, the seeder falls back to faker catalogs and keeps going.

---

## Common examples

```bash
# Clean re-seed with defaults (Nasr City, AI on, embeddings on)
npm run seed:v2:fresh

# Preview the plan without writing
npm run seed:v2:dry

# Fast offline seed: no AI, no embeddings
npm run seed:v2 -- --no-ai --no-embeddings

# Seed multiple Cairo districts in ONE run (scattered round-robin)
npm run seed:v2:fresh -- \
  --location "Masr El Gedida, Cairo" \
  --location "Maadi, Cairo" \
  --location "Abbassia, Cairo" \
  --location "6th of October City, Giza"

# Bigger dataset, lower embedding concurrency for a flaky network
npm run seed:v2:fresh -- --count 10 --concurrency 3
```

> **Multiple locations must be in a single run.** Owners/businesses are keyed by
> type+index (not location), so a *second* run with a new location **relocates**
> the same businesses rather than adding a new set.

---

## Verifying a run

1. **During the run (Phase 3)** — confirm every location geocoded; none should say `using Cairo fallback`:
   ```
   • Geocoded "Maadi, Cairo" → [lng 31.26306, lat 29.96033]
   ```

2. **After the run** — count seeded businesses near each center:
   ```bash
   mongosh "$(grep '^MONGODB_URI=' .env.development | cut -d= -f2-)" --quiet --eval '
   const centers=[{n:"Masr El Gedida",lng:31.33306,lat:30.11481},{n:"Maadi",lng:31.26306,lat:29.96033},{n:"Abbassia",lng:31.28411,lat:30.07276},{n:"October",lng:30.94092,lat:29.97235}];
   const dKm=(a,b)=>{const R=6371,r=x=>x*Math.PI/180,dLa=r(b.lat-a.lat),dLo=r(b.lng-a.lng);const h=Math.sin(dLa/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
   const c={};centers.forEach(x=>c[x.n]=0);let other=0,total=0;
   db.businesses.find({"attributes.seedTag":"nb-seed-v2"},{location:1}).forEach(b=>{total++;const p={lng:b.location.coordinates[0],lat:b.location.coordinates[1]};let bn=null,bd=1e9;centers.forEach(x=>{const d=dKm(p,x);if(d<bd){bd=d;bn=x.n;}});bd<=10?c[bn]++:other++;});
   print("total seeded businesses: "+total);printjson(c);print("far from all centers: "+other);
   '
   ```
   Expect ~`count × 34` total, split roughly evenly across centers, `far from all centers: 0`.
