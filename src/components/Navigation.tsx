"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, ChevronDown, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, logout, hasJustLoggedIn } = useAuth();

  const navItems = [
    { name: t("home"), path: "/" },
    { name: t("myFoods"), path: "/foods" },
    { name: t("recipes"), path: "/recipes" },
    { name: t("calendar"), path: "/calendar" },
    { name: t("assistant"), path: "/assistant" },
    { name: t("grocery"), path: "/grocery" },
    ...(currentUser ? [] : [{ name: t("login"), path: "/login" }]),
  ];

  const isActive = (path: string) => pathname === path;

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "th" : "en");
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleTutorialClick = () => {
    router.push("/settings");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-red-100 bg-white/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-lg border border-red-100">
              <Image
                src="/media/hero_red.png"
                alt={t("cookFetchLogoAlt")}
                width={40}
                height={40}
                className="w-10 h-10"
              />
            </div>
            <span className="text-xl font-poppins font-semibold text-gray-800">
              {t("freshKeeper")}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {/* Tutorial Button - shows when user just logged in */}
              {hasJustLoggedIn && (
                <Button
                  onClick={handleTutorialClick}
                  className="rounded-full px-6 bg-red-600 hover:bg-red-700 text-white transition-all duration-200 animate-slow-pulse"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {t("tutorial")}
                </Button>
              )}

              {navItems.map((item) => (
                <Link key={item.name} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={`rounded-full px-6 transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                    }`}
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
            </div>

            {/* User Info -> dropdown (Profile / Settings / Logout) */}
            {currentUser && (
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 bg-red-50 rounded-full px-4 py-2 border border-red-200">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={t("profileAvatarAlt")}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {currentUser.displayName || currentUser.email}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent sideOffset={8} align="end">
                    <DropdownMenuLabel>
                      {currentUser.displayName || currentUser.email}
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      {t("profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      {t("settings")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      {t("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-red-600"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-16 z-50 border-b border-red-100 bg-white shadow-lg animate-slide-up md:hidden">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-red-600 text-white"
                      : "text-gray-600 hover:bg-red-50"
                  }`}
                >
                  {item.name}
                </button>
              ))}
              {currentUser && (
                <>
                  <hr className="my-2" />
                  <button
                    onClick={() => handleNavigation("/profile")}
                    className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-red-50"
                  >
                    {t("profile")}
                  </button>
                  <button
                    onClick={() => handleNavigation("/settings")}
                    className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-red-50"
                  >
                    {t("settings")}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-red-50"
                  >
                    {t("logout")}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
