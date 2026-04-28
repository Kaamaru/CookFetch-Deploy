import type { Metadata } from "next";
import { cookies } from "next/headers";
import { apiClient } from "@/lib/apiClient";
import RecipeDetailView, {
  type RecipeDetailModel,
} from "@/components/RecipeDetailView";
import {
  getMetadataTranslations,
  normalizeMetadataLanguage,
} from "@/lib/metadataTranslations";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language = normalizeMetadataLanguage(
    cookieStore.get("cookfetch-lang")?.value,
  );
  const m = getMetadataTranslations(language);

  return {
    title: m.recipeDetailTitle,
    description: m.recipeDetailDescription,
  };
}

function normalizeIngredients(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item)).filter(Boolean);
  }

  if (input && typeof input === "object") {
    return Object.entries(input as Record<string, unknown>)
      .map(([name, value]) => `${name}: ${String(value)}`)
      .filter(Boolean);
  }

  return [];
}

function normalizeSteps(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item)).filter(Boolean);
  }

  if (typeof input === "string" && input.trim().length > 0) {
    return [input.trim()];
  }

  return [];
}

async function getRecipeDetail(id: string): Promise<RecipeDetailModel | null> {
  const source = await apiClient.fetchRecipeDetails(id);

  if (!source || typeof source !== "object") {
    return null;
  }

  const title =
    String(
      source.name ?? source.title ?? source.dishName ?? source.recipeName ?? "",
    ) || `Recipe ${id}`;

  const ingredients = normalizeIngredients(
    source.ingredients ?? source.portions,
  );
  const steps = normalizeSteps(source.preparationSteps ?? source.steps);

  return {
    id,
    title,
    description: String(source.description ?? source.summary ?? "").trim(),
    image: source.image ?? source.image_url ?? source.imageUrl,
    ingredients,
    steps,
  };
}

export default async function RecipePage({ params }: PageProps) {
  const { id } = await params;
  const recipe = await getRecipeDetail(id);

  return <RecipeDetailView recipe={recipe} />;
}
