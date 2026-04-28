import type { Metadata } from "next";
import { cookies } from "next/headers";
import Grocery from "@/_pages_backup/Grocery";
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
    title: m.groceryTitle,
    description: m.groceryDescription,
  };
}

export default function GroceryPage() {
  return (
    <section aria-labelledby="grocery-page-heading">
      <RouteSrOnlyHeading
        id="grocery-page-heading"
        translationKey="groceryLists"
      />
      <Grocery />
    </section>
  );
}
