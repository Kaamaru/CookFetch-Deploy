import type { Metadata } from "next";
import { cookies } from "next/headers";
import Recipe from "@/_pages_backup/Recipe";
import RouteSrOnlyHeading from "@/components/RouteSrOnlyHeading";
import {
  getMetadataTranslations,
  normalizeMetadataLanguage,
} from "@/lib/metadataTranslations";

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

export default function RecipePage() {
  return (
    <section aria-labelledby="recipe-page-heading">
      <RouteSrOnlyHeading id="recipe-page-heading" translationKey="recipes" />
      <Recipe />
    </section>
  );
}
