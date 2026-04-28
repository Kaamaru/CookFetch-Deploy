import type { Metadata } from "next";
import { cookies } from "next/headers";
import Assistant from "@/_pages_backup/Assistant";
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
    title: m.assistantTitle,
    description: m.assistantDescription,
  };
}

export default function AssistantPage() {
  return (
    <section aria-labelledby="assistant-page-heading">
      <RouteSrOnlyHeading
        id="assistant-page-heading"
        translationKey="aiAssistant"
      />
      <Assistant />
    </section>
  );
}
