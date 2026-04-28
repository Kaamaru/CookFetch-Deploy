"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatBoxProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * ChatBox - compact, accessible input
 * - width/height tuned: md:max-w-3xl, h-12
 * - pass className to override container sizing
 */
export default function ChatBox({
  value,
  onChange,
  onKeyPress,
  placeholder = "",
  disabled = false,
  className = "",
}: ChatBoxProps) {
  const { t } = useLanguage();

  return (
    <div className={`flex items-center gap-2 px-3 ${className}`}>
      <input
        aria-label={t("message")}
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          // keep Enter handling consistent with existing code expecting onKeyPress
          if (e.key === "Enter" && onKeyPress) {
            onKeyPress(e as unknown as React.KeyboardEvent<HTMLInputElement>);
          }
        }}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 w-full md:max-w-3xl h-12 rounded-xl px-4 py-2 shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-200 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
      />
    </div>
  );
}
