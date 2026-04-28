export interface AddRecipeRequest {
  name: string;
  ingredients: string[];
  steps: string[];
  time?: string;
}

export interface Recipe {
  uid: string;
  name: string;
  ingredients: string[];
  steps: string[];
  time?: string;
}

export interface AddRecipeResponse {
  success: boolean;
  message: string;
  recipe: Recipe;
  updated_at: string;
}
