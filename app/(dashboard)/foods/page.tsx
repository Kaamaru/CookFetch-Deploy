import type { Metadata } from "next";
import { cookies } from "next/headers";
import Foods from "@/_pages_backup/Foods";
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
    title: m.foodsTitle,
    description: m.foodsDescription,
  };
}

export default function FoodsPage() {
  return (
    <section aria-labelledby="foods-page-heading">
      <RouteSrOnlyHeading id="foods-page-heading" translationKey="myFoods" />
      <Foods />
    </section>
  );
}
