"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface FoodItem {
  id?: string;
  name: string;
  category: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: string;
  purchaseDate?: string;
  time?: string;
  notify?: boolean;
  imageUrl?: string;
}

const Calendar = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const { demoFoods, household } = useGlobalContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedFood, setExpandedFood] = useState<FoodItem | null>(null);
  const [inventoryMode, setInventoryMode] = useState<"personal" | "household">("personal");
  const isDemo = !currentUser;
  const initializedUserRef = useRef<string | null>(null);

  const calculateDaysUntilExpiry = (expiryDate?: string): number | null => {
    if (!expiryDate) return null;

    const [year, month, day] = expiryDate.split("-").map(Number);
    const expiry = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const readCachedFoods = useCallback(() => {
    if (!currentUser?.uid) return [];

    const cacheKeys =
      inventoryMode === "household"
        ? household?.household_id
          ? [
              `foods_${currentUser.uid}_household_${household.household_id}`,
              `foods_${currentUser.uid}_household`,
              `foods_${currentUser.uid}`,
            ]
          : [`foods_${currentUser.uid}_household`, `foods_${currentUser.uid}`]
        : [`foods_${currentUser.uid}_personal`, `foods_${currentUser.uid}`];

    const cachedFoods: FoodItem[] = [];

    for (const cacheKey of cacheKeys) {
      const cachedValue = localStorage.getItem(cacheKey);
      if (!cachedValue) continue;

      try {
        const parsed = JSON.parse(cachedValue);
        if (Array.isArray(parsed)) {
          cachedFoods.push(...parsed);
        }
      } catch (error) {
        console.error("Error parsing cached foods:", error);
      }
    }

    const uniqueFoods = new Map<string, FoodItem>();

    for (const food of cachedFoods) {
      const key = food.id ?? `${food.name}-${food.expiryDate}-${food.purchaseDate ?? ""}`;
      if (!uniqueFoods.has(key)) {
        uniqueFoods.set(key, food);
      }
    }

    return Array.from(uniqueFoods.values());
  }, [currentUser?.uid, inventoryMode, household?.household_id]);

  useEffect(() => {
    if (isDemo) {
      setFoods(demoFoods);
      setIsLoading(false);
      return;
    }

    if (!currentUser?.uid) {
      setFoods([]);
      setIsLoading(false);
      return;
    }

    if (initializedUserRef.current !== currentUser.uid) {
      initializedUserRef.current = currentUser.uid;

      const savedMode = localStorage.getItem(
        `calendar_inventory_mode_${currentUser.uid}`,
      );

      if (savedMode === "personal" || savedMode === "household") {
        setInventoryMode((previousMode) =>
          previousMode === savedMode ? previousMode : savedMode,
        );
      } else {
        const nextMode = household?.household_id ? "household" : "personal";
        setInventoryMode((previousMode) =>
          previousMode === nextMode ? previousMode : nextMode,
        );
      }
    }

    setIsLoading(true);
    const cachedFoods = readCachedFoods();
    setFoods(cachedFoods);
    setIsLoading(false);

  }, [currentUser?.uid, demoFoods, household?.household_id, isDemo, readCachedFoods]);

  useEffect(() => {
    if (!currentUser?.uid || isDemo) return;

    localStorage.setItem(
      `calendar_inventory_mode_${currentUser.uid}`,
      inventoryMode,
    );
    setFoods(readCachedFoods());
  }, [currentUser?.uid, inventoryMode, isDemo, readCachedFoods]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getFoodsForDate = (day: number) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    return foods.filter((food) => food.expiryDate === dateStr);
  };

  // Get status color
  const getStatusColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return "bg-red-100 text-red-700 border-red-200";
    } else if (daysUntilExpiry <= 2) {
      return "bg-red-100 text-red-700 border-red-200";
    } else if (daysUntilExpiry <= 7) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    } else {
      return "bg-green-100 text-green-700 border-green-200";
    }
  };

  // Navigation
  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 text-center font-semibold">
          📅 {t("demoModePreview")}{" "}
          <Button
            variant="ghost"
            className="text-white underline ml-2"
            onClick={() => router.push("/login")}
          >
            {t("loginNow")}
          </Button>
        </div>
      )}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {t("expiryCalendar")}
                </h1>
                <p className="text-gray-600">{t("expiryCalendarDescription")}</p>
              </div>

              {!isDemo && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-red-200 bg-white p-2 shadow-sm">
                  <Button
                    variant={inventoryMode === "personal" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setInventoryMode("personal")}
                    className={inventoryMode === "personal" ? "bg-red-600 text-white hover:bg-red-700" : "text-gray-700"}
                  >
                    {t("myInventory")}
                  </Button>
                  {household?.household_id && (
                    <Button
                      variant={inventoryMode === "household" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setInventoryMode("household")}
                      className={inventoryMode === "household" ? "bg-red-600 text-white hover:bg-red-700" : "text-gray-700"}
                    >
                      {household.name || t("household")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Calendar Controls */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousMonth}
                className="border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
              >
                {t("today")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextMonth}
                className="border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col">
            {/* Calendar Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <Card className="border-red-200">
                  <CardContent className="p-6">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {[
                        t("weekSun"),
                        t("weekMon"),
                        t("weekTue"),
                        t("weekWed"),
                        t("weekThu"),
                        t("weekFri"),
                        t("weekSat"),
                      ].map((day) => (
                        <div
                          key={day}
                          className="text-center font-semibold text-gray-600 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Days */}
                    <div
                      className="grid grid-cols-7 gap-2"
                      id="calendar-container"
                    >
                      {days.map((day, index) => {
                        const itemsForDay = day ? getFoodsForDate(day) : [];
                        const isToday =
                          day &&
                          currentDate.getFullYear() === today.getFullYear() &&
                          currentDate.getMonth() === today.getMonth() &&
                          day === today.getDate();

                        return (
                          <button
                            key={index}
                            onClick={() => day && setSelectedDay(day)}
                            className={`min-h-24 p-2 rounded-lg border-2 transition-all cursor-pointer ${day
                                ? isToday
                                  ? "border-red-400 bg-red-50 hover:scale-105"
                                  : "border-red-100 hover:border-red-300 hover:scale-105"
                                : "bg-gray-50"
                              }`}
                          >
                            {day && (
                              <>
                                <div className="font-semibold text-gray-900 mb-1">
                                  {day}
                                </div>
                                <div className="space-y-1">
                                  {itemsForDay.slice(0, 2).map((item) => (
                                    <div
                                      key={item.id}
                                      className={`text-xs px-2 py-1 rounded border truncate ${getStatusColor(
                                        calculateDaysUntilExpiry(
                                          item.expiryDate,
                                        ),
                                      )}`}
                                    >
                                      {item.name}
                                    </div>
                                  ))}
                                  {itemsForDay.length > 2 && (
                                    <div className="text-xs text-gray-500 font-semibold">
                                      +{itemsForDay.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                {/* Legend */}
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t("statusLegend")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
                        <span className="text-sm text-gray-700">
                          {t("expired")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
                        <span className="text-sm text-gray-700">
                          {t("expiresSoonTwoDays")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
                        <span className="text-sm text-gray-700">
                          {t("expiresEarlyThisWeek")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
                        <span className="text-sm text-gray-700">
                          {t("expiresEarlyFresh")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Expirations */}
                <Card className="border-red-200 mt-7">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t("upcomingExpirations")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-gray-600 text-sm">{t("loading")}</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {foods
                          .filter(
                            (item) =>
                              calculateDaysUntilExpiry(item.expiryDate) >= 0 &&
                              calculateDaysUntilExpiry(item.expiryDate) <= 7,
                          )
                          .sort(
                            (a, b) =>
                              new Date(a.expiryDate).getTime() -
                              new Date(b.expiryDate).getTime(),
                          )
                          .map((item) => (
                            <div
                              key={item.id}
                              className={`p-3 rounded-lg border ${getStatusColor(
                                calculateDaysUntilExpiry(item.expiryDate),
                              )}`}
                            >
                              <div className="font-semibold text-sm">
                                {item.name}
                              </div>
                              <div className="text-xs opacity-75 mt-1">
                                {new Date(item.expiryDate).toLocaleDateString()}
                              </div>
                              <div className="text-xs opacity-75">
                                {calculateDaysUntilExpiry(item.expiryDate) === 0
                                  ? t("expiresEarlyToday")
                                  : t("daysLeftCount", {
                                    days: calculateDaysUntilExpiry(
                                      item.expiryDate,
                                    ),
                                  })}
                              </div>
                            </div>
                          ))}
                        {foods.filter(
                          (item) =>
                            calculateDaysUntilExpiry(item.expiryDate) >= 0 &&
                            calculateDaysUntilExpiry(item.expiryDate) <= 7,
                        ).length === 0 && (
                            <p className="text-gray-600 text-sm text-center py-4">
                              {t("noItemsExpiringSoon")}
                            </p>
                          )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      <Dialog
        open={selectedDay !== null}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("itemsOnDate", {
                date: selectedDay
                  ? new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    selectedDay,
                  ).toLocaleDateString()
                  : "",
              })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedDay && getFoodsForDate(selectedDay).length > 0 ? (
              getFoodsForDate(selectedDay).map((item) => (
                <Card
                  key={item.id}
                  className={`border-2 cursor-pointer transition-all hover:shadow-lg ${getStatusColor(
                    calculateDaysUntilExpiry(item.expiryDate),
                  )}`}
                  onClick={() => setExpandedFood(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          {item.name}
                        </h3>
                        {item.category && (
                          <Badge className="mb-2 bg-red-100 text-red-700">
                            {item.category}
                          </Badge>
                        )}
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {t("expires")}{" "}
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {t("daysLeftLabel")}{" "}
                            <span className="font-semibold">
                              {calculateDaysUntilExpiry(item.expiryDate)}
                            </span>
                          </div>
                          {item.purchaseDate && (
                            <div className="text-gray-600">
                              {t("purchaseDateLabel")}{" "}
                              {new Date(item.purchaseDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-20 h-20 rounded-lg object-cover ml-4"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t("noItemsScheduledForDate")}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default Calendar;
