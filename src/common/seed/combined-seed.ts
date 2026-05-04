import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { faker } from '@faker-js/faker';
import * as ngeohash from 'ngeohash';
import { AppModule } from '../../app.module';
import { Business } from '../../modules/business/schemas/buisness.schema';
import { Item } from '../../modules/item/schemas/item.schema';
import { User } from '../../modules/user/schemas/user.schema';
import { Category } from '../../modules/categories/schemas/categories.schema';
import { BusinessCategory } from '../../modules/business/enums/business-category.enum';
import { BusinessType } from '../../modules/business/enums/business-type.enum';
import { BusinessStatus } from '../../modules/business/enums/business-status.enum';
import { BusinessFacility } from '../../modules/business/enums/business-facilities.enum';
import { BusinessMainItem } from '../../modules/business/enums/business-mainitems.enum';
import { BusinessTargetAudience } from '../../modules/business/enums/business-target-audience';
import { ItemType } from '../../modules/item/enums/item-type.enum';
import { RestaurantItemCategory } from '../../modules/item/enums/resturant-category';
import { SizeEnum } from '../../modules/item/enums/size.enum';
import { EmbedClientService } from '../../modules/search/clients/embed-client.service';
import { EmbeddingTextBuilder } from '../../modules/search/pipeline/embedding-text.builder';

const CENTER_LAT = 29.955560664016126;
const CENTER_LNG = 31.02491697797309;
const RADIUS = 5000;

const FAKE_DATA = {
  [BusinessType.ELECTRONICS]: {
    businessName: 'TechZone Electronics',
    businessDescription: 'Your premier destination for the latest gadgets and cutting-edge electronics. We offer a wide selection of smartphones, laptops, tablets, and accessories from top brands.',
    tags: ['electronics', 'smartphones', 'laptops', 'gadgets', 'technology'],
    mainItems: [BusinessMainItem.ELECTRONICS, BusinessMainItem.MOBILE_ACCESSORIES],
    items: [
      { name: 'iPhone 15 Pro Max', description: 'Latest Apple flagship smartphone with A17 chip, titanium design, and advanced camera system', price: 1200, menuCategory: null },
      { name: 'Samsung Galaxy S24 Ultra', description: 'Premium Android smartphone with S Pen and AI features', price: 1100, menuCategory: null },
      { name: 'MacBook Pro 16 inch', description: 'Powerful laptop with M3 Max chip for professionals', price: 2500, menuCategory: null },
      { name: 'Dell XPS 15 Laptop', description: 'Ultra-thin Windows laptop with OLED display', price: 1800, menuCategory: null },
      { name: 'iPad Pro 12.9', description: 'Professional tablet with M2 chip and Liquid Retina XDR', price: 1100, menuCategory: null },
      { name: 'Sony WH-1000XM5', description: 'Premium noise-cancelling headphones with 30hr battery', price: 350, menuCategory: null },
      { name: 'AirPods Pro 2', description: 'True wireless earbuds with active noise cancellation', price: 250, menuCategory: null },
      { name: 'Apple Watch Series 9', description: 'Advanced smartwatch with health monitoring', price: 400, menuCategory: null },
      { name: 'Anker Power Bank 20000mAh', description: 'Portable charger with fast charging support', price: 50, menuCategory: null },
      { name: 'USB-C Hub 7 in 1', description: 'Multi-port adapter for laptops and tablets', price: 45, menuCategory: null },
    ],
  },
  [BusinessType.CLOTHING]: {
    businessName: 'Fashion Forward',
    businessDescription: 'Trendy fashion for the modern individual. Discover our curated collection of stylish apparel for every occasion.',
    tags: ['fashion', 'clothing', 'apparel', 'designer', 'style'],
    mainItems: [BusinessMainItem.HOUSEHOLD_ESSENTIALS],
    items: [
      { name: 'Classic White Shirt', description: 'Premium cotton formal shirt, perfect for office wear', price: 80, menuCategory: null },
      { name: 'Slim Fit Jeans', description: 'Modern denim jeans with stretch comfort', price: 90, menuCategory: null },
      { name: 'Summer Dress', description: 'Elegant floral print dress for casual occasions', price: 120, menuCategory: null },
      { name: 'Leather Jacket', description: 'Genuine leather biker jacket', price: 350, menuCategory: null },
      { name: 'Wool Sweater', description: 'Warm merino wool sweater', price: 110, menuCategory: null },
      { name: 'Running Shoes', description: 'Lightweight athletic shoes with cushioning', price: 130, menuCategory: null },
      { name: 'Casual Shorts', description: 'Comfortable cotton shorts for summer', price: 45, menuCategory: null },
      { name: 'Silk Scarf', description: 'Luxurious silk scarf with floral pattern', price: 75, menuCategory: null },
      { name: 'Belt Leather', description: 'Genuine leather belt with silver buckle', price: 55, menuCategory: null },
      { name: 'Baseball Cap', description: 'Cotton twill cap with adjustable strap', price: 30, menuCategory: null },
    ],
  },
  [BusinessType.SUPERMARKET]: {
    businessName: 'Fresh Mart Supermarket',
    businessDescription: 'Your one-stop shop for fresh groceries and daily essentials. We deliver quality products at affordable prices.',
    tags: ['supermarket', 'groceries', 'fresh food', 'organic', 'daily needs'],
    mainItems: [BusinessMainItem.GROCERIES, BusinessMainItem.FRESH_PRODUCE, BusinessMainItem.DAIRY_PRODUCTS],
    items: [
      { name: 'Fresh Whole Milk 1L', description: 'Organic whole milk, farm fresh', price: 5, menuCategory: null },
      { name: 'Brown Bread 500g', description: 'Whole grain brown bread', price: 4, menuCategory: null },
      { name: 'Organic Bananas 1kg', description: 'Fresh organic bananas', price: 6, menuCategory: null },
      { name: 'Red Apples 1kg', description: 'Crisp red apples from local farms', price: 8, menuCategory: null },
      { name: 'Free Range Eggs 12pcs', description: 'Farm fresh eggs', price: 7, menuCategory: null },
      { name: 'Greek Yogurt 500g', description: 'Creamy Greek yogurt', price: 6, menuCategory: null },
      { name: 'Chicken Breast 1kg', description: 'Fresh boneless chicken', price: 15, menuCategory: null },
      { name: 'Atlantic Salmon 500g', description: 'Fresh salmon fillet', price: 25, menuCategory: null },
      { name: 'Pasta Spaghetti 500g', description: 'Italian spaghetti', price: 3, menuCategory: null },
      { name: 'Olive Oil 1L', description: 'Extra virgin olive oil', price: 18, menuCategory: null },
    ],
  },
  [BusinessType.PHARMACY]: {
    businessName: 'HealthPlus Pharmacy',
    businessDescription: 'Your trusted partner in health. We provide quality medicines, supplements, and health products for your wellbeing.',
    tags: ['pharmacy', 'medicine', 'health', 'wellness', 'supplements'],
    mainItems: [BusinessMainItem.HEALTH_WELLNESS, BusinessMainItem.PERSONAL_CARE],
    items: [
      { name: 'Vitamin C 1000mg', description: 'Immune system support tablets', price: 15, menuCategory: null },
      { name: 'Panadol 500mg', description: 'Fast relief headache tablets', price: 8, menuCategory: null },
      { name: 'Omega3 Fish Oil', description: 'Heart healthy supplements', price: 25, menuCategory: null },
      { name: 'Multivitamin Complex', description: 'Daily multivitamin for adults', price: 20, menuCategory: null },
      { name: 'Calcium + Vitamin D', description: 'Bone health supplements', price: 18, menuCategory: null },
      { name: 'Hand Sanitizer 100ml', description: 'Antibacterial hand gel', price: 5, menuCategory: null },
      { name: 'Paracetamol Syrup', description: 'Child fever syrup', price: 10, menuCategory: null },
      { name: 'Bandages Assorted', description: 'First aid bandages pack', price: 6, menuCategory: null },
      { name: 'Eye Drops 15ml', description: 'Moisturizing eye drops', price: 12, menuCategory: null },
      { name: 'Protein Powder 500g', description: 'Whey protein supplement', price: 45, menuCategory: null },
    ],
  },
  [BusinessType.FAST_FOOD]: {
    businessName: 'BurgerKing Express',
    businessDescription: ' delicious fast food favorites! Enjoy our signature burgers, crispy fries, and fresh salads.',
    tags: ['fast food', 'burger', 'fries', 'quick meal', 'takeout'],
    mainItems: [BusinessMainItem.BURGERS, BusinessMainItem.FRIED_CHICKEN, BusinessMainItem.SIDES],
    items: [
      { name: 'Classic Beef Burger', description: 'Juicy beef patty with fresh vegetables', price: 12, menuCategory: RestaurantItemCategory.BURGERS },
      { name: 'Crispy Chicken Burger', description: 'Fried chicken with mayo sauce', price: 11, menuCategory: RestaurantItemCategory.BURGERS },
      { name: 'Double Cheeseburger', description: 'Double patty with cheese and bacon', price: 15, menuCategory: RestaurantItemCategory.BURGERS },
      { name: 'French Fries Large', description: 'Crispy golden fries', price: 6, menuCategory: RestaurantItemCategory.SIDES_AND_APPETIZERS },
      { name: 'Onion Rings', description: 'Crispy battered onion rings', price: 7, menuCategory: RestaurantItemCategory.SIDES_AND_APPETIZERS },
      { name: 'Grilled Chicken Salad', description: 'Fresh greens with grilled chicken', price: 14, menuCategory: RestaurantItemCategory.SALADS },
      { name: 'Chicken Wings 6pcs', description: 'Crispy chicken wings with sauce', price: 13, menuCategory: RestaurantItemCategory.SIDES_AND_APPETIZERS },
      { name: 'Cola Medium', description: 'Refreshing cola drink', price: 4, menuCategory: RestaurantItemCategory.DRINKS },
      { name: 'Chocolate Shake', description: 'Creamy chocolate milkshake', price: 8, menuCategory: RestaurantItemCategory.DRINKS },
      { name: 'Chicken Nuggets 8pcs', description: 'Crispy chicken nuggets', price: 10, menuCategory: RestaurantItemCategory.SIDES_AND_APPETIZERS },
    ],
  },
  [BusinessType.CAFE]: {
    businessName: 'Coffee Corner Cafe',
    businessDescription: ' coffeexperience with artisan coffees and freshly baked pastries. Your perfect morning start awaits!',
    tags: ['cafe', 'coffee', 'pastries', 'breakfast', 'espresso'],
    mainItems: [BusinessMainItem.BEVERAGES_MENU, BusinessMainItem.DESSERTS, BusinessMainItem.BREAKFAST],
    items: [
      { name: 'Espresso Single', description: 'Strong single shot espresso', price: 4, menuCategory: RestaurantItemCategory.DRINKS },
      { name: 'Cappuccino Medium', description: 'Classic Italian cappuccino', price: 6, menuCategory: RestaurantItemCategory.DRINKS },
      { name: 'Latte Macchiato', description: 'Smooth latte with caramel', price: 7, menuCategory: RestaurantItemCategory.DRINKS },
      { name: 'Iced Americano', description: 'Cold espresso with ice', price: 6, menuCategory: RestaurantItemCategory.DRINKS },
      { name: 'Mocha Frappe', description: 'Chocolate coffee blended drink', price: 8, menuCategory: RestaurantItemCategory.DRINKS },
      { name: 'Croissant', description: 'Buttery French croissant', price: 5, menuCategory: RestaurantItemCategory.MEALS },
      { name: 'Blueberry Muffin', description: 'Fresh baked muffin', price: 5, menuCategory: RestaurantItemCategory.MEALS },
      { name: 'Cheesecake Slice', description: 'Rich New York cheesecake', price: 8, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Chocolate Cake', description: 'Decadent chocolate cake', price: 8, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Avocado Toast', description: 'Toasted bread with avocado', price: 10, menuCategory: RestaurantItemCategory.MEALS },
    ],
  },
  [BusinessType.DESSERT]: {
    businessName: 'Sweet Dreams Dessert Shop',
    businessDescription: 'Indulge in heavenly desserts! From artisan ice cream to mouthwatering cakes and pastries.',
    tags: ['dessert', 'ice cream', 'cakes', 'sweets', 'pastries'],
    mainItems: [BusinessMainItem.DESSERTS, BusinessMainItem.BAKERY_ITEMS],
    items: [
      { name: 'Vanilla Ice Cream Scoop', description: 'Premium vanilla bean ice cream', price: 5, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 12, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Strawberry Cheesecake', description: 'Creamy cheesecake with strawberry topping', price: 10, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Tiramisu', description: 'Classic Italian coffee dessert', price: 11, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Macarons Box 6pcs', description: 'Assorted French macarons', price: 15, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Ice Cream Sundae', description: 'Ice cream with toppings and sauce', price: 14, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Fruit Tart', description: 'Fresh fruit on pastry cream', price: 9, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Brownie Sundae', description: 'Warm brownie with ice cream', price: 12, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Panna Cotta', description: 'Italian cream dessert', price: 8, menuCategory: RestaurantItemCategory.DESSERTS },
      { name: 'Cookie Sandwich', description: 'Ice cream sandwiched in cookies', price: 7, menuCategory: RestaurantItemCategory.DESSERTS },
    ],
  },
  [BusinessType.SEAFOOD]: {
    businessDescription: 'Fresh from the ocean! Premium seafood restaurant serving the finest fish, shrimp, and seafood dishes.',
    businessName: 'Ocean Blue Seafood Restaurant',
    tags: ['seafood', 'fish', 'shrimp', 'crab', 'fresh'],
    mainItems: [BusinessMainItem.SEAFOOD_PLATES, BusinessMainItem.GRILLED_ITEMS],
    items: [
      { name: 'Grilled Sea Bass', description: 'Fresh sea bass with herbs and lemon', price: 35, menuCategory: RestaurantItemCategory.GRILLS },
      { name: 'Shrimp Linguine', description: 'Pasta with garlic shrimp', price: 28, menuCategory: RestaurantItemCategory.PASTA },
      { name: 'Lobster Thermidor', description: 'Classic lobster in creamy sauce', price: 55, menuCategory: RestaurantItemCategory.GRILLS },
      { name: 'Crab Legs 1kg', description: 'Fresh crab legs with butter', price: 45, menuCategory: RestaurantItemCategory.GRILLS },
      { name: 'Crispy Calamari', description: 'Fried squid with aioli', price: 18, menuCategory: RestaurantItemCategory.SIDES_AND_APPETIZERS },
      { name: 'Fish and Chips', description: 'Beer battered fish with chips', price: 22, menuCategory: RestaurantItemCategory.MEALS },
      { name: 'Salmon Teriyaki', description: 'Glazed salmon with rice', price: 30, menuCategory: RestaurantItemCategory.MEALS },
      { name: 'Seafood Platter', description: 'Mixed grilled seafood for two', price: 75, menuCategory: RestaurantItemCategory.GRILLS },
      { name: 'Clam Chowder', description: 'Creamy seafood soup', price: 12, menuCategory: RestaurantItemCategory.MEALS },
      { name: 'Marinated Octopus', description: 'Grilled octopus with olive oil', price: 25, menuCategory: RestaurantItemCategory.SIDES_AND_APPETIZERS },
    ],
  },
  [BusinessType.DENTIST]: {
    businessName: 'Smile Dental Clinic',
    businessDescription: 'Expert dental care for the whole family. Our experienced dentists provide gentle, professional dental services.',
    tags: ['dentist', 'dental', 'teeth', 'oral health', 'whitening'],
    mainItems: [BusinessMainItem.DENTAL_EXAMINATION, BusinessMainItem.TEETH_CLEANING],
    items: [
      { name: 'Dental Checkup', description: 'Comprehensive oral examination', price: 50, menuCategory: null },
      { name: 'Teeth Cleaning', description: 'Professional cleaning and polishing', price: 80, menuCategory: null },
      { name: 'Teeth Whitening', description: 'Professional whitening treatment', price: 200, menuCategory: null },
      { name: 'Dental Filling', description: 'Tooth colored composite filling', price: 100, menuCategory: null },
      { name: 'Root Canal Treatment', description: 'Endodontic treatment', price: 350, menuCategory: null },
      { name: 'Dental Crown', description: 'Porcelain crown fabrication', price: 400, menuCategory: null },
      { name: 'Tooth Extraction', description: 'Simple tooth removal', price: 150, menuCategory: null },
      { name: 'Dental Implant', description: 'Titanium implant placement', price: 1200, menuCategory: null },
      { name: 'Veneers', description: 'Porcelain veneers', price: 500, menuCategory: null },
      { name: 'Orthodontic Consultation', description: 'Braces evaluation', price: 75, menuCategory: null },
    ],
  },
  [BusinessType.CROSSFIT]: {
    businessName: 'CrossFit Arena',
    businessDescription: ' intensity fitness training with expert coaches. Join our community and transform your fitness!',
    tags: ['crossfit', 'fitness', 'workout', 'training', 'gym'],
    mainItems: [BusinessMainItem.CROSSFIT, BusinessMainItem.HIIT, BusinessMainItem.STRENGTH_TRAINING],
    items: [
      { name: 'CrossFit Class', description: 'High intensity functional training', price: 25, menuCategory: null },
      { name: 'HIIT Session', description: 'High intensity interval training', price: 20, menuCategory: null },
      { name: 'Strength Training', description: 'Weight lifting fundamentals', price: 20, menuCategory: null },
      { name: 'Cardio Bootcamp', description: 'Extreme cardio workout', price: 18, menuCategory: null },
      { name: 'Olympic Lifting', description: 'Advanced lifting technique', price: 30, menuCategory: null },
      { name: 'Mobility Class', description: 'Flexibility and recovery', price: 15, menuCategory: null },
      { name: 'Personal Training', description: 'One-on-one coaching session', price: 50, menuCategory: null },
      { name: 'Team WOD', description: 'Workout of the day with team', price: 22, menuCategory: null },
      { name: 'Kettlebell Session', description: 'Kettlebell conditioning', price: 18, menuCategory: null },
      { name: 'Boxing Class', description: 'High energy boxing workout', price: 25, menuCategory: null },
    ],
  },
};

const BUSINESS_CONFIGS = [
  { type: BusinessType.ELECTRONICS, category: BusinessCategory.STORE, itemType: ItemType.SUPER_MARKET_PRODUCT },
  { type: BusinessType.CLOTHING, category: BusinessCategory.STORE, itemType: ItemType.CLOTHING_PRODUCT },
  { type: BusinessType.SUPERMARKET, category: BusinessCategory.STORE, itemType: ItemType.SUPER_MARKET_PRODUCT },
  { type: BusinessType.PHARMACY, category: BusinessCategory.STORE, itemType: ItemType.PHARMACY_PRODUCT },
  { type: BusinessType.FAST_FOOD, category: BusinessCategory.RESTAURANT, itemType: ItemType.RESTAURANT },
  { type: BusinessType.CAFE, category: BusinessCategory.RESTAURANT, itemType: ItemType.RESTAURANT },
  { type: BusinessType.DESSERT, category: BusinessCategory.RESTAURANT, itemType: ItemType.RESTAURANT },
  { type: BusinessType.SEAFOOD, category: BusinessCategory.RESTAURANT, itemType: ItemType.RESTAURANT },
  { type: BusinessType.DENTIST, category: BusinessCategory.CLINIC, itemType: ItemType.CLINIC },
  { type: BusinessType.CROSSFIT, category: BusinessCategory.GYM, itemType: ItemType.CLASS_SESSION },
];

function generateRandomCoordinates(centerLat: number, centerLng: number, radiusInMeters: number): [number, number] {
  const radiusInDegrees = radiusInMeters / 111000;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  const newLat = centerLat + y;
  const newLng = centerLng + x / Math.cos(centerLat * (Math.PI / 180));
  return [newLng, newLat];
}

function generateGeohash(lat: number, lng: number) {
  const hash = ngeohash.encode(lat, lng);
  return {
    geohash: hash,
    geohash_country: hash.substring(0, 2),
    geohash_region: hash.substring(0, 3),
    geohash_city: hash.substring(0, 4),
    geohash_district: hash.substring(0, 5),
    geohash_neighborhood: hash.substring(0, 6),
    geohash_street: hash.substring(0, 7),
    geohash_building: hash.substring(0, 8),
  };
}

function generateWorkingHours() {
  return [
    { day: 'Sunday', open: '09:00', close: '22:00', isOpen: true },
    { day: 'Monday', open: '09:00', close: '22:00', isOpen: true },
    { day: 'Tuesday', open: '09:00', close: '22:00', isOpen: true },
    { day: 'Wednesday', open: '09:00', close: '22:00', isOpen: true },
    { day: 'Thursday', open: '09:00', close: '22:00', isOpen: true },
    { day: 'Friday', open: '14:00', close: '23:00', isOpen: true },
    { day: 'Saturday', open: '10:00', close: '23:00', isOpen: true },
  ];
}

function getRandomFacilities(): BusinessFacility[] {
  const allFacilities = Object.values(BusinessFacility);
  const count = faker.number.int({ min: 2, max: 5 });
  const shuffled = allFacilities.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateItemAttributes(itemType: ItemType, businessType: BusinessType, itemData: { menuCategory?: string }) {
  switch (itemType) {
    case ItemType.RESTAURANT:
      return {
        menuCategory: itemData.menuCategory || faker.helpers.arrayElement(Object.values(RestaurantItemCategory)),
        sizes: faker.helpers.arrayElement(Object.values(SizeEnum)),
        tags: ['food', 'restaurant', 'delicious'],
      };
    case ItemType.CLINIC:
      return {
        doctorName: faker.person.fullName(),
        doctorSpecialization: faker.helpers.arrayElement(['General Dentist', 'Orthodontist', 'Oral Surgeon', 'Pediatric Dentist']),
        waitingPeriod: `${faker.number.int({ min: 5, max: 30 })} minutes`,
      };
    case ItemType.CLASS_SESSION:
      return {
        trainerName: faker.person.fullName(),
        schedule: faker.helpers.arrayElement(['Morning 6:00 AM', 'Afternoon 2:00 PM', 'Evening 6:00 PM']),
        duration: `${faker.number.int({ min: 30, max: 90 })} min`,
        capacity: faker.number.int({ min: 5, max: 20 }),
        intensityLevel: faker.helpers.arrayElement(['low', 'medium', 'high']),
      };
    case ItemType.MEMBERSHIP:
      return {
        accessLevel: faker.helpers.arrayElement(['basic', 'premium', 'vip']),
        validity: `${faker.number.int({ min: 1, max: 12 })} months`,
        benefits: ['Gym access', 'Locker', 'Shower'],
      };
    case ItemType.SUPER_MARKET_PRODUCT:
      if (businessType === BusinessType.ELECTRONICS) {
        return {
          brand: faker.helpers.arrayElement(['Apple', 'Samsung', 'Sony', 'LG', 'Dell']),
          warranty: `${faker.number.int({ min: 1, max: 2 })} year`,
          stock: faker.number.int({ min: 10, max: 100 }),
        };
      }
      return {
        brand: faker.company.name(),
        weight: `${faker.number.int({ min: 100, max: 2000 })}g`,
        stock: faker.number.int({ min: 10, max: 100 }),
      };
    case ItemType.CLOTHING_PRODUCT:
      return {
        sizes: [faker.helpers.arrayElement(Object.values(SizeEnum))],
        colorsAvailable: [faker.color.human(), faker.color.human()],
        material: faker.helpers.arrayElement(['Cotton', 'Polyester', 'Wool', 'Silk']),
        brand: faker.company.name(),
        stock: faker.number.int({ min: 5, max: 50 }),
      };
    case ItemType.PHARMACY_PRODUCT:
      return {
        brand: faker.company.name(),
        activeIngredients: [faker.word.noun(), faker.word.noun()],
        dosageForm: faker.helpers.arrayElement(['tablet', 'capsule', 'syrup', 'cream', 'injection']),
        packageSize: `${faker.number.int({ min: 10, max: 100 })} units`,
        stock: faker.number.int({ min: 20, max: 200 }),
      };
    default:
      return {};
  }
}

async function seed() {
  console.log('🚀 Initializing NestJS application...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const businessModel = app.get<Model<Business>>(getModelToken(Business.name));
  const itemModel = app.get<Model<Item>>(getModelToken(Item.name));
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
  const embeddingClient = app.get(EmbedClientService);
  const embeddingTextBuilder = app.get(EmbeddingTextBuilder);

  console.log('🧹 Clearing existing seeded data...');

  const seededOwners = await userModel
    .find({ email: { $regex: /^seeded_/ } })
    .select('_id')
    .lean();
  const seededOwnerIds = seededOwners.map((u) => u._id);

  if (seededOwnerIds.length > 0) {
    await businessModel.deleteMany({ ownerId: { $in: seededOwnerIds } });
    await userModel.deleteMany({ _id: { $in: seededOwnerIds } });
    await itemModel.deleteMany({ businessId: { $in: seededOwnerIds } });
  }
  await itemModel.deleteMany({ businessName: { $regex: /^Seed/ } });
  await businessModel.deleteMany({ name: { $regex: /^Seed/ } });

  console.log('✅ Cleared existing seeded data');

  console.log('👤 Creating 10 seeded owners...');
  const ownerIds: Types.ObjectId[] = [];
  for (let i = 0; i < 10; i++) {
    const user = await userModel.create({
      userName: faker.person.fullName(),
      email: `seeded_owner_${i + 1}@test.com`,
      password: '$2b$10$dummyhashedpasswordfortesting',
      role: 'user',
      bookmarkedBusinesses: [],
    });
    ownerIds.push(user._id as Types.ObjectId);
  }
  console.log(`✅ Created ${ownerIds.length} owners`);

  console.log('📍 Fetching categories...');
  const categories = await categoryModel.find().lean();
  if (categories.length === 0) {
    console.error('❌ No categories found. Please run seed:categories first.');
    process.exit(1);
  }

  const businesses: Business[] = [];
  console.log('🏪 Creating 10 businesses with realistic data...');

  for (let i = 0; i < BUSINESS_CONFIGS.length; i++) {
    const config = BUSINESS_CONFIGS[i];
    const fakeData = FAKE_DATA[config.type];
    const coordinates = generateRandomCoordinates(CENTER_LAT, CENTER_LNG, RADIUS);
    const [lng, lat] = coordinates;
    const geohashData = generateGeohash(lat, lng);

    const business = await businessModel.create({
      name: `Seed ${fakeData.businessName} ${i + 1}`,
      description: fakeData.businessDescription,
      tags: fakeData.tags,
      type: config.type,
      category: config.category,
      subcategory: config.type.replace('_', ' '),
      phone: faker.phone.number(),
      email: faker.internet.email({ firstName: `seed${i + 1}` }),
      address: faker.location.streetAddress(true),
      location: { type: 'Point', coordinates },
      workingHours: generateWorkingHours(),
      images: [faker.image.url()],
      status: BusinessStatus.OPEN,
      rate: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      numberOfRatings: faker.number.int({ min: 10, max: 500 }),
      targetAudience: [BusinessTargetAudience.FAMILY],
      mainItems: fakeData.mainItems,
      facilities: getRandomFacilities(),
      ownerId: ownerIds[i],
      ...geohashData,
    });
    businesses.push(business);
    console.log(`   Created: ${business.name} (${config.type}/${config.category})`);
  }

  console.log('📦 Creating 10 items for each business with semantic embeddings...');
  let itemsCreated = 0;
  let embeddingsCreated = 0;

  for (const business of businesses) {
    const config = BUSINESS_CONFIGS.find((c) => c.type === business.type);
    if (!config) continue;

    const fakeData = FAKE_DATA[config.type];

    const availableCategories = categories.filter((c) => c.itemType === config.itemType);
    const category = availableCategories.length > 0 ? faker.helpers.arrayElement(availableCategories) : categories[0];

    if (!category) {
      console.error(`   No category found for business: ${business.name}, skipping items`);
      continue;
    }
    const categoryId = category._id;

    for (let j = 0; j < fakeData.items.length; j++) {
      const itemTemplate = fakeData.items[j];
      const itemDescription = itemTemplate.description;
      const price = itemTemplate.price;
      const menuCategory = itemTemplate.menuCategory;

      const attributes = generateItemAttributes(config.itemType, config.type, { menuCategory });

      const itemData: Record<string, unknown> = {
        name: itemTemplate.name,
        description: itemDescription,
        price,
        images: [faker.image.url()],
        isAvailable: faker.datatype.boolean(),
        businessId: business._id,
        type: config.itemType,
        categoryId,
        businessName: business.name,
        businessCategory: business.category,
        businessType: business.type,
        location: business.location,
        businessRate: business.rate,
        workingHours: business.workingHours,
        attributes,
      };

      const createdItem = await itemModel.create(itemData);

      try {
        const textbuilder = embeddingTextBuilder.buildRequestBody(itemData as any, business);
        const embedding = await embeddingClient.createEmbedding(textbuilder);
        await itemModel.updateOne({ _id: createdItem._id }, { $set: { embedding } });

        embeddingsCreated++;
      } catch (error: any) {
        console.warn(`   Warning: Failed to create embedding for ${itemTemplate.name}: ${error?.message}`);
      }

      itemsCreated++;
    }
    console.log(`   Created ${fakeData.items.length} items for: ${business.name}`);
  }

  console.log(`\n✅ Seeding completed!`);
  console.log(`   - Created ${businesses.length} businesses`);
  console.log(`   - Created ${itemsCreated} items`);
  console.log(`   - Created ${embeddingsCreated} semantic embeddings`);
  console.log(`   - All businesses within ${RADIUS / 1000}km radius of (${CENTER_LAT}, ${CENTER_LNG})`);

  const storeCount = businesses.filter((b) => b.category === BusinessCategory.STORE).length;
  const restaurantCount = businesses.filter((b) => b.category === BusinessCategory.RESTAURANT).length;
  const clinicCount = businesses.filter((b) => b.category === BusinessCategory.CLINIC).length;
  const gymCount = businesses.filter((b) => b.category === BusinessCategory.GYM).length;

  console.log(`\n📊 Business Summary by Category:`);
  console.log(`   STORE: ${storeCount} (Electronics, Clothing, Supermarket, Pharmacy)`);
  console.log(`   RESTAURANT: ${restaurantCount} (Fast Food, Cafe, Dessert, Seafood)`);
  console.log(`   CLINIC: ${clinicCount} (Dentist)`);
  console.log(`   GYM: ${gymCount} (CrossFit)`);

  await app.close();
  console.log('👋 Application closed.');
}

async function remove() {
  console.log('🧹 Removing all seeded data...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const businessModel = app.get<Model<Business>>(getModelToken(Business.name));
  const itemModel = app.get<Model<Item>>(getModelToken(Item.name));
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  const seededOwners = await userModel
    .find({ email: { $regex: /^seeded_/ } })
    .select('_id')
    .lean();
  const seededOwnerIds = seededOwners.map((u) => u._id);

  if (seededOwnerIds.length > 0) {
    await itemModel.deleteMany({ businessId: { $in: seededOwnerIds } });
    await businessModel.deleteMany({ ownerId: { $in: seededOwnerIds } });
    await userModel.deleteMany({ _id: { $in: seededOwnerIds } });
  }

  const itemResult = await itemModel.deleteMany({ businessName: { $regex: /^Seed/ } });
  const businessResult = await businessModel.deleteMany({ name: { $regex: /^Seed/ } });

  console.log(`✅ Removed:`);
  console.log(`   - ${businessResult.deletedCount} businesses`);
  console.log(`   - ${itemResult.deletedCount} items`);
  console.log(`   - ${seededOwners.length} owners`);

  await app.close();
  console.log('👋 Application closed.');
}

const command = process.argv[2];
if (command === 'remove') {
  remove()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} else {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
