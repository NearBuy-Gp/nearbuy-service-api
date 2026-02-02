import { Injectable, Logger } from '@nestjs/common';
import { NormalizerStrategy } from '../normalizer.interface';
import { NormalizeInputDto } from '../dtos/normalizer-input.dto';
import { NormalizeOutputDto } from '../dtos/normalizer-output.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BusinessCategory } from 'src/modules/business/enums/business-category.enum';
import { BusinessType } from 'src/modules/business/enums/business-type.enum';
import { ItemType } from 'src/modules/item/enums/item-type.enum';
@Injectable()
export class AiNormalizerStrategy implements NormalizerStrategy {
  private readonly logger = new Logger(AiNormalizerStrategy.name);
  private genAI: GoogleGenerativeAI;
  private readonly BATCH_SIZE = 20;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async normalize(input: NormalizeInputDto): Promise<NormalizeOutputDto[]> {
    const { rawData, businessCategory, businessType, businessId } = input;

    if (!rawData || rawData.length === 0) {
      this.logger.warn('No raw data to normalize');
      return [];
    }

    this.logger.log(
      `Normalizing ${rawData.length} items for ${businessCategory}/${businessType}`,
    );

    // lw dataset small process kolo at once
    if (rawData.length <= this.BATCH_SIZE) {
      return await this.processBatch(
        rawData,
        businessCategory,
        businessType,
        businessId,
      );
    }

    // lw large datasets process in batches
    const allNormalizedItems: NormalizeOutputDto[] = [];

    for (let i = 0; i < rawData.length; i += this.BATCH_SIZE) {
      const batch = rawData.slice(i, i + this.BATCH_SIZE);
      const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(rawData.length / this.BATCH_SIZE);

      this.logger.log(
        `Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`,
      );

      try {
        const normalizedBatch = await this.processBatch(
          batch,
          businessCategory,
          businessType,
          businessId,
        );

        allNormalizedItems.push(...normalizedBatch);

        // delay ben kol batch w el tany
        if (i + this.BATCH_SIZE < rawData.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        this.logger.error(
          `Batch ${batchNumber} failed: ${error.message}. Continuing with next batch...`,
        );
      }
    }

    this.logger.log(
      `Successfully normalized ${allNormalizedItems.length}/${rawData.length} items`,
    );

    return allNormalizedItems;
  }

  private async processBatch(
    rawData: any[],
    businessCategory: BusinessCategory,
    businessType: BusinessType,
    businessId: string,
  ): Promise<NormalizeOutputDto[]> {
    try {
      // get schema and item type for this business
      const schema = this.getSchemaForBusinessType(
        businessCategory,
        businessType,
      );
      const itemType = this.getItemType(businessCategory, businessType);

      const prompt = this.buildPrompt(
        rawData,
        businessCategory,
        businessType,
        schema,
        itemType,
      );

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      //  cleaning
      let cleanedText = responseText
        .replace(/```json\n?|\n?```/g, '')
        .replace(/```\n?|\n?```/g, '')
        .trim();

      // Try to extract JSON array if response has extra text
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }

      const normalizedItems = JSON.parse(cleanedText);

      const validatedItems = (
        Array.isArray(normalizedItems) ? normalizedItems : [normalizedItems]
      ).map((item, index) => ({
        name: item.name || `Unnamed Item ${index + 1}`,
        description: (item.description || '')
          .replace(/\\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        price:
          typeof item.price === 'number'
            ? item.price
            : parseFloat(item.price) || 0,
        images: item.images || [],
        isAvailable: item.isAvailable ?? true,
        businessId,
        type: itemType,
        attributes: item.attributes || {},
      }));

      return validatedItems;
    } catch (error) {
      this.logger.error('Batch normalization failed:', error.message);

      this.logger.error('Error details:', error.stack);

      throw new Error(`Failed to normalize batch: ${error.message}`);
    }
  }

  private getSchemaForBusinessType(
    category: BusinessCategory,
    type: BusinessType,
  ): any {
    // Restaurant schemas
    if (category === BusinessCategory.RESTAURANT) {
      return {
        attributes: {
          menuCategory: {
            type: 'string',
            enum: [
              'Burgers',
              'Sandwiches',
              'Fried Chicken',
              'Meals',
              'Pizza',
              'Shawarma',
              'Grills',
              'Pasta',
              'Sides & Appetizers',
              'Salads',
              'Desserts',
              'Drinks',
            ],
            description:
              'Category of the menu item - choose the most appropriate one',
            required: true,
          },
          sizes: {
            type: 'string',
            enum: ['small', 'medium', 'large', 'extra_large'],
            description: 'Available size',
            required: true,
          },
          tags: {
            type: 'array of strings',
            description: 'Tags like vegetarian, spicy, gluten-free, etc.',
            required: true,
          },
        },
      };
    }

    // Store schemas
    if (category === BusinessCategory.STORE) {
      // Supermarket
      if (type === BusinessType.SUPERMARKET) {
        return {
          attributes: {
            category: {
              type: 'string',
              enum: [
                'Fruit & Veg',
                'Bakery',
                'Poultry, Meat & Seafood',
                'Cold Cuts & Deli',
                'Ready To Eat',
                'Everyday Roastery Coffee',
                'Frozen Food',
                'Dairy & Eggs',
                'Milk',
                'Beverages',
                'Snacks & Chocolate',
                'Ice Cream',
                'Coffee & Tea',
                'Breakfast Food',
                'Cooking & Baking',
                'Canned & Jarred',
                'Healthy & Special Diet',
                'Beauty',
                'Paper & Plastic',
                'Cleaning & Laundry',
                'Personal Care',
                'Pharma & Wellness',
                'Baby Corner',
                'Pet Care',
                'Household Essentials',
                'Stationery',
              ],
              description: 'Product category',
              required: true,
            },
            brand: { type: 'string', required: false },
            weight: {
              type: 'string',
              description: 'Product weight (e.g., 500g, 1kg)',
              required: false,
            },
            stock: { type: 'number', required: false },
          },
        };
      }

      // Electronics
      if (type === BusinessType.ELECTRONICS) {
        return {
          attributes: {
            category: {
              type: 'string',
              enum: [
                'Mobile Phones',
                'Tablets',
                'Laptops & Computers',
                'Accessories',
                'Home Appliances',
                'Air Conditioners',
                'Televisions',
              ],
              description: 'Electronics category',
              required: true,
            },
            brand: { type: 'string', required: false },
            stock: { type: 'number', required: false },
          },
        };
      }

      // Clothing
      if (type === BusinessType.CLOTHING) {
        return {
          attributes: {
            category: {
              type: 'string',
              enum: ['Men', 'Women', 'Kids', 'Babies'],
              description: 'Clothing category',
              required: true,
            },
            sizesAvailable: {
              type: 'array of strings',
              description: 'XS, S, M, L, XL, XXL',
              required: false,
            },
            colorsAvailable: {
              type: 'array of strings',
              description: 'Available colors',
              required: false,
            },
            material: { type: 'string', required: false },
            brand: { type: 'string', required: false },
            stock: { type: 'number', required: false },
          },
        };
      }

      // Pharmacy
      if (type === BusinessType.PHARMACY) {
        return {
          attributes: {
            category: {
              type: 'string',
              enum: [
                'Medications',
                'Hair Care',
                'Skin Care',
                'Daily Essentials',
                'Mom & Baby',
                'Makeup & Accessories',
                'Health Care Devices',
                'Vitamins & Supplements',
                'Pet Supplies',
              ],
              description: 'Pharmacy product category',
              required: true,
            },
            brand: { type: 'string', required: false },
            activeIngredients: {
              type: 'array of strings',
              description: 'Active ingredients in the product',
              required: false,
            },
            dosageForm: {
              type: 'string',
              description: 'tablet, syrup, capsule, etc.',
              required: false,
            },
            packageSize: {
              type: 'string',
              description: 'Package size (e.g., 30 tablets)',
              required: false,
            },
            stock: { type: 'number', required: false },
          },
        };
      }
    }

    // Clinic schemas
    if (category === BusinessCategory.CLINIC) {
      return {
        attributes: {
          doctorName: {
            type: 'string',
            description: 'Name of the doctor providing the service',
            required: true,
          },
          doctorSpecialization: {
            type: 'string',
            description: 'Doctor specialization',
            required: false,
          },
          waitingPeriod: {
            type: 'string',
            description: 'Expected waiting time (e.g., 30 minutes)',
            required: false,
          },
        },
      };
    }

    // Gym schemas
    if (category === BusinessCategory.GYM) {
      if ([BusinessType.CROSSFIT, BusinessType.PILATES].includes(type)) {
        return {
          attributes: {
            trainerName: {
              type: 'string',
              description: 'Name of the trainer',
              required: true,
            },
            schedule: {
              type: 'string',
              description: 'Class schedule (e.g., Mon/Wed/Fri 6-7 PM)',
              required: false,
            },
            duration: {
              type: 'string',
              description: 'Duration (e.g., 60 minutes)',
              required: false,
            },
            capacity: {
              type: 'number',
              description: 'Max number of participants',
              required: false,
            },
            intensityLevel: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Intensity level of the class',
              required: false,
            },
          },
        };
      }

      if (type === BusinessType.BODYBUILDING) {
        return {
          attributes: {
            accessLevel: {
              type: 'string',
              description: 'Access level (basic, premium, VIP)',
              required: false,
            },
            validity: {
              type: 'string',
              description: 'Membership validity (1 month, 3 months, 1 year)',
              required: false,
            },
            benefits: {
              type: 'array of strings',
              description: 'Membership benefits',
              required: false,
            },
          },
        };
      }
    }

    // Service schemas
    if (category === BusinessCategory.SERVICE) {
      return {
        attributes: {
          duration: {
            type: 'string',
            description: 'Service duration (e.g., 2 hours)',
            required: false,
          },
          serviceType: {
            type: 'string',
            description: 'Type of service',
            required: false,
          },
          requirements: {
            type: 'array of strings',
            description: 'Service requirements or prerequisites',
            required: false,
          },
        },
      };
    }

    // Default schema
    return {
      attributes: {
        additionalInfo: { type: 'string', required: false },
      },
    };
  }

  private getItemType(
    category: BusinessCategory,
    type: BusinessType,
  ): ItemType {
    const typeMap: Record<BusinessCategory, ItemType> = {
      [BusinessCategory.RESTAURANT]: ItemType.MENU_ITEM,
      [BusinessCategory.STORE]: ItemType.PRODUCT,
      [BusinessCategory.CLINIC]: ItemType.SERVICE,
      [BusinessCategory.GYM]: [
        BusinessType.CROSSFIT,
        BusinessType.PILATES,
        BusinessType.BODYBUILDING,
      ].includes(type)
        ? ItemType.CLASS_SESSION
        : ItemType.MEMBERSHIP,
      [BusinessCategory.SERVICE]: ItemType.SERVICE,
    };

    return typeMap[category] || ItemType.PRODUCT;
  }

  private buildPrompt(
    rawData: any[],
    category: BusinessCategory,
    type: BusinessType,
    schema: any,
    itemType: ItemType,
  ): string {
    const schemaStr = JSON.stringify(schema.attributes, null, 2);

    return `You are an expert data normalizer for a ${category} business of type "${type}".

Your task: Convert raw extracted data into structured, standardized items for a database.

Raw Data (${rawData.length} entries):
${JSON.stringify(rawData, null, 2)}

Output Schema:
Each item must have this structure:
{
  "name": "string (REQUIRED - extract or infer from data)",
  "description": "string (OPTIONAL - detailed description, CLEAN AND READABLE)",
  "price": number (REQUIRED - extract from text, convert to number, use 0 if not found),
  "type": "${itemType}" (ALWAYS use this exact value),
  "attributes": ${schemaStr}
}

CRITICAL RULES:
1. **Parse text-based entries**: If data has a "text" field like "Coffee - Medium - $3.50", extract:
   - name: "Coffee"
   - price: 3.50
   - attributes.sizes: "medium"

2. **Use structured entries directly**: If data already has fields like {"name": "Coffee", "price": 3.50}, use them as-is.

3. **Handle mixed formats**: You might receive both text and structured data. Handle each appropriately.

4. **Clean descriptions**: 
   - Replace all \\n with spaces
   - Remove extra whitespace
   - Make descriptions readable and clean
   - Example: "250 grams\\nchicken breast\\nwith sauce" → "250 grams chicken breast with sauce"

5. **Intelligent inference**: Make smart guesses for attributes based on context:
   - For restaurants: Infer menuCategory from item name (e.g., "Burger" → "Burgers", "Fries" → "Sides & Appetizers")
   - For stores: Infer category from product type
   - Use common sense to fill in missing attributes

6. **Required vs Optional**: 
   - "name" and "price" are ALWAYS required
   - Fill required attributes in schema, leave optional ones empty if unknown

7. **Price extraction**: 
   - Extract prices from text: "$5.99", "5.99", "EGP 50" → 5.99, 5.99, 50
   - Return price as a NUMBER only (no currency symbols)
   - If no price found, use 0

8. **Arrays**: For array fields (tags, sizes, colors), provide arrays even if single value: ["spicy"], not "spicy"

9. **Consistency**: Normalize values (e.g., "Large", "LARGE", "large" → "large")

Examples for ${category}:

${this.getExamplesForCategory(category, type)}

IMPORTANT: Return ONLY a valid JSON array. No explanations, no markdown, just the array.
`;
  }

  private getExamplesForCategory(
    category: BusinessCategory,
    type: BusinessType,
  ): string {
    if (category === BusinessCategory.RESTAURANT) {
      return `
Input: { "name": "SRIRACHA HONEY", "price": 195, "description": "250 grams\\nchicken breast\\nwith sauce" }
Output: {
  "name": "SRIRACHA HONEY",
  "description": "250 grams chicken breast with sauce",
  "price": 195,
  "type": "menu_item",
  "attributes": {
    "menuCategory": "Fried Chicken",
    "sizes": "medium",
    "tags": ["chicken", "spicy", "honey"]
  }
}

Input: { "name": "Burger", "description": "Beef burger", "price": "50" }
Output: {
  "name": "Burger",
  "description": "Beef burger",
  "price": 50,
  "type": "menu_item",
  "attributes": {
    "menuCategory": "Burgers",
    "sizes": "medium",
    "tags": ["beef", "burger"]
  }
}

Input: { "name": "Fries", "description": "Crispy fries", "price": "30" }
Output: {
  "name": "Fries",
  "description": "Crispy fries",
  "price": 30,
  "type": "menu_item",
  "attributes": {
    "menuCategory": "Sides & Appetizers",
    "sizes": "medium",
    "tags": ["potato", "fried"]
  }
}`;
    }

    if (
      category === BusinessCategory.STORE &&
      type === BusinessType.SUPERMARKET
    ) {
      return `
Input: { "text": "Fresh Milk 1L - EGP 25" }
Output: {
  "name": "Fresh Milk",
  "description": "",
  "price": 25,
  "type": "product",
  "attributes": {
    "category": "Dairy & Eggs",
    "brand": "",
    "weight": "1L",
    "stock": 0
  }
}`;
    }

    if (
      category === BusinessCategory.STORE &&
      type === BusinessType.ELECTRONICS
    ) {
      return `
Input: { "text": "iPhone 15 Pro - $999" }
Output: {
  "name": "iPhone 15 Pro",
  "description": "",
  "price": 999,
  "type": "product",
  "attributes": {
    "category": "Mobile Phones",
    "brand": "Apple",
    "stock": 0
  }
}`;
    }

    if (category === BusinessCategory.CLINIC) {
      return `
Input: { "text": "Dental Cleaning - Dr. Smith - 30 min wait - $50" }
Output: {
  "name": "Dental Cleaning",
  "description": "",
  "price": 50,
  "type": "service",
  "attributes": {
    "doctorName": "Dr. Smith",
    "doctorSpecialization": "Dentist",
    "waitingPeriod": "30 minutes"
  }
}`;
    }

    if (category === BusinessCategory.GYM) {
      return `
Input: { "text": "CrossFit Beginner - Coach Mike - Mon/Wed/Fri 6-7 PM - Max 15 people - $30" }
Output: {
  "name": "CrossFit Beginner",
  "description": "",
  "price": 30,
  "type": "class_session",
  "attributes": {
    "trainerName": "Coach Mike",
    "schedule": "Mon/Wed/Fri 6-7 PM",
    "duration": "60 minutes",
    "capacity": 15,
    "intensityLevel": "low"
  }
}`;
    }

    return `Analyze the raw data and extract relevant information based on the business type.`;
  }
}
