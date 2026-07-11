// Canonical Food Inventory categories.
//
// These are the exact category strings the existing Foods inventory UI stores,
// filters, and displays (see `FOOD_CATEGORIES` in `Foods.tsx`). The Rust backend
// batch-detection endpoint constrains Gemini's output to this same vocabulary and
// keys its shelf_life_days() lookup off these strings. "Eggs" is the one category
// added for the batch-detection feature.

export type FoodCategory = {
  value: string;
  emoji: string;
  labelKey: string; // LanguageContext translation key
};

// Ordered to mirror the Foods.tsx list (minus the "Unspecified" UI placeholder,
// which is not a meaningful detection target).
export const FOOD_CATEGORIES: FoodCategory[] = [
  { value: "Other", emoji: "✨", labelKey: "foodCategoryOther" },
  { value: "Dairy", emoji: "🥛", labelKey: "foodCategoryDairy" },
  { value: "Eggs", emoji: "🥚", labelKey: "foodCategoryEggs" },
  { value: "Meat", emoji: "🥩", labelKey: "foodCategoryMeat" },
  { value: "Poultry", emoji: "🍗", labelKey: "foodCategoryPoultry" },
  { value: "Seafood", emoji: "🐟", labelKey: "foodCategorySeafood" },
  { value: "Vegetables", emoji: "🥦", labelKey: "foodCategoryVegetables" },
  { value: "Fruits", emoji: "🍎", labelKey: "foodCategoryFruits" },
  { value: "Grains", emoji: "🌾", labelKey: "foodCategoryGrains" },
  { value: "Legumes", emoji: "🫘", labelKey: "foodCategoryLegumes" },
  { value: "Nuts", emoji: "🥜", labelKey: "foodCategoryNuts" },
  { value: "Herbs", emoji: "🌿", labelKey: "foodCategoryHerbs" },
  { value: "Condiments", emoji: "🧂", labelKey: "foodCategoryCondiments" },
  { value: "Oils", emoji: "🫒", labelKey: "foodCategoryOils" },
  { value: "Bakery", emoji: "🥖", labelKey: "foodCategoryBakery" },
  { value: "Snacks", emoji: "🍿", labelKey: "foodCategorySnacks" },
  { value: "Beverages", emoji: "🥤", labelKey: "foodCategoryBeverages" },
  { value: "Frozen", emoji: "❄️", labelKey: "foodCategoryFrozen" },
  { value: "Canned", emoji: "🥫", labelKey: "foodCategoryCanned" },
  { value: "ReadyToEat", emoji: "🍱", labelKey: "foodCategoryReadyToEat" },
  { value: "Desserts", emoji: "🍰", labelKey: "foodCategoryDesserts" },
];

export const FOOD_CATEGORY_VALUES: string[] = FOOD_CATEGORIES.map((c) => c.value);
