"use client";

import React from "react";
import type { Dish } from "@/_pages_backup/actions";
import { useLanguage } from "@/contexts/LanguageContext";

type Columns = { sm?: number; md?: number; lg?: number };

interface Props {
  recipes?: Dish[];
  onPreview?: (dish: Dish) => void;
  gap?: string;
  columns?: Columns;
}

/**
 * AssistantRecipeStack
 * - Compact / cardy style for assistant UI (different look than Foods)
 * - Sorted by time (recent first)
 */
export default function AssistantRecipeStack({
  recipes = [],
  onPreview = () => {},
  gap = "gap-3",
  columns = { sm: 1, md: 2, lg: 2 },
}: Props) {
  const { t } = useLanguage();
  const mdCols = columns.md ? `md:grid-cols-${columns.md}` : "";
  const lgCols = columns.lg ? `lg:grid-cols-${columns.lg}` : "";
  const gridClass = `grid ${gap} grid-cols-1 ${mdCols} ${lgCols}`;

  const safeTimeValue = (d: any) => {
    const t = d?.time ?? d?.created_at ?? null;
    const parsed = t ? Date.parse(String(t)) : NaN;
    return isNaN(parsed) ? 0 : parsed;
  };

  const sorted = (recipes || [])
    .slice()
    .sort((a, b) => safeTimeValue(b as any) - safeTimeValue(a as any));

  const shortIngredients = (ing: unknown[]) => {
    if (!Array.isArray(ing) || ing.length === 0) return t("noIngredients");
    const parts = String(ing[0] ?? "").split(":")[0] || String(ing[0]);
    if (ing.length > 1) {
      return t("moreIngredientsSummary", {
        ingredient: parts,
        count: ing.length - 1,
      });
    }
    return parts;
  };

  const formatTimeShort = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div
      className={gridClass}
      role="list"
      aria-label={t("assistantRecipeResultsLabel")}
    >
      {sorted.map((dish, i) => {
        const id = (dish as any)?.uid ?? (dish as any)?.id ?? i;
        const title =
          (dish as any)?.name ||
          (dish as any)?.dishName ||
          t("recipeNumber", {
            number: i + 1,
          });
        const ingredients = Array.isArray((dish as any)?.ingredients)
          ? (dish as any).ingredients
          : [];
        const time = (dish as any)?.time ?? (dish as any)?.created_at;

        return (
          <div
            key={id}
            className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition transform hover:scale-[1.02] cursor-pointer"
            role="listitem"
          >
            <button
              type="button"
              onClick={() => onPreview?.(dish)}
              className="w-full text-left flex items-start gap-3 focus:outline-none"
              aria-label={t("openRecipe", { title })}
            >
              {/* Image */}
              <div className="flex-shrink-0">
                {dish.image ? (
                  <img
                    src={dish.image}
                    alt={title}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    🍽️
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800 truncate">
                    {title}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatTimeShort(time)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {shortIngredients(ingredients)}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-xs">
                    {t("preview")}
                  </span>
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
