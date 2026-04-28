"use client";

import React, { useState } from "react";
import RecipeStack from "@/components/RecipeStack";
import { Clock } from "lucide-react";
import type { Dish } from "@/_pages_backup/actions";
import { useLanguage } from "@/contexts/LanguageContext";

type ScheduleItem = {
  date?: string;
  is_soon?: boolean;
  name?: string;
  time?: string;
};

interface Props {
  schedules?: ScheduleItem[];
  recipes?: Dish[];
  onPreview?: (dish: Dish) => void;
  onLoadSchedules?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * FoodsPanel
 * - segmented control to switch between "Schedules" and "Recipes"
 * - renders a schedule grid and the RecipeStack
 */
export default function FoodsPanel({
  schedules = [],
  recipes = [],
  onPreview = () => {},
  onLoadSchedules,
  isLoading = false,
  className = "",
}: Props) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"schedules" | "recipes">("schedules");

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return t("invalidDate");
    return d.toLocaleDateString("en-GB");
  };

  return (
    <div className={className}>
      {/* Segmented control */}
      <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-full shadow-sm">
        <button
          type="button"
          onClick={() => setTab("schedules")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            tab === "schedules"
              ? "bg-red-600 text-white shadow"
              : "text-gray-700 hover:bg-gray-50"
          }`}
          aria-pressed={tab === "schedules"}
        >
          {t("schedulesTab")}
        </button>

        <button
          type="button"
          onClick={() => setTab("recipes")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            tab === "recipes"
              ? "bg-red-600 text-white shadow"
              : "text-gray-700 hover:bg-gray-50"
          }`}
          aria-pressed={tab === "recipes"}
        >
          {t("recipesTab")}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {onLoadSchedules && (
            <button
              onClick={onLoadSchedules}
              disabled={isLoading}
              className="text-xs text-red-600 hover:text-red-700"
            >
              {isLoading ? t("loading") : t("refreshData")}
            </button>
          )}
        </div>
      </div>

      {/* Panels */}
      <div>
        {tab === "schedules" ? (
          <>
            {schedules && schedules.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {schedules.map((s, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {s.time ? String(s.time).replace("-", ":") : "—"}
                        </span>
                      </div>
                      {s.is_soon && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                          {t("soonLabel")}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg text-gray-800 capitalize mb-1">
                      {s.name || t("unnamed")}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {formatDate(s.date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                <p className="text-gray-500">{t("noSchedulesFoundPlain")}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <RecipeStack
              recipes={recipes || []}
              onPreview={onPreview}
              gap="gap-4"
              columns={{ sm: 1, md: 1, lg: 1 }}
            />
          </>
        )}
      </div>
    </div>
  );
}
