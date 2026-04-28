import type { Metadata } from "next";
import { cookies } from "next/headers";
import Calendar from "@/_pages_backup/Calendar";
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
    title: m.calendarTitle,
    description: m.calendarDescription,
  };
}

export default function CalendarPage() {
  return (
    <section aria-labelledby="calendar-page-heading">
      <RouteSrOnlyHeading
        id="calendar-page-heading"
        translationKey="foodCalendar"
      />
      <Calendar />
    </section>
  );
}
