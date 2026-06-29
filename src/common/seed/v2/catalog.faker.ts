/**
 * Deterministic faker-based catalog generator (the `--no-ai` path and the
 * fallback whenever AI output is unusable). Produces realistic, EGYPT-LOCALIZED
 * business content + item names/descriptions/prices per business type.
 *
 * Item names use TRANSLITERATED Egyptian (Franco-Arabic / Latin script) with an
 * English clarifier so the data reads like a real Cairo storefront while staying
 * fully Latin-script (the app does not render Arabic). Prices are in EGYPTIAN
 * POUNDS (EGP), tuned to 2025-2026 street pricing.
 */
import { BusinessType } from '../../../modules/business/enums/business-type.enum';
import { BusinessCategory } from '../../../modules/business/enums/business-category.enum';
import { ItemType } from '../../../modules/item/enums/item-type.enum';
import { faker } from './rng';
import { BusinessContent } from './business.seeder';
import { egyptianBusinessName } from './egypt';
import { brandForIndex } from './egypt-brands';

export interface CatalogItem {
  name: string;
  description: string;
  price: number;
  /** DB category NAME this item belongs to (mapped to a categoryId by the seeder). */
  category?: string;
}

export interface CatalogBundle {
  business: BusinessContent;
  items: CatalogItem[];
}

interface PoolEntry {
  name: string;
  desc: string;
  /** Typical street price in EGP; the seeder jitters it per instance. */
  price: number;
}

interface ItemPool {
  items: PoolEntry[];
  /** [min,max] EGP fallback range used by the generic disambiguation path. */
  priceRange: [number, number];
}

// ── Shared base pools (reused across closely-related business types) ─────────

const SUPERMARKET_ITEMS: PoolEntry[] = [
  { name: 'Eish Baladi (Baladi Bread) 10pcs', desc: 'Fresh stone-baked baladi flatbread, pack of 10.', price: 25 },
  { name: 'Domty White Cheese 500g', desc: 'Creamy white feta-style cheese, the breakfast staple.', price: 95 },
  { name: 'Gebna Roumy (Roumy Cheese) 250g', desc: 'Aged, sharp hard cheese, sold per quarter kilo.', price: 130 },
  { name: 'Zabady Juhayna (Yoghurt) 6pcs', desc: 'Pack of six plain set yoghurt cups.', price: 60 },
  { name: 'Laban Juhayna Full Milk 1L', desc: 'UHT full-fat milk, one litre carton.', price: 48 },
  { name: 'Baladi Eggs (Tray of 30)', desc: 'Tray of 30 fresh baladi eggs.', price: 165 },
  { name: 'Egyptian Rice 1kg', desc: 'Short-grain Egyptian rice, one kilo.', price: 38 },
  { name: 'El Malika Pasta (Spaghetti) 1kg', desc: 'Durum-wheat spaghetti, family pack.', price: 40 },
  { name: 'Afia Sunflower Oil 1L', desc: 'Sunflower cooking oil, one litre.', price: 92 },
  { name: 'White Sugar 1kg', desc: 'Packaged fine white sugar, one kilo.', price: 42 },
  { name: 'El Arosa Tea 250g', desc: 'Classic fine loose black tea, 250g box.', price: 70 },
  { name: 'Foul Medames (Canned Fava Beans)', desc: 'Ready-cooked fava beans in oil, family tin.', price: 28 },
  { name: 'Tehina (Tahini) 400g', desc: 'Stone-ground sesame tahini paste.', price: 75 },
  { name: 'Halawa Tahiniya 350g', desc: 'Plain sesame halva block.', price: 85 },
  { name: 'Green Olives (Zaytoun) 500g', desc: 'Brined baladi green olives.', price: 60 },
  { name: 'Indomie Noodles 5pcs', desc: 'Instant noodle soup, pack of five.', price: 45 },
  { name: 'Chipsy Family Bag', desc: 'Family-size salted potato crisps.', price: 30 },
  { name: 'Cola 1L Bottle', desc: 'One-litre family cola bottle.', price: 35 },
  { name: 'Molokhia (Frozen) 400g', desc: 'Frozen minced jute leaves, ready to cook.', price: 55 },
  { name: 'Samna Baladi (Ghee) 800g', desc: 'Traditional clarified butter for cooking.', price: 260 },
  { name: 'Asal Aswad (Black Honey/Molasses) 750g', desc: 'Sugarcane molasses, breakfast favourite.', price: 70 },
  { name: 'Tomatoes (Tamatem) 1kg', desc: 'Fresh ripe tomatoes, per kilo.', price: 22 },
  { name: 'Potatoes (Batates) 1kg', desc: 'Fresh potatoes, per kilo.', price: 20 },
  { name: 'Onions (Basal) 1kg', desc: 'Fresh yellow onions, per kilo.', price: 18 },
  { name: 'Lentils (Ads) 1kg', desc: 'Split red lentils for shorba & koshary.', price: 55 },
  { name: 'Macaroni El Malika (Penne) 400g', desc: 'Short penne pasta, 400g pack.', price: 22 },
  { name: 'Oreo Biscuits', desc: 'Oreo chocolate sandwich biscuits.', price: 30 },
  { name: 'Doritos Chips', desc: 'Doritos nacho-cheese tortilla chips.', price: 35 },
  { name: 'KitKat Chocolate', desc: 'KitKat wafer chocolate bar.', price: 25 },
  { name: 'Galaxy Chocolate Bar', desc: 'Galaxy smooth milk chocolate.', price: 35 },
  { name: 'Dettol Antiseptic 500ml', desc: 'Dettol antiseptic disinfectant liquid.', price: 130 },
  { name: 'Harpic Toilet Cleaner', desc: 'Harpic power toilet cleaner.', price: 70 },
  { name: 'Clorox Bleach 1L', desc: 'Clorox household bleach.', price: 45 },
  { name: 'Persil Detergent Gel 2L', desc: 'Persil concentrated laundry gel.', price: 220 },
  { name: 'Ariel Washing Powder 5kg', desc: 'Ariel laundry detergent powder.', price: 350 },
  { name: 'Greek Yoghurt 400g', desc: 'Strained Greek-style yoghurt.', price: 90 },
  { name: 'Mozzarella Cheese 500g', desc: 'Shredded mozzarella cheese.', price: 160 },
  { name: 'Cheese Slices (16pc)', desc: 'Processed cheddar cheese slices.', price: 75 },
  { name: 'Minced Beef 1kg', desc: 'Fresh minced beef, per kilo.', price: 380 },
  { name: 'Beef Steak Cuts 1kg', desc: 'Tender beef steak cuts.', price: 450 },
  { name: 'Beef Cubes 1kg', desc: 'Beef cubes for stews and tagines.', price: 400 },
  { name: 'Chicken Breast 1kg', desc: 'Boneless skinless chicken breast.', price: 180 },
  { name: 'Chicken Thighs 1kg', desc: 'Fresh chicken thighs.', price: 150 },
  { name: 'Whole Chicken', desc: 'Fresh whole chicken, ~1.2kg.', price: 170 },
  { name: 'Kofta Ready-to-Cook 500g', desc: 'Seasoned kofta, ready to grill.', price: 220 },
  { name: 'Burger Patties (4pc)', desc: 'Ready-to-cook beef burger patties.', price: 160 },
  { name: 'Frozen Chicken Nuggets 750g', desc: 'Breaded frozen chicken nuggets.', price: 180 },
  { name: 'Frozen Fries 1kg', desc: 'Crinkle-cut frozen potato fries.', price: 90 },
  { name: 'Whey Protein Powder 2kg', desc: 'Gold-standard whey protein tub.', price: 1900 },
  { name: 'Pepsi 2L', desc: 'Pepsi cola, two-litre bottle.', price: 40 },
  { name: 'Avocado 1kg', desc: 'Fresh avocados, per kilo.', price: 120 },
  { name: 'Natural Bee Honey 500g', desc: 'Pure natural bee honey.', price: 220 },
  { name: 'Skimmed Milk 1L', desc: 'UHT skimmed milk carton.', price: 48 },
  { name: 'Chocolate Milk 1L', desc: 'Flavoured chocolate milk.', price: 55 },
];

const PHARMACY_ITEMS: PoolEntry[] = [
  { name: 'Panadol Extra', desc: 'Pain relief & fever reducer, 24 tablets.', price: 55 },
  { name: 'Comtrex Cold & Flu', desc: 'Relieves cold and flu symptoms.', price: 48 },
  { name: 'Vitamin C Effervescent', desc: 'Immunity-support effervescent tablets.', price: 65 },
  { name: 'Augmentin 1g', desc: 'Antibiotic, prescription required.', price: 180 },
  { name: 'Congestal', desc: 'For nasal congestion and the common cold.', price: 22 },
  { name: 'Antinal', desc: 'For intestinal upsets, 12 capsules.', price: 35 },
  { name: 'Brufen 600', desc: 'Anti-inflammatory pain reliever.', price: 40 },
  { name: 'Medical Alcohol 70% 250ml', desc: 'Antiseptic ethyl alcohol, 250ml.', price: 30 },
  { name: 'Blood Pressure Monitor', desc: 'Digital upper-arm BP monitor.', price: 850 },
  { name: 'Face Masks (Box of 50)', desc: '3-ply medical face masks, box of 50.', price: 90 },
  { name: 'Vitamin D 50000', desc: 'Weekly high-dose vitamin D capsules.', price: 120 },
  { name: 'Pampers Mega Pack', desc: 'Baby diapers size 4, mega pack.', price: 320 },
  { name: 'Head & Shoulders Shampoo 400ml', desc: 'Anti-dandruff shampoo.', price: 180 },
  { name: 'Signal Toothpaste', desc: 'Complete-care toothpaste.', price: 55 },
  { name: 'Saline Solution 500ml', desc: 'Sterile saline solution.', price: 45 },
  { name: 'Gauze & Cotton Roll', desc: 'First-aid gauze and cotton roll.', price: 38 },
  { name: 'Cataflam 50', desc: 'Fast-acting pain & anti-inflammatory tablets.', price: 60 },
  { name: 'Fevadol Cold', desc: 'Paracetamol-based cold relief sachets.', price: 50 },
  { name: 'Centrum Multivitamin', desc: 'Daily complete multivitamin, 30 tablets.', price: 420 },
  { name: 'Insulin Pen Needles', desc: 'Fine insulin pen needles, box of 100.', price: 150 },
  { name: 'Baby Milk Formula (Stage 1)', desc: 'Infant milk formula, 400g tin.', price: 280 },
  { name: 'Digital Thermometer', desc: 'Fast-read digital thermometer.', price: 110 },
  { name: 'Eva Skin Moisturizer', desc: 'Egyptian-made daily skin moisturizer.', price: 95 },
  { name: 'Sun Block SPF 50', desc: 'High-protection sunscreen lotion.', price: 320 },
  { name: 'Betadine Antiseptic 125ml', desc: 'Povidone-iodine antiseptic solution.', price: 60 },
  { name: 'Omega 3 Fish Oil 1000mg', desc: 'Omega-3 capsules, 30 count.', price: 320 },
  { name: 'Magnesium Supplement', desc: 'Magnesium tablets for muscle support.', price: 250 },
  { name: 'Collagen Powder 300g', desc: 'Marine collagen powder.', price: 650 },
  { name: 'Creatine Monohydrate 300g', desc: 'Micronised creatine powder.', price: 500 },
  { name: 'Whey Protein 1kg', desc: 'Whey protein powder, 1kg tub.', price: 1500 },
  { name: 'Kids Multivitamin Syrup', desc: 'Daily multivitamin for children.', price: 150 },
  { name: 'Baby Wipes (64pc)', desc: 'Soft fragrance-free baby wipes.', price: 70 },
  { name: 'Johnson Baby Lotion', desc: 'Gentle baby moisturizing lotion.', price: 110 },
  { name: 'Johnson Baby Shampoo', desc: 'No-tears baby shampoo.', price: 120 },
  { name: 'Baby Teething Gel', desc: 'Soothing infant teething gel.', price: 95 },
  { name: 'Cough Syrup (Kids)', desc: 'Cough relief syrup for children.', price: 55 },
  { name: 'Panadol Joint', desc: 'Panadol joint pain relief tablets.', price: 80 },
  { name: 'Panadol Night', desc: 'Panadol night, 20 tablets.', price: 70 },
  { name: 'Nasal Spray', desc: 'Saline decongestant nasal spray.', price: 65 },
  { name: 'Deodorant Spray', desc: 'Anti-perspirant deodorant spray.', price: 90 },
  { name: 'Shaving Cream & Razor', desc: 'Shaving cream with disposable razor.', price: 120 },
  { name: 'Face Wash (Sensitive Skin)', desc: 'Gentle face wash for sensitive skin.', price: 180 },
  { name: 'Sunscreen SPF 50', desc: 'High-protection daily sunscreen.', price: 320 },
  { name: 'Hair Serum', desc: 'Nourishing hair-repair serum.', price: 220 },
  { name: 'Contact Lens Solution', desc: 'Multi-purpose contact-lens solution.', price: 150 },
  { name: 'Stomach Antacid', desc: 'Antacid tablets for stomach upset.', price: 45 },
  { name: 'Antibiotic Syrup (Kids)', desc: 'Antibiotic suspension, prescription required.', price: 120 },
  { name: 'Teeth Whitening Kit', desc: 'Home teeth-whitening kit.', price: 450 },
  { name: 'Orthopedic Gel Pillow', desc: 'Memory-foam orthopedic pillow.', price: 600 },
  { name: 'Protein Bar', desc: 'Low-carb high-protein snack bar.', price: 90 },
];

const CLOTHING_ITEMS: PoolEntry[] = [
  { name: 'Egyptian Cotton T-Shirt', desc: '100% Egyptian-cotton everyday tee.', price: 320 },
  { name: 'Classic Formal Shirt', desc: 'Long-sleeve formal cotton shirt.', price: 650 },
  { name: 'Slim-Fit Jeans', desc: 'Slim-cut stretch denim jeans.', price: 750 },
  { name: "Men's Galabeya", desc: 'Lightweight cotton summer galabeya.', price: 480 },
  { name: 'Chiffon Hijab (Tarha)', desc: 'Plain chiffon hijab, available in many colours.', price: 150 },
  { name: 'Casual Abaya', desc: 'Everyday crepe abaya.', price: 900 },
  { name: 'Soiree Dress', desc: 'Embroidered evening soiree dress.', price: 2200 },
  { name: 'Cotton Pyjamas Set', desc: 'Comfortable two-piece home pyjama set.', price: 420 },
  { name: 'Everyday Sneakers (Kotshy)', desc: 'Lightweight everyday walking sneakers.', price: 1100 },
  { name: 'Bathroom Slippers (Shibshib)', desc: 'Comfortable plastic bathroom slippers.', price: 120 },
  { name: 'Ladies Handbag', desc: 'Elegant faux-leather handbag.', price: 850 },
  { name: 'Leather Belt', desc: 'Genuine leather dress belt.', price: 380 },
  { name: 'Wool Sweater (Blover)', desc: 'Warm winter wool sweater.', price: 720 },
  { name: 'Denim Jacket', desc: 'Casual washed-denim jacket.', price: 980 },
  { name: 'Cotton Boxers (3-Pack)', desc: 'Pack of three cotton boxer shorts.', price: 250 },
  { name: 'Snapback Cap', desc: 'Trendy adjustable snapback cap.', price: 180 },
  { name: 'Kids School Uniform', desc: 'Two-piece kids school uniform set.', price: 540 },
  { name: 'Winter Scarf (Kufeya)', desc: 'Soft knitted winter scarf.', price: 220 },
  { name: 'Linen Summer Trousers', desc: 'Breathable linen summer trousers.', price: 600 },
  { name: 'Polo Shirt', desc: 'Pique cotton polo shirt.', price: 450 },
  { name: 'Modest Maxi Dress', desc: 'Full-length modest jersey maxi dress.', price: 1100 },
  { name: 'Leather Loafers', desc: "Men's classic leather loafers.", price: 1300 },
  { name: 'Running Shoes', desc: 'Cushioned everyday running shoes.', price: 1800 },
  { name: 'Sneakers (Casual)', desc: 'Trendy casual lifestyle sneakers.', price: 1200 },
  { name: 'Hoodie', desc: 'Fleece-lined pullover hoodie.', price: 700 },
  { name: 'Formal Suit (2-Piece)', desc: 'Slim-fit formal suit.', price: 3500 },
  { name: 'Formal Shoes', desc: 'Genuine-leather formal shoes.', price: 1400 },
  { name: 'Summer Maxi Dress', desc: 'Floral summer maxi dress.', price: 950 },
  { name: 'Evening Dress', desc: 'Elegant evening soiree dress.', price: 2200 },
  { name: 'Summer Sandals', desc: 'Comfortable summer flat sandals.', price: 350 },
  { name: 'Evening Heels', desc: 'Elegant high-heel shoes.', price: 800 },
  { name: 'Leather Boots', desc: 'Ankle-length leather boots.', price: 1500 },
  { name: 'Sport Leggings', desc: 'High-waist stretch sport leggings.', price: 450 },
  { name: 'Track Suit', desc: 'Two-piece sports track suit.', price: 1200 },
  { name: 'Sweatpants', desc: 'Cotton jogger sweatpants.', price: 550 },
  { name: 'Yoga Mat', desc: 'Non-slip cushioned yoga mat.', price: 350 },
  { name: 'Baby Onesie', desc: 'Soft cotton newborn onesie.', price: 180 },
  { name: 'Baby Blanket', desc: 'Cotton newborn baby blanket.', price: 250 },
  { name: 'Ladies Handbag', desc: 'Faux-leather ladies handbag.', price: 850 },
];

const RESTAURANT_ITEMS: PoolEntry[] = [
  { name: 'Koshary (Family Size)', desc: "Egypt's national dish: rice, pasta, lentils & chickpeas with crispy onions.", price: 70 },
  { name: 'Chicken Shawarma Sandwich', desc: 'Chicken shawarma with garlic dip and fries.', price: 85 },
  { name: 'Hawawshi Eskanderany', desc: 'Baladi bread stuffed with spiced minced meat.', price: 90 },
  { name: 'Kebda Eskanderany Sandwich', desc: 'Spicy Alexandrian-style sauteed liver.', price: 75 },
  { name: 'Egyptian Sausage (Sogo2) Sandwich', desc: 'Baladi sausage simmered in tomato sauce.', price: 70 },
  { name: 'Falafel (Ta3meya) Sandwich', desc: 'Crispy falafel with tahini and fresh salad.', price: 25 },
  { name: 'Foul Medames Sandwich', desc: 'Stewed fava beans, the classic Egyptian breakfast.', price: 20 },
  { name: 'Broasted Chicken (Quarter)', desc: 'Crispy broasted quarter chicken.', price: 130 },
  { name: 'Grilled Kofta (Quarter Kilo)', desc: 'Charcoal-grilled minced-meat kofta.', price: 220 },
  { name: 'Shish Tawook Meal', desc: 'Grilled marinated chicken skewers with bread & garlic dip.', price: 180 },
  { name: 'Stuffed Mombar', desc: 'Beef sausage casing stuffed with spiced rice.', price: 160 },
  { name: 'Stuffed Pigeon (Hamam Mahshi)', desc: 'Freekeh-stuffed pigeon, an Egyptian delicacy.', price: 240 },
  { name: 'Rice Side (Roz M3ammar)', desc: 'Creamy oven-baked rice side dish.', price: 45 },
  { name: 'Fried Potatoes (Batates)', desc: 'Crispy golden fried potatoes.', price: 40 },
  { name: 'Molokhia with Rabbit', desc: 'Jute-leaf stew served with grilled rabbit.', price: 260 },
  { name: 'Mixed Grill Platter', desc: 'Kofta, kebab and shish tawook with sides.', price: 420 },
  { name: 'Fattah with Meat', desc: 'Layered rice, bread and meat in garlic-vinegar sauce.', price: 230 },
  { name: 'Liver & Sausage Combo', desc: 'Two sandwiches: Alexandrian liver and sausage.', price: 120 },
  { name: 'Chicken Pane Sandwich', desc: 'Crispy breaded chicken fillet sandwich.', price: 80 },
  { name: 'Macarona Bechamel', desc: 'Baked penne in seasoned bechamel and minced meat.', price: 110 },
  { name: 'Beef Burger (Classic)', desc: 'Grilled beef burger with cheese and special sauce.', price: 120 },
  { name: 'Double Cheese Burger', desc: 'Double beef patty with extra cheese.', price: 160 },
  { name: 'Chicken Burger', desc: 'Crispy chicken fillet burger with fries.', price: 110 },
  { name: 'Pizza Margherita', desc: 'Wood-fired margherita pizza.', price: 150 },
  { name: 'BBQ Chicken Pizza', desc: 'BBQ chicken pizza with onions and peppers.', price: 180 },
  { name: 'Family Pizza', desc: 'Large family-size mixed pizza.', price: 240 },
  { name: 'Fried Chicken Bucket', desc: 'Crispy broasted chicken, 8 pieces.', price: 320 },
  { name: 'Chicken Strips', desc: 'Crispy chicken tenders with dip.', price: 130 },
  { name: 'Crispy Chicken Sandwich', desc: 'Crispy fillet sandwich with fries.', price: 95 },
  { name: 'Grilled Chicken Sandwich', desc: 'Grilled chicken sandwich with garlic dip.', price: 90 },
  { name: 'Club Sandwich', desc: 'Triple-decker club sandwich with fries.', price: 110 },
  { name: 'Kabsa with Chicken', desc: 'Spiced Gulf-style rice with chicken.', price: 160 },
  { name: 'Chicken Biryani', desc: 'Fragrant biryani rice with chicken.', price: 150 },
  { name: 'Stuffed Vine Leaves (Wara2 Enab)', desc: 'Rolled vine leaves stuffed with spiced rice.', price: 120 },
  { name: 'Mahshi Mixed', desc: 'Assorted stuffed vegetables baladi style.', price: 130 },
  { name: 'Breakfast Combo (Foul & Eggs)', desc: 'Foul, eggs, cheese and baladi bread platter.', price: 85 },
  { name: 'Pancakes', desc: 'Fluffy pancakes with honey and butter.', price: 90 },
  { name: 'Grilled Steak', desc: 'Charcoal-grilled beef steak with sides.', price: 320 },
  { name: 'Pasta White Sauce', desc: 'Penne in creamy white sauce.', price: 120 },
];

const SEAFOOD_ITEMS: PoolEntry[] = [
  { name: 'Grilled Tilapia (Bolty) 1kg', desc: 'Fresh tilapia grilled with cumin, per kilo.', price: 320 },
  { name: 'Fried Mullet (Boury) 1kg', desc: 'Golden fried grey mullet, per kilo.', price: 380 },
  { name: 'Fried Shrimp (Half Kilo)', desc: 'Crispy fried shrimp, half kilo.', price: 450 },
  { name: 'Fried Calamari', desc: 'Crispy fried calamari rings.', price: 280 },
  { name: 'Grilled Cuttlefish (Sobeit)', desc: 'Grilled cuttlefish with garlic and lemon.', price: 360 },
  { name: 'Sayadeya Rice', desc: 'Spiced fish rice with caramelized onions.', price: 110 },
  { name: 'Crab (Kaboria) Family', desc: 'Crab cooked in spicy tomato sauce.', price: 520 },
  { name: 'Shrimp Pasta', desc: 'Creamy shrimp pasta.', price: 290 },
  { name: 'Smoked Herring (Renga)', desc: 'Smoked herring with oil and lemon, a classic mezze.', price: 95 },
  { name: 'Singari Grilled Fish 1kg', desc: 'Singari-style spiced grilled fish, per kilo.', price: 400 },
  { name: 'Shrimp Tagine', desc: 'Oven-baked shrimp tagine with tomato and pepper.', price: 480 },
  { name: 'Seafood Soup', desc: 'Warm mixed-seafood broth.', price: 90 },
  { name: 'Grilled Sea Bass (Karous) 1kg', desc: 'Whole grilled sea bass, per kilo.', price: 520 },
  { name: 'Seafood Tray (Mixed)', desc: 'Mixed fried & grilled seafood platter for two.', price: 650 },
  { name: 'Eel (Te3ban Samak) Grilled', desc: 'Grilled freshwater eel, regional specialty.', price: 420 },
  { name: 'Clams (Gandofly)', desc: 'Steamed clams in garlic broth.', price: 240 },
  { name: 'Sushi Rolls (24pc)', desc: 'Assorted maki and California sushi rolls.', price: 480 },
  { name: 'Sushi Platter (Family)', desc: 'Large mixed sushi platter for sharing.', price: 850 },
  { name: 'Grilled Salmon Fillet', desc: 'Grilled salmon with lemon and herbs.', price: 420 },
  { name: 'Lobster (Estakoza) Grilled', desc: 'Grilled lobster with garlic butter.', price: 950 },
  { name: 'Mixed Seafood Platter', desc: 'Fried and grilled seafood platter for two.', price: 650 },
  { name: 'Seafood Pasta', desc: 'Mixed seafood pasta in tomato or cream sauce.', price: 320 },
  { name: 'Mixed Grill Seafood', desc: 'Grilled shrimp, calamari and fish combo.', price: 480 },
  { name: 'Fish & Chips (Samak Maqli)', desc: 'Battered fried fish with fries.', price: 220 },
];

const CAFE_ITEMS: PoolEntry[] = [
  { name: 'Turkish Coffee (Mazboot)', desc: 'Sand-brewed Turkish coffee, medium sugar.', price: 35 },
  { name: 'Koshary Tea (Shai)', desc: 'Strong boiled baladi tea, the ahwa classic.', price: 20 },
  { name: 'Mint Tea (Shai bel Na3na3)', desc: 'Green tea with fresh mint.', price: 25 },
  { name: 'Sahlab', desc: 'Hot sahlab topped with nuts and cinnamon.', price: 45 },
  { name: 'Helba (Fenugreek Drink)', desc: 'Warm fenugreek drink, great in winter.', price: 30 },
  { name: 'Yansoon (Anise Drink)', desc: 'Soothing anise infusion.', price: 25 },
  { name: 'Karkade (Hibiscus)', desc: 'Chilled hibiscus iced tea.', price: 30 },
  { name: 'Sugarcane Juice (Asab)', desc: 'Freshly pressed iced sugarcane juice.', price: 25 },
  { name: 'Mango Juice (Asir Manga)', desc: 'Fresh Egyptian mango juice in season.', price: 55 },
  { name: 'Cappuccino', desc: 'Cappuccino with thick milk foam.', price: 60 },
  { name: 'Iced Coffee', desc: 'Cold milk-based iced coffee, gamda.', price: 65 },
  { name: 'Shisha (Double Apple)', desc: 'Double-apple molasses shisha.', price: 70 },
  { name: 'Lemon Mint Cooler', desc: 'Iced lemon-mint cooler.', price: 40 },
  { name: 'Nescafe', desc: 'Quick hot instant coffee.', price: 35 },
  { name: 'Hot Chocolate', desc: 'Rich hot chocolate with cream.', price: 55 },
  { name: 'Sobia', desc: 'Sweet chilled coconut-milk drink.', price: 30 },
  { name: 'Tamr Hindi (Tamarind)', desc: 'Chilled tamarind juice, a Ramadan favourite.', price: 30 },
  { name: 'Kharroub (Carob Drink)', desc: 'Cold carob drink, refreshing and sweet.', price: 30 },
  { name: 'Spanish Latte', desc: 'Sweet espresso-and-milk Spanish latte.', price: 75 },
  { name: 'Turkish Coffee (Sada)', desc: 'Plain unsweetened Turkish coffee.', price: 35 },
  { name: 'Caramel Latte', desc: 'Espresso with steamed milk and caramel.', price: 75 },
  { name: 'Iced Caramel Macchiato', desc: 'Layered iced caramel macchiato.', price: 80 },
  { name: 'Flat White', desc: 'Smooth flat white coffee.', price: 70 },
  { name: 'Matcha Latte', desc: 'Iced matcha green-tea latte.', price: 85 },
  { name: 'Mocha', desc: 'Chocolate mocha with cream.', price: 75 },
  { name: 'Espresso (Double)', desc: 'Double-shot espresso.', price: 45 },
  { name: 'Americano', desc: 'Hot americano coffee.', price: 55 },
  { name: 'Cold Brew', desc: 'Slow-steeped cold brew coffee.', price: 70 },
  { name: 'Spanish Latte (Iced)', desc: 'Sweet iced Spanish latte.', price: 80 },
  { name: 'Guava Juice (Asir Gawafa)', desc: 'Fresh guava juice.', price: 50 },
  { name: 'Fresh Orange Juice', desc: 'Freshly squeezed orange juice.', price: 45 },
  { name: 'Strawberry Smoothie', desc: 'Blended strawberry smoothie.', price: 75 },
  { name: 'Oreo Milkshake', desc: 'Thick Oreo cookies milkshake.', price: 80 },
];

const DESSERT_ITEMS: PoolEntry[] = [
  { name: 'Konafa with Cream (Eshta)', desc: 'Soft konafa filled with cream in light syrup.', price: 120 },
  { name: 'Basbousa (Piece)', desc: 'Semolina cake soaked in syrup.', price: 30 },
  { name: 'Om Ali', desc: 'Egyptian bread pudding with nuts and milk.', price: 70 },
  { name: 'Zalabya (Loqmet El Qady)', desc: 'Crispy honey-dipped dough balls.', price: 40 },
  { name: 'Baklava 1kg', desc: 'Pistachio baklava in honey, per kilo.', price: 350 },
  { name: 'Mahalabeya', desc: 'Milk pudding scented with rosewater.', price: 35 },
  { name: 'Roz bel Laban (Rice Pudding)', desc: 'Creamy baked rice pudding.', price: 35 },
  { name: 'Balah El Sham', desc: 'Crispy churros soaked in syrup.', price: 45 },
  { name: 'Kahk with Agwa 1kg', desc: 'Festive date-filled cookies, per kilo.', price: 280 },
  { name: 'Ghorayeba 1kg', desc: 'Melt-in-the-mouth butter cookies.', price: 260 },
  { name: 'Feteer Meshaltet', desc: 'Layered Egyptian flaky pastry with honey or cheese.', price: 130 },
  { name: 'Qatayef (Ramadan)', desc: 'Stuffed sweet pancakes, a Ramadan special.', price: 90 },
  { name: 'Cheesecake (Slice)', desc: 'Berry-topped cheesecake slice.', price: 95 },
  { name: 'Petit Four 1kg', desc: 'Assorted jam-filled petit fours, per kilo.', price: 300 },
  { name: 'Gateau Slice', desc: 'Layered cream gateau slice.', price: 60 },
  { name: 'Belila', desc: 'Warm sweet wheat-and-milk pudding.', price: 35 },
  { name: 'Kunafa Nutella', desc: 'Konafa filled with Nutella, popular with youth.', price: 130 },
  { name: 'Roz bel Laban bel Manga', desc: 'Rice pudding topped with fresh mango.', price: 55 },
  { name: 'Tartufo Ice Cream', desc: 'Chocolate-coated tartufo ice cream ball.', price: 75 },
  { name: 'Eish El Saraya', desc: 'Syrup-soaked bread dessert topped with cream.', price: 65 },
  { name: 'Lotus Cheesecake', desc: 'Lotus Biscoff cheesecake slice.', price: 110 },
  { name: 'San Sebastian Cheesecake', desc: 'Basque-style burnt cheesecake.', price: 120 },
  { name: 'Molten Chocolate Cake', desc: 'Warm molten chocolate lava cake.', price: 95 },
  { name: 'Brownies (Box of 4)', desc: 'Fudgy chocolate brownies.', price: 130 },
  { name: 'Donuts (Box of 6)', desc: 'Glazed assorted donuts.', price: 150 },
  { name: 'Churros', desc: 'Cinnamon churros with chocolate dip.', price: 90 },
  { name: 'Nutella Crepe', desc: 'Crepe filled with Nutella and banana.', price: 110 },
  { name: 'Belgian Waffle', desc: 'Waffle topped with cream and fruit.', price: 100 },
  { name: 'Date Cookies (Biscuit bel Agwa) 1kg', desc: 'Date-filled butter cookies, per kilo.', price: 280 },
  { name: 'Ice Cream Cone', desc: 'Two-scoop ice cream cone.', price: 45 },
  { name: 'Chocolate Cake (Slice)', desc: 'Rich chocolate gateau slice.', price: 70 },
  { name: 'Birthday Cake (1kg)', desc: 'Custom-decorated birthday cake.', price: 450 },
];

const ELECTRONICS_ITEMS: PoolEntry[] = [
  { name: 'iPhone 15 Pro Max 256GB', desc: 'Sealed, official agent warranty (daman wakeel).', price: 78000 },
  { name: 'Samsung Galaxy S24 Ultra', desc: 'Flagship Samsung, dual SIM.', price: 62000 },
  { name: 'Oppo Reno 11', desc: 'Sleek AMOLED mid-ranger.', price: 18500 },
  { name: 'Xiaomi Redmi Note 13', desc: 'Big-battery budget phone.', price: 11000 },
  { name: 'Original Type-C Charger', desc: '25W original fast charger.', price: 450 },
  { name: 'Anker Power Bank 20000mAh', desc: 'Anker fast-charge power bank.', price: 1400 },
  { name: 'Bluetooth Earbuds', desc: 'Wireless earbuds with clear sound.', price: 900 },
  { name: 'Phone Case (Jraab)', desc: 'Protective silicone phone case.', price: 150 },
  { name: 'Screen Protector (9H Glass)', desc: '9H tempered-glass screen protector.', price: 120 },
  { name: 'USB Flash 64GB', desc: 'SanDisk 64GB USB flash drive.', price: 320 },
  { name: 'WE Home Router', desc: 'Home VDSL Wi-Fi router.', price: 1600 },
  { name: 'HD Satellite Receiver', desc: 'HD channels satellite receiver.', price: 800 },
  { name: 'AirPods (High-Grade)', desc: 'High-grade wireless earphones, Apple style.', price: 2200 },
  { name: 'Smart Watch', desc: 'Fitness-tracking smartwatch.', price: 1500 },
  { name: '43" Smart LED TV', desc: '43-inch smart LED television.', price: 14500 },
  { name: 'Kitchen Blender 600W', desc: 'Braun-style 600W kitchen blender.', price: 1900 },
  { name: 'Tablet 10" 64GB', desc: '10-inch Android tablet, Wi-Fi.', price: 7500 },
  { name: 'Gaming Mouse', desc: 'RGB wired gaming mouse.', price: 600 },
  { name: 'Laptop Cooling Pad', desc: 'Dual-fan laptop cooling pad.', price: 450 },
  { name: 'Wireless Keyboard & Mouse', desc: 'Combo wireless keyboard and mouse set.', price: 850 },
  { name: 'Car Phone Holder', desc: 'Magnetic dashboard phone holder.', price: 180 },
  { name: 'LED Smart Bulb', desc: 'App-controlled colour LED bulb.', price: 220 },
  { name: 'iPhone 15 128GB', desc: 'Sealed iPhone 15, official agent warranty.', price: 58000 },
  { name: 'iPhone 14 Pro Max 256GB', desc: 'iPhone 14 Pro Max, dual SIM.', price: 62000 },
  { name: 'Samsung Galaxy A55', desc: 'Mid-range Samsung Galaxy A55.', price: 22000 },
  { name: 'Samsung Galaxy S23', desc: 'Samsung Galaxy S23 flagship.', price: 38000 },
  { name: 'MacBook Air M3', desc: 'Apple MacBook Air M3, 13-inch.', price: 72000 },
  { name: 'iPad Pro 11"', desc: 'Apple iPad Pro with M-chip.', price: 55000 },
  { name: 'iPad 10th Gen', desc: 'Apple iPad 10th generation, Wi-Fi.', price: 28000 },
  { name: 'PlayStation 5', desc: 'Sony PlayStation 5 console.', price: 38000 },
  { name: 'PlayStation 4 Slim', desc: 'Sony PlayStation 4 Slim 1TB.', price: 16000 },
  { name: '50" Smart LED TV', desc: '50-inch 4K smart LED television.', price: 22000 },
  { name: '55" Smart LED TV', desc: '55-inch 4K smart LED television.', price: 27000 },
  { name: 'Samsung Galaxy Buds', desc: 'Wireless Samsung Galaxy earbuds.', price: 2500 },
  { name: 'Dell Inspiron i7 Laptop', desc: 'Dell laptop, Core i7, 16GB RAM.', price: 42000 },
  { name: 'HP ProBook i5', desc: 'HP ProBook business laptop, Core i5.', price: 30000 },
  { name: 'Samsung 1.5HP Split AC', desc: 'Samsung split air-conditioner, 1.5 HP.', price: 28000 },
  { name: 'LG 2.25HP Split AC', desc: 'LG split air-conditioner, 2.25 HP.', price: 34000 },
];

// ── Service / clinic / class pools (Latin-script names, EGP service prices) ──

const CLINIC_DENTAL_ITEMS: PoolEntry[] = [
  { name: 'Dental Checkup (Kashf)', desc: 'Full dental and gum examination.', price: 250 },
  { name: 'Scaling & Cleaning', desc: 'Tartar removal and polishing.', price: 600 },
  { name: 'Composite Filling', desc: 'Tooth-coloured composite filling.', price: 700 },
  { name: 'Root Canal', desc: 'Complete root-canal treatment.', price: 1800 },
  { name: 'Tooth Extraction', desc: 'Simple extraction under local anaesthesia.', price: 400 },
  { name: 'Dental Crown (Tarboush)', desc: 'Matched zirconia crown.', price: 3500 },
  { name: 'Teeth Whitening', desc: 'Single laser whitening session.', price: 2500 },
  { name: 'Dental Implant', desc: 'Titanium implant with abutment.', price: 12000 },
  { name: 'Braces Consultation', desc: 'Orthodontic consultation and treatment plan.', price: 300 },
  { name: 'Veneers (Per Tooth)', desc: 'Porcelain veneer, per tooth.', price: 4000 },
  { name: 'Wisdom Tooth Extraction', desc: 'Surgical wisdom-tooth removal.', price: 1500 },
  { name: 'Panoramic X-Ray', desc: 'Full-mouth panoramic dental X-ray.', price: 300 },
  { name: 'Kids Fluoride Session', desc: 'Protective fluoride treatment for children.', price: 350 },
  { name: 'Braces Installation', desc: 'Full metal/ceramic braces installation.', price: 9000 },
  { name: 'Dental Consultation', desc: 'Dental examination and treatment plan.', price: 250 },
  { name: 'Dental Filling', desc: 'Tooth-coloured composite filling.', price: 700 },
  { name: 'Teeth Cleaning', desc: 'Scaling and polishing session.', price: 600 },
];

const CLINIC_DERMA_ITEMS: PoolEntry[] = [
  { name: 'Skin Consultation (Kashf Geldeya)', desc: 'Skin diagnosis and consultation.', price: 350 },
  { name: 'Laser Hair Removal Session', desc: 'Full-area laser hair removal session.', price: 600 },
  { name: 'Facial Cleansing', desc: 'Deep-cleansing facial.', price: 450 },
  { name: 'Chemical Peel', desc: 'Brightening chemical peel.', price: 900 },
  { name: 'Botox Session', desc: 'Anti-wrinkle botox session.', price: 3000 },
  { name: 'Dermal Filler', desc: 'Lip or cheek dermal filler.', price: 4500 },
  { name: 'Acne Treatment', desc: 'Structured acne treatment protocol.', price: 500 },
  { name: 'PRP for Hair', desc: 'Platelet-rich plasma injections for hair.', price: 1200 },
  { name: 'Mesotherapy', desc: 'Skin mesotherapy session.', price: 800 },
  { name: 'Fractional Laser', desc: 'Fractional laser for scars and pores.', price: 2000 },
  { name: 'Wart/Mole Removal', desc: 'Cautery removal of warts or moles.', price: 700 },
  { name: 'Hydrafacial', desc: 'Hydrating multi-step facial.', price: 1100 },
  { name: 'Skin Peeling', desc: 'Chemical skin-peeling session.', price: 900 },
  { name: 'Skin Rejuvenation', desc: 'Collagen-boosting rejuvenation session.', price: 1500 },
  { name: 'Wrinkles Treatment', desc: 'Anti-wrinkle treatment session.', price: 2500 },
  { name: 'Hair Transplant Consultation', desc: 'Hair-transplant assessment and plan.', price: 500 },
  { name: 'Hair Loss Treatment (PRP)', desc: 'PRP injections for hair loss.', price: 1200 },
  { name: 'Skin Check', desc: 'Skin lesion / mole check-up.', price: 350 },
  { name: 'Skin Consultation', desc: 'Dermatology skin consultation.', price: 350 },
  { name: 'Laser Acne Session', desc: 'Laser session for acne and scars.', price: 700 },
  { name: 'Face Treatment', desc: 'Rejuvenating face-treatment session.', price: 600 },
];

const CLINIC_PEDIATRIC_ITEMS: PoolEntry[] = [
  { name: 'Pediatric Checkup', desc: 'General child examination.', price: 300 },
  { name: 'Vaccination Dose', desc: 'Age-appropriate vaccine dose.', price: 450 },
  { name: 'Newborn Follow-up', desc: 'Newborn weight and feeding follow-up.', price: 350 },
  { name: 'Nebulizer Session', desc: 'Chest nebulizer session.', price: 150 },
  { name: 'Nutrition Consultation', desc: 'Child nutrition and growth plan.', price: 400 },
  { name: 'Growth Monitoring', desc: 'Growth, height and weight tracking.', price: 250 },
  { name: 'Allergy Screening', desc: 'Pediatric allergy screening.', price: 600 },
  { name: 'Fever Visit (Urgent)', desc: 'Urgent fever consultation.', price: 350 },
  { name: 'Follow-up Visit', desc: 'Follow-up review visit.', price: 200 },
  { name: 'Breastfeeding Advice', desc: 'Breastfeeding guidance session.', price: 300 },
  { name: 'Developmental Screening', desc: 'Milestone and development check.', price: 400 },
  { name: 'Baby Vaccination', desc: 'Infant vaccination dose.', price: 450 },
  { name: 'Baby Checkup', desc: 'Routine baby wellness checkup.', price: 300 },
  { name: 'Child Specialist Visit', desc: 'Pediatric specialist consultation.', price: 400 },
  { name: 'Kids Clinic Consultation', desc: 'Children clinic checkup.', price: 300 },
];

const CLINIC_GENERAL_ITEMS: PoolEntry[] = [
  { name: 'Internal Medicine Visit', desc: 'General internal-medicine consultation.', price: 350 },
  { name: 'BP & Sugar Check', desc: 'On-the-spot blood-pressure and glucose check.', price: 80 },
  { name: 'ECG (Rasm Qalb)', desc: 'Full electrocardiogram.', price: 250 },
  { name: 'Complete Blood Panel', desc: 'Complete blood count panel.', price: 400 },
  { name: 'Wound Dressing', desc: 'Wound cleaning and dressing.', price: 120 },
  { name: 'IV Injection (Mahlool)', desc: 'IV drip administration.', price: 150 },
  { name: 'Medical Certificate', desc: 'Medical fitness certificate.', price: 200 },
  { name: 'General Consultation', desc: 'General medical consultation.', price: 300 },
  { name: 'Hypertension Follow-up', desc: 'Chronic hypertension follow-up.', price: 250 },
  { name: 'Follow-up Visit', desc: 'Discounted follow-up visit.', price: 180 },
  { name: 'Diabetes Review', desc: 'Diabetes management review.', price: 320 },
  { name: 'Cholesterol Test', desc: 'Lipid profile / cholesterol blood test.', price: 250 },
  { name: 'Kidney Function Test', desc: 'Kidney function blood panel.', price: 300 },
  { name: 'Urine Test', desc: 'Complete urine analysis.', price: 120 },
  { name: 'X-Ray Imaging', desc: 'Diagnostic X-ray imaging.', price: 350 },
  { name: 'Blood Test (CBC)', desc: 'General blood analysis.', price: 300 },
  { name: 'Blood Sugar Test', desc: 'Fasting blood-sugar test.', price: 80 },
  { name: 'Heart Checkup (ECG)', desc: 'Heart checkup with ECG.', price: 400 },
  { name: 'Nutrition Consultation', desc: 'Dietitian nutrition consultation.', price: 400 },
  { name: 'Full Medical Checkup', desc: 'Comprehensive medical checkup package.', price: 1200 },
  { name: 'General Checkup', desc: 'General doctor consultation.', price: 300 },
];

const CLASS_SESSION_ITEMS: PoolEntry[] = [
  { name: 'Monthly Gym Membership', desc: 'Open monthly gym membership.', price: 700 },
  { name: 'Personal Training Package', desc: '12-session personal-training package.', price: 3000 },
  { name: 'CrossFit Class', desc: 'Group CrossFit WOD class.', price: 150 },
  { name: 'Weightlifting Session', desc: 'Resistance and weights session.', price: 120 },
  { name: 'Pilates Class', desc: 'Reformer Pilates class.', price: 250 },
  { name: 'Cardio Class (HIIT)', desc: 'HIIT fat-burning class.', price: 130 },
  { name: 'Yoga Class', desc: 'Relaxation and flexibility yoga.', price: 180 },
  { name: 'Sports Nutrition Plan', desc: 'Monthly sports-nutrition plan.', price: 500 },
  { name: 'Boxing Class', desc: 'Boxing and conditioning class.', price: 160 },
  { name: 'Sports Massage', desc: 'Recovery sports massage.', price: 400 },
  { name: 'Zumba Class', desc: 'High-energy Zumba dance class.', price: 140 },
  { name: 'Swimming Lesson', desc: 'One-on-one swimming lesson.', price: 300 },
  { name: 'Spinning Class', desc: 'Indoor cycling spinning class.', price: 150 },
  { name: 'Kids Swimming Class', desc: 'Swimming lessons for children.', price: 250 },
  { name: 'Karate Class (Kids)', desc: 'Karate training session for kids.', price: 200 },
  { name: 'MMA Class', desc: 'Mixed martial arts training session.', price: 200 },
  { name: 'Self Defense Class', desc: 'Self-defense class for women.', price: 180 },
  { name: 'Gym Trial Session', desc: 'One-day gym trial pass.', price: 100 },
];

const SERVICE_REPAIR_ITEMS: PoolEntry[] = [
  { name: 'Phone Screen Replacement', desc: 'Phone screen swap with warranty.', price: 900 },
  { name: 'Laptop Maintenance', desc: 'Diagnostics, cleaning and reinstall.', price: 350 },
  { name: 'AC Repair & Gas', desc: 'Air-conditioner service and gas recharge.', price: 600 },
  { name: 'Washing Machine Repair', desc: 'Automatic washing-machine repair.', price: 450 },
  { name: 'Fridge Repair', desc: 'Compressor and cooling repair.', price: 700 },
  { name: 'Plumbing Call-out (Sabbak)', desc: 'Plumber visit for leaks and fittings.', price: 300 },
  { name: 'Home Electrical Repair', desc: 'Home electrical fault repair.', price: 350 },
  { name: 'Battery Replacement', desc: 'Original phone battery swap.', price: 550 },
  { name: 'Water Heater Service', desc: 'Gas/electric water-heater service.', price: 400 },
  { name: 'Satellite Dish Install', desc: 'Dish install and alignment.', price: 250 },
  { name: 'TV Screen Repair', desc: 'LED/LCD TV panel and board repair.', price: 800 },
  { name: 'Microwave Repair', desc: 'Microwave diagnostics and repair.', price: 300 },
  { name: 'AC Maintenance', desc: 'Air-conditioner service and cleaning.', price: 500 },
  { name: 'AC Installation', desc: 'Split AC installation service.', price: 700 },
  { name: 'AC Cleaning', desc: 'Deep AC coil and filter cleaning.', price: 400 },
  { name: 'Mobile Phone Repair', desc: 'General mobile diagnostics and repair.', price: 300 },
  { name: 'iPhone Screen Repair', desc: 'iPhone screen replacement.', price: 1500 },
  { name: 'Car Wash', desc: 'Full exterior and interior car wash.', price: 250 },
  { name: 'Oil Change', desc: 'Engine oil and filter change.', price: 1200 },
  { name: 'Tire Change', desc: 'Tire replacement and balancing.', price: 2000 },
  { name: 'Car Polishing', desc: 'Exterior polish and wax.', price: 700 },
  { name: 'Car Interior Cleaning', desc: 'Deep interior detailing.', price: 600 },
  { name: 'Painter Service', desc: 'Wall painting service, per room.', price: 900 },
  { name: 'Carpenter Service', desc: 'Carpentry repair and fitting.', price: 500 },
  { name: 'Home Maintenance Visit', desc: 'General home maintenance call-out.', price: 350 },
];

const SERVICE_CLEANING_ITEMS: PoolEntry[] = [
  { name: 'Apartment Deep Clean', desc: 'Full apartment deep clean.', price: 800 },
  { name: 'Sofa Shampoo (Antree)', desc: 'Sofa shampoo and sanitize.', price: 600 },
  { name: 'Carpet & Moquette Cleaning', desc: 'Steam carpet and rug cleaning.', price: 450 },
  { name: 'Post-Construction Clean', desc: 'After-renovation cleaning.', price: 1500 },
  { name: 'Marble Polishing (Galy)', desc: 'Marble grinding and polishing.', price: 1200 },
  { name: 'Window & Facade Cleaning', desc: 'Glass and window cleaning.', price: 350 },
  { name: 'Pest Control', desc: 'Safe pest-control spraying.', price: 500 },
  { name: 'Full Disinfection', desc: 'Full premises disinfection.', price: 700 },
  { name: 'Kitchen Degrease', desc: 'Kitchen degrease and polish.', price: 400 },
  { name: 'Water Tank Cleaning', desc: 'Water-tank cleaning and sanitizing.', price: 550 },
  { name: 'Villa Full Clean', desc: 'Whole-villa deep cleaning service.', price: 2200 },
  { name: 'Office Cleaning Contract', desc: 'Monthly office cleaning contract.', price: 1800 },
  { name: 'Home Cleaning', desc: 'Full home cleaning service.', price: 800 },
  { name: 'Monthly Cleaning Plan', desc: 'Monthly recurring home cleaning.', price: 2200 },
  { name: 'Weekly Cleaning Plan', desc: 'Weekly home cleaning subscription.', price: 700 },
  { name: 'Deep Cleaning', desc: 'Whole-home deep clean.', price: 1200 },
  { name: 'Steam Sofa Cleaning', desc: 'Steam cleaning for sofa and antree.', price: 600 },
];

const SERVICE_BEAUTY_ITEMS: PoolEntry[] = [
  { name: "Men's Haircut", desc: "Men's cut and styling.", price: 120 },
  { name: 'Beard Trim', desc: 'Beard trim and shaping.', price: 80 },
  { name: 'Hair Protein Treatment', desc: 'Protein straightening and shine treatment.', price: 1500 },
  { name: 'Hair Color (Sabgha)', desc: 'Hair colour with conditioning.', price: 700 },
  { name: 'Soiree Makeup', desc: 'Full evening makeup.', price: 900 },
  { name: 'Bridal Makeup Package', desc: 'Complete bridal makeup package.', price: 4000 },
  { name: 'Mani-Pedi', desc: 'Full manicure and pedicure care.', price: 350 },
  { name: 'Waxing (Full Body)', desc: 'Full-body waxing session.', price: 400 },
  { name: 'Deep Conditioning (Hammam Cream)', desc: 'Nourishing deep-conditioning treatment.', price: 250 },
  { name: 'Salon Facial', desc: 'Salon deep-cleansing facial.', price: 450 },
  { name: 'Keratin Treatment', desc: 'Smoothing keratin hair treatment.', price: 1800 },
  { name: 'Henna Design', desc: 'Decorative henna application.', price: 200 },
  { name: "Women's Haircut", desc: 'Ladies cut and blow-dry.', price: 250 },
  { name: 'Hair Coloring', desc: 'Full hair colour service.', price: 700 },
  { name: 'Hair Keratin', desc: 'Keratin smoothing treatment.', price: 1800 },
  { name: 'Hair Spa', desc: 'Nourishing hair-spa session.', price: 400 },
  { name: 'Hair Extensions', desc: 'Hair-extension application.', price: 2500 },
  { name: 'Blow Dry', desc: 'Professional blow-dry styling.', price: 200 },
  { name: 'Hair Styling', desc: 'Occasion hair styling.', price: 350 },
  { name: 'Makeup Session', desc: 'Full makeup application.', price: 700 },
  { name: 'Nail Art', desc: 'Gel nail art and polish.', price: 350 },
  { name: 'Eyebrow Threading', desc: 'Eyebrow threading and shaping.', price: 80 },
  { name: 'Relaxation Massage', desc: 'Full-body relaxation massage.', price: 400 },
  { name: 'Manicure', desc: 'Classic manicure.', price: 200 },
  { name: 'Pedicure', desc: 'Classic pedicure.', price: 250 },
  { name: 'Laser Hair Removal Session', desc: 'Salon laser hair-removal session.', price: 600 },
];

const SERVICE_CONSULTING_ITEMS: PoolEntry[] = [
  { name: 'Legal Consultation', desc: 'One-hour lawyer consultation.', price: 800 },
  { name: 'Tax Advisory', desc: 'Tax advisory and filing assistance.', price: 1200 },
  { name: 'Feasibility Study', desc: 'Small-project feasibility study.', price: 5000 },
  { name: 'Digital Marketing Plan', desc: 'Social-media marketing plan.', price: 2500 },
  { name: 'HR Consultation', desc: 'HR structuring and hiring support.', price: 1500 },
  { name: 'Financial Planning', desc: 'Personal financial planning session.', price: 1800 },
  { name: 'Real-Estate Advisory', desc: 'Property buying and investment advice.', price: 1000 },
  { name: 'Company Setup', desc: 'Company registration service.', price: 6000 },
  { name: 'Engineering Consultation', desc: 'Drawings review and cost estimate.', price: 2000 },
  { name: 'Accounting Review', desc: 'Monthly bookkeeping review.', price: 1400 },
  { name: 'Trademark Registration', desc: 'Brand and trademark registration help.', price: 3500 },
  { name: 'Import/Export Advisory', desc: 'Customs and trade advisory session.', price: 2200 },
  { name: 'Internet Installation', desc: 'Home internet / fiber installation.', price: 600 },
  { name: 'Internet Repair', desc: 'Home internet fault repair.', price: 350 },
  { name: 'Router Setup', desc: 'Wi-Fi router setup and configuration.', price: 250 },
  { name: 'Fiber Optics Installation', desc: 'Fiber-optic line installation.', price: 1500 },
  { name: 'SIM Card Activation', desc: 'New SIM card activation service.', price: 50 },
  { name: 'Vodafone Cash Withdrawal', desc: 'Mobile-wallet cash-out service.', price: 20 },
  { name: 'Bill Payment Service', desc: 'Utility and telecom bill payment.', price: 15 },
  { name: 'Business Consulting', desc: 'Business advisory session.', price: 1500 },
  { name: 'Business Strategy', desc: 'Strategy consulting workshop.', price: 2500 },
  { name: 'Business Plan Preparation', desc: 'Full business-plan preparation.', price: 5000 },
  { name: 'Marketing Consulting', desc: 'Digital marketing consultation.', price: 2500 },
  { name: 'Marketing Plan', desc: 'Marketing plan and campaign setup.', price: 3000 },
  { name: 'IT Consulting', desc: 'IT systems consulting session.', price: 2000 },
  { name: 'Startup Consulting', desc: 'Startup mentoring session.', price: 1200 },
  { name: 'HR Consulting', desc: 'HR structuring consultation.', price: 1500 },
];

// ── New dedicated pools for previously generic (orphan) business types ──────

const TOYS_ITEMS: PoolEntry[] = [
  { name: 'Toy Car (Remote Control)', desc: 'Rechargeable remote-control toy car.', price: 450 },
  { name: 'Building Blocks Set', desc: 'Creative building-blocks set, 150 pieces.', price: 300 },
  { name: 'Plush Teddy Bear', desc: 'Soft large plush teddy bear.', price: 250 },
  { name: 'Kids Bicycle 16"', desc: 'Sturdy 16-inch kids bicycle.', price: 1800 },
  { name: 'Coloring & Drawing Kit', desc: 'Crayons, markers and coloring book set.', price: 120 },
  { name: 'Board Game (Family)', desc: 'Classic family board game.', price: 200 },
  { name: 'Action Figure', desc: 'Articulated superhero action figure.', price: 180 },
  { name: 'Dolls House Set', desc: 'Furnished plastic dolls house.', price: 650 },
  { name: 'Educational Puzzle', desc: 'Wooden educational puzzle for kids.', price: 150 },
  { name: 'Football (Size 5)', desc: 'Standard size-5 stitched football.', price: 280 },
  { name: 'Water Gun (Summer)', desc: 'Large-capacity water gun.', price: 130 },
  { name: 'Toy Kitchen Set', desc: 'Pretend-play kitchen set with accessories.', price: 700 },
];

const HOME_ITEMS: PoolEntry[] = [
  { name: 'Non-Stick Frying Pan', desc: 'Granite-coated non-stick frying pan.', price: 400 },
  { name: 'Stainless Cookware Set', desc: '7-piece stainless steel cookware set.', price: 2200 },
  { name: 'Bedsheet Set (King)', desc: 'Cotton king-size bedsheet set.', price: 850 },
  { name: 'Bath Towel Set', desc: 'Soft cotton bath towel set of three.', price: 500 },
  { name: 'Electric Kettle', desc: '1.7L stainless electric kettle.', price: 600 },
  { name: 'Plastic Storage Boxes', desc: 'Set of stackable storage boxes.', price: 320 },
  { name: 'Dinner Set (6 Persons)', desc: 'Porcelain dinner set for six.', price: 1500 },
  { name: 'Floor Mop & Bucket', desc: 'Spin mop with bucket and wringer.', price: 450 },
  { name: 'Wall Clock', desc: 'Modern silent wall clock.', price: 280 },
  { name: 'Curtain Set (Living Room)', desc: 'Blackout curtain set with tiebacks.', price: 950 },
  { name: 'Gas Stove (4 Burner)', desc: 'Four-burner tempered-glass gas stove.', price: 3200 },
  { name: 'Laundry Basket', desc: 'Foldable fabric laundry basket.', price: 180 },
];

const SPORTS_ITEMS: PoolEntry[] = [
  { name: 'Dumbbell Set (20kg)', desc: 'Adjustable 20kg dumbbell set.', price: 1400 },
  { name: 'Yoga Mat', desc: 'Non-slip cushioned yoga mat.', price: 350 },
  { name: 'Running Shoes', desc: 'Lightweight cushioned running shoes.', price: 1600 },
  { name: 'Football Jersey', desc: 'Club football jersey, fan edition.', price: 550 },
  { name: 'Resistance Bands Set', desc: 'Set of five resistance bands.', price: 280 },
  { name: 'Skipping Rope', desc: 'Speed skipping rope with counter.', price: 150 },
  { name: 'Protein Powder 1kg', desc: 'Whey protein powder, 1kg tub.', price: 1500 },
  { name: 'Gym Gloves', desc: 'Padded weightlifting gym gloves.', price: 250 },
  { name: 'Treadmill (Home)', desc: 'Foldable motorized home treadmill.', price: 18000 },
  { name: 'Padel Racket', desc: 'Carbon-fiber padel racket.', price: 2200 },
  { name: 'Water Bottle (1L)', desc: 'BPA-free sports water bottle.', price: 180 },
  { name: 'Boxing Gloves', desc: 'Padded training boxing gloves.', price: 600 },
];

const AUTOMOTIVE_ITEMS: PoolEntry[] = [
  { name: 'Oil Change (Taghyeer Zeit)', desc: 'Engine oil and filter change service.', price: 1200 },
  { name: 'Tire Replacement (Kawetch)', desc: 'New tire fitting and balancing, per tire.', price: 2000 },
  { name: 'Car Wash & Polish', desc: 'Full exterior wash and wax polish.', price: 250 },
  { name: 'Brake Pad Replacement', desc: 'Front brake pad replacement.', price: 900 },
  { name: 'Computer Diagnostics', desc: 'Full engine computer diagnostics scan.', price: 350 },
  { name: 'Battery Replacement', desc: 'New car battery with fitting.', price: 2800 },
  { name: 'AC Gas Recharge', desc: 'Car air-conditioner gas recharge.', price: 600 },
  { name: 'Wheel Alignment', desc: 'Computerized wheel alignment.', price: 400 },
  { name: 'Engine Tune-up', desc: 'Spark plugs and full engine tune-up.', price: 1500 },
  { name: 'Interior Detailing', desc: 'Deep interior cleaning and detailing.', price: 700 },
];

const EDUCATION_ITEMS: PoolEntry[] = [
  { name: 'Math Private Lesson', desc: 'One-hour private maths lesson (dars).', price: 200 },
  { name: 'English Course (Monthly)', desc: 'Monthly conversational English course.', price: 1500 },
  { name: 'ICDL Computer Course', desc: 'Full ICDL computer skills course.', price: 2500 },
  { name: 'Quran Memorization Class', desc: 'Weekly Quran memorization sessions.', price: 600 },
  { name: 'IELTS Preparation', desc: 'Intensive IELTS preparation package.', price: 4000 },
  { name: 'Kids Coding Club', desc: 'Weekly coding club for children.', price: 1200 },
  { name: 'Thanaweya Amma Group', desc: 'Group revision sessions for final-year students.', price: 1800 },
  { name: 'Physics Private Lesson', desc: 'One-hour private physics lesson.', price: 220 },
  { name: 'Drawing & Art Class', desc: 'Weekly drawing and art class for kids.', price: 500 },
  { name: 'French Language Course', desc: 'Beginner French language course.', price: 1600 },
];

/** Curated, EGYPT-localized item pools (name/desc/EGP price), keyed by type. */
const ITEM_POOLS: Partial<Record<BusinessType, ItemPool>> = {
  [BusinessType.SUPERMARKET]: { items: SUPERMARKET_ITEMS, priceRange: [10, 350] },
  [BusinessType.GROCERY]: { items: SUPERMARKET_ITEMS, priceRange: [10, 350] },
  [BusinessType.PHARMACY]: { items: PHARMACY_ITEMS, priceRange: [20, 900] },
  [BusinessType.HEALTH]: { items: PHARMACY_ITEMS, priceRange: [20, 900] },
  [BusinessType.CLOTHING]: { items: CLOTHING_ITEMS, priceRange: [120, 2500] },
  [BusinessType.FASHION]: { items: CLOTHING_ITEMS, priceRange: [120, 2500] },
  [BusinessType.ELECTRONICS]: { items: ELECTRONICS_ITEMS, priceRange: [120, 80000] },
  [BusinessType.FAST_FOOD]: { items: RESTAURANT_ITEMS, priceRange: [20, 250] },
  [BusinessType.FOOD_AND_BEVERAGE]: { items: RESTAURANT_ITEMS, priceRange: [20, 250] },
  [BusinessType.CAFE]: { items: CAFE_ITEMS, priceRange: [20, 90] },
  [BusinessType.DESSERT]: { items: DESSERT_ITEMS, priceRange: [30, 350] },
  [BusinessType.SEAFOOD]: { items: SEAFOOD_ITEMS, priceRange: [90, 650] },
  [BusinessType.DENTIST]: { items: CLINIC_DENTAL_ITEMS, priceRange: [250, 12000] },
  [BusinessType.DERMATOLOGY]: { items: CLINIC_DERMA_ITEMS, priceRange: [350, 4500] },
  [BusinessType.PEDIATRIC]: { items: CLINIC_PEDIATRIC_ITEMS, priceRange: [150, 600] },
  [BusinessType.GENERAL_CLINIC]: { items: CLINIC_GENERAL_ITEMS, priceRange: [80, 400] },
  [BusinessType.MEDICAL]: { items: CLINIC_GENERAL_ITEMS, priceRange: [80, 400] },
  [BusinessType.CROSSFIT]: { items: CLASS_SESSION_ITEMS, priceRange: [120, 3000] },
  [BusinessType.BODYBUILDING]: { items: CLASS_SESSION_ITEMS, priceRange: [120, 3000] },
  [BusinessType.PILATES]: { items: CLASS_SESSION_ITEMS, priceRange: [120, 3000] },
  [BusinessType.FITNESS]: { items: CLASS_SESSION_ITEMS, priceRange: [120, 3000] },
  [BusinessType.REPAIR]: { items: SERVICE_REPAIR_ITEMS, priceRange: [250, 900] },
  [BusinessType.CLEANING]: { items: SERVICE_CLEANING_ITEMS, priceRange: [350, 2200] },
  [BusinessType.BEAUTY]: { items: SERVICE_BEAUTY_ITEMS, priceRange: [80, 4000] },
  [BusinessType.SALON]: { items: SERVICE_BEAUTY_ITEMS, priceRange: [80, 4000] },
  [BusinessType.CONSULTING]: { items: SERVICE_CONSULTING_ITEMS, priceRange: [800, 6000] },
  [BusinessType.TOYS]: { items: TOYS_ITEMS, priceRange: [100, 1800] },
  [BusinessType.HOME]: { items: HOME_ITEMS, priceRange: [150, 3200] },
  [BusinessType.SPORTS]: { items: SPORTS_ITEMS, priceRange: [150, 18000] },
  [BusinessType.AUTOMOTIVE]: { items: AUTOMOTIVE_ITEMS, priceRange: [250, 2800] },
  [BusinessType.EDUCATION]: { items: EDUCATION_ITEMS, priceRange: [200, 4000] },
};

/** Egyptian-flavored generic fallbacks per item type (orphan types w/o a pool). */
function genericItem(itemType: ItemType): CatalogItem {
  switch (itemType) {
    case ItemType.RESTAURANT: {
      const e = faker.helpers.arrayElement(RESTAURANT_ITEMS);
      return { name: e.name, description: e.desc, price: e.price };
    }
    case ItemType.CLINIC: {
      const spec = faker.helpers.arrayElement(['Internal Medicine', 'Orthopedics', 'Neurology', 'ENT', 'Ophthalmology', 'Urology', 'Obstetrics']);
      return { name: `${spec} Consultation`, description: `Specialist ${spec.toLowerCase()} medical consultation.`, price: faker.number.int({ min: 200, max: 600 }) };
    }
    case ItemType.CLASS_SESSION: {
      const e = faker.helpers.arrayElement(CLASS_SESSION_ITEMS);
      return { name: e.name, description: e.desc, price: e.price };
    }
    case ItemType.CLOTHING_PRODUCT: {
      const e = faker.helpers.arrayElement(CLOTHING_ITEMS);
      return { name: e.name, description: e.desc, price: e.price };
    }
    case ItemType.PHARMACY_PRODUCT: {
      const e = faker.helpers.arrayElement(PHARMACY_ITEMS);
      return { name: e.name, description: e.desc, price: e.price };
    }
    case ItemType.SUPER_MARKET_PRODUCT: {
      const e = faker.helpers.arrayElement(SUPERMARKET_ITEMS);
      return { name: e.name, description: e.desc, price: e.price };
    }
    case ItemType.ELECTRONICS_PRODUCT: {
      const e = faker.helpers.arrayElement(ELECTRONICS_ITEMS);
      return { name: e.name, description: e.desc, price: e.price };
    }
    case ItemType.SERVICE:
    default: {
      const svc = faker.helpers.arrayElement([
        { n: 'Delivery Service', d: 'Fast local delivery within the area.', p: 50 },
        { n: 'Install & Maintain', d: 'On-site installation and maintenance.', p: 350 },
        { n: 'Technical Consultation', d: 'Specialized technical consultation.', p: 400 },
        { n: 'Monthly Subscription', d: 'Monthly service package.', p: 600 },
      ]);
      return { name: svc.n, description: svc.d, price: svc.p };
    }
  }
}

export function fakerBusinessContent(type: BusinessType, category: BusinessCategory, index?: number): BusinessContent {
  const keywords = type.split('_');
  const district = faker.helpers.arrayElement(['Nasr City', 'Maadi', 'New Cairo', 'Heliopolis', 'Mohandessin', '6th of October', 'Zamalek', 'Sheikh Zayed', 'Dokki', 'Faisal']);
  // A slice of every type is named after a real Egyptian chain from the search
  // training set (cycled by instance index) so brand queries resolve to a real
  // record; the rest keep authentic baladi storefront names.
  const brand = brandForIndex(type, index);
  if (brand) {
    const brandTokens = brand.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
    return {
      name: `${brand} - ${district}`,
      description: `${brand} branch in ${district}, Cairo — official prices, offers and home delivery (as3ar wel 3orood).`,
      tags: [...keywords, category, 'cairo', 'egypt', ...brandTokens, 'branch'].map((t) => t.toLowerCase()),
    };
  }
  return {
    name: egyptianBusinessName(type),
    description: `A trusted neighbourhood ${type.replace(/_/g, ' ')} ${category} in ${district}, Cairo — known for fast service and affordable prices (as3ar fel motanawel).`,
    tags: [...keywords, category, 'cairo', 'egypt', 'baladi', 'local'].map((t) => t.toLowerCase()),
  };
}

/** Build one catalog entry from a pool entry, jittering the price slightly. */
function fromPool(e: PoolEntry): CatalogItem {
  const factor = faker.number.float({ min: 0.92, max: 1.12, fractionDigits: 2 });
  return { name: e.name, description: e.desc, price: Math.max(1, Math.round(e.price * factor)) };
}

export function fakerCatalog(type: BusinessType, itemType: ItemType, count: number): CatalogItem[] {
  const pool = ITEM_POOLS[type];
  const items: CatalogItem[] = [];
  if (pool) {
    for (let i = 0; i < count; i++) {
      items.push(fromPool(pool.items[i % pool.items.length]));
    }
  } else {
    for (let i = 0; i < count; i++) items.push(genericItem(itemType));
  }
  return items;
}

export function fakerBundle(type: BusinessType, category: BusinessCategory, itemType: ItemType, count: number): CatalogBundle {
  return {
    business: fakerBusinessContent(type, category),
    items: fakerCatalog(type, itemType, count),
  };
}

/** Egyptian size/variant qualifiers used to disambiguate repeated item names. */
const VARIANT_QUALIFIERS = ['Wasat', 'Kebir', 'Family', 'Super', 'Double', 'Economy', 'Premium', 'Jumbo', 'Combo', 'Special Offer'];

/**
 * Generate `count` items with GUARANTEED-UNIQUE names. Unlike `fakerCatalog`,
 * this never repeats a name (the curated pool is consumed once, then it draws
 * from the per-itemType generic generator, and finally disambiguates any
 * residual collision with an Egyptian size/variant qualifier). Used to build a
 * single large pool that the seeder partitions into disjoint per-business
 * slices, so the same item name never lands in two businesses / locations.
 */
export function fakerUniqueItems(type: BusinessType, itemType: ItemType, count: number, categoryNames: string[] = []): CatalogItem[] {
  const out: CatalogItem[] = [];
  const seen = new Set<string>();
  const pool = ITEM_POOLS[type];
  let poolIdx = 0;

  while (out.length < count) {
    let item: CatalogItem;
    if (pool && poolIdx < pool.items.length) {
      item = fromPool(pool.items[poolIdx++]);
    } else {
      item = genericItem(itemType);
    }

    // Disambiguate collisions with an Egyptian variant qualifier rather than dropping.
    let attempts = 0;
    while (seen.has(item.name.toLowerCase()) && attempts < VARIANT_QUALIFIERS.length) {
      item = { ...item, name: `${item.name} ${VARIANT_QUALIFIERS[attempts]}` };
      attempts += 1;
    }
    const key = item.name.toLowerCase();
    if (seen.has(key)) continue; // give up on this one, draw again
    seen.add(key);
    // No AI here to classify, so assign a valid category at random (the seeder
    // still maps it to the matching categoryId for this itemType).
    if (categoryNames.length) item.category = faker.helpers.arrayElement(categoryNames);
    out.push(item);
  }
  return out;
}
