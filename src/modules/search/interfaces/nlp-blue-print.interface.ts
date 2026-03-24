import { BusinessCategory } from 'src/modules/business/enums/business-category.enum';
import { BusinessType } from 'src/modules/business/enums/business-type.enum';

export type Intent = 'FIND_BUSINESS' | 'FIND_PRODUCT' | 'FIND_SERVICE' | 'BOOK_APPOINTMENT';

export interface PriceFilter {
  operator: 'lt' | 'gt' | 'range';
  value: number;
  max_value: number | null;
  currency: string;
}

export interface SortOptions {
  by: 'price' | 'rating' | 'distance' | 'popularity';
  order: 'asc' | 'desc';
}

export interface TimeConstraints {
  target_time: string | null;
  day_of_week: string | null;
  is_now: boolean;
  is_relative: boolean;
}

export interface Modifiers {
  is_top_rated: boolean;
  is_cheap: boolean;
  is_luxury: boolean;
}

export interface NlpBluePrint {
  text: string;
  intent: Intent;
  confidence: number;

  entities: {
    category: BusinessCategory;
    business_type: BusinessType;

    brand: string;
    quantity: number;

    locations: string[];
    near_me: boolean;
    distance_km: number;

    price_filter: PriceFilter;

    rating_min: number | null;

    sort: SortOptions;

    service_mode: 'delivery' | 'pickup' | 'dine_in' | 'home_visit' | null;

    membership_duration_months: number | null;

    time_constraints: TimeConstraints;

    urgency: boolean;
    is_24_hours: boolean;

    size: string | null;
    color: string | null;

    attributes: string[];

    modifiers: Modifiers;
  };
  searchEmbedding: number[];
  search_vector_query: string;
}
