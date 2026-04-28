import type { Metadata } from "next";
import { cookies } from "next/headers";
import Settings from "@/_pages_backup/Settings";
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
    title: m.settingsTitle,
    description: m.settingsDescription,
  };
}

export default function SettingsPage() {
  return (
    <section aria-labelledby="settings-page-heading">
      <RouteSrOnlyHeading
        id="settings-page-heading"
        translationKey="settings"
      />
      <Settings />
    </section>
  );
}
