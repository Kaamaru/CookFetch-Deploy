import type { Metadata } from "next";
import { cookies } from "next/headers";
import Profile from "@/_pages_backup/Profile";
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
    title: m.profileTitle,
    description: m.profileDescription,
  };
}

export default function ProfilePage() {
  return (
    <section aria-labelledby="profile-page-heading">
      <RouteSrOnlyHeading
        id="profile-page-heading"
        translationKey="userProfile"
      />
      <Profile />
    </section>
  );
}
