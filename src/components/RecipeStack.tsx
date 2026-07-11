"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import type { Dish } from "@/_pages_backup/actions";
import { useLanguage } from "@/contexts/LanguageContext";

type Columns = { sm?: number; md?: number; lg?: number };

interface Props {
  recipes?: Dish[];
  onPreview?: (dish: Dish) => void;
  onDelete?: (dish: Dish) => void;
  deletingId?: string | number | null;
  gap?: string;
  columns?: Columns;
}

/**
 * RecipeStack (Foods)
 * - Foods page version: more detailed view, scrollable ingredient/steps previews.
 * - Sorted by time (recent first).
 */
export default function RecipeStack({
  recipes = [],
  onPreview = () => {},
  onDelete,
  deletingId,
  gap = "gap-4",
  columns = { sm: 1, md: 2, lg: 3 },
}: Props) {
  const { t } = useLanguage();
  const mdCols = columns.md ? `md:grid-cols-${columns.md}` : "";
  const lgCols = columns.lg ? `lg:grid-cols-${columns.lg}` : "";
  const gridClass = `grid ${gap} grid-cols-1 ${mdCols} ${lgCols}`;

  const safeTimeValue = (d: any) => {
    const t = d?.time ?? d?.created_at ?? d?.updated_at ?? null;
    const parsed = t ? Date.parse(String(t)) : NaN;
    return isNaN(parsed) ? 0 : parsed;
  };

  // sort by time descending (recent first)
  const sorted = (recipes || [])
    .slice()
    .sort((a, b) => safeTimeValue(b as any) - safeTimeValue(a as any));

  const formatTime = (iso?: string) => {
    if (!iso) return "—";
    try {
      const dt = new Date(iso);
      if (isNaN(dt.getTime())) return "Invalid date";
      return dt.toLocaleString();
    } catch {
      return "—";
    }
  };

  const parseIngredient = (raw: unknown) => {
    const s = String(raw ?? "").trim();
    if (!s) return { name: "Unknown", amount: "" };
    const idx = s.indexOf(":");
    if (idx > -1) {
      return {
        name: s.slice(0, idx).trim() || "Unknown",
        amount: s.slice(idx + 1).trim(),
      };
    }
    const parts = s.split(" - ");
    if (parts.length > 1) {
      return {
        name: parts[0].trim() || "Unknown",
        amount: parts.slice(1).join(" - ").trim(),
      };
    }
    return { name: s, amount: "" };
  };

  return (
    <div className={gridClass} role="list" aria-label={t("recipeResultsLabel")}>
      {sorted.map((dish, idx) => {
        const id = (dish as any)?.uid ?? (dish as any)?.id ?? idx;
        const recipeId = (dish as any)?.uid ?? (dish as any)?.id;
        const title =
          (dish as any)?.name || (dish as any)?.dishName || `Recipe ${idx + 1}`;
        const ingredients = Array.isArray((dish as any)?.ingredients)
          ? (dish as any).ingredients
          : [];
        const steps = Array.isArray((dish as any)?.steps)
          ? (dish as any).steps
          : [];
        const time =
          (dish as any)?.time ??
          (dish as any)?.created_at ??
          (dish as any)?.updated_at;
        return (
          <div
            key={id}
            role="listitem"
            aria-label={`Recipe card ${title}`}
            className="w-full rounded-2xl overflow-hidden bg-white shadow-sm transform transition duration-200 ease-in-out hover:shadow-lg hover:scale-105 relative"
            style={{ transformOrigin: "center top" }}
          >
            <button
              type="button"
              onClick={() => onPreview?.(dish)}
              aria-label={`Preview ${title}`}
              className="text-left w-full h-full p-4 flex flex-col items-start gap-3 focus:outline-none"
            >
              {/* Image */}
              <div className="w-full relative">
                {dish.image ? (
                  <img
                    src={dish.image}
                    alt={title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <UtensilsCrossed className="w-10 h-10 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="w-full flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-800 truncate">
                  {title}
                </h3>
                <time className="text-sm text-gray-500 whitespace-nowrap">
                  {formatTime(time)}
                </time>
              </div>
            </button>
            {onDelete ? (
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-6 right-6 px-4 py-2 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(dish);
                }}
                disabled={!recipeId || deletingId === recipeId}
              >
                {deletingId === recipeId
                  ? t("deleting")
                  : t("deleteRecipe")}
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
