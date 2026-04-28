"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function HomePageSrOnlyHeading() {
  const { t } = useLanguage();

  return (
    <h1 id="home-page-heading" className="sr-only">
      {t("homePageHeading")}
    </h1>
  );
}
