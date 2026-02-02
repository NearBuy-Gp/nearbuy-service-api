import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { AppModule } from 'src/app.module';
import { BusinessCategory } from 'src/modules/business/enums/business-category.enum';
import { BusinessFacility } from 'src/modules/business/enums/business-facilities.enum';
import { BusinessMainItem } from 'src/modules/business/enums/business-mainitems.enum';
import { BusinessStatus } from 'src/modules/business/enums/business-status.enum';
import { BusinessTargetAudience } from 'src/modules/business/enums/business-target-audience';
import { BusinessType } from 'src/modules/business/enums/business-type.enum';
import { Business } from 'src/modules/business/schemas/buisness.schema';

// Helper function to generate random coordinates within radius
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

  return [newLng, newLat]; // GeoJSON format: [longitude, latitude]
}

// Helper function to generate working hours
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

// Sample owner IDs (replace with actual user IDs from your database)
const sampleOwnerIds = [new Types.ObjectId(), new Types.ObjectId(), new Types.ObjectId(), new Types.ObjectId(), new Types.ObjectId()];

// Center coordinates: Cairo
const CENTER_LAT = 29.955560664016126;
const CENTER_LNG = 31.02491697797309;
const RADIUS = 5000; // 5km in meters

// Business templates for different categories
const businessTemplates: Omit<BusinessSeedData, 'location' | 'ownerId'>[] = [
  // STORES - Electronics
  {
    name: 'Tech Galaxy',
    description: 'Latest electronics and mobile accessories',
    tags: ['electronics', 'mobile', 'gadgets', 'accessories'],
    type: BusinessType.ELECTRONICS,
    category: BusinessCategory.STORE,
    subcategory: 'Electronics Store',
    phone: '+201234567890',
    email: 'info@techgalaxy.com',
    website: 'https://techgalaxy.com',
    whatsappNumber: '+201234567890',
    social: {
      facebook: 'techgalaxy',
      instagram: '@techgalaxy',
    },
    address: 'Downtown Cairo',
    workingHours: generateWorkingHours(),
    images: ['store1.jpg', 'store2.jpg'],
    status: BusinessStatus.OPEN,
    rate: 4.5,
    targetAudience: [BusinessTargetAudience.FAMILY],
    mainItems: [BusinessMainItem.ELECTRONICS, BusinessMainItem.MOBILE_ACCESSORIES],
    facilities: [BusinessFacility.HOME_DELIVERY, BusinessFacility.IN_STORE_PICKUP, BusinessFacility.WARRANTY_AVAILABLE, BusinessFacility.CARD_PAYMENTS, BusinessFacility.PARKING_AVAILABLE],
  },
  // STORES - Clothing
  {
    name: 'Fashion Hub',
    description: 'Trendy clothing for all occasions',
    tags: ['fashion', 'clothing', 'apparel', 'style'],
    type: BusinessType.CLOTHING,
    category: BusinessCategory.STORE,
    subcategory: 'Clothing Store',
    phone: '+201234567891',
    email: 'contact@fashionhub.com',
    address: 'Nasr City',
    workingHours: generateWorkingHours(),
    images: ['clothing1.jpg', 'clothing2.jpg'],
    status: BusinessStatus.OPEN,
    rate: 4.3,
    targetAudience: [BusinessTargetAudience.FAMILY, BusinessTargetAudience.TOURISTS],
    mainItems: [BusinessMainItem.HOUSEHOLD_ESSENTIALS],
    facilities: [BusinessFacility.IN_STORE_PICKUP, BusinessFacility.CARD_PAYMENTS, BusinessFacility.PARKING_AVAILABLE, BusinessFacility.WHEELCHAIR_ACCESS, BusinessFacility.WIFI_AVAILABLE],
  },
  // STORES - Supermarket
  {
    name: 'Fresh Market',
    description: 'Your daily grocery needs',
    tags: ['groceries', 'supermarket', 'fresh', 'daily needs'],
    type: BusinessType.SUPERMARKET,
    category: BusinessCategory.STORE,
    subcategory: 'Supermarket',
    phone: '+201234567892',
    address: 'Heliopolis',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.6,
    targetAudience: [BusinessTargetAudience.FAMILY],
    mainItems: [BusinessMainItem.GROCERIES, BusinessMainItem.FRESH_PRODUCE, BusinessMainItem.DAIRY_PRODUCTS, BusinessMainItem.BAKERY_ITEMS, BusinessMainItem.SNACKS, BusinessMainItem.BEVERAGES],
    facilities: [BusinessFacility.HOME_DELIVERY, BusinessFacility.IN_STORE_PICKUP, BusinessFacility.CARD_PAYMENTS, BusinessFacility.PARKING_AVAILABLE, BusinessFacility.WHEELCHAIR_ACCESS],
  },
  // STORES - Pharmacy
  {
    name: 'Care Pharmacy',
    description: 'Your trusted healthcare partner',
    tags: ['pharmacy', 'medicine', 'healthcare', 'wellness'],
    type: BusinessType.PHARMACY,
    category: BusinessCategory.STORE,
    subcategory: 'Pharmacy',
    phone: '+201234567893',
    address: 'Zamalek',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.7,
    targetAudience: [BusinessTargetAudience.FAMILY, BusinessTargetAudience.SENIORS],
    mainItems: [BusinessMainItem.HEALTH_WELLNESS, BusinessMainItem.PERSONAL_CARE, BusinessMainItem.BABY_PRODUCTS],
    facilities: [BusinessFacility.HOME_DELIVERY, BusinessFacility.ONLINE_ORDERING, BusinessFacility.CARD_PAYMENTS, BusinessFacility.WHEELCHAIR_ACCESS],
  },
  // RESTAURANTS - Fast Food
  {
    name: 'Burger Express',
    description: 'Quick and delicious fast food',
    tags: ['burger', 'fast food', 'fries', 'quick meal'],
    type: BusinessType.FAST_FOOD,
    category: BusinessCategory.RESTAURANT,
    subcategory: 'Fast Food',
    phone: '+201234567894',
    address: 'Garden City',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.2,
    targetAudience: [BusinessTargetAudience.FAMILY, BusinessTargetAudience.CHILDREN],
    mainItems: [BusinessMainItem.BURGERS, BusinessMainItem.FRIED_CHICKEN, BusinessMainItem.SANDWICHES, BusinessMainItem.SIDES],
    facilities: [BusinessFacility.DINE_IN, BusinessFacility.TAKEAWAY, BusinessFacility.DELIVERY, BusinessFacility.FAMILY_FRIENDLY, BusinessFacility.KIDS_MENU, BusinessFacility.WIFI_AVAILABLE],
  },
  // RESTAURANTS - Cafe
  {
    name: 'Coffee Corner',
    description: 'Premium coffee and pastries',
    tags: ['coffee', 'cafe', 'pastries', 'breakfast'],
    type: BusinessType.CAFE,
    category: BusinessCategory.RESTAURANT,
    subcategory: 'Cafe',
    phone: '+201234567895',
    address: 'Maadi',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.4,
    targetAudience: [BusinessTargetAudience.FAMILY, BusinessTargetAudience.TOURISTS],
    mainItems: [BusinessMainItem.BEVERAGES_MENU, BusinessMainItem.DESSERTS, BusinessMainItem.BREAKFAST, BusinessMainItem.SANDWICHES],
    facilities: [BusinessFacility.DINE_IN, BusinessFacility.TAKEAWAY, BusinessFacility.DELIVERY, BusinessFacility.OUTDOOR_SEATING, BusinessFacility.WIFI_AVAILABLE],
  },
  // RESTAURANTS - Dessert
  {
    name: 'Sweet Heaven',
    description: 'Delightful desserts and ice cream',
    tags: ['dessert', 'sweets', 'ice cream', 'bakery'],
    type: BusinessType.DESSERT,
    category: BusinessCategory.RESTAURANT,
    subcategory: 'Dessert Shop',
    phone: '+201234567896',
    address: 'New Cairo',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.5,
    targetAudience: [BusinessTargetAudience.FAMILY, BusinessTargetAudience.CHILDREN],
    mainItems: [BusinessMainItem.DESSERTS, BusinessMainItem.BAKERY_ITEMS],
    facilities: [BusinessFacility.DINE_IN, BusinessFacility.TAKEAWAY, BusinessFacility.DELIVERY, BusinessFacility.FAMILY_FRIENDLY, BusinessFacility.OUTDOOR_SEATING],
  },
  // RESTAURANTS - Seafood
  {
    name: 'Ocean Blue',
    description: 'Fresh seafood daily',
    tags: ['seafood', 'fish', 'shrimp', 'fresh'],
    type: BusinessType.SEAFOOD,
    category: BusinessCategory.RESTAURANT,
    subcategory: 'Seafood Restaurant',
    phone: '+201234567897',
    address: 'Dokki',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.6,
    targetAudience: [BusinessTargetAudience.FAMILY],
    mainItems: [BusinessMainItem.SEAFOOD_PLATES, BusinessMainItem.GRILLED_ITEMS, BusinessMainItem.SALADS, BusinessMainItem.FAMILY_MEALS],
    facilities: [BusinessFacility.DINE_IN, BusinessFacility.TAKEAWAY, BusinessFacility.DELIVERY, BusinessFacility.FAMILY_FRIENDLY, BusinessFacility.PARKING_AVAILABLE, BusinessFacility.WIFI_AVAILABLE],
  },
  // CLINICS - Dentist
  {
    name: 'Smile Dental Clinic',
    description: 'Complete dental care services',
    tags: ['dentist', 'dental', 'teeth', 'oral health'],
    type: BusinessType.DENTIST,
    category: BusinessCategory.CLINIC,
    subcategory: 'Dental Clinic',
    phone: '+201234567898',
    address: 'Mohandiseen',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.8,
    targetAudience: [BusinessTargetAudience.FAMILY, BusinessTargetAudience.CHILDREN],
    mainItems: [BusinessMainItem.DENTAL_EXAMINATION, BusinessMainItem.TEETH_CLEANING, BusinessMainItem.DENTAL_FILLING],
    facilities: [BusinessFacility.APPOINTMENT_REQUIRED, BusinessFacility.INSURANCE_ACCEPTED, BusinessFacility.EMERGENCY_CASES, BusinessFacility.CARD_PAYMENTS, BusinessFacility.PARKING_AVAILABLE],
  },
  // CLINICS - Dermatology
  {
    name: 'Skin Care Clinic',
    description: 'Expert dermatology services',
    tags: ['dermatology', 'skin', 'beauty', 'healthcare'],
    type: BusinessType.DERMATOLOGY,
    category: BusinessCategory.CLINIC,
    subcategory: 'Dermatology Clinic',
    phone: '+201234567899',
    address: 'Agouza',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.7,
    targetAudience: [BusinessTargetAudience.FAMILY],
    mainItems: [BusinessMainItem.DERMATOLOGY_SESSION, BusinessMainItem.GENERAL_CONSULTATION, BusinessMainItem.FOLLOW_UP],
    facilities: [BusinessFacility.APPOINTMENT_REQUIRED, BusinessFacility.INSURANCE_ACCEPTED, BusinessFacility.CARD_PAYMENTS, BusinessFacility.ONLINE_BOOKING],
  },
  // CLINICS - Pediatric
  {
    name: 'Kids Health Center',
    description: 'Specialized pediatric care',
    tags: ['pediatric', 'children', 'kids', 'healthcare'],
    type: BusinessType.PEDIATRIC,
    category: BusinessCategory.CLINIC,
    subcategory: 'Pediatric Clinic',
    phone: '+201234567800',
    address: 'Sheikh Zayed',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.9,
    targetAudience: [BusinessTargetAudience.CHILDREN, BusinessTargetAudience.FAMILY],
    mainItems: [BusinessMainItem.PEDIATRIC_CHECKUP, BusinessMainItem.VACCINATIONS, BusinessMainItem.GENERAL_CONSULTATION],
    facilities: [BusinessFacility.APPOINTMENT_REQUIRED, BusinessFacility.INSURANCE_ACCEPTED, BusinessFacility.EMERGENCY_CASES, BusinessFacility.PARKING_AVAILABLE, BusinessFacility.WHEELCHAIR_ACCESS],
  },
  // CLINICS - General
  {
    name: 'City Medical Center',
    description: 'Comprehensive healthcare services',
    tags: ['medical', 'clinic', 'healthcare', 'doctor'],
    type: BusinessType.GENERAL_CLINIC,
    category: BusinessCategory.CLINIC,
    subcategory: 'Medical Clinic',
    phone: '+201234567801',
    address: 'Downtown Cairo',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.5,
    targetAudience: [BusinessTargetAudience.FAMILY, BusinessTargetAudience.SENIORS],
    mainItems: [BusinessMainItem.GENERAL_CONSULTATION, BusinessMainItem.LAB_TESTS, BusinessMainItem.BLOOD_ANALYSIS, BusinessMainItem.ULTRASOUND, BusinessMainItem.CHRONIC_DISEASE_MANAGEMENT],
    facilities: [BusinessFacility.APPOINTMENT_REQUIRED, BusinessFacility.INSURANCE_ACCEPTED, BusinessFacility.LAB_SERVICES, BusinessFacility.EMERGENCY_CASES, BusinessFacility.PARKING_AVAILABLE],
  },
  // GYM - CrossFit
  {
    name: 'CrossFit Arena',
    description: 'High-intensity CrossFit training',
    tags: ['crossfit', 'fitness', 'training', 'workout'],
    type: BusinessType.CROSSFIT,
    category: BusinessCategory.GYM,
    subcategory: 'CrossFit Gym',
    phone: '+201234567802',
    address: 'Nasr City',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.6,
    targetAudience: [BusinessTargetAudience.ATHLETES, BusinessTargetAudience.FAMILY],
    mainItems: [BusinessMainItem.CROSSFIT, BusinessMainItem.HIIT, BusinessMainItem.STRENGTH_TRAINING, BusinessMainItem.GROUP_CLASSES],
    facilities: [
      BusinessFacility.PERSONAL_TRAINER,
      BusinessFacility.GROUP_CLASSES,
      BusinessFacility.LOCKER,
      BusinessFacility.SHOWERS,
      BusinessFacility.PARKING_AVAILABLE,
      BusinessFacility.AIR_CONDITIONED,
    ],
  },
  // GYM - Bodybuilding
  {
    name: 'Iron Paradise Gym',
    description: 'Professional bodybuilding facility',
    tags: ['bodybuilding', 'gym', 'weights', 'muscle'],
    type: BusinessType.BODYBUILDING,
    category: BusinessCategory.GYM,
    subcategory: 'Bodybuilding Gym',
    phone: '+201234567803',
    address: 'Heliopolis',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.7,
    targetAudience: [BusinessTargetAudience.ATHLETES],
    mainItems: [BusinessMainItem.WEIGHTLIFTING, BusinessMainItem.STRENGTH_TRAINING, BusinessMainItem.PERSONAL_TRAINING, BusinessMainItem.NUTRITION_GUIDANCE],
    facilities: [
      BusinessFacility.PERSONAL_TRAINER,
      BusinessFacility.LOCKER,
      BusinessFacility.SHOWERS,
      BusinessFacility.NUTRITION_GUIDANCE,
      BusinessFacility.AIR_CONDITIONED,
      BusinessFacility.PARKING_AVAILABLE,
    ],
  },
  // GYM - Pilates
  {
    name: 'Zen Pilates Studio',
    description: 'Mind and body wellness through Pilates',
    tags: ['pilates', 'yoga', 'wellness', 'fitness'],
    type: BusinessType.PILATES,
    category: BusinessCategory.GYM,
    subcategory: 'Pilates Studio',
    phone: '+201234567804',
    address: 'Zamalek',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.8,
    targetAudience: [BusinessTargetAudience.FAMILY],
    mainItems: [BusinessMainItem.PILATES, BusinessMainItem.YOGA, BusinessMainItem.STRETCHING, BusinessMainItem.GROUP_CLASSES],
    facilities: [
      BusinessFacility.GROUP_CLASSES,
      BusinessFacility.WOMEN_ONLY_HOURS,
      BusinessFacility.LOCKER,
      BusinessFacility.SHOWERS,
      BusinessFacility.AIR_CONDITIONED,
      BusinessFacility.ONLINE_BOOKING,
    ],
  },
  // SERVICE - Repair
  {
    name: 'Quick Fix Services',
    description: 'Professional repair services',
    tags: ['repair', 'maintenance', 'fixing', 'service'],
    type: BusinessType.REPAIR,
    category: BusinessCategory.SERVICE,
    subcategory: 'Repair Service',
    phone: '+201234567805',
    address: 'Maadi',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.4,
    targetAudience: [BusinessTargetAudience.FAMILY],
    mainItems: [BusinessMainItem.APPLIANCE_REPAIR, BusinessMainItem.MOBILE_REPAIR, BusinessMainItem.ELECTRICAL_WORK, BusinessMainItem.PLUMBING_REPAIR],
    facilities: [BusinessFacility.HOME_SERVICE, BusinessFacility.ONSITE_SERVICE, BusinessFacility.EMERGENCY_SERVICE, BusinessFacility.WARRANTY, BusinessFacility.ONLINE_BOOKING],
  },
  // SERVICE - Cleaning
  {
    name: 'Sparkle Clean',
    description: 'Professional cleaning services',
    tags: ['cleaning', 'home service', 'deep clean', 'hygiene'],
    type: BusinessType.CLEANING,
    category: BusinessCategory.SERVICE,
    subcategory: 'Cleaning Service',
    phone: '+201234567806',
    address: 'New Cairo',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.5,
    targetAudience: [BusinessTargetAudience.FAMILY],
    mainItems: [BusinessMainItem.HOME_CLEANING, BusinessMainItem.DEEP_CLEANING, BusinessMainItem.PEST_CONTROL],
    facilities: [BusinessFacility.HOME_SERVICE, BusinessFacility.ONLINE_BOOKING, BusinessFacility.CARD_PAYMENTS],
  },
  // SERVICE - Beauty
  {
    name: 'Elegance Beauty Salon',
    description: 'Premium beauty and styling services',
    tags: ['beauty', 'salon', 'hair', 'styling'],
    type: BusinessType.BEAUTY,
    category: BusinessCategory.SERVICE,
    subcategory: 'Beauty Salon',
    phone: '+201234567807',
    address: 'Dokki',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.6,
    targetAudience: [BusinessTargetAudience.FAMILY],
    mainItems: [BusinessMainItem.BEAUTY_SERVICES, BusinessMainItem.HAIR_STYLING],
    facilities: [BusinessFacility.ONLINE_BOOKING, BusinessFacility.CARD_PAYMENTS, BusinessFacility.PARKING_AVAILABLE, BusinessFacility.WIFI_AVAILABLE, BusinessFacility.AIR_CONDITIONED],
  },
  // SERVICE - Consulting
  {
    name: 'Expert Consulting',
    description: 'Professional consulting services',
    tags: ['consulting', 'business', 'advisory', 'professional'],
    type: BusinessType.CONSULTING,
    category: BusinessCategory.SERVICE,
    subcategory: 'Consulting Firm',
    phone: '+201234567808',
    address: 'Smart Village',
    workingHours: generateWorkingHours(),
    status: BusinessStatus.OPEN,
    rate: 4.7,
    targetAudience: [BusinessTargetAudience.OTHERS],
    mainItems: [BusinessMainItem.OTHERS],
    facilities: [BusinessFacility.ONLINE_BOOKING, BusinessFacility.CARD_PAYMENTS, BusinessFacility.PARKING_AVAILABLE, BusinessFacility.WIFI_AVAILABLE],
  },
];

interface BusinessSeedData {
  name: string;
  description?: string;
  tags?: string[];
  type: BusinessType;
  category?: BusinessCategory;
  subcategory?: string;
  phone?: string;
  email?: string;
  website?: string;
  whatsappNumber?: string;
  social?: Record<string, string>;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  workingHours?: Array<{
    day: string;
    open?: string;
    close?: string;
    isOpen?: boolean;
  }>;
  images?: string[];
  status: BusinessStatus;
  rate: number;
  targetAudience?: BusinessTargetAudience[];
  mainItems?: BusinessMainItem[];
  facilities?: BusinessFacility[];
  ownerId: Types.ObjectId;
}

// Generate seed data
function generateBusinessSeedData(count: number = 50): BusinessSeedData[] {
  const businesses: BusinessSeedData[] = [];

  for (let i = 0; i < count; i++) {
    const template = businessTemplates[i % businessTemplates.length];
    const coordinates = generateRandomCoordinates(CENTER_LAT, CENTER_LNG, RADIUS);

    const business: BusinessSeedData = {
      ...template,
      name: `${template.name} Branch ${i + 1}`,
      location: {
        type: 'Point' as const,
        coordinates,
      },
      ownerId: sampleOwnerIds[i % sampleOwnerIds.length],
      rate: Math.round((Math.random() * 2 + 3) * 10) / 10, // Random rate between 3.0 and 5.0
    };

    businesses.push(business);
  }

  return businesses;
}

// Seeder Service
class BusinessSeederService {
  constructor(private businessModel: Model<Business>) {}

  async seed() {
    try {
      console.log('🌱 Starting business seeding...');

      // Clear existing data
      const deleteResult = await this.businessModel.deleteMany({});
      console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing businesses`);

      // Generate and insert seed data
      const seedData = generateBusinessSeedData(50);
      const result = await this.businessModel.insertMany(seedData);

      console.log(`✅ Successfully seeded ${result.length} businesses`);
      console.log(`📍 All businesses are within 5km radius of Cairo (${CENTER_LAT}, ${CENTER_LNG})`);

      // Print summary by category
      const summary = result.reduce(
        (acc, business) => {
          const category = business.category || 'unknown';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log('\n📊 Seeding Summary:');
      Object.entries(summary).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} businesses`);
      });

      return result;
    } catch (error) {
      console.error('❌ Error seeding businesses:', error);
      throw error;
    }
  }
}

// Main seeding function
async function seed() {
  console.log('🚀 Initializing NestJS application...');

  const app = await NestFactory.createApplicationContext(AppModule);

  // Get the Business model using the correct token
  const businessModel = app.get<Model<Business>>(getModelToken(Business.name));
  const seederService = new BusinessSeederService(businessModel);

  await seederService.seed();

  await app.close();
  console.log('👋 Seeding completed. Application closed.');
}

// Run the seeder
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
