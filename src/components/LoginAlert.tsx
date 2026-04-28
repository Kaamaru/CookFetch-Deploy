"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const LoginAlert = () => {
  const { hasJustLoggedIn, dismissLoginAlert, currentUser } = useAuth();
  const { t } = useLanguage();

  if (!hasJustLoggedIn) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="bg-white border-2 border-green-500 rounded-lg shadow-lg p-4 flex items-center gap-4 max-w-sm mx-auto">
        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
        <div className="flex-grow">
          <h3 className="font-semibold text-gray-900">
            {t("loginSuccessTitle")}
          </h3>
          <p className="text-sm text-gray-600">
            {t("welcomeBack")}, {currentUser?.displayName || t("user")}!{" "}
            {t("sessionActiveOnBrowser")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={dismissLoginAlert}
          className="ml-2 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default LoginAlert;
