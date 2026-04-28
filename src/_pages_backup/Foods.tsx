"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import IngredientsPanel from "@/components/IngredientsPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Calendar,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCcw,
  Clock,
  Bell,
  BellOff,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalContext } from "@/contexts/GlobalContext";
import RecipeStack from "@/components/RecipeStack";
import { useRouter } from "next/navigation";
import { normalizeDish } from "@/lib/recipeUtils";
import { apiClient } from "@/lib/apiClient";
import { API_DEBUG } from "@/lib/config";
import ImageClassifier from "@/components/ImageClassifier";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserData {
  email: string;
  savedrecipes: Recipe[];
  schedules: Schedule[];
  username: string;
}

interface Recipe {
  id?: string;
  uid?: string;
  name?: string;
  dishName?: string;
  title?: string;
  [key: string]: any;
}

interface RecipeSearchData {
  id: string;
  name?: string;
  ingredients?: Record<string, string>;
  nutrition?: Record<string, string>;
}

interface RecipeSearchMatchInfo {
  matched_from: string;
  score: number;
  confidence?: "exact" | "high" | "low";
}

interface RecipeSearchResponse {
  status: "found" | "generating" | "failed" | "not_found";
  data: RecipeSearchData | null;
  match_info: RecipeSearchMatchInfo | null;
  retry_after?: number | null;
}

// Update your Schedule interface to include the firestore document ID
interface Schedule {
  uid: string;
  // id?: string; // Add this line - the firestore document ID
  date: string;
  expiry: string;
  name: string;
  time: string;
  notify?: boolean;
  category?: string;
  image_url?: string;
  quantity?: string;
  location?: string;
}

// Update your FoodItem interface to include the firestore ID for scheduled items
interface FoodItem {
  id?: string; // <- changed from number to string
  name: string;
  category: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: string;
  purchaseDate?: string;
  time?: string;
  firestoreId?: string; // Optional now
  notify?: boolean;
  imageUrl?: string;
}

type Props = {
  expiry: Record<string, number>;
};

const JsonDropdown: React.FC<Props> = ({ expiry }) => {
  const { t } = useLanguage();
  const [selectedKey, setSelectedKey] = useState<string>(
    Object.keys(expiry)[0],
  );

  return (
    <div className="flex flex-col gap-3 max-w-md p-4 border rounded shadow">
      <label htmlFor="dropdown" className="font-medium">
        {t("selectKey")}
      </label>
      <select
        id="dropdown"
        className="p-2 border rounded"
        value={selectedKey}
        onChange={(e) => setSelectedKey(e.target.value)}
      >
        {Object.keys(expiry).map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>

      <div className="p-3 bg-gray-100 border rounded text-sm">
        <strong>{t("value")}:</strong> {expiry[selectedKey]}
      </div>
    </div>
  );
};

const Foods = () => {
  const { t } = useLanguage();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const { currentUser, logout } = useAuth();
  const { demoFoods, setDemoFoods, household } = useGlobalContext();
  const router = useRouter();
  const [tab, setTab] = useState<
    "ingredients" | "recipes" | "notifications" | "classify"
  >("ingredients");
  const [inventoryMode, setInventoryMode] = useState<"personal" | "household">("personal");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterExpiryPreset, setFilterExpiryPreset] = useState<string>("any");
  const [sortKey, setSortKey] = useState<"expiry" | "name">("expiry");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftFilterCategory, setDraftFilterCategory] =
    useState<string>(filterCategory);
  const [draftExpiryPreset, setDraftExpiryPreset] =
    useState<string>(filterExpiryPreset);
  const [draftSortKey, setDraftSortKey] = useState<"expiry" | "name">(sortKey);
  const [draftSortOrder, setDraftSortOrder] = useState<"asc" | "desc">(
    sortOrder,
  );
  const [notifiedFoods, setNotifiedFoods] = useState<FoodItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [notificationsCount, setNotificationsCount] = useState<number | null>(
    null,
  );
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("");
  const [notifSearchTerm, setNotifSearchTerm] = useState("");
  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);
  const [recipeSearchStatus, setRecipeSearchStatus] = useState<
    "idle" | "generating" | "found" | "failed"
  >("idle");
  const [recipeSearchError, setRecipeSearchError] = useState<string | null>(
    null,
  );
  const [searchedRecipe, setSearchedRecipe] = useState<RecipeSearchData | null>(
    null,
  );
  const [searchedRecipeMatchInfo, setSearchedRecipeMatchInfo] =
    useState<RecipeSearchMatchInfo | null>(null);
  const [recipeSearchRetryKey, setRecipeSearchRetryKey] = useState(0);
  const recipeSearchAbortRef = useRef<AbortController | null>(null);

  // Sample expiry data - replace with your actual expiry prop
  const FOOD_CATEGORIES = [
    { value: "Unspecified", label: t("foodCategoryUnspecified"), emoji: "❓" },
    { value: "Other", label: t("foodCategoryOther"), emoji: "✨" },
    { value: "Dairy", label: t("foodCategoryDairy"), emoji: "🥛" },
    { value: "Meat", label: t("foodCategoryMeat"), emoji: "🥩" },
    { value: "Poultry", label: t("foodCategoryPoultry"), emoji: "🍗" },
    { value: "Seafood", label: t("foodCategorySeafood"), emoji: "🐟" },
    { value: "Vegetables", label: t("foodCategoryVegetables"), emoji: "🥦" },
    { value: "Fruits", label: t("foodCategoryFruits"), emoji: "🍎" },
    { value: "Grains", label: t("foodCategoryGrains"), emoji: "🌾" },
    { value: "Legumes", label: t("foodCategoryLegumes"), emoji: "🫘" },
    { value: "Nuts", label: t("foodCategoryNuts"), emoji: "🥜" },
    { value: "Herbs", label: t("foodCategoryHerbs"), emoji: "🌿" },
    { value: "Condiments", label: t("foodCategoryCondiments"), emoji: "🧂" },
    { value: "Oils", label: t("foodCategoryOils"), emoji: "🫒" },
    { value: "Bakery", label: t("foodCategoryBakery"), emoji: "🥖" },
    { value: "Snacks", label: t("foodCategorySnacks"), emoji: "🍿" },
    { value: "Beverages", label: t("foodCategoryBeverages"), emoji: "🥤" },
    { value: "Frozen", label: t("foodCategoryFrozen"), emoji: "❄️" },
    { value: "Canned", label: t("foodCategoryCanned"), emoji: "🥫" },
    { value: "ReadyToEat", label: t("foodCategoryReadyToEat"), emoji: "🍱" },
    { value: "Desserts", label: t("foodCategoryDesserts"), emoji: "🍰" },
  ];

  const expiry = {
    Unspecified: 7,
    Dairy: 7,
    Meat: 3,
    Poultry: 2,
    Seafood: 1,
    Vegetables: 3,
    Fruits: 5,
    Grains: 30,
    Legumes: 14,
    Nuts: 60,
    Herbs: 7,
    Condiments: 90,
    Oils: 180,
    Bakery: 5,
    Snacks: 30,
    Beverages: 14,
    Frozen: 90,
    Canned: 365,
    ReadyToEat: 3,
    Desserts: 7,
    Other: 7,
  };

  const [newFood, setNewFood] = useState({
    name: "",
    category: "",
    customCategory: "",
    location: "",
    expiryDate: "",
    quantity: "",
    selectedExpiryFood: "",
    notify: false,
    expiryMode: "predefined", // "predefined" | "customDate" | "customTime"
    customDays: "",
    customDaysValue: 1,
  });

  const [editFood, setEditFood] = useState({
    name: "",
    category: "",
    expiryDate: "",
    quantity: "",
    selectedExpiryFood: "",
  });

  // New state for managing pending changes (delete & notification toggles)
  const [pendingChanges, setPendingChanges] = useState<
    Record<
      string,
      {
        isMarkedForDelete?: boolean;
        notificationsEnabled?: boolean;
      }
    >
  >({});

  const [reloadCooldown, setReloadCooldown] = useState(false);
  const [addFoodCooldown, setAddFoodCooldown] = useState(false);

  const logInventoryDebug = (
    stage: string,
    details: Record<string, unknown> = {},
  ) => {
    if (!API_DEBUG) return;
    console.log(`[inventory:${stage}]`, {
      uid: currentUser?.uid ?? null,
      ...details,
    });
  };

  const ReloadSchedules = async () => {
    const loadStartedAt = Date.now();
    logInventoryDebug("load-start", {
      trigger: "reload",
      isDemo,
      hasUser: Boolean(currentUser?.uid),
      mode: inventoryMode,
    });

    // Don't allow API calls in demo mode
    if (isDemo) {
      setError(t("actionNotAvailableInDemo"));
      logInventoryDebug("load-skip-demo", { trigger: "reload" });
      return;
    }

    if (reloadCooldown) return;
    setReloadCooldown(true);
    setTimeout(() => setReloadCooldown(false), 5000);

    setIsLoading(true);
    setError(null);

    try {
      // Check if currentUser exists
      if (!currentUser?.uid) {
        setError(t("noUserLoggedIn"));
        logInventoryDebug("load-no-user", { trigger: "reload" });
        return;
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      let fetchedSchedules: Schedule[] = [];

      if (inventoryMode === "household" && household) {
        logInventoryDebug("request-household-schedules", { householdId: household.household_id });
        const res = await apiClient.getHouseholdSchedules(household.household_id, currentUser.uid);
        if (res.success) {
          fetchedSchedules = res.schedules;
        }
      } else {
        logInventoryDebug("request-user", { endpoint: "getUser" });
        const data = await apiClient.getUser(currentUser.uid);
        if (data) {
          setUserData(data);
          fetchedSchedules = data.schedules || [];
        }
      }

      if (fetchedSchedules) {
        try {
          // Use the parsed data directly
          const convertedFoods: FoodItem[] = fetchedSchedules.map((schedule) => ({
            id: schedule.uid,
            name: schedule.name,
            category: schedule.category ?? t("scheduledItem"),
            expiryDate: schedule.expiry ?? schedule.date ?? "",
            daysUntilExpiry: calculateDaysUntilExpiry(schedule.expiry ?? schedule.date ?? undefined),
            quantity: schedule.quantity || t("notSet"),
            purchaseDate: schedule.date,
            time: schedule.time,
            notify: schedule.notify ?? false,
            imageUrl: schedule.image_url ?? undefined,
          }));

          // Preserve manually added foods (those without purchaseDate from schedules)
          const manuallyAddedFoods = foods.filter((food) => !food.purchaseDate);

          // Update all states with the new data
          setSchedules(fetchedSchedules);
          const allFoods = [...manuallyAddedFoods, ...convertedFoods];
          setFoods(allFoods);

          logInventoryDebug("load-success", {
            schedules: fetchedSchedules.length,
            foods: allFoods.length,
            durationMs: Date.now() - loadStartedAt,
          });

          // Cache foods for Calendar to use
          try {
            const cacheKey = `foods_${currentUser.uid}_${inventoryMode}`;
            localStorage.setItem(cacheKey, JSON.stringify(allFoods));
          } catch (e) {
            console.warn("Failed to cache foods", e);
          }
        } catch (e) {
          setError(t("failedToParseUserData"));
          console.error("Parse error:", e);
        }
      } else {
        setError(t("failedToFetchUserData"));
      }
    } catch (err) {
      setError(t("failedToReloadSchedules"));
      console.error("Error reloading schedules:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    ReloadSchedules();
  }, [inventoryMode]);

  const LoadNotifications = async () => {
    setIsLoadingNotifications(true);
    setNotifyError(null);
    // Guard: require logged-in user for user-scoped notifications
    if (!currentUser?.uid) {
      setNotifyError(t("noUserLoggedIn"));
      setNotifiedFoods([]);
      setNotificationsCount(null);
      setIsLoadingNotifications(false);
      return;
    }
    try {
      const parsed = await apiClient.getNotifications(currentUser.uid);
      const schedulesArr: any[] = Array.isArray(parsed?.schedules)
        ? parsed.schedules
        : [];

      const apiCount =
        typeof parsed?.count === "number" ? parsed?.count : schedulesArr.length;

      const converted: FoodItem[] = schedulesArr.map((schedule: any) => {
        const normalizedExpiry = schedule?.expiry ?? schedule?.date ?? undefined;
        return {
          id: schedule?.uid ?? schedule?.id ?? undefined,
          name: schedule?.name ?? "",
          category: schedule?.category ?? t("scheduledItem"),
          expiryDate: schedule?.expiry ?? "",
          daysUntilExpiry: calculateDaysUntilExpiry(normalizedExpiry),
          quantity: schedule?.quantity ?? t("notSet"),
          purchaseDate: schedule?.date ?? undefined,
          time: schedule?.time ?? undefined,
          notify: schedule?.notify ?? true,
          imageUrl: schedule?.image_url ?? undefined,
        };
      });
      const activeNotified = converted.filter((c) => c.notify !== false);
      setNotifiedFoods(activeNotified);
      // Display count based on active notifications
      setNotificationsCount(activeNotified.length);

      // Align inventory notify flags with latest notification data
      setFoods((prev) => {
        if (!converted.length) return prev;
        const notifyMap = new Map<string, boolean>();
        converted.forEach((c) => {
          if (c.id) notifyMap.set(c.id, c.notify ?? true);
        });
        return prev.map((f) =>
          f.id && notifyMap.has(f.id)
            ? { ...f, notify: notifyMap.get(f.id) ?? f.notify }
            : f,
        );
      });

      // persist notifications to cache with timestamp
      try {
        const cacheKey = `cookfetch_notifications_${currentUser.uid}`;
        const payload = {
          ts: Date.now(),
          data: { count: apiCount, schedules: schedulesArr },
        };
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch (e) {
        console.warn("Failed to write notifications cache", e);
      }
    } catch (e: any) {
      console.error("Notifications load error:", e);
      setNotifyError(e?.message || t("failedToLoadNotifications"));
      setNotifiedFoods([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Initial load

  // Cache TTL in ms (5 minutes)
  const CACHE_TTL_MS = 5 * 60 * 1000;

  useEffect(() => {
    // try to load cached user data to avoid forcing user to press reload repeatedly
    const tryLoadCache = () => {
      if (!currentUser?.uid) return;
      try {
        const cacheKey = `cookfetch_userdata_${currentUser.uid}`;
        const raw = localStorage.getItem(cacheKey);
        if (!raw) {
          logInventoryDebug("cache-miss", { cacheKey });
          // On first login with no cache, load from API immediately
          ReloadSchedules();
          return;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.ts || !parsed.data) {
          ReloadSchedules();
          return;
        }
        const age = Date.now() - parsed.ts;
        if (age > CACHE_TTL_MS) {
          logInventoryDebug("cache-hit-stale", {
            ageMs: age,
            ttlMs: CACHE_TTL_MS,
          });
          // stale: still load it for immediate UX, then refresh in background
          console.log(
            "Loaded stale cache for user, will refresh in background",
          );
          const data: UserData = parsed.data;
          setUserData(data);
          setSchedules(data.schedules);
          const convertedFoods: FoodItem[] = data.schedules.map((schedule) => ({
            id: schedule.uid,
            name: schedule.name,
            category: schedule.category ?? t("scheduledItem"),
            expiryDate: schedule.expiry ?? schedule.date ?? "",
            daysUntilExpiry: calculateDaysUntilExpiry(schedule.expiry ?? schedule.date ?? undefined),
            quantity: schedule.quantity || t("notSet"),
            purchaseDate: schedule.date,
            time: schedule.time,
            notify: schedule.notify ?? false,
            imageUrl: schedule.image_url ?? undefined,
          }));
          const manuallyAddedFoods = foods.filter((food) => !food.purchaseDate);
          setFoods([...manuallyAddedFoods, ...convertedFoods]);
          // refresh in background (no UI blocking)
          ReloadSchedules();
        } else {
          logInventoryDebug("cache-hit-fresh", {
            ageMs: age,
            ttlMs: CACHE_TTL_MS,
          });
          // fresh cache — use it
          const data: UserData = parsed.data;
          setUserData(data);
          setSchedules(data.schedules);
          const convertedFoods: FoodItem[] = data.schedules.map((schedule) => ({
            id: schedule.uid,
            name: schedule.name,
            category: schedule.category ?? t("scheduledItem"),
            expiryDate: schedule.expiry ?? schedule.date ?? "",
            daysUntilExpiry: calculateDaysUntilExpiry(schedule.expiry ?? schedule.date ?? undefined),
            quantity: schedule.quantity || t("notSet"),
            purchaseDate: schedule.date,
            time: schedule.time,
            notify: schedule.notify ?? false,
            imageUrl: schedule.image_url ?? undefined,
          }));
          const manuallyAddedFoods = foods.filter((food) => !food.purchaseDate);
          setFoods([...manuallyAddedFoods, ...convertedFoods]);
        }
      } catch (e) {
        console.warn("Failed to load user data cache", e);
        // On cache parse error, load fresh from API
        ReloadSchedules();
      }
    };

    tryLoadCache();
  }, [currentUser?.uid]);

  // Cache-first notifications loader with TTL similar to user data
  const tryLoadNotifCache = (refreshIfStale = false) => {
    if (!currentUser?.uid) return;
    try {
      const cacheKey = `cookfetch_notifications_${currentUser.uid}`;
      const raw = localStorage.getItem(cacheKey);
      if (!raw) {
        // No cache: fetch now if requested
        if (refreshIfStale) LoadNotifications();
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts || !parsed.data) {
        if (refreshIfStale) LoadNotifications();
        return;
      }
      const age = Date.now() - parsed.ts;
      const data = parsed.data;

      const schedulesArr: any[] = Array.isArray(data?.schedules)
        ? data.schedules
        : [];
      const apiCount =
        typeof data?.count === "number" ? data.count : schedulesArr.length;

      // Update UI from cache immediately
      const converted: FoodItem[] = schedulesArr.map((schedule: any) => {
        const normalizedExpiry = schedule?.expiry ?? schedule?.date ?? undefined;
        return {
          id: schedule?.uid ?? schedule?.id ?? undefined,
          name: schedule?.name ?? "",
          category: schedule?.category ?? t("scheduledItem"),
          expiryDate: schedule?.expiry ?? "",
          daysUntilExpiry: calculateDaysUntilExpiry(normalizedExpiry),
          quantity: schedule?.quantity ?? t("notSet"),
          purchaseDate: schedule?.date ?? undefined,
          time: schedule?.time ?? undefined,
          notify: schedule?.notify ?? true,
          imageUrl: schedule?.image_url ?? undefined,
        };
      });
      const activeNotified = converted.filter((c) => c.notify !== false);
      setNotifiedFoods(activeNotified);
      setNotificationsCount(activeNotified.length);

      // Sync notify flags into inventory list from cache
      setFoods((prev) => {
        if (!converted.length) return prev;
        const notifyMap = new Map<string, boolean>();
        converted.forEach((c) => {
          if (c.id) notifyMap.set(c.id, c.notify ?? true);
        });
        return prev.map((f) =>
          f.id && notifyMap.has(f.id)
            ? { ...f, notify: notifyMap.get(f.id) ?? f.notify }
            : f,
        );
      });

      // If stale, refresh in background
      if (age > CACHE_TTL_MS && refreshIfStale) {
        LoadNotifications();
      }
    } catch (e) {
      console.warn("Failed to load notifications cache", e);
      if (refreshIfStale) LoadNotifications();
    }
  };

  useEffect(() => {
    if (tab === "notifications") {
      // Use cache-first strategy like user data: load cache and refresh in background if stale
      // Only refresh in background if we have a current user
      tryLoadNotifCache(!!currentUser?.uid);
    }
  }, [tab, currentUser?.uid]);

  const calculateDaysUntilExpiry = (expiryDate?: string | null): number => {
    if (!expiryDate || typeof expiryDate !== "string") {
      return Number.POSITIVE_INFINITY;
    }

    // Parse date as local date (YYYY-MM-DD format) to avoid timezone issues
    const parts = expiryDate.split("-").map(Number);
    let expiry: Date;
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      const [year, month, day] = parts;
      expiry = new Date(year, month - 1, day);
    } else {
      const parsed = Date.parse(expiryDate);
      if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
      expiry = new Date(parsed);
    }

    // Get today's date at midnight (local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        label: "Expired",
        icon: "🚫",
      };
    } else if (daysUntilExpiry <= 2) {
      return {
        color: "bg-red-100 text-red-700 border-red-200",
        label: "Expires Soon",
        icon: "⚠️",
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Expires This Week",
        icon: "⏰",
      };
    } else {
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Fresh",
        icon: "✅",
      };
    }
  };

  const calculateExpiryFromDays = (days: number): string => {
    const today = new Date();
    const expiryDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    // Use local date string to avoid timezone issues
    const year = expiryDate.getFullYear();
    const month = String(expiryDate.getMonth() + 1).padStart(2, "0");
    const day = String(expiryDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleEditFood = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingFood) return;

    let finalExpiryDate = editFood.expiryDate;

    if (
      !useCustomDate &&
      editFood.selectedExpiryFood &&
      expiry[editFood.selectedExpiryFood]
    ) {
      finalExpiryDate = calculateExpiryFromDays(
        expiry[editFood.selectedExpiryFood],
      );
    }

    const daysUntilExpiry = calculateDaysUntilExpiry(finalExpiryDate);

    const updatedFood: FoodItem = {
      ...editingFood,
      name: editFood.name,
      category: editFood.category,
      expiryDate: finalExpiryDate,
      daysUntilExpiry,
      quantity: editFood.quantity,
    };

    setFoods(
      foods.map((food) => (food.id === editingFood.id ? updatedFood : food)),
    );

    setEditingFood(null);
    setEditFood({
      name: "",
      category: "",
      expiryDate: "",
      quantity: "",
      selectedExpiryFood: "",
    });
    setUseCustomDate(false);
  };

  const startEdit = (food: FoodItem) => {
    setEditingFood(food);
    setEditFood({
      name: food.name,
      category: food.category,
      expiryDate: food.expiryDate,
      quantity: food.quantity,
      selectedExpiryFood: "",
    });
    setShowAddForm(false);
    setUseCustomDate(false);
  };

  const cancelEdit = () => {
    setEditingFood(null);
    setEditFood({
      name: "",
      category: "",
      expiryDate: "",
      quantity: "",
      selectedExpiryFood: "",
    });
    setUseCustomDate(false);
  };

  // Final version of the delete functions

  const deleteScheduleFromAPI = async (scheduleId: string) => {
    // Don't allow API calls in demo mode
    if (isDemo) {
      return { success: true }; // Simulate success in demo mode
    }

    try {
      await apiClient.deleteSchedule(currentUser.uid, scheduleId);

      return { success: true };
    } catch (error) {
      console.error("Error deleting schedule:", error);
      return { success: false, error: error.message };
    }
  };

  // Notify ON/OFF API helpers
  const notifyOnAPI = async (scheduleId: string) => {
    // Don't allow API calls in demo mode
    if (isDemo) {
      return { success: true }; // Simulate success in demo mode
    }

    try {
      await apiClient.notifyOn(currentUser?.uid || "", scheduleId);
      return { success: true };
    } catch (error: any) {
      console.error("Error enabling notifications:", error);
      return { success: false, error: error.message };
    }
  };

  const notifyOffAPI = async (scheduleId: string) => {
    // Don't allow API calls in demo mode
    if (isDemo) {
      return { success: true }; // Simulate success in demo mode
    }

    try {
      await apiClient.notifyOff(currentUser?.uid || "", scheduleId);
      return { success: true };
    } catch (error: any) {
      console.error("Error disabling notifications:", error);
      return { success: false, error: error.message };
    }
  };

  // Toggle delete mark (confirmation state)
  const toggleDeleteMark = (id: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isMarkedForDelete: !prev[id]?.isMarkedForDelete,
      },
    }));
  };

  // Toggle notification (placeholder for future API)
  const toggleNotification = (id: string) => {
    setPendingChanges((prev) => {
      // Get the initial value from the food item if not already in pendingChanges
      const food =
        foods.find((f) => f.id === id) ||
        notifiedFoods.find((f) => f.id === id);
      const currentDisplayValue =
        prev[id]?.notificationsEnabled !== undefined
          ? prev[id]?.notificationsEnabled
          : (food?.notify ?? false);
      const newValue = !currentDisplayValue;

      // Only track as a change if different from the original food.notify
      const originalValue = food?.notify ?? false;
      if (newValue === originalValue) {
        // Remove from pendingChanges if toggling back to original
        const { [id]: _, ...rest } = prev;
        return rest;
      } else {
        // Mark as changed
        return {
          ...prev,
          [id]: {
            ...prev[id],
            notificationsEnabled: newValue,
          },
        };
      }
    });
  };

  // Batch save changes (delete & notification toggles)
  const handleSaveChanges = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const changes = Object.entries(pendingChanges);

      // Process deletions first
      for (const [id, change] of changes) {
        if (change.isMarkedForDelete) {
          const foodToDelete = foods.find((food) => food.id === id);
          if (foodToDelete?.id) {
            const result = await deleteScheduleFromAPI(id);
            if (!result.success) {
              setError(
                t("failedToDeleteFoodItem", { name: foodToDelete.name }),
              );
              setIsLoading(false);
              return;
            }
          }

          // Remove from local state
          setFoods((prev) => prev.filter((food) => food.id !== id));

          // Also update global demo foods if in demo mode
          if (isDemo) {
            setDemoFoods(demoFoods.filter((food) => food.id !== id));
          }

          if (foodToDelete?.firestoreId) {
            setSchedules((prev) =>
              prev.filter(
                (schedule) => schedule.uid !== foodToDelete.firestoreId,
              ),
            );
          }
        }
      }

      // Process notification toggle changes (queue requests sequentially)
      for (const [id, change] of changes) {
        if (change.notificationsEnabled !== undefined) {
          const enable = change.notificationsEnabled === true;
          const res = enable ? await notifyOnAPI(id) : await notifyOffAPI(id);
          if (!res.success) {
            const itemName =
              foods.find((f) => f.id === id)?.name ||
              notifiedFoods.find((f) => f.id === id)?.name ||
              t("item");
            setError(t("failedToUpdateNotifications", { name: itemName }));
            setIsLoading(false);
            return;
          }

          // Optimistically update local state in both lists
          setFoods((prev) =>
            prev.map((f) => (f.id === id ? { ...f, notify: enable } : f)),
          );

          // Also update global demo foods if in demo mode
          if (isDemo) {
            setDemoFoods(
              demoFoods.map((f) =>
                f.id === id ? { ...f, notify: enable } : f,
              ),
            );
          }

          setNotifiedFoods((prev) => {
            if (enable) {
              // ensure present (add from foods if missing)
              const exists = prev.some((f) => f.id === id);
              if (exists)
                return prev.map((f) =>
                  f.id === id ? { ...f, notify: true } : f,
                );
              const fromFoods = foods.find((f) => f.id === id);
              if (fromFoods) {
                const item: FoodItem = {
                  id: fromFoods.id,
                  name: fromFoods.name,
                  category: fromFoods.category,
                  expiryDate: fromFoods.expiryDate,
                  daysUntilExpiry: fromFoods.daysUntilExpiry,
                  quantity: fromFoods.quantity,
                  purchaseDate: fromFoods.purchaseDate,
                  time: fromFoods.time,
                  notify: true,
                  imageUrl: fromFoods.imageUrl,
                };
                return [...prev, item].sort((a, b) =>
                  a.name.localeCompare(b.name),
                );
              }
              return prev;
            } else {
              // remove from notified list when turning off
              return prev.filter((f) => f.id !== id);
            }
          });
        }
      }

      // Clear pending changes after successful save
      setPendingChanges({});
    } catch (error) {
      setError(t("failedToSaveChangesTryAgain"));
      console.error("Error saving changes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFood = async (id: string) => {
    // Now just toggles the mark, doesn't delete immediately
    toggleDeleteMark(id);
  };

  const knownCategoryValues = FOOD_CATEGORIES.map((c) => c.value);
  const isOtherCategory = (cat: string) =>
    !knownCategoryValues.includes(cat) && cat !== "Scheduled Item";

  const filteredFoods = foods.filter((food) => {
    const term = searchTerm.trim().toLowerCase();
    const textMatch = term
      ? food.name.toLowerCase().includes(term) ||
      food.category.toLowerCase().includes(term)
      : true;

    const categoryMatch =
      filterCategory === "All"
        ? true
        : filterCategory === "Other"
          ? food.category === "Other" || isOtherCategory(food.category)
          : food.category === filterCategory;

    let expiryMatch = true;
    if (filterExpiryPreset !== "any") {
      if (filterExpiryPreset === "soon") {
        expiryMatch = food.daysUntilExpiry <= 2;
      } else {
        const maxDays = Number(filterExpiryPreset);
        expiryMatch = food.daysUntilExpiry <= maxDays;
      }
    }

    return textMatch && categoryMatch && expiryMatch;
  });

  const sortedFoods = [...filteredFoods].sort((a, b) => {
    if (sortKey === "name") {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? cmp : -cmp;
    }
    const ad = new Date(a.expiryDate).getTime();
    const bd = new Date(b.expiryDate).getTime();
    const cmp = ad - bd;
    return sortOrder === "asc" ? cmp : -cmp;
  });

  // Notifications view: name-only search and ascending sort by name
  const notifiedFiltered = [...notifiedFoods]
    .filter((f) => {
      const term = notifSearchTerm.trim().toLowerCase();
      if (!term) return true;
      return f.name.toLowerCase().includes(term);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const expiringCount = foods.filter(
    (food) => food.daysUntilExpiry <= 2 && food.daysUntilExpiry >= 0,
  ).length;
  const expiredCount = foods.filter((food) => food.daysUntilExpiry < 0).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Recipes: name-only search and ascending sort
  const getRecipeName = (r: any): string => {
    const name = String(r?.name ?? r?.dishName ?? r?.title ?? "").trim();
    return name || t("untitledRecipe");
  };
  const filteredRecipes = [...(userData?.savedrecipes ?? [])]
    .filter((r) => {
      const term = recipeSearchTerm.trim().toLowerCase();
      if (!term) return true;
      return getRecipeName(r).toLowerCase().includes(term);
    })
    .sort((a, b) => getRecipeName(a).localeCompare(getRecipeName(b)));

  useEffect(() => {
    const term = recipeSearchTerm.trim();

    if (tab !== "recipes" || !term) {
      setRecipeSearchStatus("idle");
      setRecipeSearchError(null);
      setSearchedRecipe(null);
      setSearchedRecipeMatchInfo(null);
      recipeSearchAbortRef.current?.abort();
      recipeSearchAbortRef.current = null;
      return;
    }

    const controller = new AbortController();
    recipeSearchAbortRef.current?.abort();
    recipeSearchAbortRef.current = controller;

    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          resolve();
        }, ms);

        controller.signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timeoutId);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });

    const fetchRecipe = async () => {
      setRecipeSearchError(null);
      setSearchedRecipe(null);
      setSearchedRecipeMatchInfo(null);

      try {
        // Debounce user input before calling API.
        await wait(400);

        const maxRetries = 5;
        let retries = 0;

        while (true) {
          const payload: RecipeSearchResponse = await apiClient.searchRecipes(
            term,
            controller.signal,
          );

          if (payload.status === "found") {
            setRecipeSearchStatus("found");
            setSearchedRecipe(payload.data);
            setSearchedRecipeMatchInfo(payload.match_info);
            return;
          }

          if (payload.status === "failed") {
            setRecipeSearchStatus("failed");
            setRecipeSearchError(t("recipeSearchFailed"));
            return;
          }

          setRecipeSearchStatus("generating");

          if (retries >= maxRetries) {
            setRecipeSearchStatus("failed");
            setRecipeSearchError(t("recipeStillGeneratingRetry"));
            return;
          }

          const retryAfterSec =
            typeof payload.retry_after === "number" && payload.retry_after > 0
              ? payload.retry_after
              : 2;

          retries += 1;
          await wait(retryAfterSec * 1000);
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }

        setRecipeSearchStatus("failed");
        setRecipeSearchError(t("unableToSearchRecipesRightNow"));
      }
    };

    fetchRecipe();

    return () => {
      controller.abort();
      if (recipeSearchAbortRef.current === controller) {
        recipeSearchAbortRef.current = null;
      }
    };
  }, [tab, recipeSearchTerm, recipeSearchRetryKey]);

  const handleDeleteRecipe = async (recipe: any) => {
    if (!currentUser?.uid) {
      setError(t("youMustBeLoggedInToDeleteRecipes"));
      return;
    }

    const recipeId = recipe?.id || recipe?.uid;
    if (!recipeId) {
      setError(t("missingRecipeIdCannotDelete"));
      return;
    }

    const name = getRecipeName(recipe);
    const confirmed = window.confirm(t("deleteRecipeConfirm", { name }));
    if (!confirmed) return;

    setDeletingRecipeId(recipeId);
    try {
      await apiClient.deleteRecipe(currentUser.uid, recipeId);

      // Update local state and cache
      setUserData((prev) => {
        if (!prev) return prev;
        const updatedRecipes = (prev.savedrecipes || []).filter(
          (r) => (r?.id || r?.uid) !== recipeId,
        );
        const updatedData = { ...prev, savedrecipes: updatedRecipes };
        try {
          const cacheKey = `cookfetch_userdata_${currentUser.uid}`;
          const raw = localStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            const payload = {
              ts: Date.now(),
              data: { ...(parsed?.data || {}), ...updatedData },
            };
            localStorage.setItem(cacheKey, JSON.stringify(payload));
          }
        } catch (e) {
          console.warn("Failed to update recipe cache after delete", e);
        }
        return updatedData;
      });
    } catch (e: any) {
      setError(e?.message || t("failedToDeleteRecipe"));
    } finally {
      setDeletingRecipeId(null);
    }
  };

  // Helper: Update local cache with new schedule
  const updateCacheWithNewSchedule = (newSchedule: Schedule) => {
    if (!currentUser?.uid) return;

    try {
      const cacheKey = `cookfetch_userdata_${currentUser.uid}`;
      const raw = localStorage.getItem(cacheKey);
      if (!raw) {
        console.warn("Cache not found when trying to update");
        return;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data) return;

      // Add new schedule to the cache
      const updatedData: UserData = {
        ...parsed.data,
        schedules: [...(parsed.data.schedules || []), newSchedule],
      };

      // Update localStorage cache
      const payload = {
        ts: Date.now(),
        data: updatedData,
      };
      localStorage.setItem(cacheKey, JSON.stringify(payload));

      // Update state immediately for UI feedback
      setSchedules(updatedData.schedules);
      setUserData(updatedData);

      // Convert and update foods list
      const convertedFoods: FoodItem[] = updatedData.schedules.map(
        (schedule) => ({
          id: schedule.uid,
          name: schedule.name,
          category: schedule.category ?? t("scheduledItem"),
          expiryDate: schedule.expiry ?? schedule.date ?? "",
          daysUntilExpiry: calculateDaysUntilExpiry(schedule.expiry ?? schedule.date ?? undefined),
          quantity: schedule.quantity || t("notSet"),
          purchaseDate: schedule.date,
          time: schedule.time,
          notify: schedule.notify ?? false,
          imageUrl: schedule.image_url ?? undefined,
        }),
      );

      const manuallyAddedFoods = foods.filter((food) => !food.purchaseDate);
      setFoods([...manuallyAddedFoods, ...convertedFoods]);

      console.log("Cache updated with new schedule");
    } catch (e) {
      console.error("Failed to update cache with new schedule:", e);
    }
  };

  // Helper: Check for ghosted items (items in cache but not on backend)
  const checkForGhostedItems = async () => {
    if (!currentUser?.uid || !schedules.length) return false;

    try {
      const liveData = await apiClient.getUser(currentUser.uid);
      const liveScheduleIds = new Set(
        liveData.schedules?.map((s) => s.uid) || [],
      );
      const cachedScheduleIds = new Set(schedules.map((s) => s.uid));

      // Find ghosted items
      const ghostedItems = Array.from(cachedScheduleIds).filter(
        (id) => !liveScheduleIds.has(id),
      );

      return ghostedItems.length > 0;
    } catch (e) {
      console.error("Error checking for ghosted items:", e);
      return false;
    }
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !isDemo) return;

    // Rate limit check
    if (addFoodCooldown) {
      setError(t("pleaseWaitBeforeAddingFood"));
      return;
    }

    setAddFoodCooldown(true);
    setTimeout(() => setAddFoodCooldown(false), 2000);

    // Helper function to get local date string (YYYY-MM-DD) without timezone conversion
    const getLocalDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Get current time and prepare formatted strings.
    const now = new Date();
    const formattedDate = getLocalDateString(now); // "YYYY-MM-DD"

    // To format time as "DD-MM-YYYY", build it correctly.
    const dateYear = String(now.getFullYear());
    const dateMonth = String(now.getMonth() + 1).padStart(2, "0");
    const dateDay = String(now.getDate()).padStart(2, "0");
    const formattedTime = `${dateDay}-${dateMonth}-${dateYear}`;

    // Calculate the expiry date based on mode.
    let expiryDateStr = "";

    if (newFood.expiryMode === "predefined") {
      // Using predefined expiry: Look up the number of days for selected category.
      const daysToAdd = expiry[newFood.category];
      if (!daysToAdd) {
        setError(t("selectFoodCategoryForPredefinedExpiry"));
        setAddFoodCooldown(false);
        return;
      }
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + daysToAdd);
      expiryDateStr = getLocalDateString(expiryDate); // "YYYY-MM-DD"
    } else if (newFood.expiryMode === "customDate") {
      // Using a custom date from the calendar input
      if (!newFood.expiryDate) {
        setError(t("selectCustomExpiryDate"));
        setAddFoodCooldown(false);
        return;
      }
      expiryDateStr = newFood.expiryDate;
    } else if (newFood.expiryMode === "customTime") {
      // Using custom time/days
      const daysToAdd = newFood.customDaysValue || 1;
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + daysToAdd);
      expiryDateStr = getLocalDateString(expiryDate); // "YYYY-MM-DD"
    }

    // Prepare the food item
    const newFoodItem: FoodItem = {
      id: isDemo ? `demo-${Date.now()}` : `temp_${Date.now()}`,
      name: newFood.name,
      category:
        newFood.category === "Other" && newFood.customCategory
          ? newFood.customCategory
          : newFood.category,
      expiryDate: expiryDateStr,
      daysUntilExpiry: Math.ceil(
        (new Date(expiryDateStr).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
      ),
      quantity: newFood.quantity || t("notSet"),
      purchaseDate: formattedDate,
      time: formattedTime,
      notify: newFood.notify,
    };

    try {
      // Demo mode: just add to local state
      if (isDemo) {
        const updatedDemoFoods = [...demoFoods, newFoodItem];
        setDemoFoods(updatedDemoFoods);
        setFoods(updatedDemoFoods);

        // Clear the form
        setNewFood({
          name: "",
          category: "",
          customCategory: "",
          location: "",
          expiryDate: "",
          quantity: "",
          selectedExpiryFood: "",
          notify: false,
          expiryMode: "predefined",
          customDays: "",
          customDaysValue: 1,
        });
        setShowAddForm(false);
        setError(null);
        return;
      }

      // Real mode: make API call
      const payload: any = {
        member_uid: currentUser.uid,
        name: newFood.name,
        date: formattedDate,
        time: formattedTime,
        expiry: expiryDateStr,
        quantity: newFood.quantity || t("notSet"),
        notify: newFood.notify,
        category:
          newFood.category === "Other" && newFood.customCategory
            ? newFood.customCategory
            : newFood.category,
        location: newFood.location?.trim() || undefined,
      };

      console.log("🍎 DEBUG - Sending payload to API:", {
        expiryMode: newFood.expiryMode,
        calculatedExpiryDateStr: expiryDateStr,
        payloadExpiry: payload.expiry,
        payload: payload,
        mode: inventoryMode,
      });

      let data;
      if (inventoryMode === "household" && household) {
        data = await apiClient.addHouseholdSchedule(household.household_id, payload);
      } else {
        data = await apiClient.addSchedule(currentUser.uid, {
          name: newFood.name,
          time: formattedTime,
          date: formattedDate,
          expiry: expiryDateStr,
          notify: newFood.notify,
          category: payload.category,
          quantity: payload.quantity,
          location: payload.location,
        });
      }
      console.log("🍎 Food added successfully:", data);

      // Create new schedule object to add to cache using the API response data
      const newSchedule: Schedule = {
        uid: data.schedule_id || data.schedule?.uid || `temp_${Date.now()}`,
        name: data.title || data.schedule?.name || newFood.name,
        date: data.date || data.schedule?.date || formattedDate,
        time: data.time || data.schedule?.time || formattedTime,
        expiry: data.expiry || data.schedule?.expiry || expiryDateStr,
        quantity: data.quantity || data.schedule?.quantity || newFood.quantity || t("notSet"),
        notify: data.notify ?? data.schedule?.notify ?? newFood.notify,
        category: data.category || data.schedule?.category || newFood.category,
        location: data.location || data.schedule?.location || newFood.location?.trim() || undefined,
        image_url: data.image_url || data.schedule?.image_url,
      };

      // Update local cache immediately for instant UI feedback
      updateCacheWithNewSchedule(newSchedule);

      // Clear the form
      setNewFood({
        name: "",
        category: "",
        customCategory: "",
        location: "",
        expiryDate: "",
        quantity: "",
        selectedExpiryFood: "",
        notify: false,
        expiryMode: "predefined",
        customDays: "",
        customDaysValue: 1,
      });
      setShowAddForm(false);
      setError(null);

      // Verify in background - check for ghosted items
      setTimeout(async () => {
        const hasGhosted = await checkForGhostedItems();
        if (hasGhosted) {
          setError(t("ghostedItemsWarning"));
        }
      }, 500);
    } catch (error) {
      console.error("Error adding food:", error);

      // Recommend refresh if network error
      if (error instanceof TypeError) {
        setError(t("networkErrorWhileAddingFood"));
      } else {
        setError(error instanceof Error ? error.message : t("failedToAddFood"));
      }
    } finally {
      setAddFoodCooldown(false);
    }
  };

  // Convert various recipe shapes (user saved recipes) into the Dish shape expected by Recipe page
  // Using shared normalizeDish utility for consistent image handling
  const convertToDish = normalizeDish;

  // ON PREVIEW CLICK
  const handleRecipePreview = (rawDish: any) => {
    const normalized = normalizeDish(rawDish);
    if (!normalized) {
      console.warn("Unable to normalize recipe for preview", rawDish);
      return;
    }
    // navigate to recipe page with normalized shape
    router.push("/recipe");
  };

  // Demo mode for non-logged in users
  const isDemo = !currentUser;

  // Load demo data when in demo mode - use global demo foods
  React.useEffect(() => {
    if (isDemo) {
      setFoods(demoFoods);
    } else {
      // When user logs in, clear demo foods to make way for real data
      // Cache loading or ReloadSchedules will populate actual user data
      setFoods([]);
    }
  }, [isDemo, demoFoods]);

  return (
    <div className="min-h-screen bg-white">
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 text-center font-semibold">
          📋 Demo Mode - Preview what you can do when logged in.{" "}
          <Button
            variant="ghost"
            className="text-white underline ml-2"
            onClick={() => router.push("/login")}
          >
            {t("loginNow")}
          </Button>
        </div>
      )}
      <div className="min-h-screen bg-white">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                {/* <JsonDropdown expiry={expiry} /> */}
                {household ? (
                  <Select
                    value={inventoryMode}
                    onValueChange={(v: "personal" | "household") => setInventoryMode(v)}
                  >
                    <SelectTrigger className="group flex items-center gap-3 px-3 sm:px-4 py-4 sm:py-4 rounded-xl w-full max-w-[280px] sm:max-w-xs bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer [&>svg]:hidden">
                      <div className="flex flex-col text-left min-w-0">
                        <span className="text-xs text-gray-500 leading-none mb-0.5">
                          {inventoryMode === "personal" ? "Personal" : "Shared"}
                        </span>
                        <span className="text-lg sm:text-xl font-bold text-gray-900 leading-tight truncate">
                          {inventoryMode === "personal" ? t("myInventory") : household.name}
                        </span>
                      </div>
                      <svg
                        className="ml-auto w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                      </svg>
                    </SelectTrigger>

                    <SelectContent className="rounded-xl border border-gray-200 shadow-lg p-1.5 animate-in fade-in zoom-in-95 min-w-[220px]">
                      <SelectItem
                        value="personal"
                        className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-100 data-[state=checked]:bg-blue-50"
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-medium text-gray-900 text-sm">{t("myInventory")}</span>
                          <span className="text-xs text-gray-500">Your private items</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="household"
                        className="rounded-lg px-3 py-2.5 cursor-pointer focus:bg-gray-100 data-[state=checked]:bg-blue-50"
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-medium text-gray-900 text-sm">{household.name}</span>
                          <span className="text-xs text-gray-500">Shared household inventory</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {t("myFoodInventory")}
                  </h1>
                )}
                <button
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 px-3 py-1 border border-red-300 rounded-full transition"
                  onClick={ReloadSchedules}
                  disabled={isLoading || reloadCooldown}
                >
                  <RefreshCcw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  {isLoading
                    ? t("refreshing")
                    : reloadCooldown
                      ? t("wait")
                      : t("refresh")}
                </button>
              </div>
              <p className="text-gray-600">{t("trackGroceries")}</p>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 items-center">
                <Card className="border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <span className="text-lg">📦</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {foods.length}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("totalItems")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          {expiringCount}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("expiringSoon")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                        <span className="text-lg">🚫</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          {expiredCount}
                        </p>
                        <p className="text-sm text-gray-600">{t("expired")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* View dropdown (Inventory, Recipes, Notifications) */}
                <div className="flex items-center justify-end">
                  <div className="bg-white p-2 rounded-full shadow-sm inline-flex w-56">
                    <Select value={tab} onValueChange={(v) => setTab(v as any)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("selectViewPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingredients">
                          {t("myFoods")}
                        </SelectItem>
                        <SelectItem value="recipes">{t("recipes")}</SelectItem>
                        <SelectItem value="classify">
                          {t("classifyImageTab")}
                        </SelectItem>
                        <SelectItem value="notifications">
                          {t("notifications")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* end dropdown */}
              </div>
            </div>

            {/* Controls: Filter + search shown only for Ingredients */}
            {tab === "ingredients" && (
              <div className="flex flex-col sm:flex-row gap-4 mb-3 animate-slide-up">
                <div className="flex flex-1 items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsFilterOpen(true)}
                    className="border-red-300 text-red-700 hover:bg-red-50 rounded-xl px-4"
                  >
                    {t("filters")}
                  </Button>
                  {/* Search Input for Ingredients (name & category) */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t("searchFoods")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Bulk Actions */}
                  {(() => {
                    const allMarkedForDelete = sortedFoods.every(
                      (food) =>
                        food.id && pendingChanges[food.id]?.isMarkedForDelete,
                    );
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPending = { ...pendingChanges };
                          sortedFoods.forEach((food) => {
                            if (food.id) {
                              newPending[food.id] = {
                                ...(newPending[food.id] || {}),
                                isMarkedForDelete: !allMarkedForDelete,
                              };
                            }
                          });
                          setPendingChanges(newPending);
                        }}
                        className={`rounded-xl ${allMarkedForDelete
                          ? "border-green-300 text-green-700 hover:bg-green-50"
                          : "border-red-300 text-red-700 hover:bg-red-50"
                          }`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {allMarkedForDelete ? t("undeleteAll") : t("deleteAll")}
                      </Button>
                    );
                  })()}
                  {(() => {
                    const allNotifyEnabled = sortedFoods.every((food) => {
                      if (!food.id) return false;
                      const notifyState =
                        pendingChanges[food.id]?.notificationsEnabled !==
                          undefined
                          ? pendingChanges[food.id]?.notificationsEnabled
                          : (food.notify ?? false);
                      return notifyState;
                    });
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPending = { ...pendingChanges };
                          sortedFoods.forEach((food) => {
                            if (food.id) {
                              newPending[food.id] = {
                                ...(newPending[food.id] || {}),
                                notificationsEnabled: !allNotifyEnabled,
                              };
                            }
                          });
                          setPendingChanges(newPending);
                        }}
                        className={`rounded-xl ${allNotifyEnabled
                          ? "border-gray-300 text-gray-700 hover:bg-gray-100"
                          : "border-green-300 text-green-700 hover:bg-green-50"
                          }`}
                      >
                        <Bell className="w-4 h-4 mr-1" />
                        {allNotifyEnabled ? t("denotifyAll") : t("notifyAll")}
                      </Button>
                    );
                  })()}
                </div>
                <Button
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setEditingFood(null);
                  }}
                  className="bg-red-500 hover:bg-red-700 text-white rounded-xl px-6 py-3 font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addFood")}
                </Button>
              </div>
            )}

            {/* Filter Dialog */}
            <Dialog
              open={isFilterOpen}
              onOpenChange={(open) => {
                setIsFilterOpen(open);
                if (open) {
                  setDraftFilterCategory(filterCategory);
                  setDraftExpiryPreset(filterExpiryPreset);
                  setDraftSortKey(sortKey);
                  setDraftSortOrder(sortOrder);
                }
              }}
            >
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t("filtersAndSorting")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  {/* Category */}
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label className="text-right">{t("category")}</Label>
                    <div className="col-span-3">
                      <Select
                        value={draftFilterCategory}
                        onValueChange={(v) => setDraftFilterCategory(v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("all")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">
                            {t("allCategories")}
                          </SelectItem>
                          {FOOD_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Expiry preset */}
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label className="text-right">{t("expiresIn")}</Label>
                    <div className="col-span-3">
                      <Select
                        value={draftExpiryPreset}
                        onValueChange={(v) => setDraftExpiryPreset(v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("any")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">{t("any")}</SelectItem>
                          <SelectItem value="soon">
                            {t("soonTwoDays")}
                          </SelectItem>
                          <SelectItem value="1">1 {t("day")}</SelectItem>
                          <SelectItem value="3">3 {t("days")}</SelectItem>
                          <SelectItem value="7">7 {t("days")}</SelectItem>
                          <SelectItem value="14">14 {t("days")}</SelectItem>
                          <SelectItem value="30">30 {t("days")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Sorting */}
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label className="text-right">{t("sortBy")}</Label>
                    <div className="col-span-3 flex gap-3">
                      <div className="w-40">
                        <Select
                          value={draftSortKey}
                          onValueChange={(v) => setDraftSortKey(v as any)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expiry">
                              {t("expiryDate")}
                            </SelectItem>
                            <SelectItem value="name">
                              {t("foodName")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-40">
                        <Select
                          value={draftSortOrder}
                          onValueChange={(v) => setDraftSortOrder(v as any)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">
                              {t("ascending")}
                            </SelectItem>
                            <SelectItem value="desc">
                              {t("descending")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDraftFilterCategory("All");
                      setDraftExpiryPreset("any");
                      setDraftSortKey("expiry");
                      setDraftSortOrder("asc");
                    }}
                  >
                    {t("reset")}
                  </Button>
                  <Button
                    onClick={() => {
                      setFilterCategory(draftFilterCategory);
                      setFilterExpiryPreset(draftExpiryPreset);
                      setSortKey(draftSortKey);
                      setSortOrder(draftSortOrder);
                      setIsFilterOpen(false);
                    }}
                  >
                    {t("apply")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Pending changes summary & actions */}
            {(() => {
              const entries = Object.entries(pendingChanges);
              const deleteCount = entries.filter(
                ([, c]) => c.isMarkedForDelete,
              ).length;
              const notifyCount = entries.filter(
                ([, c]) => c.notificationsEnabled === true,
              ).length;
              const denotifyCount = entries.filter(
                ([, c]) => c.notificationsEnabled === false,
              ).length;
              const hasPending =
                deleteCount > 0 || notifyCount > 0 || denotifyCount > 0;
              if (!hasPending) return null;
              return (
                <div className="w-full mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3">
                    {/* Left: counts */}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {deleteCount > 0 && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-red-100 text-red-700 px-3 py-1">
                          <Trash2 className="w-4 h-4" />
                          {t("deleteCount", { count: deleteCount })}
                        </span>
                      )}
                      {notifyCount > 0 && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 text-green-700 px-3 py-1">
                          {/* bell icon drawn by CSS later in cards; counts here */}
                          {t("notifyCount", { count: notifyCount })}
                        </span>
                      )}
                      {denotifyCount > 0 && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-200 text-gray-800 px-3 py-1">
                          {t("denotifyCount", { count: denotifyCount })}
                        </span>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSaveChanges}
                        disabled={isLoading}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-2 font-semibold disabled:opacity-50"
                      >
                        {isLoading ? t("saving") : t("saveChanges")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPendingChanges({})}
                        disabled={isLoading}
                        className="border-gray-300 text-gray-800 hover:bg-gray-50 rounded-xl px-4 py-2"
                      >
                        {t("undoChanges")}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Panels: Ingredients vs Recipes vs Classify */}
            {tab === "ingredients" ? (
              isLoading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white py-20 animate-fade-in">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                  </div>
                  <p className="mt-6 text-gray-600 font-medium">
                    {t("loadingInventory")}
                  </p>
                </div>
              ) : (
                <IngredientsPanel
                  filteredFoods={sortedFoods}
                  showAddForm={showAddForm}
                  setShowAddForm={setShowAddForm}
                  newFood={newFood}
                  setNewFood={setNewFood}
                  editFood={editFood}
                  setEditFood={setEditFood}
                  editingFood={editingFood}
                  useCustomDate={useCustomDate}
                  setUseCustomDate={setUseCustomDate}
                  foodCategories={FOOD_CATEGORIES}
                  expiry={expiry}
                  handleAddFood={handleAddFood}
                  handleEditFood={handleEditFood}
                  startEdit={startEdit}
                  cancelEdit={cancelEdit}
                  handleDeleteFood={handleDeleteFood}
                  formatDate={formatDate}
                  getExpiryStatus={getExpiryStatus}
                  pendingChanges={pendingChanges}
                  toggleDeleteMark={toggleDeleteMark}
                  toggleNotification={toggleNotification}
                  addFoodCooldown={addFoodCooldown}
                />
              )
            ) : tab === "recipes" ? (
              isLoading ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white py-20 animate-fade-in">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">📖</span>
                    </div>
                  </div>
                  <p className="mt-6 text-gray-600 font-medium">
                    {t("loadingRecipes")}
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  {/* Recipes search (name-only) */}
                  <div className="flex items-center gap-3 mb-3 justify-between">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={t("searchRecipeByNamePlaceholder")}
                        value={recipeSearchTerm}
                        onChange={(e) => setRecipeSearchTerm(e.target.value)}
                        className="pl-10 rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                      />
                    </div>
                    <div className="flex items-center shrink-0">
                      <Badge className="bg-red-100 text-red-700">
                        {t("showingCountOfCount", {
                          shown: filteredRecipes.length,
                          total: userData?.savedrecipes?.length ?? 0,
                        })}
                      </Badge>
                    </div>
                  </div>

                  {recipeSearchStatus === "generating" && (
                    <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      {t("searchingDatabaseGenerating")}
                    </div>
                  )}

                  {recipeSearchStatus === "failed" && recipeSearchError && (
                    <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-sm text-red-700">
                        {recipeSearchError}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => setRecipeSearchRetryKey((v) => v + 1)}
                      >
                        {t("retrySearch")}
                      </Button>
                    </div>
                  )}

                  {recipeSearchStatus === "found" && searchedRecipe && (
                    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-red-700 font-semibold">
                            {t("searchResult")}
                          </p>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {searchedRecipe.name}
                          </h3>
                          {searchedRecipeMatchInfo &&
                            searchedRecipeMatchInfo.confidence !== "exact" && (
                              <p className="mt-1 text-sm text-red-700">
                                {t("similarMatchFromScore", {
                                  matchedFrom:
                                    searchedRecipeMatchInfo.matched_from,
                                  score:
                                    searchedRecipeMatchInfo.score.toFixed(2),
                                })}
                              </p>
                            )}
                        </div>
                        <Badge className="bg-white text-red-700 border border-red-200">
                          {t("apiLabel")}
                        </Badge>
                      </div>

                      {searchedRecipe.ingredients &&
                        Object.keys(searchedRecipe.ingredients).length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-800 mb-2">
                              {t("ingredients")}
                            </p>
                            <ul className="space-y-1">
                              {Object.entries(searchedRecipe.ingredients).map(
                                ([ingredient, amount]) => (
                                  <li
                                    key={ingredient}
                                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                                  >
                                    <span className="text-gray-700 capitalize">
                                      {ingredient}
                                    </span>
                                    <span className="text-red-700 font-medium">
                                      {amount}
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {searchedRecipe.nutrition &&
                        Object.keys(searchedRecipe.nutrition).length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-800 mb-2">
                              {t("nutrition")}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(searchedRecipe.nutrition).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="rounded-lg bg-white px-3 py-2 text-sm"
                                  >
                                    <p className="text-gray-500 capitalize">
                                      {key}
                                    </p>
                                    <p className="font-semibold text-gray-800">
                                      {value}
                                    </p>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  <RecipeStack
                    recipes={filteredRecipes
                      .map(normalizeDish)
                      .filter(
                        (dish): dish is NonNullable<typeof dish> =>
                          dish !== null && dish !== undefined,
                      )}
                    onPreview={handleRecipePreview}
                    onDelete={handleDeleteRecipe}
                    deletingId={deletingRecipeId}
                    gap="gap-4"
                    columns={{ sm: 1, md: 1, lg: 1 }}
                  />
                </div>
              )
            ) : tab === "classify" ? (
              <div className="mt-4">
                <ImageClassifier />
              </div>
            ) : isLoadingNotifications ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white py-20 animate-fade-in">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🔔</span>
                  </div>
                </div>
                <p className="mt-6 text-gray-600 font-medium">
                  {t("loadingNotifications")}
                </p>
              </div>
            ) : (
              <div className="mt-4">
                {notifyError && (
                  <div className="mb-4 text-red-600">{notifyError}</div>
                )}
                {/* Notifications search and count */}
                <div className="flex items-center gap-3 mb-3 justify-between">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t("searchNotificationsPlaceholder")}
                      value={notifSearchTerm}
                      onChange={(e) => setNotifSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>
                  <div className="flex items-center shrink-0">
                    <Badge className="bg-red-100 text-red-700">
                      {t("showingCountOfCount", {
                        shown: notifiedFiltered.length,
                        total: notificationsCount ?? notifiedFiltered.length,
                      })}
                    </Badge>
                  </div>
                </div>
                {notifiedFiltered.length === 0 ? (
                  <p className="text-gray-600">{t("noNotifiedSchedules")}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notifiedFiltered.map((food) => (
                      <Card
                        key={`${food.id}-${food.expiryDate}`}
                        className="border-red-200"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-gray-800">{food.name}</span>
                            {(() => {
                              const p = pendingChanges[food.id ?? ""] || {};
                              const notifyState =
                                p.notificationsEnabled !== undefined
                                  ? p.notificationsEnabled
                                  : (food.notify ?? true);
                              return (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-700">
                                    {t("notifyAll")}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`p-2 transition-colors ${notifyState
                                      ? "hover:bg-blue-50 text-blue-600"
                                      : "hover:bg-gray-100 text-gray-400"
                                      }`}
                                    onClick={() =>
                                      food.id && toggleNotification(food.id)
                                    }
                                    title={
                                      notifyState
                                        ? t("notificationsEnabled")
                                        : t("notificationsDisabled")
                                    }
                                  >
                                    {notifyState ? (
                                      <Bell className="h-4 w-4" />
                                    ) : (
                                      <BellOff className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              );
                            })()}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">
                              {t("category")}:
                            </span>
                            <span className="text-gray-600">
                              {food.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              {t("expires")} {formatDate(food.expiryDate)}
                            </span>
                            <span className="ml-auto text-gray-500">
                              {t("dueInDays", { days: food.daysUntilExpiry })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Foods;
