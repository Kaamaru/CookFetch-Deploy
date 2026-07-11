"use client";

import React, { useState } from "react";
import ChatbotSkeleton from "@/components/ChatbotSkeleton";
import Chatbot from "@/components/Chatbot";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Info,
  Zap,
  FileText,
  BookOpen,
  ImportIcon,
  HomeIcon,
  Bot,
  ChevronDown,
} from "lucide-react";
import RecipeStack from "@/components/RecipeStack";
import PageHeader from "@/components/PageHeader";
const AssistantPage: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [showHelpSections, setShowHelpSections] = useState(true);
  const isDemo = !currentUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 text-center font-semibold flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          <Bot className="w-4 h-4 shrink-0" />
          {t("demoModePreview")}{" "}
          <Button
            variant="ghost"
            className="text-white underline ml-2"
            onClick={() => router.push("/login")}
          >
            {t("loginNow")}
          </Button>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <PageHeader
          icon={Bot}
          title={t("kitchenAssistant")}
          subtitle={t("assistantPreviewDescription")}
          className="mb-8"
        />

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Main: Chatbot preview */}
          <div className="md:col-span-2" id="assistant-chat">
            {/* <Card className="bg-transparent shadow-none"> */}
            <CardContent className="p-0">
              <Chatbot />
            </CardContent>
            {/* </Card> */}
          </div>

          {/* Aside: help, quick actions, tips */}
          <aside className="flex flex-col space-y-4">
            <button
              className="w-full flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-white px-4 py-3 shadow-sm hover:bg-red-50 transition-colors"
              onClick={() => setShowHelpSections((prev) => !prev)}
              aria-expanded={showHelpSections}
            >
              <span className="flex items-center gap-2 font-semibold text-gray-800">
                <Info className="w-4 h-4 text-red-600" /> {t("tips")}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-red-600 transition-transform duration-300 ${
                  showHelpSections ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`w-full transition-all duration-400 ease-in-out ${
                showHelpSections
                  ? "space-y-4 opacity-100 max-h-[1200px]"
                  : "space-y-0 opacity-0 max-h-0 overflow-hidden"
              }`}
            >
              <Card className="rounded-2xl border-red-100 shadow-sm">
                <CardContent className="p-5">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <Info className="w-4 h-4" />
                    </span>
                    {t("howToUse")}
                  </h3>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
                    <li>{t("howToStep1")}</li>
                    <li>{t("howToStep2")}</li>
                    <li>{t("howToStep3")}</li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-red-100 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="flex items-center gap-2 text-md font-semibold text-gray-900 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <Zap className="w-4 h-4" />
                    </span>
                    {t("quickActions")}
                  </h4>
                  <div className="grid gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/foods")}
                    className="justify-start rounded-xl hover:bg-red-50 hover:text-red-700"
                  >
                    <BookOpen className="w-4 h-4 mr-2" /> {t("myFoods")}
                  </Button>
                  {/* <Button variant="ghost" onClick={() => router.push('/login')} className="justify-start">
										{t("login") || "Login"}
									</Button> */}
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/")}
                    className="justify-start rounded-xl hover:bg-red-50 hover:text-red-700"
                  >
                    <HomeIcon className="w-4 h-4 mr-2" /> {t("home")}
                  </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-red-100 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="flex items-center gap-2 text-md font-semibold text-gray-900 mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <Info className="w-4 h-4" />
                    </span>
                    {t("tips")}
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {[
                      t("chooseYourIngredientsTip"),
                      t("generateRecipesTip"),
                      t("toggleByExpirationTip"),
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default AssistantPage;
