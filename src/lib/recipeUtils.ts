import { Dish, Portions } from "@/_pages_backup/actions";

/**
 * Normalize a raw recipe/dish object from various sources (API, saved data, etc.)
 * into the standard Dish interface format.
 * 
 * Handles:
 * - Converting image_url/imageUrl/etc to image
 * - Converting ingredients array to portions object
 * - Normalizing preparation steps
 */
export function normalizeDish(raw: any): Dish | null {
  if (!raw) return null;

  // If it's already the expected shape with all required fields, just normalize the image
  if (raw.dishName && raw.portions && raw.preparationSteps) {
    return {
      dishName: raw.dishName,
      portions: raw.portions,
      preparationSteps: raw.preparationSteps,
      image: raw.image || raw.image_url || raw.imageUrl || raw.imageURL || raw.img || raw.picture || undefined,
      id: raw.id || raw.uid,
      uid: raw.uid,
      time: raw.time,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      ingredients: raw.ingredients,
      steps: raw.steps,
    };
  }

  const dishName = raw.name || raw.dishName || "Untitled Recipe";
  const id = raw.id || raw.uid || raw.recipeId || raw.recipe_id || undefined;
  const uid = raw.uid || undefined;

  // Parse ingredients array of "name: amount" into portions object
  const portions: Portions = {};
  if (Array.isArray(raw.ingredients)) {
    raw.ingredients.forEach((ing: any) => {
      try {
        const s = String(ing ?? "").trim();
        if (!s) return;
        const idx = s.indexOf(":");
        if (idx > -1) {
          const key = s.slice(0, idx).trim() || "ingredient";
          const val = s.slice(idx + 1).trim();
          portions[key] = val;
        } else {
          // fallback: put full string as key with empty amount
          portions[s] = "";
        }
      } catch {
        // ignore malformed ingredient
      }
    });
  } else if (raw.portions && typeof raw.portions === 'object') {
    // Already have portions object
    Object.assign(portions, raw.portions);
  }

  const preparationSteps = Array.isArray(raw.steps)
    ? raw.steps
    : Array.isArray(raw.preparationSteps)
      ? raw.preparationSteps
      : [];

  // Try multiple image field names to handle various API responses
  // NOTE: Backend may not be returning image_url in savedrecipes endpoint
  // even though it was sent during save. This is a known issue.
  const image = raw.image || raw.image_url || raw.imageUrl || raw.imageURL || raw.img || raw.picture || null;

  if (image) {
    console.log(`[normalizeDish] Found image for ${dishName}:`, image);
  } else {
    console.log(`[normalizeDish] NO image for ${dishName} - backend may not be returning image_url`);
  }

  return {
    dishName,
    portions,
    preparationSteps,
    image: image || undefined,
    id,
    uid,
    time: raw.time,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : undefined,
    steps: Array.isArray(raw.steps) ? raw.steps : undefined,
  };
}

/**
 * Normalize an array of raw dishes
 */
export function normalizeDishes(rawDishes: any[]): Dish[] {
  if (!Array.isArray(rawDishes)) return [];
  return rawDishes.map(normalizeDish).filter((d): d is Dish => d !== null);
}
