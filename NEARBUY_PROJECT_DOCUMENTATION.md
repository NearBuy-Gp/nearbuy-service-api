# NearBuy — Graduation Project Documentation (Reference Master)

> **Purpose of this file.** This is an internal *reference master* you can copy from while writing the formal thesis. It is organized to mirror the required thesis Table of Contents (Abstract → Chapter 1..6 → References) and it contains **everything the backend currently implements**: features, endpoints, schemas, enums, AI integrations, algorithms, and the run/deploy steps. Treat each section as raw material — copy the relevant prose, tables, and diagrams into the official template and trim as needed.
>
> Everything below was extracted directly from the source code in this repository (`nearbuy-service-api`). Where the thesis template asks for bracketed instructions (e.g. "[State all figures …]"), this file gives you the *content* to put there.

---

## 0. Front-Matter Helpers (for the template's first pages)

### 0.1 Suggested Project Title
**NearBuy — An AI-Powered Hyperlocal Discovery & Smart-Notification Platform for Local Businesses.**

### 0.2 One-line definition
NearBuy is a location-based marketplace/discovery backend that lets local business owners list their shops and catalog (manually or by AI-assisted bulk upload), and lets users **discover nearby businesses on a map** and **find products/services through natural-language semantic search**, while a **smart-notification engine** re-engages users based on their tracked interests.

### 0.3 Draft Abstract (English) — ~230 words (edit to fit 250–300)
> Local commerce suffers from a discovery gap: small businesses are hard to find online, their catalogs are rarely digitized, and existing map apps only show names and pins rather than *what is actually inside the shop*. NearBuy addresses this with a hyperlocal discovery platform built as a modular NestJS/MongoDB backend. The system lets business owners register a shop with precise geolocation and onboard their full catalog either manually or through an AI-assisted bulk-upload pipeline that parses CSV, Excel, PDF, image (vision OCR), and plain-text files and normalizes them into structured, typed items using a large language model. Discovery is delivered two ways: (1) a zoom-aware, geohash-clustered **map view** and radius-based "nearby" search using MongoDB 2dsphere indexes, and (2) a **natural-language semantic search** in which an external NLP microservice converts a user query into an intent blueprint plus a 384-dimensional embedding, and a dynamically-assembled MongoDB Atlas Vector Search aggregation pipeline ranks results by combining semantic similarity, rating, distance, price, time-availability and attribute filters. A **smart-notification subsystem** tracks user interest with weighted scoring and exponential time decay, detects repeated searches, and dispatches Firebase Cloud Messaging push notifications through a Redis/BullMQ queue gated by an "intelligence" layer (score thresholds, frequency cooldowns, quiet hours, conversion and snooze checks). The result is an extensible backend demonstrating that semantic retrieval, geospatial clustering, and behavior-aware messaging can be combined to make local commerce genuinely discoverable.

### 0.4 Draft Abstract (Arabic) — الملخص
> يعاني التجارة المحلية من فجوة في الاكتشاف: يصعب العثور على المتاجر الصغيرة عبر الإنترنت، ونادرًا ما تكون قوائم منتجاتها رقمية، وتكتفي تطبيقات الخرائط الحالية بعرض الأسماء والمواقع دون إظهار ما يوجد فعليًا داخل المتجر. يعالج تطبيق **NearBuy** هذه المشكلة من خلال منصة اكتشاف محلية مبنية على هيئة خادم خلفي معياري باستخدام NestJS وقاعدة بيانات MongoDB. يتيح النظام لأصحاب الأعمال تسجيل متاجرهم بموقع جغرافي دقيق وإدخال قوائم منتجاتهم يدويًا أو عبر مسار رفع جماعي مدعوم بالذكاء الاصطناعي يقوم بتحليل ملفات CSV وExcel وPDF والصور (عبر التعرّف البصري) والنصوص، ثم تحويلها إلى عناصر منظّمة ومصنّفة باستخدام نموذج لغوي كبير. ويُقدَّم الاكتشاف بطريقتين: عرض خريطة يعتمد على التجميع الجغرافي (geohash) حسب مستوى التكبير والبحث ضمن نطاق محدّد، وبحث دلالي بلغة طبيعية حيث تحوّل خدمة معالجة لغوية خارجية استعلام المستخدم إلى مخطط نوايا ومتجه تضمين بُعده 384، ثم يرتّب مسار تجميع متجهي في MongoDB النتائج بدمج التشابه الدلالي والتقييم والمسافة والسعر وأوقات العمل. كما يضم النظام محرّك إشعارات ذكية يتتبّع اهتمامات المستخدم بنظام تسجيل نقاط متناقص زمنيًا، ويكتشف عمليات البحث المتكررة، ويرسل إشعارات Firebase عبر طابور Redis/BullMQ محكوم بطبقة ذكاء. والنتيجة خادم خلفي قابل للتوسّع يثبت إمكانية جعل التجارة المحلية قابلة للاكتشاف فعليًا.

### 0.5 List of Abbreviations (fill the template's "List of Abbreviations")
| Abbreviation | Meaning |
|---|---|
| API | Application Programming Interface |
| REST | Representational State Transfer |
| JWT | JSON Web Token |
| DTO | Data Transfer Object |
| CRUD | Create, Read, Update, Delete |
| NLP | Natural Language Processing |
| LLM | Large Language Model |
| OCR | Optical Character Recognition |
| FCM | Firebase Cloud Messaging |
| TTL | Time To Live |
| CDN | Content Delivery Network |
| kNN | k-Nearest Neighbors |
| ANN | Approximate Nearest Neighbor |
| GeoJSON | Geographic JSON |
| 2dsphere | MongoDB spherical geospatial index |
| BSON | Binary JSON (MongoDB storage format) |
| CORS | Cross-Origin Resource Sharing |
| ODM | Object Document Mapper (Mongoose) |
| MVC | Model–View–Controller |
| SDK | Software Development Kit |
| CI | Continuous Integration |
| UTC | Coordinated Universal Time |

### 0.6 List of Symbols (fill the template's "List of Symbols")
| Symbol | Meaning |
|---|---|
| λ (lambda) | Exponential decay constant for interest score (= 0.015) |
| `final_score` | Composite ranking score in semantic search |
| 384 | Embedding vector dimensionality |
| `e^(−λt)` | Decay function applied to interest score over time *t* (days) |
| 6378.1 | Earth radius in km (used in Haversine distance) |

---

# Chapter 1 — Introduction

## 1.1 Problem Definition
Local ("hyperlocal") commerce has a structural discovery problem composed of three sub-problems:

1. **Invisible inventory.** A user standing 200 meters from a pharmacy that stocks a specific product has no way to know it. Map applications (Google Maps, etc.) index *businesses*, not their *items*. The question "who near me sells X right now?" is unanswerable.
2. **Un-digitized catalogs.** Small merchants rarely have the time or technical skill to type their entire menu/catalog into a system. Their data lives in paper menus, PDF price-lists, Excel sheets, or photos — formats no marketplace ingests automatically.
3. **Keyword-only search.** Even where item data exists, traditional search is literal keyword matching. A query like "something cheap and spicy near me that's open now" mixes intent (food), constraints (price, attribute, distance) and time, which keyword search cannot interpret.

Additionally, **re-engagement is naïve**: typical apps either spam users or never notify them. There is no mechanism that learns *what a user keeps looking for* and notifies them intelligently without causing notification fatigue.

## 1.2 Motivation
- **For users:** answer "what's near me, that has what I want, that's open, that's good, that's affordable" in a single natural sentence.
- **For merchants:** go from a photo of a menu to a fully structured, searchable online catalog in seconds, with AI writing their business description and tags.
- **For the platform:** turn passive search history into a respectful, intelligent notification channel that brings users back when there is genuinely relevant supply nearby.
- **Academically:** demonstrate an end-to-end system that fuses **geospatial indexing**, **vector/semantic retrieval**, **LLM-based data extraction**, and **behavioral notification intelligence** in one cohesive backend.

## 1.3 Objectives
1. Build a secure, role-based REST backend (business owners vs. users) with JWT authentication.
2. Model businesses with precise geolocation and an 8-level **geohash hierarchy** enabling map clustering at any zoom level.
3. Support a **polymorphic catalog** where one collection stores restaurants' dishes, clinics' services, gym classes, pharmacy/supermarket products, and clothing, each with type-specific validated attributes.
4. Provide **AI-assisted bulk onboarding**: parse CSV/Excel/PDF/image/text → normalize to typed items via LLM.
5. Provide **AI auto-generation** of business descriptions and SEO tags.
6. Implement **natural-language semantic search** using an NLP microservice + MongoDB Atlas Vector Search, ranked by a tunable composite score.
7. Implement a **smart-notification engine** (interest scoring, decay, repeated-search detection, FCM delivery) with an intelligence gate to prevent spam.

## 1.4 Methodology (summary — full detail in Chapter 3)
The project follows a **modular, layered, service-oriented architecture** on **NestJS** (Controller → Service → Mongoose Model), with **MongoDB** as the primary datastore, **Redis + BullMQ** for asynchronous jobs, **Cloudinary** for media, **Firebase** for push, and **external AI providers** (Google Gemini, OpenRouter/Gemma, and a custom Python NLP/embedding microservice) for the intelligence features. Development used TypeScript, ESLint/Prettier, and Jest for unit/integration tests. Data for testing was produced with a deterministic **seed pipeline** (Faker-based) that also generates real embeddings for vector search.

## 1.5 Time Plan
*(Use this as a template for your Gantt/figure "Figure 1.1: Time Plan". Adjust dates to your actual schedule.)*

| Phase | Work | Approx. Duration |
|---|---|---|
| 1 | Requirements, research, architecture design | Weeks 1–2 |
| 2 | Auth, User, Business modules + geospatial model | Weeks 3–5 |
| 3 | Polymorphic Item & Categories modules, Cloudinary | Weeks 6–7 |
| 4 | Upload pipeline (parsers + AI normalizer) & Auto-generation | Weeks 8–10 |
| 5 | NLP microservice + semantic search pipeline + vector index | Weeks 11–13 |
| 6 | Smart-notification engine (interest, decay, FCM, queue) | Weeks 14–16 |
| 7 | Testing, seeding, documentation, deployment | Weeks 17–18 |

## 1.6 Thesis Outline
- **Chapter 2 — Literature Review:** background on geospatial search, vector/semantic search, LLM information extraction, and recommendation/notification systems.
- **Chapter 3 — System Architecture and Methods:** the layered architecture, modules, data model, and the algorithms behind search and notifications.
- **Chapter 4 — System Implementation and Results:** dataset/seed, software tools, hardware setup, and experimental behavior.
- **Chapter 5 — Run the Application:** step-by-step instructions to install, configure, seed, and run.
- **Chapter 6 — Conclusion and Future Work.**

---

# Chapter 2 — Literature Review
*(Skeleton with the right topics + how NearBuy relates. Add your cited papers.)*

**2.1 Geospatial search & geohashing.** Discuss MongoDB `2dsphere` indexes, GeoJSON points, `$near`/`$geoWithin`/`$geoNear`, and **geohash** encoding (Niemeyer). NearBuy stores 8 geohash precisions (country→building) so the map can *cluster* markers by truncating the hash at a precision chosen by zoom level. Compare to grid-based and quadtree clustering.

**2.2 Vector / semantic search.** Discuss dense embeddings, cosine similarity, approximate nearest-neighbor (HNSW), and managed vector search (MongoDB Atlas Vector Search, `$vectorSearch`). NearBuy uses 384-dim sentence embeddings (typical of MiniLM-class models) and cosine metric. Contrast with classical TF-IDF/BM25 keyword retrieval.

**2.3 LLMs for information extraction & generation.** Discuss using LLMs to convert unstructured text/vision input into structured records (schema-constrained generation) and to generate marketing copy. NearBuy uses Google **Gemini 2.5 Flash** for vision OCR + data normalization and **Gemma-2-9B-IT via OpenRouter** for description/tag generation.

**2.4 Recommendation & notification systems.** Discuss implicit-feedback signals, time-decay models (exponential forgetting), and notification fatigue / send-time optimization. NearBuy implements weighted implicit feedback (`SEARCH=+1 … ADD_WATCHLIST=+5`), weekly exponential decay (`λ=0.015`), and a multi-gate "intelligence" filter.

**2.5 Backend architecture patterns.** Discuss layered/hexagonal architecture, the Strategy pattern (file parsers), the Factory pattern, discriminated-union persistence, and queue-based asynchronous processing (Redis/BullMQ).

---

# Chapter 3 — System Architecture and Methods

## 3.1 System Architecture

### 3.1.1 Technology Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js v20.x, TypeScript 5.7 (target ES2021, CommonJS) |
| Framework | NestJS 11 (modular DI, Controllers/Services/Modules) |
| Database | MongoDB 7 / Mongoose 8 ODM |
| Vector search | MongoDB Atlas Vector Search (`$vectorSearch`, index `vector_index`) |
| Cache / Queue | Redis (ioredis) + BullMQ 4 |
| Media | Cloudinary (image CDN with on-the-fly transforms) |
| Push | Firebase Admin SDK (FCM) |
| AI – vision & normalize | Google Gemini `gemini-2.5-flash` (`@google/generative-ai`) |
| AI – copywriting | OpenRouter → `google/gemma-2-9b-it` (via `openai` SDK) |
| AI – NLP & embeddings | External Python microservice (Railway), 384-dim embeddings |
| Geocoding | OpenStreetMap **Nominatim** |
| API docs | Swagger / OpenAPI (`@nestjs/swagger`) at `/api/docs` |
| Scheduling | `@nestjs/schedule` (cron jobs) |
| Validation | `class-validator` + `class-transformer`, global `ValidationPipe` |
| Auth | `@nestjs/jwt`, bcrypt password hashing |
| Testing | Jest + ts-jest, Supertest (e2e) |
| Tooling | ESLint, Prettier |

### 3.1.2 Global Application Configuration (`main.ts`)
- **Global route prefix:** `api` → every endpoint is under `/api/...`.
- **Swagger UI:** `/api/docs` (Bearer auth enabled).
- **Global `ValidationPipe`:** `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`; custom `exceptionFactory` flattens validation messages into a `BadRequestException` array.
- **Global filter:** `AllExceptionsFilter` for consistent error responses.
- **CORS:** origins parsed from `CORS_ORIGIN` env (JSON array), methods `GET/POST/PUT/PATCH/DELETE/OPTIONS`, credentials enabled.
- **Process guards:** handlers for `unhandledRejection` / `uncaughtException`.
- **Port:** `PORT` env (default 3000).
- **Config:** `ConfigModule` global, loads `.env.${NODE_ENV}` (`.env.development` / `.env.production`).

### 3.1.3 Module Map (root `AppModule`)
```
AppModule
├── ConfigModule (global, .env.<NODE_ENV>)
├── MongooseModule (async, MONGODB_URI)
├── BullModule (Redis connection; TLS when host is *.railway.app)
├── AuthModule              → signup / signin, JWT, guards
├── UserModule              → user profile, bookmarks, FCM token
├── BusinessModule          → register/update business, nearby, map-view
├── ItemModule              → polymorphic catalog CRUD (+ embeddings)
├── CategoriesModule        → per-item-type category lists
├── CloudinaryModule        → image upload/delete (CDN)
├── UploadModule            → file parse → AI normalize (bulk onboarding)
│   └── NormalizerModule    → AI normalizer strategy (Gemini)
├── AutoGenerationModule    → AI business description + tags (Gemma)
├── SearchModule            → NLP parse → vector pipeline → ranked results
├── NotificationModule      → subscriptions, processor, decay cron
│   ├── InterestModule      → interest scoring & history
│   ├── IntelligenceModule  → C1–C6 send/block gates
│   ├── GeoModule           → nearby-business geo queries for notifications
│   └── EventListenerModule → MongoDB change streams (restock / open)
├── FirebaseModule          → FCM push wrapper
└── QueueModule (@Global)   → BullMQ 'notifications' queue config
```

### 3.1.4 Layered Request Flow
```
HTTP Request
  → CORS + Global ValidationPipe (whitelist/transform)
  → Guard layer (JwtAuthGuard → RolesGuard) on protected routes
  → Controller (thin; binds params/body/user)
  → Service (business logic, validation, orchestration)
  → Mongoose Model (MongoDB)  / External client (AI, FCM, Cloudinary)
  → DTO mapper (fromEntity) → JSON Response
(Errors → AllExceptionsFilter → uniform error body)
```

### 3.1.5 Authentication & Authorization
- **Roles:** `Role.OWNER = 'owner'`, `Role.USER = 'user'` (`src/utils/enums/user-role.enum.ts`).
- **JwtAuthGuard:** extracts `Bearer <token>` from `Authorization`, verifies signature with `JWT_SECRET`, loads the user, attaches `req.user = { id, email, role, businessId? }`. Rejects missing/invalid/"blacklisted" (deleted-user) tokens.
- **RolesGuard + `@Roles(...)` decorator:** reads required roles via `Reflector` from metadata key `roles`; passes if `req.user.role` is allowed.
- **Password security:** bcrypt hash (10 salt rounds) on signup; `bcrypt.compare` on login.
- **JWT payload:** `{ email, id, role }`; expiry from `JWT_EXPIRES_IN`.

## 3.2 Description of Methods and Procedures Used

This section documents every functional module: its responsibility, endpoints, data model, and key logic. (All routes are prefixed with `/api`.)

---

### 3.2.1 AUTH Module
**Responsibility:** registration, login, token issuance.

**Endpoints**
| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| POST | `/auth/register` | public | `SignUpRequestDto {email, password, userName?, role}` | Create user (owner/user), hash password, return JWT |
| POST | `/auth/signin` | public | `LoginRequestDto {email, password}` | Verify credentials, return JWT (+ `businessId` if owner) |

**Responses:** `LoginResponseDto { userPayload {id, userName, role, businessId?}, accessToken }`.

**Service logic**
- `signup`: reject if email exists (`BadRequestException`), hash password, create user, sign token.
- `login`: find by email (`NotFoundException` if missing), compare password (`BadRequestException` if wrong), sign token; if `OWNER`, attach the owner's `businessId`.

---

### 3.2.2 USER Module
**Responsibility:** user profile, business bookmarks, FCM token storage for notifications.

**`User` schema (collection `users`, timestamps on)**
| Field | Type | Notes |
|---|---|---|
| `userName` | String | optional |
| `email` | String | **required, unique** |
| `password` | String | bcrypt hash |
| `role` | enum(Role) | default `user` |
| `fcmToken` | String\|null | device push token |
| `bookmarkedBusinesses` | ObjectId[] (ref Business) | default `[]` |

**`UserInterest` schema (user module copy)** — search-behavior tracking: `userId`, `searchKeyword`, `businessType`, `businessCategory`, `decayScore`, `searchHistory[{searchedAt,hour,dayOfWeek}]`, `peakSearchHour`, `peakSearchDay`, `lastConversionAt`, `conversionCount`, `lastUpdated`, `lastDecayApplied`. *(The notification subsystem uses a parallel, richer `UserInterest` — see 3.2.10.)*

**Endpoints**
| Method | Path | Auth/Role | Purpose |
|---|---|---|---|
| POST | `/user/book-mark/business/:businessId` | USER | Bookmark a business (rejects duplicates) |
| GET | `/user/book-mark/business` | USER | List bookmarked businesses as `BusinessOnMapDto[]` |

**Exposed service helpers:** `getFcmToken(userId)`, `clearFcmToken(userId)` (used by notification delivery to drop stale tokens).

---

### 3.2.3 BUSINESS Module
**Responsibility:** business registration, profile, geospatial discovery (nearby + map clustering).

**`Business` schema (collection `businesses`)** — key fields:
- Identity/content: `name*`, `description`, `category*` (enum), `type*` (enum), `tags[]`, `subcategory`, `phone`, `email`, `website`, `whatsappNumber`, `social{facebook,instagram,tiktok,twitter,linkedIn}`, `images[]`.
- Location: `address*`, `location*` = GeoJSON `Point` `[lng, lat]` (**2dsphere index**), plus 8 geohash fields:
  `geohash` (p9), `geohash_country`(p2), `geohash_region`(p3), `geohash_city`(p4), `geohash_district`(p5), `geohash_neighborhood`(p6), `geohash_street`(p7), `geohash_building`(p8).
- Operations: `workingHours[{day, from, to, isClosed}]`, `status` (enum, default `open`), `is_open_now`, `lastOpenedAt`.
- Quality/segmentation: `rate` (0–5), `numberOfRatings`, `targetAudience[]` (default `['family']`), `mainItems[]`, `facilities[]`, `targetAudienceOther[]`, `mainItemsOthers[]`, `attributes{}`.
- Ownership: `ownerId*` (ref User, indexed). One business per owner is enforced.

**Enums (exact values).**
- `BusinessCategory`: `store, gym, clinic, restaurant, service`.
- `BusinessStatus`: `open, closed, temporarily_closed`.
- `BusinessTargetAudience`: `family, athletes, children, seniors, tourists, others`.
- `BusinessType` (grouped): stores `electronics, clothing, supermarket, pharmacy`; food `fast_food, cafe, dessert, seafood`; clinics `dentist, dermatology, pediatric, general_clinic`; gyms `crossfit, bodybuilding, pilates`; services `repair, cleaning, beauty, consulting`; product/experience extras `fashion, grocery, health, sports, home, toys, medical, salon, fitness, education, automotive, food_beverage, entertainment, travel, other`.
- `BusinessFacility` and `BusinessMainItem` — large enums grouped by category (delivery/parking/wifi/appointment/personal_trainer/… and groceries/burgers/lab_tests/strength_training/home_cleaning/…). Full lists in §A.1 appendix.
- `WeekDays`: `monday … sunday`.

**Geohash helper (`src/utils/helpers/geohash.ts`).** `generateGeohashes(lng,lat)` returns all 8 precisions; `getGeohashConfigForZoom(zoom)` maps a map zoom level to `{field, precision}`. Precision→coverage: p2≈1250 km, p3≈156 km, p4≈39 km, p5≈4.9 km, p6≈1.2 km, p7≈153 m, p8≈38 m.

**Endpoints**
| Method | Path | Auth/Role | Purpose |
|---|---|---|---|
| POST | `/business/register` | OWNER | Create business (one per owner), generates 8 geohashes |
| GET | `/business/nearby` | public | Radius search (`$near` + `$maxDistance`), paginated, optional `businessType` |
| GET | `/business/map-view` | USER | Bounding-box (`$geoWithin $box`) + geohash clustering by zoom |
| GET | `/business/:id` | public | Business detail + paginated items (optional `categoryId`) |
| GET | `/business/:id/owner` | OWNER | Owner's own business detail |
| GET | `/business/:id/items` | OWNER | Owner's items (paginated) |
| PATCH | `/business/:id` | OWNER | Update; cascades `workingHours`/`location` changes to its Items |

**Map clustering logic.** For high zoom (individual view, ~>15) it returns each business; for lower zoom it runs an aggregation that `$group`s by the zoom-appropriate geohash field, computes a cluster centroid and count, and returns `BusinessOnMapDto { …, isCluster }`.

**Query DTOs.** `NearbyQueryDto {lat, lng, radius=10000, businessType?, page=1, limit=5(max100)}`; `MapViewQueryDto {swLat, swLng, neLat, neLng, zoom, businessType?}`.

---

### 3.2.4 ITEM Module (Polymorphic Catalog)
**Responsibility:** the heart of "what's inside a shop" — a single `items` collection storing many product/service shapes via a **Mongoose discriminator** (`discriminatorKey: 'type'`).

**Base `Item` schema fields:** `name*`, `description`, `price` (default 0), `images[]`, `isAvailable` (default true), `is_in_stock` (default true), `lastRestockedAt`, `businessId*` (ref), `categoryId*` (ref), `type*` (enum **discriminator**), denormalized `businessName*`, `businessCategory*`, `businessType*`, `location {Point}`, `businessRate` (0–5), `workingHours[]`, and `embedding: number[]` (384-dim, for vector search). Rich indexes on `businessId+categoryId`, `location` (2dsphere), `businessType+category`, `businessRate`, `price`, `isAvailable`, `is_in_stock`.

**`ItemType` enum:** `service, clinic, class_session, membership, restaurant, super_market_product, pharmacy_product, clothing_product, MENU_ITEM, PRODUCT`.

**Type-specific discriminator schemas / attribute DTOs**
| Type | Required attributes | Optional attributes |
|---|---|---|
| restaurant | `menuCategory` (enum), `sizes` (enum) | `otherMenuCategory`, `tags[]` |
| clinic | `doctorName` | `doctorSpecialization`, `waitingPeriod` |
| class_session | `trainerName`, `schedule`, `duration` | `capacity`, `intensityLevel(low/medium/high)` |
| membership | — | `accessLevel`, `validity`, `benefits[]` |
| super_market_product | — | `brand`, `weight`, `stock` |
| clothing_product | `sizes[]` (enum) | `colorsAvailable[]`, `material`, `brand`, `stock` |
| pharmacy_product | — | `brand`, `activeIngredients[]`, `dosageForm`, `packageSize`, `stock` |

Supporting enums: `SizeEnum {small,medium,large}`, `ClothesCategory {men,women,kids,unisex}`, `RestaurantItemCategory {Burgers, Sandwiches, Fried Chicken, Meals, Pizza, Shawarma, Grills, Pasta, Sides & Appetizers, Salads, Desserts, Drinks, Others}`, `RestaurantItemType {food,beverage,dessert,hot_drink,cold_drink,lunch,dinner,breakfast}`. An `Availability` schema supports `{isAvailable, bookingRequired, estimatedDuration, slots[{day,times[]}]}`.

**Validation pipes**
- `DiscriminatedItemValidationPipe` — reads `type`, routes the body to the matching DTO, validates nested `attributes`, returns typed instance or a structured error.
- `DiscriminatedBulkValidationPipe` — same, per element of an array, aggregating errors with `itemIndex`.
- `ImageValidationPipe` — allows `jpeg/png/webp/jpg`, max 5 MB.

**Endpoints** (under `/:businessId/item`, OWNER role)
| Method | Path | Purpose |
|---|---|---|
| POST | `/add-manual` | Create one typed item (builds embedding text, calls embed client) |
| POST | `/add-bulk` | Bulk insert mixed-type items (`insertMany`) |
| GET | `/:itemId` | Fetch one |
| PATCH | `/:itemId` | Partial update (`$set`, strict:false for nested) |
| DELETE | `/:itemId` | Delete |

**Embedding on create.** On `add-manual`, the service composes embedding text from item + business metadata (via `EmbeddingTextBuilder`) and calls the embed microservice to store a 384-dim `embedding` on the item, making it semantically searchable.

---

### 3.2.5 CATEGORIES Module
**Responsibility:** the filter taxonomy per item type.
**`Category` schema:** `{ name, itemType (enum), key }`, unique index `(key, itemType)`.
**Endpoints (public):**
| Method | Path | Purpose |
|---|---|---|
| GET | `/categories/:itemType` | All categories for an item type |
| GET | `/categories/business/:businessId` | Distinct categories actually used by a business's items |

Seed source `ITEM_CATEGORY_SEED` defines per-type categories (e.g. clinic → General Checkup/Dental/Dermatology/Pediatrics/Cardiology; restaurant → food/beverage/dessert/hot_drink/cold_drink/breakfast/lunch/dinner; etc.).

---

### 3.2.6 CLOUDINARY Module
**Responsibility:** image storage on a CDN with automatic optimization.
**Config:** `CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET`.
**Service:** `uploadImage(file, folder='items')` streams the buffer with transforms `width/height 800 crop:'limit', quality:'auto', fetch_format:'auto'` and returns `secure_url`; `uploadMany(files)` (Promise.all); `deleteImage(url)` (derives `publicId` from URL and calls `destroy`).
**Endpoints (multipart, `ImageValidationPipe`, memory storage):**
| Method | Path | Folder |
|---|---|---|
| POST | `/upload/images/business` | `business` |
| POST | `/upload/images/items` | `items` |
| DELETE | `/upload/images` | (delete by `{imageUrl}`) |

---

### 3.2.7 UPLOAD Module (AI Bulk Onboarding) — *Strategy + Factory + AI Normalizer*
**Responsibility:** turn a merchant's file(s) into structured, typed items.

**Endpoints** (under `/:businessId/item/upload`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/raw` | Single file → raw extraction `{businessId, fileType, raw}` |
| POST | `/raw/batch` | Many files → parsed → deduped → AI-normalized `NormalizeOutputDto[]`. Supports `testMode` with explicit `businessCategory`/`businessType`. |

**File-type detection & Strategy pattern (`FileParsingStrategyFactory`).** Detects `csv/excel/pdf/image/text` from MIME + extension, returns the matching `FileParsingStrategy` (`parse(file): Promise<any[]>`):
| Type | Library | Output |
|---|---|---|
| CSV | `csv-parse` (sync; trim, skip-empty, relax-count; header auto-detect) | array of row objects |
| Excel | `xlsx` (first sheet, header detect) | array of row objects |
| PDF | `pdfjs-dist` (all pages, line split, trim, filter) | `[{text}]` |
| Image | **Google Gemini `gemini-2.5-flash` vision** (base64 → JSON extraction prompt) | `[{name, price, description}]` |
| Text | native | `[{text}]` |

> Note: `tesseract.js` + `eng.traineddata` are present in the repo but the active image path uses **Gemini vision**, not Tesseract.

**Normalizer submodule (AI).** `NormalizerService → AiNormalizerStrategy` (Gemini `gemini-2.5-flash`):
- Batches input in chunks of **20** (1-second spacing between batches; errors per batch are logged, processing continues).
- Resolves `ItemType` from `(businessCategory, businessType)` (e.g. STORE+PHARMACY→`pharmacy_product`, GYM+BODYBUILDING→`membership`, GYM+CROSSFIT/PILATES→`class_session`).
- Builds a **type-specific attribute schema** + category list (from `ITEM_CATEGORY_SEED`) and a prompt with examples; calls Gemini (temp 0.7); strips markdown, extracts the JSON array.
- Maps to `NormalizeOutputDto {name, description?, price, images?, isAvailable, businessId, type, attributes}` (price coerced to number, descriptions cleaned, `isAvailable:true`).

**End-to-end:** `POST /raw/batch` → validate business → parse each file in parallel (`Promise.allSettled`) → combine → dedupe (by `text` for PDF/text) → `NormalizerService.normalize()` → return typed items ready to be inserted via the Item module.

---

### 3.2.8 AUTO-GENERATION Module (AI Copywriting)
**Responsibility:** generate a business description + SEO tags so owners don't write copy themselves.
**AI provider:** OpenRouter (`OPENROUTER_API_KEY`, `OPENAI_BASE_URL`) using model **`google/gemma-2-9b-it`** via the `openai` SDK; sends `HTTP-Referer`/`X-Title` headers.
**Endpoint:** `POST /auto-generation/business`, body `GenerateBusinessAiDto {name, category, type, mainItems[], mainItemsOthers?, targetAudience[], targetAudienceOthers?}`.
**Logic:**
1. Validate `type ∈ CATEGORY_TYPES_MAP[category]` and `mainItems` non-empty.
2. `buildPromptV1(dto)` selects a category-specific prompt (restaurant/clinic/gym/service/store), each instructing "exactly 2 sentences", professional tone, no hype.
3. Call 1 → description (temp 0.6, max 200 tokens). Call 2 → up to 10 comma-separated lowercase SEO tags from the description (temp 0.4, max 60 tokens).
4. Return `{ description, tags[] }`.
**Constant maps:** `CATEGORY_TYPES_MAP`, `CATEGORY_MAIN_ITEMS_MAP`, `CATEGORY_FACILITIES_MAP` constrain valid combinations per category.

---

### 3.2.9 SEARCH Module (Natural-Language Semantic Search) — *flagship feature*
**Responsibility:** convert a natural-language query into ranked nearby items using NLP + vector search.

**External NLP/Embedding microservice** (`NLP_SERVICE_URL`, Python, deployed on Railway):
- `POST /parse` `{text}` → `NlpBluePrint` (intent + entities + **`query_vector` 384-dim** + reconstructed `search_vector_query`).
- `POST /index` `{item payload}` → `CreateEmbeddingResponse` (`embedding_vector` 384-dim) — used when items are created/seeded.
- Embedding dimension validated to **384**; cosine metric; client uses a 30s timeout (→ `GatewayTimeoutException`).

**`NlpBluePrint` entities** include: `category`, `business_type`, `brand`, `quantity`, `locations[]`, `near_me`, `distance_km`, `price_filter{operator(lt/gt/range), value, max_value}`, `rating_min`, `sort{by(price/rating/distance/popularity), order}`, `service_mode`, `membership_duration_months`, `time_constraints{target_time, day_of_week, is_now}`, `urgency`, `is_24_hours`, `size`, `color`, `attributes[]`, `modifiers{is_top_rated,is_cheap,is_luxury}`. `Intent ∈ {FIND_BUSINESS, FIND_PRODUCT, FIND_SERVICE, BOOK_APPOINTMENT, OUT_OF_SCOPE}`.

**Endpoints**
| Method | Path | Purpose |
|---|---|---|
| POST | `/search` | Semantic search. Body `SearchRequestDto {query, userLocation[lat,lng], priceMin?, priceMax?, ratingMin?, openNow?, priceSort?, userId?, lat?, lng?}` |
| GET | `/search/autocomplete` | `{q, limit=8}` → item-name suggestions (regex word-boundary, dedup by lowercased name) |

**Pipeline assembly (`PipelineBuilderService` + stage builders).** For in-scope queries the MongoDB aggregation is built in order:
1. **Vector search** (`$vectorSearch`, index `vector_index`, path `embedding`, `queryVector` from blueprint, `numCandidates` = 50/150/300 depending on urgency/top-rated, `limit 50`, optional `businessType` pre-filter) → `$addFields {vectorScore: {$meta:'vectorSearchScore'}}`.
2. **Geo stage** — if `locations[]` (Nominatim geocode) or `near_me`+`userLocation`: `$match {location:{$geoWithin:{$centerSphere:[[lng,lat], km/6378.1]}}}`.
3. **Enrichment** — `$addFields` Haversine `distance_km` and `isOpenNow` (evaluates `workingHours`, handles overnight windows).
4. **Time stage** — filter by `openNow` / `time_constraints` (day + time).
5. **Price-Rating stage** — apply price range and `businessRate ≥ ratingMin` (request overrides blueprint).
6. **Attribute stage** — filter `attributes.sizes/colorsAvailable/brand/validity` (size/color/brand/membership).
7. **Score stage** — `final_score = 0.6·vectorScore + 0.25·(businessRate/5) + 0.15·distance_score`.
8. **Sort stage** — by `priceSort`/blueprint `sort`, else `final_score desc`.
9. **Limit 15** → **Projection** `{businessId, name(=businessName), category, rate, photo(first image), isOpenNow, distance_km(rounded)}`.

For `OUT_OF_SCOPE`/low-confidence queries it falls back to `limit → enrichment → projection` (no vector search).

**Search side-effect (async, non-blocking).** If intent is in-scope and `userId` present: record interest (`InterestService.record('SEARCH', …)`); once interest score ≥ 3, **upsert a `BEHAVIORAL` notification subscription** keyed by `userId+type+searchIntent.businessType`; enqueue a `REPEATED_SEARCH` BullMQ job (`jobId: repeated-search:<userId>:<businessType>`). This is what powers the Repeated-Search Alert.

**Utilities:** `getCoordinates(name)` (Nominatim, returns `[lng,lat]`), `normalizeTime` (parses `14:30`, `2:30pm`, `2pm` → `HH:MM`).

---

### 3.2.10 NOTIFICATION Module (Smart Notifications / Repeated-Search Alert)
**Responsibility:** intelligent, queue-based push notifications via FCM.

**Notification types (`NotificationType`):** `RESTOCK, BUSINESS_OPEN, PROXIMITY, BEHAVIORAL`.

**Schemas**
- **`NotificationSubscription`:** `userId*`, `type*`, `businessId?`, `itemId?`, `searchIntent{businessType, businessCategory, searchVector[], keywords[], original_query, modifiers{is_cheap, rating_min}}`, `interestRef` (→UserInterest), `isActive` (default true), `snoozedUntil?`, `lastNotifiedAt?`, `notifyCount` (default 0), `geofence.radiusMeters` (default 300), `expiresAt` (TTL). Indexes: `(userId,type,interestRef)` sparse, `(userId,type,searchIntent.businessType)` sparse, `expiresAt` TTL.
- **`UserInterest` (notification copy):** `userId*`, `keyword`, `biz_type*`, `category`, `score` (default 0), `rawScore` (never decays), `lastUpdated`, `lastDecayApplied`, `searchHistory[{searchedAt,hour,dayOfWeek}]` (max 50), `peakSearchHour`, `peakSearchDay`, `lastConversionAt`, `conversionCount`. **Unique index `(userId, biz_type)`**.
- **`NotificationDelivery`** (audit log, TTL 60 days): `subscriptionId?`, `userId*`, `type*`, `businessId?`, `itemId?`, `triggeredAt`, `channel(FCM/LOCAL)`, `status(SENT/FAILED/READ/DISMISSED)`, `scoreAtSend`, `searchContext{keyword,businessType,businessCategory,scoreAtTrigger}`.

**Controller endpoints** (`/notifications`, JWT user)
| Method | Path | Purpose |
|---|---|---|
| POST | `/subscribe` | Subscribe (idempotent; reactivates, geofence 300 m, notifyCount 0) |
| DELETE | `/subscribe` | Unsubscribe (soft-delete `isActive=false`) |
| GET | `/subscriptions/check` | Boolean: is user subscribed (`type, businessId?, itemId?`) |
| POST | `/:id/snooze` | Silence for N hours (default 24) |

**Interest scoring (`InterestService`).** Weighted implicit feedback:
`SEARCH +1, VIEW_STORE +1, CLICK_ITEM +2, FAVORITE +3, ADD_WATCHLIST +5, NOTIFICATION_SENT −1, NOTIF_DISMISSED −0.5`. `record()` upserts by `(userId, biz_type)`, updates `score`/`rawScore`, pushes search history (FIFO 50) on SEARCH. `markConverted()` sets `lastConversionAt` + increments `conversionCount`.

**Interest decay job (`@Cron EVERY_WEEK`).** `decayedScore = score · e^(−λ·daysSince)` with `λ=0.015`; if result `< 0.5` (`DEACTIVATE_THRESHOLD`), the linked subscriptions are set `isActive=false`. Persists new `score` + `lastDecayApplied`.

**Intelligence gate (`IntelligenceService.evaluate`) — C1..C6 (first failure blocks):**
- **C1 Score threshold:** for non-RESTOCK/BUSINESS_OPEN types, require `score ≥ THRESHOLD` (`PROXIMITY 3, BEHAVIORAL 3, TRENDING 4, TIME_AWARE 3`).
- **C2 Frequency cooldown:** `BASE_COOLDOWN_HOURS {RESTOCK 24, BUSINESS_OPEN 4, PROXIMITY 6, BEHAVIORAL 12, TRENDING 24, TIME_AWARE 48}` scaled by score (≥8 → ×0.4, ≥5 → ×0.7, ≥3 → ×1.0, else ×2.0).
- **C3 Quiet hours:** outside 08:00–22:00 Africa/Cairo → job `moveToDelayed` to next window, block.
- **C4 Already converted:** `lastConversionAt > lastNotifiedAt` → block.
- **C5 Snooze:** `snoozedUntil > now` → block.
- **C6 User preference:** placeholder (pass).

**Event triggers (`EventListenerService`, MongoDB change streams).**
- **Restock:** Item update where `is_in_stock:true` (& `isAvailable`) → enqueue `RESTOCK` (jobId `restock-<itemId>-<ts>`, 3 attempts exp backoff 3 s).
- **Business open:** Business update where `is_open_now:true` or `status:OPEN` (& not closed) → enqueue `BUSINESS_OPEN` (jobId `open-<businessId>-<minute>`).
Streams auto-restart 5 s after error.

**Processor (`NotificationProcessor`, BullMQ worker).** Handles three job kinds; for each, loads matching active/un-snoozed subscriptions, **runs the intelligence gate**, then `send()`:
- `RESTOCK` → "Back in stock! {item} is available again".
- `BUSINESS_OPEN` → "Now open! {business} just opened".
- `REPEATED_SEARCH` → guards (`score≥3`, no conversion in 7 days, active BEHAVIORAL sub exists, gate passes) → "Still looking? 🔍 You searched "{keyword}" multiple times — found nearby!".
`send()` fetches the user's FCM token (skips if none), sends via Firebase, on `StaleFcmTokenError` clears the token, then best-effort updates `lastNotifiedAt`/`notifyCount`, writes a `NotificationDelivery`, and records `NOTIFICATION_SENT` (−1 score).

**Firebase (`FirebaseService`).** Initializes Admin SDK from base64 `FIREBASE_SERVICE_ACCOUNT`. `sendPush({token,title,body,data})` builds a cross-platform message (Android `priority:high`+sound; iOS APNs sound+badge). `sendMulticast()` for future bulk campaigns. Stale tokens raise `StaleFcmTokenError`.

**Geo (`GeoService`).** `findNearUser(lat,lng,{biz_type,category,maxDistanceMeters=500,minRating=3.5})` runs `$geoNear` (open now, category/type filter) → `$match rating≥3.5` → `$limit 3`.

---

# Chapter 4 — System Implementation and Results

## 4.1 Dataset
NearBuy has no external/public dataset; data is **synthetically generated** by a deterministic seed pipeline and, in production, supplied by real merchants through the upload pipeline.

**Seed scripts (`src/common/seed/`):**
- `combined-seed.ts` (`npm run seed:combined`) — the main seeder. Creates owners, **businesses** clustered around a center point (`CENTER_LAT 29.95556`, `CENTER_LNG 31.02492`, radius 5000 m — Greater Cairo), and a hand-authored catalog (`FAKE_DATA`) per business type (e.g. *TechZone Electronics* with iPhone 15 Pro Max, MacBook Pro 16″, etc.; *Fashion Forward* clothing; restaurants; clinics; gyms). It generates 8 geohashes per business (via `ngeohash`) and **calls the embedding microservice** to attach real 384-dim vectors so vector search works on seeded data. Remove with `npm run seed:remove`.
- `business-seed.ts` (`npm run seed`) — business-only seeding.
- `items-category-seed.ts` (`npm run seed:categories`) — populates the `categories` collection from `ITEM_CATEGORY_SEED`.
- `create-vector-index.ts` (`npm run seed:create-vector-index`) — checks embedded items and prints/creates the Atlas vector index config.

**Atlas vector index** (`vector_index`):
```json
{ "mappings": { "dynamic": false, "fields": {
  "embedding": { "type": "knnVector", "dimensions": 384, "metric": "cosine", "quantization": "float" }
}}}
```

*(For "List of Tables", you can use Table 4.1 = seeded business types & sample items; Table 4.2 = embedding/index config.)*

## 4.2 Software Tools Used
- **NestJS 11 / Node 20 / TypeScript 5.7** — application framework & language.
- **MongoDB 7 + Mongoose 8** — database & ODM; **MongoDB Atlas Vector Search** for semantic retrieval.
- **Redis + BullMQ 4** — job queue for asynchronous notifications.
- **Cloudinary** — image hosting/transformation.
- **Firebase Admin** — push notifications (FCM).
- **Google Gemini (`@google/generative-ai`)** — vision OCR + AI normalization.
- **OpenRouter + `openai` SDK (Gemma-2-9B-IT)** — description/tag generation.
- **External NLP microservice** — query parsing + embeddings (384-dim).
- **Nominatim (OpenStreetMap)** — geocoding named locations.
- Parsing libs: `csv-parse`, `xlsx`, `pdfjs-dist`. Geohashing: `ngeohash`.
- **Swagger/OpenAPI** — interactive API docs at `/api/docs`.
- **Jest + Supertest** — testing. **ESLint + Prettier** — code quality. **Faker** — seed data.

## 4.3 Setup / Configuration (Hardware & Environment)
- **Dev hardware:** any machine able to run Node 20 + access MongoDB Atlas; the OCR/AI features are offloaded to cloud APIs so no GPU is required locally.
- **External services required:** MongoDB Atlas cluster (with Vector Search), a Redis instance, Cloudinary account, Firebase project (service-account JSON), Gemini API key, OpenRouter API key, and the NLP microservice URL.
- **Environment variables** (`.env.development` / `.env.production`):
  `NODE_ENV, PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, CORS_ORIGIN, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, FIREBASE_SERVICE_ACCOUNT (base64 JSON), NLP_SERVICE_URL, OPENAI_API_KEY, OPENAI_BASE_URL, OPENROUTER_API_KEY, APP_HTTP_REFERER, APP_X_TITLE, API_KEY`.
- BullMQ auto-enables TLS when `REDIS_HOST` contains `railway.app`.

## 4.4 Experimental Behavior & Results
Document these as your "experiments" (capture real screenshots/logs from your run):
1. **Auth & RBAC:** owner vs. user can/can't reach owner-only routes (expect 401/403).
2. **Geospatial discovery:** `/business/nearby` returns businesses ordered by distance within radius; `/business/map-view` returns clustered vs. individual markers as zoom changes (Table: zoom → geohash precision → cluster count).
3. **Polymorphic items:** posting a restaurant vs. clinic item triggers different attribute validation; invalid attributes return structured `itemIndex` errors.
4. **AI bulk upload:** upload a menu image/PDF/CSV → measure how many rows are correctly extracted & normalized into typed items (precision of name/price/attributes).
5. **Auto-generation:** given `{name, category, type, mainItems}` the API returns a coherent 2-sentence description + ≤10 tags.
6. **Semantic search quality:** compare ranked results for queries like *"cheap pizza near me open now"*, *"dermatology clinic"*, *"large red t-shirt"* — show that intent/entities are parsed and ranking respects price/rating/distance/time. Report latency (NLP parse + vector search).
7. **Smart notifications:** simulate 3 repeated searches → confirm a `REPEATED_SEARCH` job fires, the intelligence gate behaves (cooldown/quiet-hours/converted), and FCM delivery is logged in `NotificationDelivery`. The integration test `repeated-search.integration.spec.ts` and `intelligence.service.spec.ts` already assert these gates (use them as result evidence).

*(Suggested figures: Figure 1.2 System Architecture; Figure 4.x Semantic-search pipeline; Figure 4.y Notification flow; Figure 4.z Map clustering.)*

---

# Chapter 5 — Run the Application

## 5.1 Prerequisites
- Node.js 20+, npm, Git.
- A MongoDB Atlas cluster (Vector Search enabled) — set `MONGODB_URI`.
- A Redis instance — set `REDIS_HOST/PORT/PASSWORD`.
- Accounts/keys for Cloudinary, Firebase, Gemini, OpenRouter, and the NLP microservice URL.

## 5.2 Install
```bash
git clone <repo-url>
cd nearbuy-service-api
npm install
```

## 5.3 Configure environment
Create `.env.development` (and/or `.env.production`) with all variables listed in §4.3.

## 5.4 Seed the database (optional but recommended for demo)
```bash
npm run seed:categories      # populate item categories
npm run seed:combined        # businesses + items + real embeddings
npm run seed:create-vector-index   # print/create Atlas vector index config
# to clean up:
npm run seed:remove
```
Then, in the Atlas UI, ensure the `vector_index` (knnVector, 384, cosine) exists on the `items` collection (config in §4.1).

## 5.5 Run
```bash
# development (watch)
npm run start:dev

# plain start
npm run start

# production
npm run build
npm run start:prod
```
The API serves under `http://localhost:<PORT>/api` and Swagger docs at `http://localhost:<PORT>/api/docs`.

## 5.6 Quality & tests
```bash
npm run lint          # ESLint
npm run format        # Prettier
npm run test          # unit tests
npm run test:e2e      # end-to-end
npm run test:cov      # coverage
```

## 5.7 Quick smoke test (cURL)
```bash
# Register an owner
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@x.com","password":"pass1234","userName":"Owner","role":"owner"}'

# Semantic search
curl -X POST http://localhost:3000/api/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"cheap pizza near me open now","userLocation":[29.95,31.02]}'
```

---

# Chapter 6 — Conclusion and Future Work

## 6.1 Conclusion
NearBuy demonstrates that a single, well-structured NestJS/MongoDB backend can deliver a genuinely *intelligent* local-commerce experience. It combines (a) precise geospatial modeling with an 8-level geohash hierarchy for zoom-aware map clustering, (b) a polymorphic catalog that uniformly stores very different product/service types, (c) an AI-assisted onboarding pipeline that converts merchants' unstructured files (including menu photos) into structured typed items, (d) natural-language semantic search powered by an NLP microservice and MongoDB Atlas Vector Search with a tunable composite ranking, and (e) a behavior-aware smart-notification engine with weighted interest scoring, exponential decay, and a multi-gate intelligence filter delivering push notifications through Redis/BullMQ and FCM. Together these show how geospatial, semantic, and behavioral techniques can be fused to close the local-commerce discovery gap.

## 6.2 Future Work
1. **Multi-timezone quiet hours** (currently hardcoded to Africa/Cairo).
2. **Interest pattern analysis** — populate `peakSearchHour/peakSearchDay` and send at peak times (`InterestPatternService` is a stub).
3. **Distance-decay in ranking** — replace the static `distance_score = 1.0` (15% weight) with an inverse-distance function.
4. **Trending & proximity notifications** — fully implement `TRENDING`/`PROXIMITY` job types and geofenced proximity pushes.
5. **Ratings & reviews** — user-facing rating submission (schema fields exist: `rate`, `numberOfRatings`).
6. **Booking/orders** — turn `Availability` slots and `BOOK_APPOINTMENT` intent into real transactions, then attribute conversions back to notifications.
7. **Bring NLP/embeddings in-house** or cache embeddings to reduce external-service latency and single-point-of-failure risk.
8. **Queue the AI normalization** for very large catalogs (BullMQ infra already exists but upload runs synchronously).
9. **Admin dashboard & analytics** over `NotificationDelivery` logs (effectiveness, A/B testing of copy).
10. **Harden auth on media/upload endpoints** and add rate limiting.

---

# References
*(Fill with your actual citations — IEEE/APA. Suggested categories:)*
1. NestJS Documentation — https://docs.nestjs.com
2. MongoDB Geospatial Queries & 2dsphere Indexes — MongoDB Manual.
3. MongoDB Atlas Vector Search (`$vectorSearch`) — MongoDB Documentation.
4. Reimers, N. & Gurevych, I. — *Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks*, EMNLP 2019. (384-dim MiniLM family.)
5. Niemeyer, G. — *Geohash* geocoding system.
6. Firebase Cloud Messaging — Google Firebase Documentation.
7. BullMQ Documentation — https://docs.bullmq.io
8. Google Gemini API / OpenRouter API documentation.
9. (Add papers on recommender time-decay, send-time optimization, and LLM information extraction you cite in Chapter 2.)

---

# Appendix A — Full Enum Reference (for exact-value tables)

## A.1 BusinessFacility (grouped)
General: `home_delivery, in_store_pickup, online_ordering, warranty_available, after_sales_support, parking_available, wheelchair_access, card_payments`.
Restaurant: `dine_in, takeaway, delivery, outdoor_seating, family_friendly, kids_menu, wifi_available, smoking_area`.
Clinic: `appointment_required, insurance_accepted, lab_services, emergency_cases`.
Gym: `personal_trainer, group_classes, women_only_hours, locker, showers, nutrition_guidance, air_conditioned`.
Service: `onsite_service, home_service, emergency_service, warranty, online_booking`.

## A.2 BusinessMainItem (grouped — abbreviated)
Store: `groceries, fresh_produce, snacks, beverages, dairy_products, frozen_food, cleaning_supplies, personal_care, baby_products, household_essentials, mobile_accessories, electronics, health_wellness, pet_food, bakery_items`.
Restaurant: `sandwiches, burgers, grilled_items, fried_chicken, pasta, pizza, seafood_plates, salads, sides, breakfast, desserts, oriental_dishes, beverages_menu, shawarma, family_meals`.
Clinic: `general_consultation, follow_up, pediatric_checkup, dermatology_session, dental_examination, teeth_cleaning, dental_filling, lab_tests, blood_analysis, ultrasound, prescription_renewal, vaccinations, emergency_cases_clinic, wound_care, chronic_disease_management`.
Gym: `strength_training, cardio_workouts, personal_training, fitness_assessment, group_classes, crossfit, hiit, yoga, pilates, zumba, spinning, weightlifting, stretching, nutrition_guidance, weight_loss_programs`.
Service: `home_cleaning, deep_cleaning, ac_maintenance, plumbing_repair, electrical_work, appliance_repair, mobile_repair, car_wash, beauty_services, hair_styling, home_painting, furniture_assembly, pest_control, emergency_repair, installation_services, others`.

## A.3 Notification constants
Thresholds `{PROXIMITY 3, BEHAVIORAL 3, TRENDING 4, TIME_AWARE 3}`; base cooldown hours `{RESTOCK 24, BUSINESS_OPEN 4, PROXIMITY 6, BEHAVIORAL 12, TRENDING 24, TIME_AWARE 48}`; score weights `{SEARCH +1, VIEW_STORE +1, CLICK_ITEM +2, FAVORITE +3, ADD_WATCHLIST +5, NOTIFICATION_SENT −1, NOTIF_DISMISSED −0.5}`; decay `λ=0.015`, deactivate `< 0.5`, quiet hours `22:00–08:00` Africa/Cairo, default geofence `300 m`.

---

# Appendix B — Complete Endpoint Index (all routes prefixed `/api`)
| Module | Method | Path | Auth |
|---|---|---|---|
| Auth | POST | `/auth/register` | public |
| Auth | POST | `/auth/signin` | public |
| User | POST | `/user/book-mark/business/:businessId` | USER |
| User | GET | `/user/book-mark/business` | USER |
| Business | POST | `/business/register` | OWNER |
| Business | GET | `/business/nearby` | public |
| Business | GET | `/business/map-view` | USER |
| Business | GET | `/business/:id` | public |
| Business | GET | `/business/:id/owner` | OWNER |
| Business | GET | `/business/:id/items` | OWNER |
| Business | PATCH | `/business/:id` | OWNER |
| Item | POST | `/:businessId/item/add-manual` | OWNER |
| Item | POST | `/:businessId/item/add-bulk` | OWNER |
| Item | GET | `/:businessId/item/:itemId` | OWNER |
| Item | PATCH | `/:businessId/item/:itemId` | OWNER |
| Item | DELETE | `/:businessId/item/:itemId` | OWNER |
| Upload | POST | `/:businessId/item/upload/raw` | OWNER |
| Upload | POST | `/:businessId/item/upload/raw/batch` | OWNER |
| Categories | GET | `/categories/:itemType` | public |
| Categories | GET | `/categories/business/:businessId` | public |
| Cloudinary | POST | `/upload/images/business` | (open) |
| Cloudinary | POST | `/upload/images/items` | (open) |
| Cloudinary | DELETE | `/upload/images` | (open) |
| Auto-Gen | POST | `/auto-generation/business` | (open) |
| Search | POST | `/search` | public |
| Search | GET | `/search/autocomplete` | public |
| Notification | POST | `/notifications/subscribe` | USER |
| Notification | DELETE | `/notifications/subscribe` | USER |
| Notification | GET | `/notifications/subscriptions/check` | USER |
| Notification | POST | `/notifications/:id/snooze` | USER |

> Note: a few media/auto-generation endpoints currently lack auth guards in code — flag this in your "Future Work / Security" discussion.
