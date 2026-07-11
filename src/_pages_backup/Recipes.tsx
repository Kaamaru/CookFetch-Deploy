"use client";

import React, { useState } from "react";
import { BookOpen, Camera, ChefHat } from "lucide-react";
import { useRouter } from "next/navigation";
import ImageClassifier from "@/components/ImageClassifier";
import RecipeSearchPanel from "@/components/RecipeSearchPanel";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const Recipes: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [tab, setTab] = useState<"search" | "image">("search");
  const { currentUser } = useAuth();
  const isLocked = !currentUser;
  const visibleTab = isLocked ? "search" : tab;

  const handleTabChange = (nextTab: "search" | "image") => {
    if (isLocked) {
      return;
    }

    setTab(nextTab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {isLocked && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 text-center font-semibold mb-4 flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          <ChefHat className="w-4 h-4 shrink-0" />
          {t("demoModePreview")}{" "}
          <Button
            variant="ghost"
            className="text-white underline ml-2"
            onClick={() => router.push("/login")}
          >
            {t("loginNow")}
          </Button>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t("recipes")}</h1>
          <p className="text-gray-600 mt-1">{t("recipesPageDescription")}</p>
        </div>

        <div
          className={`bg-white rounded-2xl p-2 shadow-sm border border-red-100 inline-flex mb-4 ${isLocked ? "opacity-50 pointer-events-none" : ""}`}
        >
          <button
            type="button"
            onClick={() => handleTabChange("search")}
            disabled={isLocked}
            aria-disabled={isLocked}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
              visibleTab === "search"
                ? "bg-red-500 text-white shadow"
                : "text-gray-700 hover:bg-red-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {t("search")}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("image")}
            disabled={isLocked}
            aria-disabled={isLocked}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
              visibleTab === "image"
                ? "bg-red-500 text-white shadow"
                : "text-gray-700 hover:bg-red-50"
            }`}
          >
            <Camera className="w-4 h-4" />
            {t("imageToRecipe")}
          </button>
        </div>

        {isLocked ? (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
            <h2 className="text-sm font-semibold">{t("loginRequired")}</h2>
            <p className="mt-1 text-sm">
              {t("recipesLoginRequiredDescription")}
            </p>
          </div>
        ) : null}

        <div
          className={`bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-red-100 ${isLocked ? "opacity-50 pointer-events-none" : ""}`}
        >
          {visibleTab === "search" ? (
            <RecipeSearchPanel />
          ) : (
            <ImageClassifier />
          )}
        </div>
      </div>
    </div>
  );
};

export default Recipes;
