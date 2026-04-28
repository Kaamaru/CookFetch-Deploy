"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Dish } from "@/_pages_backup/actions";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  dish: Dish | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (dish: Dish) => Promise<boolean>;
  isAdding: boolean;
  onViewFull?: (dish: Dish) => void;
};

const RecipePreviewModal: React.FC<Props> = ({
  dish,
  open,
  onOpenChange,
  onAdd,
  isAdding,
  onViewFull,
}) => {
  const { t } = useLanguage();
  const [showFull, setShowFull] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setShowFull(false);
    }
  }, [open, dish]);

  if (!dish) return null;

  const handleClose = () => {
    setShowFull(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dish.dishName}</DialogTitle>
          <DialogDescription>{t("recipePreviewDescription")}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Image / placeholder */}
          <div className="md:col-span-1 flex items-center justify-center">
            {dish.image ? (
              <img
                src={dish.image}
                alt={dish.dishName}
                className="w-44 h-32 object-cover rounded-lg shadow-sm"
                onError={(e) => {
                  // hide broken image and fallback to emoji
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-44 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-4xl">
                🍽️
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:col-span-2">
            <h4 className="font-semibold">{t("portions")}</h4>
            <ul className="list-inside list-disc mb-3 text-sm">
              {Object.entries(dish.portions).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>

            <h4 className="font-semibold">{t("preparation")}</h4>
            <div className="mt-2 max-h-40 overflow-auto text-sm bg-white p-2 rounded border border-gray-100">
              {showFull ? (
                <ol className="list-decimal list-inside space-y-1">
                  {dish.preparationSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1">
                  {dish.preparationSteps.slice(0, 3).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                  {dish.preparationSteps.length > 3 && (
                    <li className="text-xs text-gray-500">
                      {t("moreStepsAvailable")}
                    </li>
                  )}
                </ol>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // navigate to full recipe page if callback provided, otherwise toggle
                  if (onViewFull && dish) {
                    handleClose();
                    onViewFull(dish);
                  } else {
                    setShowFull((s) => !s);
                  }
                }}
              >
                {showFull ? t("collapse") : t("viewFullRecipe")}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  {t("close")}
                </Button>
              </DialogClose>
              <Button
                size="sm"
                onClick={async () => dish && (await onAdd(dish))}
                disabled={isAdding}
              >
                {isAdding ? t("addingItem") : t("add")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecipePreviewModal;
