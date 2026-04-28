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
} from "lucide-react";
import RecipeStack from "@/components/RecipeStack";
const AssistantPage: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [showHelpSections, setShowHelpSections] = useState(true);
  const isDemo = !currentUser;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 text-center font-semibold mb-4">
          🤖 {t("demoModePreview")}{" "}
          <Button
            variant="ghost"
            className="text-white underline ml-2"
            onClick={() => router.push("/login")}
          >
            {t("loginNow")}
          </Button>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <header className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
            {t("kitchenAssistant")}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t("assistantPreviewDescription")}
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main: Chatbot preview */}
          <div className="md:col-span-2" id="assistant-chat">
            {/* <Card className="bg-transparent shadow-none"> */}
            <CardContent className="p-0">
              <Chatbot />
            </CardContent>
            {/* </Card> */}
          </div>

          {/* Aside: help, quick actions, tips */}
          <aside
            className={`flex flex-col space-y-3 transition-all duration-500 ease-in-out ${
              showHelpSections ? "" : ""
            }`}
          >
            <Button
              variant="secondary"
              className="w-full flex items-center justify-between gap-3"
              onClick={() => setShowHelpSections((prev) => !prev)}
              aria-expanded={showHelpSections}
            >
              <span className="flex items-center gap-2 text-md font-semibold">
                <Info className="w-4 h-4" /> {t("tips")}
              </span>
              <span
                className={`transition-transform duration-300 ${
                  showHelpSections ? "rotate-180" : "-rotate-0"
                }`}
                aria-hidden
              >
                -&gt;
              </span>
            </Button>

            <div
              className={`w-full transition-all duration-400 ease-in-out ${
                showHelpSections
                  ? "space-y-4 opacity-100 max-h-[1200px]"
                  : "space-y-0 opacity-0 max-h-0 overflow-hidden"
              }`}
            >
              <Card className="p-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-2">
                  <Info className="w-5 h-5 text-red-600" /> {t("howToUse")}
                </h3>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
                  <li>{t("howToStep1")}</li>
                  <li>{t("howToStep2")}</li>
                  <li>{t("howToStep3")}</li>
                </ol>
              </Card>

              <Card className="p-4">
                <h4 className="flex items-center gap-2 text-md font-semibold mb-2">
                  <FileText className="w-4 h-4 text-red-600" />{" "}
                  {t("quickActions")}
                </h4>
                <div className="grid gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/foods")}
                    className="justify-start"
                  >
                    <BookOpen className="w-4 h-4 mr-2" /> {t("myFoods")}
                  </Button>
                  {/* <Button variant="ghost" onClick={() => router.push('/login')} className="justify-start">
										{t("login") || "Login"}
									</Button> */}
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/")}
                    className="justify-start"
                  >
                    <HomeIcon className="w-4 h-4 mr-2" /> {t("home")}
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="flex items-center gap-2 text-md font-semibold mb-2">
                  <Info className="w-4 h-4 text-red-600" /> {t("tips")}
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• {t("chooseYourIngredientsTip")}</li>
                  <li>• {t("generateRecipesTip")}</li>
                  <li>• {t("toggleByExpirationTip")}</li>
                </ul>
              </Card>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default AssistantPage;
