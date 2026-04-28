'use client';

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useGlobalContext } from "@/contexts/GlobalContext";

interface LanguageOption {
  code: string;
  label: string;
}

const languages: LanguageOption[] = [
  { code: "en", label: "EN" },
  { code: "th", label: "TH" },
  { code: "jp", label: "JP" },
];

const LanguageDropdown: React.FC = () => {
  const { promptLanguage, setPromptLanguage } = useGlobalContext();
  const [open, setOpen] = useState(false);

  const handleSelect = (code: string) => {
    setPromptLanguage(code);
    setOpen(false);
    // Optionally call your i18n or LanguageContext update function here
    // i18n.changeLanguage(code)
  };

  return (
    <div className="relative inline-block text-left">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center space-x-2 bg-red-50 rounded-full px-4 py-2 border border-red-200 hover:shadow-sm transition"
      >
        <span className="text-sm font-medium text-red-600">
          {languages.find((lang) => lang.code === promptLanguage)?.label}
        </span>
        <ChevronDown className="w-4 h-4 text-red-400" />
      </button>

      {/* Dropdown Items */}
      {open && (
        <div className="absolute mt-2 w-full bg-white border border-red-200 rounded-md shadow-lg z-20">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                lang.code === promptLanguage
                  ? "text-red-600 font-semibold bg-red-50"
                  : "text-gray-700 hover:bg-red-100"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;
