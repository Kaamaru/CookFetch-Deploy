import type { Metadata } from "next";
import { cookies } from "next/headers";
import Index from "@/_pages_backup/Index";
import HomePageSrOnlyHeading from "@/components/HomePageSrOnlyHeading";
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
    title: m.homeTitle,
    description: m.homeDescription,
  };
}

export default function Home() {
  return (
    <section aria-labelledby="home-page-heading">
      <HomePageSrOnlyHeading />
      <Index />
    </section>
  );
}
