"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Non-functional skeleton of the Chatbot component.
 * This is a UI-only preview that redirects the user to the real page when
 * they click the 'Open full assistant' button.
 */
const ChatbotSkeleton = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto h-200 flex flex-col border-red-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-poppins font-semibold">
                {t("kitchenAssistantPreview")}
              </h3>
              <p className="text-sm text-red-100">
                {t("assistantPreviewClickOpen")}
              </p>
            </div>
          </div>
          <div className="text-sm text-white/80">{t("preview")}</div>
        </div>

        {/* Static message area */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl whitespace-pre-line bg-red-50 text-gray-800 border border-red-100">
              <p className="text-sm">{t("assistantPreviewMessage")}</p>
            </div>
          </div>
        </CardContent>

        {/* Input area (disabled preview) */}
        <div className="p-4 border-t border-red-100">
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 items-stretch">
            <Input
              placeholder={t("typeIngredientsPreview")}
              disabled
              className="flex-1 w-full border px-4 py-2 rounded transition bg-gray-50 text-gray-400"
            />

            {/* Preview send button: redirects to the real page */}
            <Button
              size="sm"
              className="w-full sm:w-auto rounded-full px-4 py-2 border bg-red-500 text-white hover:bg-red-700"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Link href="/assistant">
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto text-red-600"
              >
                {t("openFullAssistant")}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatbotSkeleton;
