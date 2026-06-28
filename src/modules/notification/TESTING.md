# Notification System — Mobile Testing Guide

How to test every notification case end-to-end (mobile app → backend → FCM → device).

This document describes **what the system does**, **how to trigger each notification type**, and **step-by-step test scenarios** you can run from the mobile app (plus the backend/DB setup each one needs).

---

## 0. TL;DR — What you need before any test

| Requirement | Why | Status |
|-------------|-----|--------|
| Real device or emulator with **Google Play services** | FCM push only works on real FCM-capable devices | Mobile side |
| App registered in **Firebase project** (`google-services.json` / `GoogleService-Info.plist`) | App must obtain an FCM device token | Mobile side |
| Backend env `FIREBASE_SERVICE_ACCOUNT` set (base64 JSON) | Backend signs/sends pushes via Firebase Admin SDK | Backend |
| **Redis** running | Notifications run through a BullMQ queue (`notifications`) | Backend |
| **MongoDB as a replica set** | Restock / Business-open triggers use **Change Streams**, which require a replica set | Backend |
| A valid **JWT** for the test user | All subscription endpoints require auth | Mobile/Backend |
| The user's **`fcmToken`** stored in the DB | Backend reads it to send the push | ⚠️ See blocker below |

### ⚠️ BLOCKER #1 — There is no endpoint to register an FCM token

The backend can **read** (`UserService.getFcmToken`) and **clear** (`UserService.clearFcmToken`) the token, but **no API exists to set/update it**. There is no `setFcmToken` method, no `/users/fcm-token` route, nothing in auth/login that captures it.

Today a token only lands in the DB via **seed data** (`src/common/seed/v2/user.seeder.ts` writes a fake `seed-fcm-...` value — which is **not a real device token**, so real pushes to seeded users will fail/clear).

**Consequences for testing:**
- The mobile app currently **cannot register its real FCM token** through the API.
- To test real push delivery you must either:
  1. **Add a token-registration endpoint** (recommended — see §6), or
  2. **Manually write the device's FCM token into the DB** for the test user (workaround — see §5.1).

Decide which path you want before testing. Everything below assumes the test user has a **real** `fcmToken` in the DB.

---

## 1. The four notification types

Enum `NotificationType` (`dto/subscribe.dto.ts`):

| Type | Triggered by | Implemented? |
|------|--------------|--------------|
| `RESTOCK` | An item's `is_in_stock` flips to `true` | ✅ Yes (change stream → `handleRestock`) |
| `BUSINESS_OPEN` | A business's `is_open_now` flips to `true` (or `status: OPEN`) | ✅ Yes (change stream → `handleBusinessOpen`) |
| `BEHAVIORAL` | User repeatedly searches the same thing; a `REPEATED_SEARCH` job is enqueued | ✅ Yes (`handleRepeatedSearch`) |
| `PROXIMITY` | (reserved) user enters a geofence | ⚠️ Not implemented in the processor yet |

---

## 2. API surface the mobile app uses

All routes are under `/notifications` and require `Authorization: Bearer <JWT>`.

| Method | Path | Body / Query | Purpose |
|--------|------|--------------|---------|
| `POST` | `/notifications/subscribe` | `{ type, businessId?, itemId? }` | Subscribe to a type (creates/reactivates subscription, default geofence 300m) |
| `DELETE` | `/notifications/subscribe` | `{ type, businessId?, itemId? }` | Unsubscribe (soft delete: `isActive=false`) → returns **204** |
| `GET` | `/notifications/subscriptions/check` | `?type=&businessId=&itemId=` | Returns `true`/`false` whether user is subscribed |
| `POST` | `/notifications/:id/snooze` | `{ hours: number }` (default 24) | Snooze a subscription for N hours |

`type` must be one of `RESTOCK | BUSINESS_OPEN | PROXIMITY | BEHAVIORAL`. `businessId` / `itemId` must be valid Mongo ObjectIds.

> **Note:** There is **no** "list my notifications" / "mark as read" endpoint. Delivery history lives in the `notification_deliveries` collection but is not exposed via API. If the mobile app needs an inbox, that endpoint must be built (see §6).

---

## 3. The intelligence gates (why a push may NOT arrive)

Before any push is sent, `IntelligenceService.evaluate()` runs. A notification can be **silently suppressed** by any of these. Keep them in mind while testing — a "missing" push is often an intentional gate, not a bug.

| Gate | Rule | Affects |
|------|------|---------|
| **Score threshold** | `interest.score` must be ≥ 3 (TRENDING ≥ 4) | BEHAVIORAL/PROXIMITY/TRENDING — **RESTOCK & BUSINESS_OPEN bypass this** |
| **Frequency cooldown** | Must wait since `lastNotifiedAt`. Base: RESTOCK 24h, BUSINESS_OPEN 4h, BEHAVIORAL 12h (scaled by score) | All |
| **Quiet hours** | Only **08:00–22:00 Africa/Cairo (UTC+2)**. Outside this, job is **delayed** until 08:00 Cairo | All |
| **Already converted** | If user converted after we last notified, suppress | BEHAVIORAL |
| **Snoozed** | If `snoozedUntil` is in the future, suppress | All |

### ⚠️ Testing implication: Quiet hours & cooldown will block you
- If you test **outside 08:00–22:00 Cairo time**, pushes get **deferred**, not sent — you'll think it's broken.
- The **cooldown** means you can't repeatedly fire the same notification to the same user. Between runs either change the user, reset `lastNotifiedAt`, or wait out the window.

**To make testing predictable:** temporarily widen quiet hours / zero the cooldown in a test config, or reset the subscription's `lastNotifiedAt`/`snoozedUntil` in the DB between runs (see §5.3).

---

## 4. End-to-end test scenarios (from the mobile app)

Each scenario lists: mobile action → backend trigger → expected push.

### Scenario A — RESTOCK ✅
**Goal:** User subscribes to an out-of-stock item, then gets a push when it's restocked.

1. **Mobile:** open an item that is out of stock → tap "Notify me" → app calls
   `POST /notifications/subscribe { "type": "RESTOCK", "itemId": "<itemId>", "businessId": "<businessId>" }`
2. **Verify subscription:** `GET /notifications/subscriptions/check?type=RESTOCK&itemId=<itemId>` → `true`.
3. **Trigger (backend/admin):** set the item back in stock:
   ```js
   db.items.updateOne({ _id: ObjectId("<itemId>") }, { $set: { is_in_stock: true } })
   ```
   (Or via the merchant flow that flips `is_in_stock`.)
4. **Expected:** within seconds the device receives a push:
   - title/body ≈ *"Back in stock!"* with the item name/price
   - `data.type = "RESTOCK"`, `data.itemId`, `data.businessId`
5. **Verify backend:** a new doc in `notification_deliveries` with `type: RESTOCK`, `status: SENT`; the subscription's `notifyCount` incremented and `lastNotifiedAt` set.

**Gotchas:** Requires Mongo replica set (change stream). RESTOCK has a 24h cooldown — use a fresh item/user for repeat tests.

---

### Scenario B — BUSINESS_OPEN ✅
**Goal:** User subscribes to a closed business, gets a push when it opens.

1. **Mobile:** on a business page → "Notify me when open" →
   `POST /notifications/subscribe { "type": "BUSINESS_OPEN", "businessId": "<businessId>" }`
2. **Verify:** `GET /notifications/subscriptions/check?type=BUSINESS_OPEN&businessId=<businessId>` → `true`.
3. **Trigger:** flip the business open:
   ```js
   db.businesses.updateOne({ _id: ObjectId("<businessId>") }, { $set: { is_open_now: true } })
   // or { status: "OPEN" }
   ```
4. **Expected:** push with `data.type = "BUSINESS_OPEN"`, `data.businessId`. Cooldown here is 4h.
5. **Verify:** `notification_deliveries` row `type: BUSINESS_OPEN, status: SENT`.

---

### Scenario C — BEHAVIORAL (repeated search) ✅
**Goal:** User repeatedly searches "pizza" and later gets a re-engagement push.

This is the most involved one because it depends on the **interest score** and on a `REPEATED_SEARCH` job being enqueued.

1. **Mobile:** the user must be subscribed to behavioral nudges:
   `POST /notifications/subscribe { "type": "BEHAVIORAL", ... }` (with the relevant `searchIntent`/business type, depending on how the app populates it).
2. **Build up score:** perform the searches/actions the app sends to the interest tracker so `UserInterest.score ≥ 3`. Score weights: SEARCH +1, VIEW_STORE +1, CLICK_ITEM +2, FAVORITE +3, ADD_WATCHLIST +5. So e.g. 3+ searches, or a favorite + a couple searches.
   - Confirm in DB: `db.user_interests.find({ userId: ObjectId("<userId>") })` → `score ≥ 3`.
3. **Trigger:** enqueue a `REPEATED_SEARCH` job `{ userId, interestId }` (this is normally done by the search/scheduler system — for a manual test, enqueue it directly, see §5.2).
4. **Expected:** push ≈ *"Still looking? 🔍 …"* with `data.type = "BEHAVIORAL"`, `data.keyword`, `data.businessType`.
5. **Verify:** `notification_deliveries` row with `searchContext` (keyword, businessType, category, scoreAtTrigger). The interest `score` drops by 1 (NOTIFICATION_SENT = −1).

**Will be suppressed if:** score < 3, user converted in the last 7 days, no matching active BEHAVIORAL subscription, cooldown/quiet-hours/snooze.

---

### Scenario D — Snooze ✅
1. Subscribe to any type and note the subscription `_id` (returned from `POST /subscribe`).
2. **Mobile:** `POST /notifications/<id>/snooze { "hours": 1 }`.
3. Trigger the underlying event (restock/open). **Expected:** **no push** while snoozed; `notification_deliveries` gets **no** new SENT row.
4. After the snooze window, trigger again → push arrives.

### Scenario E — Unsubscribe ✅
1. `DELETE /notifications/subscribe { "type": "RESTOCK", "itemId": "<itemId>" }` → **204**.
2. `GET /subscriptions/check...` → `false`.
3. Trigger the event → **no push**.

### Scenario F — Stale token cleanup ✅
1. Put a **bad/expired** FCM token on the user.
2. Trigger any event. FCM rejects it; backend catches `StaleFcmTokenError` and **clears** the token (`fcmToken: null`). Verify in DB.

### Scenario G — Quiet hours ✅
1. Set device/server clock (or test the gate) so it's **outside 08:00–22:00 Cairo**.
2. Trigger an event → job is **delayed**, not sent now. It fires at 08:00 Cairo. Useful to confirm the deferral behavior.

---

## 5. Manual triggers & DB workarounds

### 5.1 Put a real FCM token on the test user (workaround for Blocker #1)
1. On the mobile app, log/print the FCM device token (Firebase SDK `getToken()`).
2. Write it to the user in Mongo:
   ```js
   db.users.updateOne({ _id: ObjectId("<userId>") }, { $set: { fcmToken: "<real-device-token>" } })
   ```
3. Now backend pushes will reach that device.

### 5.2 Manually enqueue a job (no real event needed)
Notifications are processed from the BullMQ `notifications` queue. You can push a job directly (Node REPL / small script using the same Redis connection):
```js
// pseudo — use the project's queue connection
await notificationsQueue.add('RESTOCK', { businessId, itemId, itemName: 'Test', itemPrice: 9.99 });
await notificationsQueue.add('BUSINESS_OPEN', { businessId, businessName: 'Test Cafe' });
await notificationsQueue.add('REPEATED_SEARCH', { userId, interestId });
```
This bypasses the change streams and lets you test the processor + gates + FCM directly.

### 5.3 Reset gates between test runs
```js
// clear cooldown & snooze on a subscription
db.notification_subscriptions.updateOne(
  { _id: ObjectId("<subId>") },
  { $set: { lastNotifiedAt: null, snoozedUntil: null, isActive: true } }
);
// bump an interest score to pass the behavioral gate
db.user_interests.updateOne({ _id: ObjectId("<interestId>") }, { $set: { score: 5 } });
```

### 5.4 Inspect what happened
```js
db.notification_deliveries.find({ userId: ObjectId("<userId>") }).sort({ triggeredAt: -1 }).limit(10)
```
Each row tells you `type`, `status` (SENT/FAILED/READ/DISMISSED), `channel` (FCM), and `scoreAtSend`.

---

## 6. Recommended fixes to make mobile testing real

These are the gaps that block proper mobile testing today. Address whichever you need:

1. **Add an FCM token registration endpoint** (required for real mobile use):
   - `POST /users/fcm-token { token }` (or fold into login) → `UserService.setFcmToken(userId, token)`.
   - Without it, the app can never deliver its token to the backend.
2. **Add a "my notifications" / inbox endpoint** if the app shows a notification list (read from `notification_deliveries`).
3. **Add a mark-as-read / dismissed endpoint** (the delivery schema already supports `READ`/`DISMISSED` statuses and dismissal lowers score by 0.5).
4. **Test-mode toggles** for quiet hours and cooldown so QA can fire repeatedly without DB surgery.

---

## 7. Pre-flight checklist (copy/paste)

- [ ] MongoDB running **as a replica set** (change streams work)
- [ ] Redis running; `notifications` queue reachable
- [ ] `FIREBASE_SERVICE_ACCOUNT` set; backend logs "Firebase Admin initialised"
- [ ] Mobile app built with correct Firebase config, obtains a device token
- [ ] Test user has a **real** `fcmToken` in DB (§5.1)
- [ ] You have a valid JWT for the test user
- [ ] Testing within **08:00–22:00 Africa/Cairo**, or quiet-hours gate adjusted
- [ ] Cooldown/snooze reset between repeat runs (§5.3)

---

## 8. Existing automated tests (run these too)

```bash
npm test -- notification
```
- `tests/notification.controller.integration.spec.ts` — subscribe / unsubscribe / check / validation / auth
- `tests/repeated-search.integration.spec.ts` — REPEATED_SEARCH processor: score gate, conversion gate, missing subscription, stale token, delivery logging
- `tests/intelligence.service.spec.ts` — all gates (score, cooldown, quiet hours, converted, snooze)

These give fast confidence in the gate logic without needing a device. Use the mobile scenarios above for true end-to-end FCM delivery.
