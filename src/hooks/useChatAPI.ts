"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient, type ChatRequest, type ChatResponse } from "@/lib/apiClient";

const useChatAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const sendChatRequest = async (
    ingredients: string[],
    language: string = "ENG",
    selectedPeopleIds?: string[],
  ): Promise<ChatResponse["dishes"]> => {
    setLoading(true);
    setError(null);

    try {
      if (!currentUser?.uid) {
        throw new Error(t("youMustBeLoggedIn"));
      }

      const requestBody: ChatRequest = {
        history: [],
        prompt: {
          text: ingredients.join(","),
        },
        promptlanguage: language,
        userid: currentUser.uid,
        selected_people_ids:
          selectedPeopleIds && selectedPeopleIds.length > 0
            ? selectedPeopleIds
            : undefined,
      };

      const data: ChatResponse = await apiClient.sendChatRequest(currentUser.uid, requestBody);
      console.log("Chat API response:", data);

      return data.dishes;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("failedRecipeSuggestionsMsg");
      setError(errorMessage);
      console.error("Error calling chat API:", err);

      toast({
        title: t("failed"),
        description: t("failedRecipeSuggestionsMsg"),
        variant: "destructive",
      });

      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    sendChatRequest,
    loading,
    error,
  };
};

export default useChatAPI;
