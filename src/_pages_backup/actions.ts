'use client';

import { confirmPasswordReset } from "firebase/auth";
import { useState } from "react";
import { normalizeDishes } from "@/lib/recipeUtils";
import { apiClient } from "@/lib/apiClient";

export interface Portions {
  [key: string]: string;
}

export interface Dish {
  dishName: string;
  portions: Portions;
  preparationSteps: string[];
  image?: string; // normalized image URL for preview
  id?: string; // backend recipe id when available
  uid?: string; // optional alternate id key
  time?: string;
  created_at?: string;
  updated_at?: string;
  ingredients?: string[]; // preserve raw ingredients if provided
  steps?: string[]; // preserve raw steps if provided
}

export interface RecipeResponse {
  dishes: Dish[];
}


export const useChatRecipe = () => {
const [recipes, setRecipes] = useState<Dish[]>([]);

  return { recipes, setRecipes };
};
export const useConcatPrompt = () => {
  const [concatenatedString, setConcatenatedString] = useState("");

  return { concatenatedString, setConcatenatedString };
};

export async function getRecipesFromIngredients(ingredients: string, uid: string = ""): Promise<{ success: boolean; data?: Dish[]; error?: string }> {
  
  try {
    console.log("Fetching recipes with ingredients:", ingredients);
    const data = await apiClient.sendChatRequest(uid, {
      history: [],
      prompt: {
        text: ingredients,
      },
      promptlanguage: "ENG",
    });
    
    console.log("=== PARSED API RESPONSE (object) ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("=== END PARSED RESPONSE ===");
    
    if (!data.dishes || !Array.isArray(data.dishes)) {
        console.error("Invalid response format - dishes missing or not an array:", data);
        throw new Error("Invalid response format from API.");
    }

    // Normalize API response: ensure image_url becomes image
    const normalizedDishes = normalizeDishes(data.dishes);

    console.log("Fetched recipes (dishes array):", normalizedDishes);
    // Log each dish's image field for debugging
    normalizedDishes.forEach((dish, idx) => {
      console.log(`[Dish ${idx}] Name: ${dish.dishName}, Image: ${dish.image || "(none)"}`);
    });
    return { success: true, data: normalizedDishes };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching recipes.';
    return { success: false, error: errorMessage };
  }
}

