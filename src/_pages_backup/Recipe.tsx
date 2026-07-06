"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dish } from "@/_pages_backup/actions";
import RecipePreview from "@/components/RecipePreview";
import AssistantRecipeStack from "@/components/AssistantRecipeStack";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const RecipePage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [dish, setDish] = React.useState<Dish | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("selected-recipe");
      if (cached) {
        try {
          setDish(JSON.parse(cached));
        } catch (e) {
          console.error("Failed to parse selected recipe from sessionStorage", e);
        }
      }
      setLoading(false);
    }
  }, []);

  console.log("RecipePage - currentUser:", currentUser);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50 relative">
        <div className="absolute inset-0 bg-black/50 z-40"></div>
        <div className="p-6 opacity-50 pointer-events-none">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{t("noRecipeSelected")}</h2>
              <p className="text-sm text-gray-600">
                {t("openRecipeFromAssistant")}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto">
          <Card className="max-w-md shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("loginRequired")}
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                {t("pleaseLogInToViewRecipes")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">{t("noRecipeSelected")}</h2>
            <p className="text-sm text-gray-600">
              {t("openRecipeFromAssistant")}
            </p>
            <div className="mt-4">
              <Button onClick={() => router.back()}>{t("goBack")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <RecipePreview dish={dish} onClose={() => router.back()} />;
};

export default RecipePage;
