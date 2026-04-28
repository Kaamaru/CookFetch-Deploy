"use client";

import React, { useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { t } = useLanguage();
  const { currentUser, login, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      router.push("/foods");
    }
  }, [currentUser, router]);

  const handleGoogleLogin = async () => {
    await login();
  };

  if (currentUser) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <div className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-gentle bg-white shadow-2xl border border-red-100">
              <Image
                src="/media/hero_red.png"
                alt={t("cookFetchLogoAlt")}
                width={64}
                height={64}
                className="w-16 h-16"
              />
            </div>
            <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-2">
              {t("welcomeToCookFetch")}
            </h1>
            <p className="text-gray-600">{t("startJourneyToSmartFood")}</p>
          </div>

          {/* Auth Card */}
          <Card className="border-red-200 shadow-lg animate-slide-up">
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-gray-800">
                {t("getStarted")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Sign-in Button */}
              <Button
                onClick={handleGoogleLogin}
                className="w-full py-6 bg-white hover:bg-gray-50 text-gray-700 border-2 border-red-200 hover:border-red-300 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 group"
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loading ? (
                  t("signingIn")
                ) : (
                  <div className="flex items-center">
                    <span className="text-lg font-semibold">
                      {t("continueWithGoogle")}
                    </span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>

              {/* Feature highlights */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>{t("trackFoodExpirationDates")}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>{t("getSmartNotifications")}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>{t("discoverRecipeSuggestions")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to home link */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
