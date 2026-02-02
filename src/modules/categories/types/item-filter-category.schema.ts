import { ClothesCategory } from 'src/modules/item/enums/clothes-category.enum';
import { ItemType } from 'src/modules/item/enums/item-type.enum';
import { RestaurantItemType } from 'src/modules/item/enums/resturant-item-type';

export const ITEM_CATEGORY_SEED: Record<
  ItemType,
  {
    key: string;
    name: string;
    icon?: string;
  }[]
> = {
  [ItemType.SERVICE]: [
    { key: 'GENERAL_SERVICE', name: 'General Service' },
    { key: 'CONSULTATION', name: 'Consultation' },
    { key: 'MAINTENANCE', name: 'Maintenance' },
    { key: 'INSTALLATION', name: 'Installation' },
  ],

  [ItemType.CLINIC]: [
    { key: 'GENERAL_CHECKUP', name: 'General Checkup' },
    { key: 'DENTAL', name: 'Dental' },
    { key: 'DERMATOLOGY', name: 'Dermatology' },
    { key: 'PEDIATRICS', name: 'Pediatrics' },
    { key: 'CARDIOLOGY', name: 'Cardiology' },
  ],

  [ItemType.CLASS_SESSION]: [
    { key: 'FITNESS', name: 'Fitness' },
    { key: 'YOGA', name: 'Yoga' },
    { key: 'DANCE', name: 'Dance' },
    { key: 'MARTIAL_ARTS', name: 'Martial Arts' },
    { key: 'SWIMMING', name: 'Swimming' },
  ],

  [ItemType.MEMBERSHIP]: [
    { key: 'BASIC', name: 'Basic Membership' },
    { key: 'PREMIUM', name: 'Premium Membership' },
    { key: 'VIP', name: 'VIP Membership' },
    { key: 'FAMILY', name: 'Family Membership' },
  ],

  [ItemType.RESTAURANT]: [
    { key: RestaurantItemType.FOOD, name: 'Food' },
    { key: RestaurantItemType.BEVERAGE, name: 'Beverages' },
    { key: RestaurantItemType.DESSERT, name: 'Desserts' },
    { key: RestaurantItemType.HOT_DRINK, name: 'Hot Drinks' },
    { key: RestaurantItemType.COLD_DRINK, name: 'Cold Drinks' },
    { key: RestaurantItemType.BREAKFAST, name: 'Breakfast' },
    { key: RestaurantItemType.LUNCH, name: 'Lunch' },
    { key: RestaurantItemType.DINNER, name: 'Dinner' },
  ],

  [ItemType.SUPER_MARKET_PRODUCT]: [
    { key: 'DAIRY', name: 'Dairy' },
    { key: 'VEGETABLES', name: 'Vegetables' },
    { key: 'FRUITS', name: 'Fruits' },
    { key: 'MEAT', name: 'Meat' },
    { key: 'POULTRY', name: 'Poultry' },
    { key: 'FROZEN', name: 'Frozen Foods' },
    { key: 'SNACKS', name: 'Snacks' },
    { key: 'BEVERAGES', name: 'Beverages' },
    { key: 'HOUSEHOLD', name: 'Household Items' },
  ],

  [ItemType.PHARMACY_PRODUCT]: [
    { key: 'MEDICATION', name: 'Medication' },
    { key: 'SUPPLEMENTS', name: 'Supplements' },
    { key: 'PERSONAL_CARE', name: 'Personal Care' },
    { key: 'MEDICAL_DEVICES', name: 'Medical Devices' },
    { key: 'BABY_CARE', name: 'Baby Care' },
    { key: 'FIRST_AID', name: 'First Aid' },
  ],

  [ItemType.CLOTHING_PRODUCT]: [
    { key: ClothesCategory.MEN, name: 'Men' },
    { key: ClothesCategory.WOMEN, name: 'Women' },
    { key: ClothesCategory.KIDS, name: 'Kids' },
    { key: ClothesCategory.UNISEX, name: 'Unisex' },
  ],
};
