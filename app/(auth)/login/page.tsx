import type { Metadata } from "next";
import { cookies } from "next/headers";
import Login from "@/_pages_backup/Login";
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
    title: m.loginTitle,
    description: m.loginDescription,
  };
}

export default function LoginPage() {
  return (
    <section aria-labelledby="login-page-heading">
      <RouteSrOnlyHeading
        id="login-page-heading"
        translationKey="loginToCookFetch"
      />
      <Login />
    </section>
  );
}
