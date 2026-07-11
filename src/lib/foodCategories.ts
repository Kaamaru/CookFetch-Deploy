// Canonical Food Inventory categories.
//
// These are the exact category strings the existing Foods inventory UI stores,
// filters, and displays (see `FOOD_CATEGORIES` in `Foods.tsx`). The Rust backend
// batch-detection endpoint constrains Gemini's output to this same vocabulary and
// keys its shelf_life_days() lookup off these strings. "Eggs" is the one category
// added for the batch-detection feature.

import {
  Package,
  HelpCircle,
  Milk,
  Egg,
  Beef,
  Drumstick,
  Fish,
  Carrot,
  Apple,
  Wheat,
  Bean,
  Nut,
  Leaf,
  Soup,
  Droplet,
  Croissant,
  Cookie,
  CupSoda,
  Snowflake,
  Archive,
  Utensils,
  Cake,
  type LucideIcon,
} from "lucide-react";

export type FoodCategory = {
  value: string;
  icon: LucideIcon;
  labelKey: string; // LanguageContext translation key
};

// Icon for every known category value (including the "Unspecified" UI placeholder).
export const CATEGORY_ICON: Record<string, LucideIcon> = {
  Unspecified: HelpCircle,
  Other: Package,
  Dairy: Milk,
  Eggs: Egg,
  Meat: Beef,
  Poultry: Drumstick,
  Seafood: Fish,
  Vegetables: Carrot,
  Fruits: Apple,
  Grains: Wheat,
  Legumes: Bean,
  Nuts: Nut,
  Herbs: Leaf,
  Condiments: Soup,
  Oils: Droplet,
  Bakery: Croissant,
  Snacks: Cookie,
  Beverages: CupSoda,
  Frozen: Snowflake,
  Canned: Archive,
  ReadyToEat: Utensils,
  Desserts: Cake,
};

/** Icon for a category value, falling back to a generic package icon. */
export const getCategoryIcon = (value: string): LucideIcon =>
  CATEGORY_ICON[value] ?? Package;

// Ordered to mirror the Foods.tsx list (minus the "Unspecified" UI placeholder,
// which is not a meaningful detection target).
export const FOOD_CATEGORIES: FoodCategory[] = [
  { value: "Other", icon: CATEGORY_ICON.Other, labelKey: "foodCategoryOther" },
  { value: "Dairy", icon: CATEGORY_ICON.Dairy, labelKey: "foodCategoryDairy" },
  { value: "Eggs", icon: CATEGORY_ICON.Eggs, labelKey: "foodCategoryEggs" },
  { value: "Meat", icon: CATEGORY_ICON.Meat, labelKey: "foodCategoryMeat" },
  { value: "Poultry", icon: CATEGORY_ICON.Poultry, labelKey: "foodCategoryPoultry" },
  { value: "Seafood", icon: CATEGORY_ICON.Seafood, labelKey: "foodCategorySeafood" },
  { value: "Vegetables", icon: CATEGORY_ICON.Vegetables, labelKey: "foodCategoryVegetables" },
  { value: "Fruits", icon: CATEGORY_ICON.Fruits, labelKey: "foodCategoryFruits" },
  { value: "Grains", icon: CATEGORY_ICON.Grains, labelKey: "foodCategoryGrains" },
  { value: "Legumes", icon: CATEGORY_ICON.Legumes, labelKey: "foodCategoryLegumes" },
  { value: "Nuts", icon: CATEGORY_ICON.Nuts, labelKey: "foodCategoryNuts" },
  { value: "Herbs", icon: CATEGORY_ICON.Herbs, labelKey: "foodCategoryHerbs" },
  { value: "Condiments", icon: CATEGORY_ICON.Condiments, labelKey: "foodCategoryCondiments" },
  { value: "Oils", icon: CATEGORY_ICON.Oils, labelKey: "foodCategoryOils" },
  { value: "Bakery", icon: CATEGORY_ICON.Bakery, labelKey: "foodCategoryBakery" },
  { value: "Snacks", icon: CATEGORY_ICON.Snacks, labelKey: "foodCategorySnacks" },
  { value: "Beverages", icon: CATEGORY_ICON.Beverages, labelKey: "foodCategoryBeverages" },
  { value: "Frozen", icon: CATEGORY_ICON.Frozen, labelKey: "foodCategoryFrozen" },
  { value: "Canned", icon: CATEGORY_ICON.Canned, labelKey: "foodCategoryCanned" },
  { value: "ReadyToEat", icon: CATEGORY_ICON.ReadyToEat, labelKey: "foodCategoryReadyToEat" },
  { value: "Desserts", icon: CATEGORY_ICON.Desserts, labelKey: "foodCategoryDesserts" },
];

export const FOOD_CATEGORY_VALUES: string[] = FOOD_CATEGORIES.map((c) => c.value);
