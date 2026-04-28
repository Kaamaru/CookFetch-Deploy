"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dish } from "@/_pages_backup/actions";
import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/ImageWithFallback";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  dish: Dish;
  onClose?: () => void;
};

const RecipePreview: React.FC<Props> = ({ dish, onClose }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const recipeId = (dish as any)?.id || (dish as any)?.uid || null;

  const handleClose = () => {
    if (onClose) return onClose();
    router.back();
  };

  const handleDelete = async () => {
    if (!currentUser) {
      toast({
        title: t("loginRequired"),
        description: t("signInToDeleteRecipes"),
        variant: "destructive",
      });
      return;
    }

    if (!recipeId) {
      toast({
        title: t("missingRecipeId"),
        description: t("cannotDeleteRecipeNoId"),
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await apiClient.deleteRecipe(currentUser.uid, recipeId);

      toast({
        title: t("recipeDeleted"),
        description: t("removedFromRecipes", { name: dish.dishName }),
      });
      handleClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("unknownError");
      toast({
        title: t("failedToDelete"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{dish.dishName}</h1>
            <div>
              <Button variant={"ghost" as any} onClick={handleClose}>
                {t("close")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex flex-col gap-3 items-start">
              <ImageWithFallback
                src={dish.image}
                alt={dish.dishName}
                className="w-full h-48 rounded"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={!recipeId || isDeleting}
                className="self-stretch"
              >
                {isDeleting ? t("deleting") : t("deleteRecipe")}
              </Button>
            </div>
            <div className="md:w-2/3">
              <h3 className="font-semibold">{t("portions")}</h3>
              <ul className="list-disc list-inside mb-4">
                {Object.entries(dish.portions).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
              </ul>

              <h3 className="font-semibold">{t("preparation")}</h3>
              <ol className="list-decimal list-inside space-y-2">
                {dish.preparationSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecipePreview;
