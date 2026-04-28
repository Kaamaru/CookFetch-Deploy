"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChefHat } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface IngredientSelectorProps {
  availableIngredients: string[];
  onIngredientsSelected: (ingredients: string[]) => void;
  loading?: boolean;
}

const IngredientSelector: React.FC<IngredientSelectorProps> = ({
  availableIngredients,
  onIngredientsSelected,
  loading = false,
}) => {
  const { t } = useLanguage();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredients, setCustomIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleIngredientToggle = (ingredient: string) => {
    const newSelected = selectedIngredients.includes(ingredient)
      ? selectedIngredients.filter((item) => item !== ingredient)
      : [...selectedIngredients, ingredient];

    setSelectedIngredients(newSelected);
  };

  const handleAddCustomIngredient = () => {
    if (
      newIngredient.trim() &&
      !customIngredients.includes(newIngredient.trim())
    ) {
      const newCustom = [...customIngredients, newIngredient.trim()];
      setCustomIngredients(newCustom);
      setNewIngredient("");
    }
  };

  const handleRemoveCustomIngredient = (ingredient: string) => {
    setCustomIngredients(
      customIngredients.filter((item) => item !== ingredient),
    );
  };

  const handleSubmit = () => {
    const allSelected = [...selectedIngredients, ...customIngredients];
    onIngredientsSelected(allSelected);
  };

  const allIngredients = [...selectedIngredients, ...customIngredients];

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ChefHat className="h-5 w-5 text-red-600" />
          <span>{t("selectYourIngredients")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Ingredients */}
        {availableIngredients.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">
              {t("fromYourInventory")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {availableIngredients.map((ingredient) => (
                <div key={ingredient} className="flex items-center space-x-2">
                  <Checkbox
                    id={ingredient}
                    checked={selectedIngredients.includes(ingredient)}
                    onCheckedChange={() => handleIngredientToggle(ingredient)}
                  />
                  <label
                    htmlFor={ingredient}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                  >
                    {ingredient}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Ingredients */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700">
              {t("customIngredients")}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("addCustom")}
            </Button>
          </div>

          {showCustomInput && (
            <div className="flex space-x-2">
              <Input
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder={t("enterIngredientName")}
                className="flex-1"
                onKeyPress={(e) =>
                  e.key === "Enter" && handleAddCustomIngredient()
                }
              />
              <Button
                onClick={handleAddCustomIngredient}
                size="sm"
                className="bg-red-500 hover:bg-red-700"
              >
                {t("add")}
              </Button>
            </div>
          )}

          {customIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customIngredients.map((ingredient) => (
                <Badge
                  key={ingredient}
                  variant="secondary"
                  className="flex items-center space-x-1 bg-red-100 text-red-800"
                >
                  <span className="capitalize">{ingredient}</span>
                  <button
                    onClick={() => handleRemoveCustomIngredient(ingredient)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Selected Summary */}
        {allIngredients.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-2">
              {t("selectedIngredients")} ({allIngredients.length}):
            </p>
            <p className="text-sm text-red-700">{allIngredients.join(", ")}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={allIngredients.length === 0 || loading}
          className="w-full bg-red-500 hover:bg-red-700"
        >
          {loading
            ? t("gettingRecipes")
            : `${t("getRecipeSuggestions")}${allIngredients.length > 0 ? ` (${allIngredients.length} ${t("ingredientsCountLabel")})` : ""}`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default IngredientSelector;
