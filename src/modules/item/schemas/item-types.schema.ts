import { Schema } from 'mongoose';
import { RestaurantItemCategory } from '../enums/resturant-category';
import { SizeEnum } from '../enums/size.enum';

export const restaurantItemSchema = new Schema({
  attributes: {
    menuCategory: {
      type: String,
      enum: Object.values(RestaurantItemCategory),
      required: true,
    },
    otherMenuCategory: { type: String },
    sizes: {
      type: String,
      enum: Object.values(SizeEnum),
      required: true,
    },
    tags: {
      type: [String],
    },
  },
});

export const clinicServiceSchema = new Schema({
  attributes: {
    doctorName: { type: String, required: true },
    doctorSpecialization: { type: String },
    waitingPeriod: { type: String },
  },
});

export const classSessionSchema = new Schema({
  attributes: {
    trainerName: { type: String, required: true },
    schedule: { type: String },
    duration: { type: String },
    capacity: { type: Number },
    intensityLevel: { type: String, enum: ['low', 'medium', 'high'] },
  },
});

export const gymMembershipSchema = new Schema({
  attributes: {
    accessLevel: { type: String },
    validity: { type: String },
    benefits: { type: [String] },
  },
});

export const supermarketProductSchema = new Schema({
  attributes: {
    brand: { type: String },
    weight: { type: String },
    stock: { type: Number },
  },
});

export const clothingProductSchema = new Schema({
  attributes: {
    sizes: {
      type: String,
      enum: Object.values(SizeEnum),
      required: true,
    },
    colorsAvailable: { type: [String] },
    material: { type: String },
    brand: { type: String },
    stock: { type: Number },
  },
});

export const pharmacyProductSchema = new Schema({
  attributes: {
    brand: { type: String },
    activeIngredients: { type: [String] },
    dosageForm: { type: String },
    packageSize: { type: String },
    stock: { type: Number },
  },
});
