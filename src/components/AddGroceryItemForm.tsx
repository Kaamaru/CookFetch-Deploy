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
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  listId: string;
  userId: string;
  onItemAdded: (item: any) => void;
  onNewItemPending?: (itemId: string) => void;
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

const AddGroceryItemForm: React.FC<Props> = ({
  listId,
  userId,
  onItemAdded,
  onNewItemPending,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pieces");

  const getUnitLabel = (unitValue: string): string => {
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

    const translationKey = unitKeyMap[unitValue];
    return translationKey ? t(translationKey) : unitValue;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !quantity.trim()) {
      toast({
        title: t("missingInfo"),
        description: t("fillItemNameAndQuantity"),
        variant: "destructive",
      });
      return;
    }

    // Create item locally without API call - will be sent in batch save
    const newItem = {
      uid: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      quantity: quantity.trim(),
      unit,
      checked: false,
    };

    onItemAdded(newItem);
    // Mark this item as pending (new item to be created)
    if (onNewItemPending) {
      onNewItemPending(newItem.uid);
    }
    setName("");
    setQuantity("");
    setUnit("pieces");
    toast({
      title: t("itemAdded"),
      description: `"${name.trim()}" ${t("addedLocallySaveChangesToSync")}`,
    });
  };

  return (
    <Card className="border-red-200">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder={t("itemNameExampleEggs")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder={t("quantity")}
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="flex-1">
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

            <Button
              type="submit"
              disabled={!name.trim() || !quantity.trim()}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("add")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddGroceryItemForm;
