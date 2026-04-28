import type { Metadata } from "next";
import { cookies } from "next/headers";
import Devices from "@/_pages_backup/Devices";
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
    title: m.devicesTitle,
    description: m.devicesDescription,
  };
}

export default function DevicesPage() {
  return (
    <section aria-labelledby="devices-page-heading">
      <RouteSrOnlyHeading
        id="devices-page-heading"
        translationKey="connectedDevices"
      />
      <Devices />
    </section>
  );
}
