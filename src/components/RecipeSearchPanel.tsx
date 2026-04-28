"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient, type AddToListResponse, type GenerateRecipeResponse, type RecipeSearchData, type RecipeSearchMatchInfo, type RecipeSearchResponse } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const RecipeSearchPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<
    "idle" | "generating" | "found" | "not_found" | "failed"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecipeSearchData | null>(null);
  const [matchInfo, setMatchInfo] = useState<RecipeSearchMatchInfo | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [generateSuccessMessage, setGenerateSuccessMessage] = useState<
    string | null
  >(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRecipeDetails = async (
    recipeId: string,
    signal?: AbortSignal,
  ): Promise<RecipeSearchData> => {
    const detailData = await apiClient.fetchRecipeDetails(recipeId, signal);

    return {
      id: detailData?.id ?? recipeId,
      name: detailData?.name ?? t("untitledRecipe"),
      ingredients: detailData?.ingredients,
      nutrition: detailData?.nutrition,
    };
  };

  const runSearch = async () => {
    const term = searchTerm.trim();
    if (!term) return;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(resolve, ms);

        controller.signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timeoutId);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });

    setIsSearching(true);
    setError(null);
    setResult(null);
    setMatchInfo(null);
    setGenerateSuccessMessage(null);

    try {
      const maxRetries = 5;
      let retries = 0;

      while (true) {
        const payload: RecipeSearchResponse = await apiClient.searchRecipes(term, controller.signal);

        if (payload.status === "found") {
          const lookupId = payload.data?.id;
          if (!lookupId) {
            throw new Error("Recipe was found but no recipe id was returned.");
          }

          const fullRecipe = await fetchRecipeDetails(
            lookupId,
            controller.signal,
          );
          setStatus("found");
          setResult(fullRecipe);
          setMatchInfo(payload.match_info);
          return;
        }

        if (payload.status === "not_found") {
          setStatus("not_found");
          return;
        }

        setStatus("generating");

        if (retries >= maxRetries) {
          setStatus("failed");
          setError(t("searchingDatabaseGenerating"));
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

      setStatus("failed");
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setIsSearching(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  const handleGenerate = async () => {
    const term = searchTerm.trim();
    if (!term) return;

    setIsGenerating(true);
    setError(null);
    setGenerateSuccessMessage(null);

    try {
      const payload: GenerateRecipeResponse = await apiClient.generateRecipe(term);

      if (payload.status === "failed") {
        setStatus("failed");
        setError(t("failed"));
        return;
      }

      if (!payload.data?.id) {
        setStatus("failed");
        setError(t("missingRecipeId"));
        return;
      }

      const fullRecipe = await fetchRecipeDetails(payload.data.id);
      setStatus("found");
      setResult(fullRecipe);
      setMatchInfo(payload.match_info ?? null);
      setGenerateSuccessMessage(t("recipeAddedSuccessfully"));
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToList = async () => {
    if (!result?.id) {
      setError(t("missingRecipeId"));
      return;
    }

    if (!currentUser?.uid) {
      setError(t("logInToAddRecipeToList"));
      return;
    }

    setIsAddingToList(true);
    setError(null);

    try {
      const listName = result.name?.trim() || searchTerm.trim() || t("recipes");

      const createPayload = await apiClient.createGroceryList(currentUser.uid, {
        list_name: listName,
      });

      if (!createPayload?.success || !createPayload?.list?.list_id) {
        throw new Error(createPayload?.error || "Failed to create grocery list.");
      }

      const createdListId = createPayload.list.list_id as string;

      const payload: AddToListResponse = await apiClient.addRecipeToList(result.id, {
        userid: currentUser.uid,
        list_id: createdListId,
      });

      if (payload.status === "success") {
        const addedCount = payload.data?.items_added ?? 0;
        toast({
          title: t("groceryListCreated"),
          description: t("addedIngredientsToList", {
            count: addedCount,
            name: listName,
          }),
        });
        router.push("/grocery");
        return;
      }

      const message = payload.message;
      if (message === "userid and list_id are required") {
        setError(t("logInToAddRecipeToList"));
      } else if (message === "recipe_not_found") {
        setError(t("recipeNotFoundGeneratePrompt"));
      } else if (message === "recipe_has_no_ingredients") {
        setError(t("recipeHasNoIngredients"));
      } else if (message === "no_items_added") {
        setError(t("failedToAddRecipe"));
      } else {
        setError(t("failedToAddRecipe"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToAddRecipe"));
    } finally {
      setIsAddingToList(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setStatus("idle");
      setError(null);
      setResult(null);
      setMatchInfo(null);
      setGenerateSuccessMessage(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t("searchRecipeByNamePlaceholder")}
            value={searchTerm}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                runSearch();
              }
            }}
            className="pl-10 rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
          />
        </div>
        <Button
          onClick={runSearch}
          disabled={isSearching || isGenerating || !searchTerm.trim()}
          className="rounded-xl bg-red-500 hover:bg-red-700 text-white"
        >
          {isSearching ? t("searching") : t("search")}
        </Button>
      </div>

      {status === "not_found" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
          <p className="text-sm text-amber-800">
            {t("recipeNotFoundGeneratePrompt")}
          </p>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isSearching || !searchTerm.trim()}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isGenerating ? t("generating") : t("generateNewRecipe")}
          </Button>
        </div>
      )}

      {status === "generating" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {t("searchingDatabaseGenerating")}
        </div>
      )}

      {generateSuccessMessage && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {generateSuccessMessage}
        </div>
      )}

      {status === "failed" && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
          <Button
            variant="outline"
            className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
            onClick={runSearch}
          >
            {t("retrySearch")}
          </Button>
        </div>
      )}

      {status === "found" && result && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-red-700 font-semibold">
                {t("searchResult")}
              </p>
              <h3 className="text-xl font-semibold text-gray-900">
                {result.name || t("untitledRecipe")}
              </h3>
              {matchInfo && matchInfo.confidence !== "exact" && (
                <p className="mt-1 text-sm text-red-700">
                  {t("similarMatchFromScore", {
                    matchedFrom: matchInfo.matched_from,
                    score: matchInfo.score.toFixed(2),
                  })}
                </p>
              )}
            </div>
            <Badge className="bg-white text-red-700 border border-red-200">
              {t("apiLabel")}
            </Badge>
          </div>

          {result.ingredients && Object.keys(result.ingredients).length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                {t("ingredients")}
              </p>
              <ul className="space-y-1">
                {Object.entries(result.ingredients).map(
                  ([ingredient, amount]) => (
                    <li
                      key={ingredient}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                    >
                      <span className="text-gray-700 capitalize">
                        {ingredient}
                      </span>
                      <span className="text-red-700 font-medium">{amount}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {result.nutrition && Object.keys(result.nutrition).length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                {t("nutrition")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.nutrition).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <p className="text-gray-500 capitalize">{key}</p>
                    <p className="font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-red-200 bg-white p-3">
            {!currentUser?.uid ? (
              <div className="text-sm text-red-700">
                {t("logInToAddRecipeToList")}
                <Button
                  variant="link"
                  className="px-1 text-red-700"
                  onClick={() => router.push("/login")}
                >
                  {t("goToLogin")}
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAddToList}
                disabled={isAddingToList || !result?.id}
                className="rounded-xl bg-red-500 hover:bg-red-700 text-white"
              >
                {isAddingToList ? t("addingItem") : t("addToGroceryList")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeSearchPanel;
