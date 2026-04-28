"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroceryItem {
  uid: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
}

interface Props {
  item: GroceryItem;
  listId: string;
  userId: string;
  pendingChange?: {
    checked?: boolean;
    quantity?: string;
    unit?: string;
    isMarkedForDelete?: boolean;
  };
  onToggleChecked: () => void;
  onUpdateQuantity: (quantity: string, unit: string) => void;
  onMarkDelete: () => void;
  onCheckAttempt?: (item: GroceryItem) => void;
}

const UNITS = [
  "pieces",
  "cups",
  "tablespoons",
  "teaspoons",
  "grams",
  "kg",
  "ml",
  "liters",
  "pounds",
  "ounces",
  "dozen",
];

const GroceryItemRow: React.FC<Props> = ({
  item,
  listId,
  userId,
  pendingChange,
  onToggleChecked,
  onUpdateQuantity,
  onMarkDelete,
  onCheckAttempt,
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantity);
  const [editUnit, setEditUnit] = useState(item.unit);

  const getUnitLabel = (unit: string): string => {
    const unitKeyMap: Record<string, string> = {
      pieces: "unitPieces",
      cups: "unitCups",
      tablespoons: "unitTablespoons",
      teaspoons: "unitTeaspoons",
      grams: "unitGrams",
      kg: "unitKg",
      ml: "unitMl",
      liters: "unitLiters",
      pounds: "unitPounds",
      ounces: "unitOunces",
      dozen: "unitDozen",
    };

    const translationKey = unitKeyMap[unit];
    return translationKey ? t(translationKey) : unit;
  };

  // Use pending changes if available, otherwise use original item values
  const displayChecked = pendingChange?.checked ?? item.checked;
  const displayQuantity = pendingChange?.quantity ?? item.quantity;
  const displayUnit = pendingChange?.unit ?? item.unit;
  const isMarkedForDelete = pendingChange?.isMarkedForDelete ?? false;

  const handleToggleChecked = () => {
    const currentlyChecked = displayChecked;

    // If checking (false -> true), show conversion modal
    if (!currentlyChecked && onCheckAttempt) {
      onCheckAttempt(item);
    } else {
      // If unchecking, just toggle directly
      onToggleChecked();
    }
  };

  const handleSaveEdit = () => {
    if (!editQuantity.trim()) {
      return;
    }
    onUpdateQuantity(editQuantity.trim(), editUnit);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onMarkDelete();
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
        displayChecked
          ? "bg-gray-50 border-gray-200"
          : "bg-white border-red-100 hover:border-red-300"
      } ${isMarkedForDelete ? "bg-red-50 border-red-300" : ""} ${pendingChange ? "border-2 border-blue-400" : ""}`}
    >
      {/* Checkbox */}
      <Checkbox
        checked={displayChecked}
        onCheckedChange={handleToggleChecked}
        className="h-5 w-5"
      />

      {/* Item Details */}
      <div
        className={`flex-1 min-w-0 ${displayChecked ? "line-through text-gray-400" : ""} ${isMarkedForDelete ? "opacity-50" : ""}`}
      >
        {isEditing ? (
          <div className="space-y-2">
            <p className="font-medium text-gray-800">{item.name}</p>
            <div className="flex gap-2">
              <Input
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                placeholder={t("quantityInputPlaceholder")}
                className="flex-1"
              />
              <Select value={editUnit} onValueChange={setEditUnit}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {getUnitLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-red-50 p-2 rounded -m-2"
          >
            <p className="font-medium text-gray-800">{item.name}</p>
            <p className="text-sm text-gray-600">
              {displayQuantity} {getUnitLabel(displayUnit)}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {isEditing ? (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
            {t("cancel")}
          </Button>
          <Button
            size="sm"
            onClick={handleSaveEdit}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className={`hover:bg-red-50 ${isMarkedForDelete ? "text-green-600 hover:text-green-700" : "text-red-500 hover:text-red-700"}`}
          title={
            isMarkedForDelete
              ? t("clickToUndoDeletion")
              : t("clickToMarkForDeletion")
          }
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default GroceryItemRow;
