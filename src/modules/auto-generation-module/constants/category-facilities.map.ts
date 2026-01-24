import { BusinessCategory } from '../../business/enums/business-category.enum';
import { BusinessFacility } from '../../business/enums/business-facilities.enum';

export const CATEGORY_FACILITIES_MAP: Record<
  BusinessCategory,
  BusinessFacility[]
> = {
  [BusinessCategory.STORE]: [
    BusinessFacility.HOME_DELIVERY,
    BusinessFacility.IN_STORE_PICKUP,
    BusinessFacility.ONLINE_ORDERING,
    BusinessFacility.WARRANTY_AVAILABLE,
    BusinessFacility.AFTER_SALES_SUPPORT,
    BusinessFacility.PARKING_AVAILABLE,
    BusinessFacility.WHEELCHAIR_ACCESS,
    BusinessFacility.CARD_PAYMENTS,
  ],

  [BusinessCategory.RESTAURANT]: [
    BusinessFacility.DINE_IN,
    BusinessFacility.TAKEAWAY,
    BusinessFacility.DELIVERY,
    BusinessFacility.OUTDOOR_SEATING,
    BusinessFacility.FAMILY_FRIENDLY,
    BusinessFacility.KIDS_MENU,
    BusinessFacility.WIFI_AVAILABLE,
    BusinessFacility.SMOKING_AREA,
    BusinessFacility.CARD_PAYMENTS,
  ],

  [BusinessCategory.CLINIC]: [
    BusinessFacility.APPOINTMENT_REQUIRED,
    BusinessFacility.INSURANCE_ACCEPTED,
    BusinessFacility.LAB_SERVICES,
    BusinessFacility.WHEELCHAIR_ACCESS,
    BusinessFacility.EMERGENCY_CASES,
    BusinessFacility.PARKING_AVAILABLE,
  ],

  [BusinessCategory.GYM]: [
    BusinessFacility.PERSONAL_TRAINER,
    BusinessFacility.GROUP_CLASSES,
    BusinessFacility.WOMEN_ONLY_HOURS,
    BusinessFacility.LOCKER,
    BusinessFacility.SHOWERS,
    BusinessFacility.NUTRITION_GUIDANCE,
    BusinessFacility.PARKING_AVAILABLE,
    BusinessFacility.AIR_CONDITIONED,
  ],

  [BusinessCategory.SERVICE]: [
    BusinessFacility.ONSITE_SERVICE,
    BusinessFacility.HOME_SERVICE,
    BusinessFacility.APPOINTMENT_REQUIRED,
    BusinessFacility.EMERGENCY_SERVICE,
    BusinessFacility.WARRANTY,
    BusinessFacility.ONLINE_BOOKING,
    BusinessFacility.CARD_PAYMENTS,
  ],
};
