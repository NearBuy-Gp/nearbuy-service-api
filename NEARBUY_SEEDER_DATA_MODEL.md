# NearBuy — Data-Model Inventory (Seeder Phase 0)

This is the verified field-by-field inventory the v2 seeder
(`src/common/seed/v2/`) is built against. Everything below was read from the
actual schemas/enums/validators — not inferred.

## Stack & conventions

- **Language/Framework:** TypeScript, NestJS 11.
- **DB/ODM:** MongoDB (Atlas) via Mongoose 8 (`@nestjs/mongoose`).
- **Infra:** Redis + BullMQ (queue `notifications`), Mongo change streams,
  Firebase Admin (FCM), Cloudinary, OpenRouter + Gemini, external NLP service.
- **Seeders** bootstrap the app with `NestFactory.createApplicationContext(AppModule)`
  and resolve models via `getModelToken(...)`. Run with
  `ts-node -r tsconfig-paths/register`.
- **Geo convention:** GeoJSON Points store `[longitude, latitude]`.

## Entities & relationships

```
User (role=owner) ──1:1*──> Business ──1:N──> Item
                                 │                │
                                 └─ category/type └─ categoryId ─> Category
User (role=user) ──> UserInterest ──> NotificationSubscription ──> NotificationDelivery
```
*One-user-one-business is enforced by the seeder (one OWNER per business), not by
the schema. `Business.ownerId` is a `ref:User` with no uniqueness constraint.*

`BusinessCategory` and `BusinessType` are **code enums** (not tables). `Category`
is a reference collection scoped by `ItemType`; items reference a `Category`
whose `itemType` matches the item's discriminator `type`.

## User — `src/modules/user/schemas/user.schema.ts`

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| userName | string | no | — | |
| email | string | **yes** | — | **unique** |
| password | string | yes | — | bcrypt hash |
| role | enum `Role` | yes | `user` | `owner` \| `user` |
| fcmToken | string\|null | no | null | FCM push token |
| bookmarkedBusinesses | ObjectId[] (ref Business) | yes | — | indexed |
| createdAt/updatedAt | Date | auto | — | `timestamps:true` |

## Business — `src/modules/business/schemas/buisness.schema.ts`

Required: `name`, `category`, `type`, `address`, `location.coordinates`,
`ownerId`. Optional but **all populated by the seeder**: `description`, `tags[]`,
`subcategory`, `phone`, `email`, `website`, `whatsappNumber`,
`social{facebook,instagram,tiktok,twitter,linkedin}`, `workingHours[]`
(`{day, From, to, isClosed}`), `images[]`, `status` (enum, default `open`),
`ratings[]` (`{userId,rate 0–5}`), `rate` (0–5), `numberOfRatings`,
`targetAudience[]`, `mainItems[]`, `facilities[]`, `targetAudienceOther[]`,
`mainItemsOthers[]`, geohash tiers (`geohash`, `geohash_country` … `geohash_building`),
`is_open_now`, `lastOpenedAt`, `attributes{}` (Mixed). Indexes: 2dsphere on
`location`, geohash×8, `ownerId`, `is_open_now`.

## Item — `src/modules/item/schemas/item.schema.ts` (collection `items`, `discriminatorKey: type`)

Required: `name`, `price` (default 0), `businessId` (ref), `type` (enum `ItemType`),
`categoryId` (ref Category), `businessName`, `businessCategory`, `businessType`,
`location.coordinates`. Other: `description`, `images[]`, `isAvailable` (def true),
`is_in_stock` (def true), `lastRestockedAt`, `businessRate` (0–5), `workingHours[]`,
`embedding[]` (384 numbers).

Type-specific `attributes` come from **registered discriminators**
(`item-types.schema.ts`): RESTAURANT (`menuCategory*`, `otherMenuCategory`,
`sizes*`, `tags[]`), CLINIC (`doctorName*`, `doctorSpecialization`, `waitingPeriod`),
CLASS_SESSION (`trainerName*`, `schedule`, `duration`, `capacity`, `intensityLevel`
low/medium/high), MEMBERSHIP, SUPER_MARKET_PRODUCT (`brand`,`weight`,`stock`),
CLOTHING_PRODUCT (`sizes*[]`,`colorsAvailable[]`,`material`,`brand`,`stock`),
PHARMACY_PRODUCT (`brand`,`activeIngredients[]`,`dosageForm`,`packageSize`,`stock`).
**No discriminator for SERVICE / MENU_ITEM / PRODUCT** — items of those types are
plain base docs (no typed attributes). The seeder uses only the discriminated
types plus SERVICE.

## Category — `src/modules/categories/schemas/categories.schema.ts`

`name*`, `itemType*` (enum), `key*`. Unique compound `{key,itemType}`. Seed data:
`ITEM_CATEGORY_SEED` in `item-filter-category.schema.ts` (SERVICE, CLINIC,
CLASS_SESSION, MEMBERSHIP, RESTAURANT, SUPER_MARKET_PRODUCT, PHARMACY_PRODUCT,
CLOTHING_PRODUCT have category lists; MENU_ITEM/PRODUCT are empty).

## Enums

- **BusinessCategory** (5): store, gym, clinic, restaurant, service.
- **BusinessType** (34): electronics, clothing, supermarket, pharmacy, fast_food,
  cafe, dessert, seafood, dentist, dermatology, pediatric, general_clinic,
  crossfit, bodybuilding, pilates, repair, cleaning, beauty, consulting, fashion,
  grocery, health, sports, home, toys, medical, salon, fitness, education,
  automotive, food_beverage, entertainment, travel, other.
- **CATEGORY_TYPES_MAP** validly maps only **19** of those 34 types:
  STORE=[electronics,clothing,supermarket,pharmacy], RESTAURANT=[fast_food,cafe,
  dessert,seafood], CLINIC=[dentist,dermatology,pediatric,general_clinic],
  GYM=[crossfit,bodybuilding,pilates], SERVICE=[repair,cleaning,beauty,consulting].
  The other **15** are "orphans" (force-assigned by the seeder — see
  `type-plan.ts`).
- **ItemType** (10): service, clinic, class_session, membership, restaurant,
  super_market_product, pharmacy_product, clothing_product, MENU_ITEM, PRODUCT.
- Also: BusinessStatus (open/closed/temporarily_closed), BusinessFacility (42),
  BusinessMainItem (88), BusinessTargetAudience (6), RestaurantItemCategory,
  SizeEnum (small/medium/large), ClothesCategory, WeekDays, Role.

## Search module

Atlas Vector Search. Items get an `embedding` (384-dim) at create time via
`EmbedClientService.createEmbedding(payload)` → POST `${NLP_SERVICE_URL}/index`
(throws on failure; validates 384 dims). Real vector queries need an Atlas index
named **`vector_index`** on `items.embedding` (cosine), created manually in the
Atlas UI. The "Smart Notification / Repeated Search" feature records
`UserInterest` from search side-effects and, at score ≥ 3, upserts a BEHAVIORAL
subscription and enqueues a job.

## Notification module

- **NotificationType** (4): RESTOCK, BUSINESS_OPEN, PROXIMITY, BEHAVIORAL.
- **NotificationSubscription**: `userId*`, `type*`, `businessId?`, `itemId?`,
  `searchIntent?{businessType,businessCategory,searchVector[],keywords[],
  original_query,modifiers{is_cheap,rating_min}}`, `interestRef?`, `isActive`,
  `snoozedUntil?`, `lastNotifiedAt?`, `notifyCount`, `geofence{radiusMeters=300}`,
  `expiresAt?` (TTL).
- **NotificationDelivery**: `subscriptionId?`, `userId*`, `type*`, `businessId?`,
  `itemId?`, `triggeredAt`, `channel` (FCM\|LOCAL), `status`
  (SENT\|FAILED\|READ\|DISMISSED), `scoreAtSend`, `searchContext?`. TTL 60 days.
- **UserInterest** (collection `user_interests`, unique `{userId,biz_type}`):
  `keyword*`, `biz_type*`, `category*`, `score`, `rawScore`, `lastUpdated`,
  `lastDecayApplied`, `searchHistory[]{searchedAt,hour,dayOfWeek}`,
  `peakSearchHour`, `peakSearchDay`, `lastConversionAt`, `conversionCount`.
- Production path: Mongo change streams → BullMQ processor → Firebase. The seeder
  inserts representative rows directly (and sets `fcmToken` so the real pipeline
  could fire).

## Reused app code (not reimplemented)

`getCoordinates` (Nominatim geocoding), `ngeohash` precision tiers,
`EmbedClientService` (embeddings), `ITEM_CATEGORY_SEED` (reference data),
`CATEGORY_TYPES_MAP`, OpenRouter client config from `AutoGenerationService`.

## Env vars

`MONGODB_URI`, `NLP_SERVICE_URL`, `OPENROUTER_API_KEY`, `OPENAI_BASE_URL`,
`APP_HTTP_REFERER`, `APP_X_TITLE`, Redis (`REDIS_HOST/PORT/PASSWORD`),
`FIREBASE_SERVICE_ACCOUNT`, `GEMINI_API_KEY`.
