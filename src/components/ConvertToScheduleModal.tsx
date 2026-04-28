"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Tag, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroceryItem {
  uid: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
}

interface ConversionData {
  date: string; // YYYY-MM-DD
  time: string; // HH-MM
  category?: string;
  expiry: string; // YYYY-MM-DD
  location?: string;
}

interface Props {
  item: GroceryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvert: (data: ConversionData) => Promise<void>;
  isLoading?: boolean;
}

const CATEGORIES = [
  { value: "cooking", labelKey: "scheduleCategoryCooking" },
  { value: "grocery", labelKey: "scheduleCategoryGrocery" },
  { value: "shopping", labelKey: "scheduleCategoryShopping" },
  { value: "meal-prep", labelKey: "scheduleCategoryMealPrep" },
  { value: "meal", labelKey: "scheduleCategoryMeal" },
  { value: "other", labelKey: "scheduleCategoryOther" },
];

const EXPIRY_UNITS = [
  { label: "days", value: "days" },
  { label: "weeks", value: "weeks" },
  { label: "months", value: "months" },
];

const ConvertToScheduleModal: React.FC<Props> = ({
  item,
  open,
  onOpenChange,
  onConvert,
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("cooking");
  const [expiryMode, setExpiryMode] = useState<"date" | "custom">("date");
  const [expiry, setExpiry] = useState("");
  const [customExpiryAmount, setCustomExpiryAmount] = useState("7");
  const [customExpiryUnit, setCustomExpiryUnit] = useState<
    "days" | "weeks" | "months"
  >("days");
  const [location, setLocation] = useState("");

  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}-${minutes}`;
  };

  const calculateExpiryDate = (): string => {
    const baseDate = new Date();
    const amount = parseInt(customExpiryAmount) || 0;
    let daysToAdd = 0;

    if (customExpiryUnit === "days") {
      daysToAdd = amount;
    } else if (customExpiryUnit === "weeks") {
      daysToAdd = amount * 7;
    } else if (customExpiryUnit === "months") {
      daysToAdd = amount * 30;
    }

    const expiryDate = new Date(baseDate);
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);
    return expiryDate.toISOString().split("T")[0];
  };

  const handleConvert = async () => {
    const finalExpiry = expiryMode === "date" ? expiry : calculateExpiryDate();

    if (!date || !time || !finalExpiry) {
      return;
    }

    try {
      await onConvert({
        date,
        time,
        category: category || "cooking",
        expiry: finalExpiry,
        location: location.trim() || undefined,
      });
      // Reset form
      setDate("");
      setTime("");
      setCategory("cooking");
      setExpiryMode("date");
      setExpiry("");
      setCustomExpiryAmount("7");
      setCustomExpiryUnit("days");
      setLocation("");
      onOpenChange(false);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("convertToSchedule")}</DialogTitle>
          <DialogDescription>{t("convertToScheduleDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Info */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">{t("item")}</p>
            <p className="text-lg font-semibold text-gray-800">{item.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              {item.quantity} {item.unit}
            </p>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t("date")}
            </Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={getTodayDate()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setDate(getTodayDate())}
                disabled={isLoading}
                className="flex items-center gap-2"
                title={t("setToToday")}
              >
                {t("today")}
              </Button>
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t("time24HourFormat")}
            </Label>
            <div className="flex gap-2">
              <Input
                type="time"
                value={time.replace("-", ":")}
                onChange={(e) => {
                  const timeValue = e.target.value;
                  // Convert from HH:MM to HH-MM format
                  const formatted = timeValue.replace(":", "-");
                  setTime(formatted);
                }}
                disabled={isLoading}
                placeholder={t("timeFormatPlaceholder")}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setTime(getCurrentTime())}
                disabled={isLoading}
                className="flex items-center gap-2"
                title={t("setToCurrentTime")}
              >
                <Zap className="w-4 h-4" />
                {t("now")}
              </Button>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {t("category")}
            </Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {t(cat.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location (optional)</Label>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isLoading}
              placeholder="Pantry / Fridge / Freezer"
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t("expiryDate")}
              </Label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setExpiryMode("date")}
                  className={`text-xs px-2 py-1 rounded ${
                    expiryMode === "date"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {t("date")}
                </button>
                <button
                  type="button"
                  onClick={() => setExpiryMode("custom")}
                  className={`text-xs px-2 py-1 rounded ${
                    expiryMode === "custom"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {t("custom")}
                </button>
              </div>
            </div>

            {expiryMode === "date" ? (
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  min={date || getTodayDate()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExpiry(getTodayDate())}
                  disabled={isLoading}
                  title={t("setToToday")}
                >
                  {t("today")}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={customExpiryAmount}
                  onChange={(e) => setCustomExpiryAmount(e.target.value)}
                  placeholder={t("amount")}
                  disabled={isLoading}
                  className="w-20"
                />
                <Select
                  value={customExpiryUnit}
                  onValueChange={(value) =>
                    setCustomExpiryUnit(value as "days" | "weeks" | "months")
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {t(unit.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConvert}
            disabled={
              !date || !time || (!expiry && expiryMode === "date") || isLoading
            }
            className="bg-red-500 hover:bg-red-700"
          >
            {isLoading ? t("converting") : t("convertToSchedule")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertToScheduleModal;
