"use client";

import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  id: string;
  translationKey: string;
};

export default function RouteSrOnlyHeading({ id, translationKey }: Props) {
  const { t } = useLanguage();

  return (
    <h1 id={id} className="sr-only">
      {t(translationKey)}
    </h1>
  );
}
