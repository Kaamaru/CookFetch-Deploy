"use client";

import NotFound from "@/_pages_backup/NotFound";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="not-found-page-heading">
      <h1 id="not-found-page-heading" className="sr-only">
        {t("pageNotFound")}
      </h1>
      <NotFound />
    </section>
  );
}
