import type { Metadata } from "next";
import { cookies } from "next/headers";
import Recipes from "@/_pages_backup/Recipes";
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
    title: m.recipesTitle,
    description: m.recipesDescription,
  };
}

export default function RecipesPage() {
  return (
    <section aria-labelledby="recipes-page-heading">
      <RouteSrOnlyHeading id="recipes-page-heading" translationKey="recipes" />
      <Recipes />
    </section>
  );
}
