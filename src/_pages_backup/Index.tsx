"use client";

import React, { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import Chatbot from "@/components/Chatbot";
import ChatbotSkeleton from "@/components/ChatbotSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Bell,
  Calendar,
  MessageCircle,
  Plus,
  Shield,
  Scan,
  ShoppingCart,
  PenLine,
  ChefHat,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { ResponseParser } from "@/components/response-parser";

// Add custom animation styles
const animationStyles = `
  @keyframes swish-in {
    0% {
      opacity: 0;
      transform: scale(0.8) translateX(30px) translateY(-20px) rotateZ(-5deg);
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 1;
      transform: scale(1) translateX(0) translateY(0) rotateZ(0deg);
    }
  }
  
  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  
  @keyframes float-up-down {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-16px);
    }
  }
  
  .animate-swish-in {
    animation: swish-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .animate-fade-in-image {
    animation: fade-in 0.6s ease-in;
  }
  
  .animate-float-up-down {
    animation: float-up-down 3s ease-in-out infinite;
  }
`;
const Index = () => {
  const { t } = useLanguage();
  const { currentUser, logout } = useAuth();
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Function to start/restart auto-rotation
  const startAutoRotation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSelectedFeatureIndex((prevIndex) => (prevIndex + 1) % 4);
    }, 5000);
  };

  // Handle manual card click and reset timer
  const handleCardClick = (index: number) => {
    setSelectedFeatureIndex(index);
    startAutoRotation();
  };

  // Initialize auto-rotation on mount
  useEffect(() => {
    startAutoRotation();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const features = [
    {
      icon: <Plus className="h-6 w-6" />,
      title: t("addYourFoods"),
      description: t("addYourFoodsDesc"),
      image: "/media/phone_tap.jpg",
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: t("smartNotifications"),
      description: t("smartNotificationsDesc"),
      image: "/media/notify.png",
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: t("recipeAssistant"),
      description: t("recipeAssistantDesc"),
      image: "/media/assistant.png",
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: t("expiryDashboard"),
      description: t("expiryDashboardDesc"),
      image: "/media/dashboard.png",
    },
    {
      icon: <Scan className="h-6 w-6" />,
      title: t("foodScanner"),
      description: t("foodScannerDesc"),
      image: "/media/scanner.jpg",
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      title: t("shoppingList"),
      description: t("shoppingListDesc"),
      image: "/media/shopping.jpg",
    },
  ];

  const selectedFeature = features[selectedFeatureIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-gentle shadow-2xl bg-white">
                <Image
                  src="/media/hero_red.png"
                  alt={t("cookFetchLogoAlt")}
                  width={80}
                  height={80}
                  className="w-20 h-20"
                />
              </div>
              <h1 className="text-4xl sm:text-6xl font-poppins font-bold text-gray-900 mb-6">
                {t("neverWasteFoodAgain")}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                {t("heroDescription")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/foods">
                <Button
                  size="lg"
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  {t("startManagingFood")}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                {currentUser ? null : (
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-red-300 text-red-600 hover:bg-red-50 px-8 py-6 rounded-2xl text-lg font-semibold"
                  >
                    <Shield className="mr-2 h-5 w-5" />
                    {t("signUpFree")}
                  </Button>
                )}
              </Link>
            </div>
          </div>

          {/* Features Interactive Section */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Expandable Feature Cards (1/3 width) */}
              <div className="flex flex-col gap-2 lg:min-h-96">
                {features.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => handleCardClick(index)}
                    className={`p-3 rounded-2xl text-left transition-all duration-300 transform overflow-hidden flex flex-col ${
                      selectedFeatureIndex === index
                        ? "bg-red-500 text-white shadow-lg flex-1"
                        : "bg-white border border-red-100 text-gray-900 hover:border-red-200 hover:bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedFeatureIndex === index
                            ? "bg-white text-red-500"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {feature.icon}
                      </div>
                      <h3 className="font-poppins font-semibold text-base">
                        {feature.title}
                      </h3>
                    </div>

                    {/* Expandable Description */}
                    <div
                      className={`transition-all duration-300 overflow-hidden ${
                        selectedFeatureIndex === index
                          ? "max-h-96 opacity-100 pl-12 flex-1"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <p
                        className={`text-xs leading-relaxed ${
                          selectedFeatureIndex === index ? "text-red-100" : ""
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Right Column: Feature Image (2/3 width) */}
              <div className="hidden lg:flex lg:col-span-2 items-center justify-center overflow-hidden h-125">
                <div
                  key={selectedFeatureIndex}
                  className="relative w-full h-full rounded-3xl bg-gradient-to-br from-red-100 to-red-200 overflow-hidden shadow-xl animate-swish-in"
                >
                  <Image
                    src={selectedFeature.image}
                    alt={selectedFeature.title}
                    fill
                    sizes="(max-width: 1024px) 0px, 66vw"
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              </div>
            </div>

            {/* Mobile Image Display */}
            <div className="lg:hidden mt-8">
              <div
                key={selectedFeatureIndex}
                className="relative w-full h-64 rounded-3xl bg-gradient-to-br from-red-100 to-red-200 overflow-hidden shadow-lg animate-swish-in"
              >
                <Image
                  src={selectedFeature.image}
                  alt={selectedFeature.title}
                  fill
                  sizes="100vw"
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chatbot Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-gray-900 mb-4">
              {t("meetYourKitchenAssistant")}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("kitchenAssistantDesc")}
            </p>
          </div>
          <div className="animate-slide-up">
            <ChatbotSkeleton />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-gray-900 mb-4">
              {t("howItWorks")}
            </h2>
            <p className="text-xl text-gray-600">{t("howItWorksDesc")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: t("addYourFood"),
                description: t("addYourFoodDesc"),
                icon: PenLine,
              },
              {
                step: "2",
                title: t("getReminders"),
                description: t("getRemindersDesc"),
                icon: Bell,
              },
              {
                step: "3",
                title: t("cookAndEnjoy"),
                description: t("cookAndEnjoyDesc"),
                icon: ChefHat,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-white">
                  <item.icon className="w-8 h-8" />
                </div>
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  {item.step}
                </div>
                <h3 className="font-poppins font-semibold text-xl text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
