"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  MessageCircle,
  AlertCircle,
  RefreshCcw,
  Calendar,
  Clock,
  X,
  Plus,
  Filter,
} from "lucide-react";
import { useMealHistory } from "@/hooks/useMealHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import MealInput from "./MealInput";
import MealHistory from "./MealHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Dish } from "@/_pages_backup/actions";
import RecipePreviewModal from "@/components/RecipePreviewModal";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import AssistantRecipeStack from "@/components/AssistantRecipeStack";
import FoodsPanel from "@/components/FoodsPanel";
import ChatBox from "@/components/ChatBox";
import RecipeStack from "@/components/RecipeStack";
import { apiClient, Person } from "@/lib/apiClient";
import { normalizeDishes } from "@/lib/recipeUtils";

interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  time: string | null;
}

interface Schedule {
  date: string;
  is_soon: boolean;
  name: string;
  time: string;
  // Normalize various datez formats into unix seconds for consistent comparisons
  expiry: string;
  category: string;
}

interface UserData {
  email: string;
  savedrecipes: Recipe[];
  schedules: Schedule[];
  username: string;
  people?: Person[];  // add this
}
interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  hasMealSuggestions?: boolean;
}

const availableIngredients = [
  "milk",
  "protein",
  "vegetables",
  "fruits",
  "cheese",
  "bread",
  "eggs",
  "chicken",
  "rice",
  "pasta",
  "tomato",
  "onion",
  "garlic",
  "olive oil",
  "butter",
  "flour",
  "sugar",
  "salt",
  "pepper",
  "fish",
  "beef",
  "lettuce",
];

const ScheduleCard = ({ schedule }: { schedule: Schedule }) => {
  const { t } = useLanguage();
  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  // safe time display (avoid calling replace on undefined)
  const timeDisplay = schedule?.time
    ? String(schedule.time).replace(/-/g, ":")
    : "—";

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 ${
        schedule.is_soon
          ? "border-l-red-400 border-gray-200"
          : "border-l-red-400 border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-600 font-medium">{timeDisplay}</span>
        {schedule.is_soon && (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
            {t("soonLabel")}
          </span>
        )}
      </div>

      <div className="text-center">
        <h3 className="font-semibold text-xl text-gray-800 capitalize mb-2">
          {schedule.name}
        </h3>
        <div className="text-lg text-gray-600 font-medium">
          {schedule.category}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{schedule.time.replace("-", ":")}</span>
        </div>
      </div>
    </div>
  );
};

const ScheduleGrid = ({ schedules }: { schedules: Schedule[] }) => {
  const { t } = useLanguage();
  const { concatenatedString, setConcatenatedString, recipes, setRecipes } =
    useGlobalContext();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showExpired, setShowExpired] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectionCount, setSelectionCount] = useState<number>(3);

  const getCategoryLabel = (category: string): string => {
    const categoryKeyMap: Record<string, string> = {
      all: "allCategories",
      dairy: "foodCategoryDairy",
      meat: "foodCategoryMeat",
      seafood: "foodCategorySeafood",
      vegetables: "foodCategoryVegetables",
      fruits: "foodCategoryFruits",
      grains: "foodCategoryGrains",
      canned: "foodCategoryCanned",
      other: "foodCategoryOther",
    };

    const normalized = category.toLowerCase();
    const translationKey = categoryKeyMap[normalized];

    if (translationKey) {
      return t(translationKey);
    }

    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Extract categories from ingredient names (simple categorization)
  const getCategory = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes("milk") ||
      lowerName.includes("cheese") ||
      lowerName.includes("yogurt") ||
      lowerName.includes("butter")
    )
      return "dairy";
    if (
      lowerName.includes("chicken") ||
      lowerName.includes("beef") ||
      lowerName.includes("pork") ||
      lowerName.includes("meat") ||
      lowerName.includes("bacon")
    )
      return "meat";
    if (
      lowerName.includes("fish") ||
      lowerName.includes("shrimp") ||
      lowerName.includes("salmon") ||
      lowerName.includes("tuna")
    )
      return "seafood";
    if (
      lowerName.includes("lettuce") ||
      lowerName.includes("carrot") ||
      lowerName.includes("potato") ||
      lowerName.includes("onion") ||
      lowerName.includes("tomato") ||
      lowerName.includes("vegetable")
    )
      return "vegetables";
    if (
      lowerName.includes("apple") ||
      lowerName.includes("banana") ||
      lowerName.includes("fruit") ||
      lowerName.includes("watermelon")
    )
      return "fruits";
    if (
      lowerName.includes("rice") ||
      lowerName.includes("pasta") ||
      lowerName.includes("bread") ||
      lowerName.includes("flour") ||
      lowerName.includes("oat")
    )
      return "grains";
    if (
      lowerName.includes("can") ||
      lowerName.includes("soup") ||
      lowerName.includes("bean")
    )
      return "canned";
    return "other";
  };
  const toUnixSeconds = (dateValue?: string): number | null => {
    if (!dateValue) return null;

    // Numeric epoch support (seconds or ms)
    const numeric = Number(dateValue);
    if (!Number.isNaN(numeric)) {
      return numeric > 1_000_000_000_000 ? Math.floor(numeric / 1000) : numeric;
    }

    // Handle common DD-MM-YYYY or DD/MM/YYYY shapes
    const dmyMatch = dateValue.match(/^([0-3]?\d)[-/]([0-1]?\d)[-/](\d{4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      const parsed = new Date(
        Number(y),
        Number(m) - 1,
        Number(d),
        23,
        59,
        59,
        999,
      );
      if (!Number.isNaN(parsed.getTime()))
        return Math.floor(parsed.getTime() / 1000);
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return null;

    // date-only → expire at END of that day (local time)
    parsed.setHours(23, 59, 59, 999);

    return Math.floor(parsed.getTime() / 1000);
  };
  const availableIngredients = [
    ...new Map(
      schedules
        .filter((schedule) => {
          const expiryTimestamp = toUnixSeconds(
            schedule.expiry || schedule.date,
          );
          const nowSeconds = Math.floor(Date.now() / 1000);

          const isExpired =
            expiryTimestamp !== null ? nowSeconds > expiryTimestamp : false;

          // console.log("Filtering:", schedule.name, {
          //   expiry: schedule.expiry,
          //   expiryTimestamp,
          //   nowSeconds,
          //   isExpired,
          // });

          if (!showExpired && isExpired) return false;

          if (categoryFilter !== "all") {
            const itemCategory = getCategory(schedule.name);
            if (itemCategory !== categoryFilter) return false;
          }

          return true;
        })
        .map((schedule) => [schedule.name, schedule]),
    ).values(),
  ];

  // Get unique categories from all schedules
  const availableCategories = [
    "all",
    ...new Set(schedules.map((s) => getCategory(s.name))),
  ];

  // Update concatenated string whenever selectedIngredients changes
  useEffect(() => {
    const newString = selectedIngredients.join(", ");
    console.log("[ScheduleGrid] Updating global string:", newString); // <--
    setConcatenatedString(newString);
  }, [selectedIngredients]);

  // Toggle ingredient selection (for checkbox-style clicking)
  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ingredient)) {
        return prev.filter((item) => item !== ingredient);
      } else {
        return [...prev, ingredient];
      }
    });
  };

  // Remove ingredient from selected list (for X button in the bar)
  const removeIngredient = (ingredient: string) => {
    setSelectedIngredients((prev) =>
      prev.filter((item) => item !== ingredient),
    );
  };

  // Clear all selected ingredients
  const clearAll = () => {
    setSelectedIngredients([]);
  };

  // Select ingredients randomly (excluding expired)
  const selectRandomIngredients = (count: number) => {
    if (availableIngredients.length === 0) return;

    const nowSeconds = Math.floor(Date.now() / 1000);

    // Filter out expired items
    const nonExpiredIngredients = availableIngredients.filter((item) => {
      const schedule = schedules.find((s) => s.name === item.name);
      const expiryTimestamp = schedule
        ? toUnixSeconds(schedule.expiry || schedule.date)
        : null;
      return expiryTimestamp === null || nowSeconds <= expiryTimestamp;
    });

    if (nonExpiredIngredients.length === 0) return;

    // Pure random selection: shuffle all non-expired items and pick top N
    // This avoids category bias and ensures true variety
    const shuffled = [...nonExpiredIngredients].sort(() => Math.random() - 0.5);

    const selected: string[] = [];
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      selected.push(shuffled[i].name);
    }

    setSelectedIngredients(selected);
  };

  // Select ingredients by expiry (nearest to expiring first, excluding expired)
  const selectByExpiryIngredients = (count: number) => {
    if (availableIngredients.length === 0) return;

    const nowSeconds = Math.floor(Date.now() / 1000);

    // Create a mapping of ingredient names to their schedules and sort by expiry
    const ingredientsWithExpiry = availableIngredients
      .map((item) => {
        const schedule = schedules.find((s) => s.name === item.name);
        const expiryTimestamp = schedule
          ? toUnixSeconds(schedule.expiry || schedule.date)
          : null;
        return {
          ...item,
          expiryTimestamp,
          daysUntilExpiry: expiryTimestamp
            ? Math.ceil((expiryTimestamp - nowSeconds) / 86400)
            : Infinity,
        };
      })
      // Filter out expired items (only include items that expire in the future)
      .filter((item) => item.daysUntilExpiry > 0)
      // Sort by days until expiry (ascending - nearest to expiring first)
      // For items with same expiry, randomize to add variety
      .sort((a, b) => {
        if (a.daysUntilExpiry === b.daysUntilExpiry) {
          return Math.random() - 0.5; // Randomize when expiry is the same
        }
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });

    if (ingredientsWithExpiry.length === 0) return;

    // Group sorted ingredients by category
    const ingredientsByCategory: {
      [key: string]: (typeof ingredientsWithExpiry)[number][];
    } = {};
    ingredientsWithExpiry.forEach((item) => {
      const itemCategory = getCategory(item.name);
      if (!ingredientsByCategory[itemCategory]) {
        ingredientsByCategory[itemCategory] = [];
      }
      ingredientsByCategory[itemCategory].push(item);
    });

    const categories = Object.keys(ingredientsByCategory);
    const selected: string[] = [];
    const usedItems = new Set<string>(); // Track selected items to avoid duplicates

    // Try to pick from different categories first, prioritizing items nearest to expiry
    if (categories.length >= count) {
      // Shuffle categories and pick one from each
      const shuffledCategories = categories.sort(() => Math.random() - 0.5);
      for (let i = 0; i < count; i++) {
        const category = shuffledCategories[i];
        const items = ingredientsByCategory[category];

        // Find an item from this category that hasn't been selected yet
        // Still pick the one nearest to expiry from available items
        const availableItems = items.filter(
          (item) => !usedItems.has(item.name),
        );
        if (availableItems.length > 0) {
          selected.push(availableItems[0].name); // First one is nearest to expiry
          usedItems.add(availableItems[0].name);
        }
      }
    } else {
      // If fewer than count categories, pick from sorted list (nearest to expiry)
      for (let i = 0; i < Math.min(count, ingredientsWithExpiry.length); i++) {
        selected.push(ingredientsWithExpiry[i].name);
      }
    }

    setSelectedIngredients(selected);
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Ingredient Selector Section */}
      <div>
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-700">
              {t("filters")}
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Category Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600 mb-2 block">
                {t("category")}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Expired Toggle */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="showExpired"
                checked={showExpired}
                onChange={(e) => setShowExpired(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-600 mt-0.5"
              />
              <label
                htmlFor="showExpired"
                className="text-sm font-medium text-gray-700 leading-tight"
              >
                {t("showExpired")}
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          {selectedIngredients.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              {t("clearAll")}
            </button>
          )}
        </div>

        {/* Selected Ingredients Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
          {selectedIngredients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedIngredients.map((ingredient) => (
                <div
                  key={ingredient}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                >
                  <span>{ingredient}</span>
                  <button
                    onClick={() => removeIngredient(ingredient)}
                    className="hover:bg-red-200 rounded-full p-1 transition-colors"
                    aria-label={t("removeIngredient", { ingredient })}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              {t("noIngredientsSelected")}
            </p>
          )}
        </div>
        {/* Available Ingredients Grid (Checkbox-style) */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("availableIngredientsFromInventory")}
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={availableIngredients.length}
                value={selectionCount}
                onChange={(e) =>
                  setSelectionCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={() => selectRandomIngredients(selectionCount)}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-3 py-1 rounded-full transition-colors"
                title={t("selectRandomIngredients")}
              >
                {t("randomIngredients")}
              </button>
              <button
                onClick={() => selectByExpiryIngredients(selectionCount)}
                className="text-sm bg-red-100 hover:bg-red-200 text-red-700 font-medium px-3 py-1 rounded-full transition-colors"
                title={t("selectByExpiryIngredients")}
              >
                {t("byExpiry")}
              </button>
            </div>
          </div>
          {availableIngredients.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableIngredients.map(({ name, date, expiry, category }) => {
                const isSelected = selectedIngredients.includes(name);

                // Check if expired
                const expirySource = expiry || date;
                const expiryTimestamp = toUnixSeconds(expirySource);
                const nowSeconds = Math.floor(Date.now() / 1000);
                const isExpired =
                  expiryTimestamp !== null
                    ? expiryTimestamp < nowSeconds
                    : false;

                // Safe date formatting
                let formattedCategory = t("unspecified");
                formattedCategory = category
                  ? getCategoryLabel(category)
                  : t("unspecified");
                return (
                  <button
                    key={name}
                    onClick={() => toggleIngredient(name)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-left w-full ${
                      isSelected
                        ? "bg-red-600 text-white border-red-600 shadow-md"
                        : isExpired
                          ? "bg-red-50 text-gray-700 border-red-200 hover:border-red-300"
                          : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? "bg-white border-white"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <Plus className="w-3 h-3 text-red-600 rotate-45" />
                        )}
                      </div>
                      <span className="text-sm font-medium capitalize">
                        {name}
                      </span>
                      {isExpired && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                          {t("expired")}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-xs ml-6 ${
                        isExpired ? "text-red-600 font-medium" : "text-gray-500"
                      }`}
                    >
                      {formattedCategory}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              {t("noIngredientsAvailableFromSchedules")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
type Props = {
  dish: Dish;
};

const Chatbot = () => {
  const { concatenatedString, setConcatenatedString, recipes, setRecipes } =
    useGlobalContext();
  const [ingredients, setIngredients] = useState("");
  const [language, setanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error2, setError2] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [inputValue2, setInputValue2] = useState("");
  const [isSendOnCooldown, setisSendOnCooldown] = useState(false);
  const [isSendInputEmpty, setisSendInputEmpty] = useState(false);
  const [isReloadCooldown, setIsReloadCooldown] = useState(false);
  // do for isSendInputEmpty
  const { t } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: t("hiImYourKitchenAssistant"),
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { history, updateSuggestions, addToHistory, clearHistory } =
    useMealHistory();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const { currentUser } = useAuth();
  const getCacheKey = (uid: string) => `assistant:user:${uid}:schedules`;

  // modal & preview state
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // disable send when there is no typed text AND no selected choices
  useEffect(() => {
    const hasText = inputValue.trim().length > 0;
    const hasChoices = !!(
      concatenatedString && concatenatedString.trim().length > 0
    );
    setisSendInputEmpty(!(hasText || hasChoices));
  }, [inputValue, concatenatedString]);

  const handleFetchProfile = async () => {
    if (isReloadCooldown) {
      handleValidationError(t("pleaseWaitBeforeReloading"));
      return;
    }
    setIsReloadCooldown(true);
    setTimeout(() => setIsReloadCooldown(false), 5000);

    // console.log("Fetching profile for user:", currentUser);
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    setUserData(null);

    try {
      const parsedData = await apiClient.getUser(currentUser.uid);

      // ensure each schedule has expected fields
      const normalizedSchedules = (parsedData.schedules || []).map((s: any) => ({
        date: s.date ?? s.expiry ?? "",
        is_soon: Boolean(s.is_soon),
        name: s.name ?? s.title ?? t("unnamed"),
        time: s.time ?? s.hour ?? "",
        expiry: s.expiry ?? s.date ?? "",
        // keep original fields if needed
        ...s,
      }));

      const finalData: UserData = {
        email: parsedData.email ?? "",
        username: parsedData.username ?? "",
        savedrecipes: parsedData.savedrecipes.map((recipe) => ({
          id: recipe.uid || recipe.id || recipe.name,
          name: recipe.name,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          time: recipe.time ?? null,
        })),
        schedules: normalizedSchedules,
        people: Array.isArray(parsedData.people)
          ? parsedData.people.map((person) => ({
              person_id: person.person_id,
              name: person.name,
              preference: Array.isArray(person.preference)
                ? person.preference
                : [],
              allergy: Array.isArray(person.allergy) ? person.allergy : [],
            }))
          : [],
      };

      setUserData(finalData);
      try {
        if (currentUser) {
          const key = getCacheKey(currentUser.uid);
          const payload = { ...finalData, cachedAt: new Date().toISOString() };
          localStorage.setItem(key, JSON.stringify(payload));
        }
      } catch (e) {
        console.warn("[handleFetchProfile] failed to cache schedules:", e);
      }
    } catch (err) {
      console.error("[handleFetchProfile] error:", err);
      setError(t("networkOrServerErrorFetchProfile"));
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   handleFetchProfile(); // load once when user logs in
  // }, [currentUser]);

  // Enhanced bot responses with meal suggestions
  const botResponsesWithSuggestions = [
    t("recipeAssistantDesc"),
    t("getRecipeSuggestions"),
    t("kitchenAssistantDesc"),
    t("addFromYourInventory"),
    t("recipeAssistant"),
  ];

  const extractMealSuggestions = (text: string): string[] => {
    const lines = text.split("\n");
    const suggestions: string[] = [];

    lines.forEach((line) => {
      if (line.includes("•")) {
        const meal = line.replace("•", "").trim();
        if (meal) suggestions.push(meal);
      }
    });

    return suggestions;
  };
  const handleSendCOoldown = () => {
    if (isSendOnCooldown) {
      return;
    }
    setisSendOnCooldown(true);

    setTimeout(() => {
      setisSendOnCooldown(false);
    }, 5000);
  };
  const handleSendMessage = async () => {
    if (isSendOnCooldown) return;
    // ensure there's either typed text or selected choices
    if (isSendInputEmpty) {
      // show validation warning instead of preventing the button click silently
      handleValidationError(t("enterOrSelectIngredientsBeforeSend"));
      return;
    }
    handleSendCOoldown();
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      isBot: false,
      timestamp: new Date(),
    };

    console.log("Input:", inputValue);

    setLoading(true);
    setError2(null);
    setSearched(true);

    console.log("111Fetching igr:", concatenatedString);

    const promptText = [concatenatedString, inputValue]
      .filter((value) => value && value.trim().length > 0)
      .join(" , ");

    try {
      if (!currentUser?.uid) {
        throw new Error(t("youMustBeLoggedIn"));
      }

      const response = await apiClient.sendChatRequest(currentUser.uid, {
        history: [],
        prompt: {
          text: promptText,
        },
        promptlanguage: "ENG",
        userid: currentUser.uid,
        selected_people_ids:
          selectedPeople.length > 0
            ? selectedPeople.map((person) => person.person_id)
            : undefined,
        people_context:
          selectedPeople.length > 0
            ? selectedPeople.map((person) => ({
                name: person.name,
                preference: person.preference || [],
                allergy: person.allergy || [],
              }))
            : undefined,
      });

      const normalizedDishes = normalizeDishes(response.dishes || []);
      setRecipes(normalizedDishes);
      console.log("Set recipes:", normalizedDishes);
    } catch (err) {
      console.error("[handleSendMessage] chat request failed:", err);
      setError2(err instanceof Error ? err.message : t("failed"));
      setRecipes([]);
    }

    setLoading(false);

    setLoading(false);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setValidationError("");

    // Simulate bot response delay
    setTimeout(() => {
      const botResponseText =
        botResponsesWithSuggestions[
          Math.floor(Math.random() * botResponsesWithSuggestions.length)
        ];
      const suggestions = extractMealSuggestions(botResponseText);

      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponseText,
        isBot: true,
        timestamp: new Date(),
        hasMealSuggestions: suggestions.length > 0,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (suggestions.length > 0) {
        updateSuggestions(suggestions);
      }

      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleMealSubmit = (meal: string): boolean => {
    const success = addToHistory(meal);
    if (success) {
      setValidationError("");
    }
    return success;
  };

  const handleOpenPreview = (dish: Dish) => {
    setSelectedDish(dish);
    setModalMessage(null);
    setIsModalOpen(true);
  };

  const handleAddFromModal = async (dish: Dish) => {
    if (!currentUser) {
      setModalMessage(t("mustBeLoggedInToAddRecipes"));
      return false;
    }

    // Log the add attempt
    console.log("[handleAddFromModal] Adding recipe:", {
      id: (dish as any)?.id,
      name: dish.dishName,
      portions: dish.portions,
    });

    setIsAdding(true);
    setModalMessage(null);

    const payload = {
      name: dish.dishName,
      ingredients: Object.entries(dish.portions).map(
        ([key, value]) => `${key}: ${value}`,
      ),
      steps: dish.preparationSteps,
      time: new Date().toISOString(),
      // Backend expects image_url; map from normalized Dish.image
      image_url: dish.image || undefined,
    };
    console.log(dish);
    try {
      const data = await apiClient.addRecipe(currentUser.uid, payload);

      // Log server response for debugging
      console.log("[handleAddFromModal] server response:", {
        data,
      });

      if (data.success) {
        setModalMessage(`✅ ${t("recipeAddedSuccessfully")}`);
        // Do NOT modify local recipes list — this action only updates the backend.
        // Removed: setRecipes([dish, ...(recipes || [])]);

        // Update cache with new recipe
        try {
          if (currentUser) {
            const key = getCacheKey(currentUser.uid);
            const raw = localStorage.getItem(key);
            if (raw) {
              const cachedData = JSON.parse(raw);
              // Add new recipe to savedrecipes array
              if (!Array.isArray(cachedData.savedrecipes)) {
                cachedData.savedrecipes = [];
              }
              const newRecipe: Recipe = {
                id: Date.now().toString(),
                name: dish.dishName,
                ingredients: Object.entries(dish.portions).map(
                  ([key, value]) => `${key}: ${value}`,
                ),
                steps: dish.preparationSteps,
                time: new Date().toISOString(),
              };
              cachedData.savedrecipes.push(newRecipe);
              cachedData.cachedAt = new Date().toISOString();
              localStorage.setItem(key, JSON.stringify(cachedData));

              // Update userData state to reflect new recipe immediately
              setUserData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  savedrecipes: [...(prev.savedrecipes || []), newRecipe],
                };
              });
            }
          }
        } catch (e) {
          console.warn("[handleAddFromModal] failed to update cache:", e);
        }

        toast({
          title: t("recipeAddedTitle"),
          description: t("recipeAddedToYourRecipes", { name: dish.dishName }),
        });
        // close after a short delay
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedDish(null);
        }, 900);
        setIsAdding(false);
        return true;
      } else {
        console.log("[handleAddFromModal] failed add:", {
          result: data,
          data,
        });
        setModalMessage(`❌ ${t("failedToAddRecipe")}`);
        toast({
          title: t("failed"),
          description: t("couldntAddRecipe", { name: dish.dishName }),
        });
        setIsAdding(false);
        return false;
      }
    } catch (err) {
      console.log("[handleAddFromModal] network/error:", err);
      console.error(err);
      setModalMessage(`❌ ${t("networkError")}`);
      toast({
        title: t("networkError"),
        description: t("couldntAddRecipe", { name: dish.dishName }),
      });
      setIsAdding(false);
      return false;
    }
  };

  const handleViewFull = (dish: Dish) => {
    // navigate to recipe page and pass dish in location state
    router.push("/recipe");
  };

  const handleValidationError = (message: string) => {
    setValidationError(message);
    setTimeout(() => setValidationError(""), 5000);
  };

  // Hydrate schedules from cache when user changes or on first load
  useEffect(() => {
    if (!currentUser) return;

    try {
      const key = getCacheKey(currentUser.uid);
      const raw = localStorage.getItem(key);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.schedules)) {
          const cachedUser: UserData = {
            email: parsed.email ?? "",
            username: parsed.username ?? "",
            savedrecipes: Array.isArray(parsed.savedrecipes)
              ? parsed.savedrecipes
              : [],
            schedules: parsed.schedules,
            people: Array.isArray(parsed.people) ? parsed.people : [],
          };
          setUserData(cachedUser);
        }
      }
    } catch (e) {
      console.warn("[Assistant cache] failed to hydrate:", e);
    }
  }, [currentUser]);

  // Close assistant results and navigate to Foods page
  const handleCloseResultsAndGoFoods = () => {
    try {
      setRecipes([]); // clear assistant suggestions
    } catch (e) {
      console.warn("Failed to clear recipes:", e);
    }
    router.push("/foods");
  };

  const lastMessage = messages[messages.length - 1];
  const showMealInput = lastMessage?.isBot && lastMessage?.hasMealSuggestions;

  const toggleSelectedPerson = (person: Person) => {
    setSelectedPeople((prev) => {
      const isAlreadySelected = prev.some(
        (item) => item.person_id === person.person_id,
      );
      if (isAlreadySelected) {
        return prev.filter((item) => item.person_id !== person.person_id);
      }
      return [...prev, person];
    });
  };

  useEffect(() => {
    if (!userData?.people || userData.people.length === 0) {
      setSelectedPeople([]);
      return;
    }

    setSelectedPeople((prev) =>
      prev.filter((selected) =>
        userData.people?.some((person) => person.person_id === selected.person_id),
      ),
    );
  }, [userData?.people]);

  return (
    <div className="">
      <Card className="w-full max-w-2xl mx-auto h-200 flex flex-col  shadow-lg overflow-hidden outline-none focus:outline-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-poppins font-semibold">
                {t("kitchenAssistant")}
              </h3>
              <p className="text-sm text-red-100">{t("askMeAboutRecipes")}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-white hover:bg-white/20"
          >
            {t("history")} ({history.length})
          </Button>
        </div>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isBot ? "justify-start" : "justify-end"
              } animate-fade-in`}
            >
              <div
                className={`max-w-full sm:max-w-xs lg:max-w-md px-4 py-2 rounded-2xl whitespace-pre-line ${
                  message.isBot
                    ? "bg-red-50 text-gray-800 border border-red-100"
                    : "bg-red-600 text-white"
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t border-red-100">
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 items-stretch">
            {/* Replaced Input with ChatBox for a wider and shorter input */}
            <ChatBox
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                !currentUser
                  ? t("youMustBeLoggedIn")
                  : t("anyAdditionalInstrctions")
              }
              disabled={!currentUser}
              className={`flex-1 w-full ${!currentUser ? "opacity-80" : ""}`}
            />

            {/* avoid rendering raw objects; show a small safe summary */}
            {/* {userData ? (
              <div className="text-xs text-gray-600 sm:ml-2">
                Schedules: {userData.schedules?.length ?? 0}
              </div>
            ) : null} */}
            <Button
              onClick={handleSendMessage}
              size="sm"
              disabled={!currentUser || isSendOnCooldown}
              className={`w-full sm:w-auto rounded-full px-4 py-2 border transition ${
                !currentUser
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
              aria-label={t("sendMessage")}
            >
              {loading ? (
                <span className="inline-flex items-center justify-center w-4 h-4">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </span>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {currentUser && (
          <div className="p-4 border-t border-red-100 bg-red-50">
            <div className="flex items-center justify-between rounded-xl shadow-sm">
              <span className="text-xl font-bold text-red-700">
                {t("addFromYourInventory")}
              </span>

              <button
                onClick={handleFetchProfile}
                disabled={isLoading || isReloadCooldown}
                className="text-red-600 hover:text-red-800 p-2 rounded-full transition-colors duration-200"
                aria-label={t("refresh")}
              >
                {isLoading
                  ? t("loading")
                  : isReloadCooldown
                    ? t("wait")
                    : t("loadMySchedules")}
                <RefreshCcw className="w-5 h-5 inline ml-1" />
              </button>
            </div>

            {/* Schedule Grid */}
            {userData?.schedules && (
              <div className="mt-2">
                <ScheduleGrid schedules={userData.schedules} />
              </div>
            )}

            {userData?.people && userData.people.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  People Context
                </div>
                <div className="flex flex-wrap gap-2">
                  {userData.people.map((person) => {
                    const isSelected = selectedPeople.some(
                      (selected) => selected.person_id === person.person_id,
                    );

                    return (
                      <button
                        key={person.person_id}
                        type="button"
                        onClick={() => toggleSelectedPerson(person)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          isSelected
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-red-300"
                        }`}
                      >
                        {person.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assistant should only show schedules in this inventory area (no recipes toggle here). */}
            {/* If you want assistant-specific recipe previews elsewhere, use AssistantRecipeStack where appropriate. */}
          </div>
        )}

        {/* Floating X when modal open: closes modal and goes to foods */}
        {isModalOpen && (
          <button
            onClick={() => {
              setIsModalOpen(false);
              router.push("/foods");
            }}
            aria-label={t("closeRecipeAndGoToFoods")}
            className="fixed top-4 right-4 z-50 bg-white rounded-full p-2 shadow hover:bg-gray-100"
          >
            <span className="text-lg font-semibold">✕</span>
          </button>
        )}
      </Card>

      {/* Assistant recipe results */}
      {recipes && recipes.length > 0 && (
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold mt-3 ml-8ok">
              {t("assistantRecipes")}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecipes([])}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {t("clear")}
              </button>
            </div>
          </div>

          <AssistantRecipeStack
            recipes={recipes}
            onPreview={(d) => {
              setSelectedDish(d);
              setIsModalOpen(true);
            }}
          />
        </div>
      )}
      {/* Preview Modal */}
      <RecipePreviewModal
        dish={selectedDish}
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setSelectedDish(null);
        }}
        onAdd={handleAddFromModal}
        onViewFull={handleViewFull}
        isAdding={isAdding}
      />

      {/* Validation Error */}
      {validationError && (
        <div className="w-full max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{validationError}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Display */}
      {showHistory && (
        <div className="w-full max-w-2xl mx-auto">
          <MealHistory history={history} onClearHistory={clearHistory} />
        </div>
      )}
    </div>
  );
};

export default Chatbot;
