/**
 * NearBuy v2 seeder — top-level orchestrator.
 *
 * Order: reference data → geocoding → (per type × N) owner → business → items
 * → embeddings → consumers → notifications → verification.
 *
 * Run:  npm run seed:v2 -- [flags]   (see config.ts / README.md for flags)
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { AppModule } from '../../../app.module';

import { User } from '../../../modules/user/schemas/user.schema';
import { Business } from '../../../modules/business/schemas/buisness.schema';
import { Item } from '../../../modules/item/schemas/item.schema';
import { Category } from '../../../modules/categories/schemas/categories.schema';
import { NotificationSubscription } from '../../../modules/notification/schemas/notification-subscriptions.schema';
import { NotificationDelivery } from '../../../modules/notification/schemas/notifiaction-delivery.schema';
import { UserInterest } from '../../../modules/notification/schemas/user-intrest.schema';
import { EmbedClientService } from '../../../modules/search/clients/embed-client.service';

import { parseConfig, describeConfig } from './config';
import { initRng } from './rng';
import { log } from './logger';
import { mapLimit } from './concurrency';
import { ALL_BUSINESS_TYPES, buildTypePlan } from './type-plan';
import { seedCategories } from './reference.seeder';
import { resolveCenters } from './geo.seeder';
import { upsertOwner, upsertConsumers } from './user.seeder';
import { upsertBusiness, BusinessSeed } from './business.seeder';
import { AiCatalogGenerator } from './catalog.ai';
import { createItemsForBusiness, embedItem, SeededItem } from './item.seeder';
import { seedNotificationsForConsumer } from './notification.seeder';
import { freshCleanup } from './cleanup';
import { verify } from './verify';

async function main() {
  const cfg = parseConfig();
  console.log('🌱 NearBuy v2 Seeder');
  console.log(`   config: ${describeConfig(cfg)}`);
  initRng(cfg);

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const config = app.get(ConfigService);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const businessModel = app.get<Model<Business>>(getModelToken(Business.name));
  const itemModel = app.get<Model<Item>>(getModelToken(Item.name));
  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
  const subModel = app.get<Model<NotificationSubscription>>(getModelToken(NotificationSubscription.name));
  const deliveryModel = app.get<Model<NotificationDelivery>>(getModelToken(NotificationDelivery.name));
  const interestModel = app.get<Model<UserInterest>>(getModelToken(UserInterest.name));
  const embedClient = app.get(EmbedClientService);

  const allModels = { userModel, businessModel, itemModel, subModel, deliveryModel, interestModel };

  try {
    if (cfg.fresh && !cfg.dryRun) {
      log.phase('Fresh cleanup (seeded-only)');
      await freshCleanup(allModels);
    }

    // Phase: reference data
    log.phase('Reference data (categories)');
    const categoriesByType = await seedCategories(categoryModel, cfg.dryRun);

    // Phase: geocoding
    log.phase('Geocoding locations');
    const centers = await resolveCenters(cfg.locations);

    // Phase: businesses + items
    log.phase(`Businesses & items (${ALL_BUSINESS_TYPES.length} types × ${cfg.countPerType})`);
    const plan = buildTypePlan();
    const ai = new AiCatalogGenerator(config);

    const allBusinesses: BusinessSeed[] = [];
    const allItems: SeededItem[] = [];
    let businessCount = 0;

    if (cfg.dryRun) {
      for (const type of ALL_BUSINESS_TYPES) {
        const entry = plan[type];
        log.step(`${type} → category=${entry.category}, itemType=${entry.itemType}${entry.orphan ? ' (orphan, forced)' : ''} × ${cfg.countPerType}`);
      }
      log.info(`Dry-run: would create ${ALL_BUSINESS_TYPES.length * cfg.countPerType} businesses, ` + `~${ALL_BUSINESS_TYPES.length * cfg.countPerType * cfg.itemsPerBusiness} items, ${cfg.consumers} consumers.`);
    } else {
      for (const type of ALL_BUSINESS_TYPES) {
        const entry = plan[type];
        const categories = categoriesByType.get(entry.itemType) ?? [];
        // One disjoint, unique item slice (and distinct business name) per
        // instance — so the same item never repeats across branches/locations.
        // Pass the real DB category names so the AI classifies each item into one.
        const bundles = await ai.getInstanceBundles(type, entry.category, entry.itemType, cfg.itemsPerBusiness, cfg.countPerType, categories.map((c) => c.name));

        for (let i = 0; i < cfg.countPerType; i++) {
          const bundle = bundles[i];
          const center = centers[(businessCount + i) % centers.length].coordinates;
          const ownerId = await upsertOwner(userModel, type, i);
          const business = await upsertBusiness(businessModel, { ownerId, type, category: entry.category, index: i, center, content: bundle.business });
          allBusinesses.push(business);

          const items = await createItemsForBusiness(itemModel, business, entry.itemType, categories, bundle.items);
          allItems.push(...items);
        }
        businessCount += cfg.countPerType;
        log.progress(businessCount, ALL_BUSINESS_TYPES.length * cfg.countPerType, 'businesses');
      }
      log.ok(`Created/updated ${allBusinesses.length} businesses and ${allItems.length} items.`);
    }

    // Phase: embeddings
    if (!cfg.dryRun && cfg.embeddings && allItems.length > 0) {
      log.phase('Semantic embeddings (NLP service)');
      let done = 0;
      let ok = 0;
      await mapLimit(allItems, cfg.concurrency, async (item) => {
        const success = await embedItem(embedClient, itemModel, item, cfg.fresh);
        done += 1;
        if (success) ok += 1;
        log.progress(done, allItems.length, 'embeddings');
        return success;
      });
      if (ok === 0) log.warn(`No embeddings created — NLP service (${config.get('NLP_SERVICE_URL') ?? 'unset'}) unreachable. Search verified via non-vector query.`);
      else log.ok(`Embeddings: ${ok}/${allItems.length} items embedded.`);
    } else if (!cfg.dryRun && !cfg.embeddings) {
      log.info('Embeddings skipped (--no-embeddings).');
    }

    // Phase: consumers + notifications
    if (!cfg.dryRun) {
      log.phase('Consumers & notifications');
      const businessIds = allBusinesses.map((b) => b._id as Types.ObjectId);
      const consumerIds = await upsertConsumers(userModel, cfg.consumers, businessIds);
      let totals = { interests: 0, subscriptions: 0, deliveries: 0 };
      for (let i = 0; i < consumerIds.length; i++) {
        const r = await seedNotificationsForConsumer({ subModel, deliveryModel, interestModel }, consumerIds[i], i, allBusinesses, allItems);
        totals = { interests: totals.interests + r.interests, subscriptions: totals.subscriptions + r.subscriptions, deliveries: totals.deliveries + r.deliveries };
        log.progress(i + 1, consumerIds.length, 'consumers');
      }
      log.ok(`Notifications: ${consumerIds.length} consumers, ${totals.interests} interests, ${totals.subscriptions} subscriptions, ${totals.deliveries} deliveries.`);
    }

    // Phase: verification
    if (!cfg.dryRun) {
      const passed = await verify(allModels, cfg.countPerType);
      await app.close();
      process.exit(passed ? 0 : 1);
    }

    await app.close();
    log.ok('Dry-run complete.');
    process.exit(0);
  } catch (err) {
    log.error(`Seeder failed: ${(err as Error).message}`);
    console.error(err);
    await app.close();
    process.exit(1);
  }
}

main();
