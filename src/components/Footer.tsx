"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative z-10 border-t border-red-100 bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-md">
            <Image
              src="/media/hero_red.png"
              alt={t("cookFetchLogoAlt")}
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          <span className="text-xl font-poppins font-semibold text-gray-800">
            {t("freshKeeper")}
          </span>
        </div>
        <p className="text-gray-600 mb-2">{t("smartFoodManagement")}</p>
        <p className="text-sm text-gray-500">{t("footerCopyright")}</p>
      </div>
    </footer>
  );
};

export default Footer;
