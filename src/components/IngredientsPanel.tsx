"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Calendar, Clock, Trash2, Bell, BellOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * IngredientsPanel
 * - Props: minimal wiring to reuse the existing Foods logic.
 * - Renders: Add form, Edit form, Foods grid, Empty state.
 */

type FoodItem = {
  id?: string;
  name: string;
  category: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: string;
  purchaseDate?: string;
  time?: string;
  firestoreId?: string;
  notify?: boolean;
};

interface Props {
  filteredFoods: FoodItem[];
  showAddForm: boolean;
  setShowAddForm: (v: boolean) => void;
  newFood: any;
  setNewFood: (v: any) => void;
  editFood: any;
  setEditFood: (v: any) => void;
  editingFood: FoodItem | null;
  useCustomDate: boolean;
  setUseCustomDate: (b: boolean) => void;
  foodCategories: Array<{ value: string; label: string; emoji: string }>;
  expiry: Record<string, number>;
  handleAddFood: (e: React.FormEvent) => Promise<void>;
  handleEditFood: (e: React.FormEvent) => void;
  startEdit: (food: FoodItem) => void;
  cancelEdit: () => void;
  handleDeleteFood: (id: string) => Promise<void>;
  formatDate: (s: string) => string;
  getExpiryStatus: (n: number) => {
    color: string;
    label: string;
    icon: string;
  };
  pendingChanges: Record<
    string,
    {
      isMarkedForDelete?: boolean;
      notificationsEnabled?: boolean;
    }
  >;
  toggleDeleteMark: (id: string) => void;
  toggleNotification: (id: string) => void;
  addFoodCooldown?: boolean;
}

export default function IngredientsPanel({
  filteredFoods,
  showAddForm,
  setShowAddForm,
  newFood,
  setNewFood,
  editFood,
  setEditFood,
  editingFood,
  useCustomDate,
  setUseCustomDate,
  foodCategories,
  expiry,
  handleAddFood,
  handleEditFood,
  startEdit,
  cancelEdit,
  handleDeleteFood,
  formatDate,
  getExpiryStatus,
  pendingChanges,
  toggleDeleteMark,
  toggleNotification,
  addFoodCooldown,
}: Props) {
  const { t } = useLanguage();
  return (
    <div>
      {/* Add Food Form */}
      {showAddForm && (
        <Card className="mb-6 border-red-200 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">
              {t("addNewFoodItem")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleAddFood}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label htmlFor="food-name">{t("foodName")}</Label>
                <Input
                  id="food-name"
                  value={newFood.name}
                  onChange={(e) =>
                    setNewFood({ ...newFood, name: e.target.value })
                  }
                  placeholder={t("enterFoodName")}
                  className="rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="food-category"
                  className="text-sm font-medium text-gray-800"
                >
                  {t("category")}
                </Label>

                <Select
                  value={newFood.category}
                  onValueChange={(value) => {
                    const needsCustomMode =
                      value === "Unspecified" || value === "Other";
                    setNewFood({
                      ...newFood,
                      category: value,
                      expiryMode: needsCustomMode
                        ? "customTime"
                        : newFood.expiryMode,
                    });
                  }}
                  required
                >
                  <SelectTrigger
                    id="food-category"
                    className="h-11 rounded-2xl border-red-200 bg-red-50/40 px-4 text-sm shadow-sm transition hover:bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-300"
                  >
                    <SelectValue placeholder={t("selectFoodCategory")} />
                  </SelectTrigger>

                  <SelectContent className="rounded-2xl border-red-200 bg-white shadow-xl">
                    {foodCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="food-quantity"
                  className="text-sm font-medium text-gray-800"
                >
                  {t("quantity")}
                </Label>
                <Input
                  id="food-quantity"
                  value={newFood.quantity}
                  onChange={(e) =>
                    setNewFood({ ...newFood, quantity: e.target.value })
                  }
                  placeholder={t("quantityPlaceholder")}
                  className="rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="food-location"
                  className="text-sm font-medium text-gray-800"
                >
                  Location (optional)
                </Label>
                <Input
                  id="food-location"
                  value={newFood.location || ""}
                  onChange={(e) =>
                    setNewFood({ ...newFood, location: e.target.value })
                  }
                  placeholder="Pantry / Fridge / Freezer"
                  className="rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                />
              </div>

              {/* Custom Category Input for "Other" */}
              {newFood.category === "Other" && (
                <div className="md:col-span-2 space-y-2">
                  <Label
                    htmlFor="custom-category"
                    className="text-sm font-medium text-gray-800"
                  >
                    {t("customCategoryName")}
                  </Label>
                  <Input
                    id="custom-category"
                    value={newFood.customCategory}
                    onChange={(e) =>
                      setNewFood({ ...newFood, customCategory: e.target.value })
                    }
                    placeholder={t("enterCustomCategoryName")}
                    className="rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                    required={newFood.category === "Other"}
                  />
                </div>
              )}

              {/* Expiry Mode Selection */}
              <div className="md:col-span-2 space-y-4">
                <Label className="text-sm font-medium text-gray-800">
                  {t("expiryTime")}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewFood({ ...newFood, expiryMode: "predefined" })
                    }
                    disabled={
                      newFood.category === "Unspecified" ||
                      newFood.category === "Other"
                    }
                    className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                      newFood.expiryMode === "predefined"
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200`}
                  >
                    {t("predefined")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewFood({ ...newFood, expiryMode: "customDate" })
                    }
                    className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                      newFood.expiryMode === "customDate"
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {t("customDate")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewFood({ ...newFood, expiryMode: "customTime" })
                    }
                    className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                      newFood.expiryMode === "customTime"
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {t("customTime")}
                  </button>
                </div>

                {/* Predefined Expiry */}
                {newFood.expiryMode === "predefined" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="food-expiry-display"
                      className="text-xs font-medium text-zinc-600"
                    >
                      {t("expiryBasedOnCategory")}
                    </Label>
                    <div className="w-full rounded-xl border border-red-200 bg-gray-50 px-3 py-2.5 text-sm text-zinc-600 cursor-not-allowed">
                      {newFood.category && expiry[newFood.category]
                        ? newFood.category === "Unspecified" ||
                          newFood.category === "Other"
                          ? newFood.category.toLowerCase()
                          : `${newFood.category.toLowerCase()} ${expiry[newFood.category]} days`
                        : newFood.category
                          ? `${newFood.category.toLowerCase()} (${t("noExpiryData")})`
                          : "— — —"}
                    </div>
                    {newFood.category && expiry[newFood.category] && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-gray-700">
                        {t("willExpireInDays", {
                          days: expiry[newFood.category],
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Date Expiry */}
                {newFood.expiryMode === "customDate" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="food-expiry"
                      className="text-xs font-medium text-zinc-600"
                    >
                      {t("selectExpiryDate")}
                    </Label>
                    <Input
                      id="food-expiry"
                      type="date"
                      value={newFood.expiryDate}
                      onChange={(e) =>
                        setNewFood({ ...newFood, expiryDate: e.target.value })
                      }
                      required={newFood.expiryMode === "customDate"}
                      className="w-full rounded-xl border-red-200 bg-white px-3 py-2.5 text-sm text-zinc-800 transition focus:border-red-400 focus:ring-1 focus:ring-red-400"
                    />
                    {newFood.expiryDate && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-gray-700">
                        {t("expiryOnDate", {
                          date: new Date(
                            newFood.expiryDate,
                          ).toLocaleDateString(),
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Time Expiry */}
                {newFood.expiryMode === "customTime" && (
                  <div className="space-y-3">
                    <div className="space-y-2 relative">
                      <Label
                        htmlFor="days-dropdown"
                        className="text-xs font-medium text-zinc-600"
                      >
                        {t("selectNumberOfDays")}
                      </Label>
                      <select
                        id="days-dropdown"
                        value={newFood.customDays}
                        onChange={(e) =>
                          setNewFood({
                            ...newFood,
                            customDays: e.target.value,
                            customDaysValue:
                              e.target.value === "custom"
                                ? newFood.customDaysValue
                                : parseInt(e.target.value),
                          })
                        }
                        required={newFood.expiryMode === "customTime"}
                        className="w-full appearance-none rounded-xl border border-red-200 bg-white px-3 py-2.5 pr-9 text-sm text-zinc-800 transition focus:border-red-400 focus:ring-1 focus:ring-red-400"
                      >
                        <option value="">{t("selectDaysPlaceholder")}</option>
                        <option value="1">1 {t("day")}</option>
                        <option value="3">3 {t("days")}</option>
                        <option value="5">5 {t("days")}</option>
                        <option value="7">7 {t("days")}</option>
                        <option value="14">14 {t("days")}</option>
                        <option value="30">30 {t("days")}</option>
                        <option value="custom">{t("custom")}</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-[36px] text-zinc-400">
                        ▾
                      </span>
                    </div>

                    {newFood.customDays === "custom" && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="custom-days-input"
                          className="text-xs font-medium text-zinc-600"
                        >
                          {t("enterNumberOfDays")}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="custom-days-input"
                            type="number"
                            min="1"
                            max="365"
                            value={newFood.customDaysValue}
                            onChange={(e) =>
                              setNewFood({
                                ...newFood,
                                customDaysValue: Math.max(
                                  1,
                                  parseInt(e.target.value) || 1,
                                ),
                              })
                            }
                            className="w-full rounded-xl border-red-200 bg-white px-3 py-2.5 text-sm text-zinc-800 transition focus:border-red-400 focus:ring-1 focus:ring-red-400"
                          />
                          <span className="text-sm text-gray-600 font-medium">
                            {t("day")}
                          </span>
                        </div>
                      </div>
                    )}

                    {newFood.customDays && newFood.customDays !== "" && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-gray-700">
                        {t("expiresInDayCount", {
                          days: newFood.customDaysValue,
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notify Toggle */}
              <div className="md:col-span-2 flex items-center justify-between p-4 bg-red-50/40 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  {newFood.notify ? (
                    <Bell className="h-5 w-5 text-red-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <Label
                      htmlFor="notify-toggle"
                      className="text-sm font-medium text-gray-800 cursor-pointer"
                    >
                      {t("enableNotifications")}
                    </Label>
                    <p className="text-xs text-gray-600">
                      {t("notifyWhenAboutToExpire")}
                    </p>
                  </div>
                </div>
                <Switch
                  id="notify-toggle"
                  checked={newFood.notify}
                  onCheckedChange={(checked) =>
                    setNewFood({ ...newFood, notify: checked })
                  }
                  className="data-[state=checked]:bg-red-500"
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <Button
                  type="submit"
                  disabled={addFoodCooldown}
                  className="bg-red-500 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addFoodCooldown ? t("adding") : t("addFood")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                >
                  {t("cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Food Form */}
      {editingFood && (
        <Card className="mb-6 border-red-200 animate-slide-up">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">
              {t("editFoodItem")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleEditFood}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-food-name">{t("foodName")}</Label>
                <Input
                  id="edit-food-name"
                  value={editFood.name}
                  onChange={(e) =>
                    setEditFood({ ...editFood, name: e.target.value })
                  }
                  placeholder={t("enterFoodName")}
                  className="rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-food-category">{t("category")}</Label>
                <Input
                  id="edit-food-category"
                  value={editFood.category}
                  onChange={(e) =>
                    setEditFood({ ...editFood, category: e.target.value })
                  }
                  placeholder={t("categoryPlaceholder")}
                  className="rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="editExpiryOption"
                      checked={!useCustomDate}
                      onChange={() => setUseCustomDate(false)}
                      className="text-red-600"
                    />
                    <span>{t("predefined")}</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="editExpiryOption"
                      checked={useCustomDate}
                      onChange={() => setUseCustomDate(true)}
                      className="text-red-600"
                    />
                    <span>{t("customDate")}</span>
                  </label>
                </div>

                {!useCustomDate ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-food-expiry-select">
                      {t("expiryTime")}
                    </Label>
                    <select
                      id="edit-food-expiry-select"
                      value={editFood.selectedExpiryFood}
                      onChange={(e) =>
                        setEditFood({
                          ...editFood,
                          selectedExpiryFood: e.target.value,
                        })
                      }
                      className="w-full p-2 rounded-xl border border-red-200 focus:border-red-400 focus:ring-red-400"
                      required={!useCustomDate}
                    >
                      <option value="">{t("selectFoodCategory")}</option>
                      {Object.entries(expiry).map(([food, days]) => (
                        <option key={food} value={food}>
                          {food} ({days} days)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="edit-food-expiry">{t("customDate")}</Label>
                    <Input
                      id="edit-food-expiry"
                      type="date"
                      value={editFood.expiryDate}
                      onChange={(e) =>
                        setEditFood({ ...editFood, expiryDate: e.target.value })
                      }
                      className="rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                      required={useCustomDate}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-food-quantity">{t("quantity")}</Label>
                <Input
                  id="edit-food-quantity"
                  value={editFood.quantity}
                  onChange={(e) =>
                    setEditFood({ ...editFood, quantity: e.target.value })
                  }
                  placeholder={t("quantityPlaceholder")}
                  className="rounded-xl border-red-200 focus:border-red-400 focus:ring-red-400"
                  required
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <Button
                  type="submit"
                  className="bg-red-500 hover:bg-red-700 text-white rounded-xl"
                >
                  {t("updateFood")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                >
                  {t("cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Food Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFoods.map((food, index) => {
          const status = getExpiryStatus(food.daysUntilExpiry);
          const p = pendingChanges[food.id ?? ""] || {};
          return (
            <Card
              key={food.id ?? index}
              className={`border-red-200 hover:shadow-lg transition-all duration-200 animate-fade-in ${
                p.isMarkedForDelete
                  ? "border-red-300 bg-red-50/40 opacity-90 animate-delete-fade"
                  : ""
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3
                      className={`font-semibold text-lg mb-1 ${p.isMarkedForDelete ? "text-red-600 line-through" : "text-gray-900"}`}
                    >
                      {food.name}
                    </h3>
                    <p
                      className={`text-sm ${p.isMarkedForDelete ? "text-red-500" : "text-gray-600"}`}
                    >
                      {food.category}
                    </p>
                    <p
                      className={`text-sm ${p.isMarkedForDelete ? "text-red-400" : "text-gray-500"}`}
                    >
                      {t("quantity")}: {food.quantity || t("unspecified")}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {/* Notification Toggle */}
                    {(() => {
                      const notifyState =
                        p.notificationsEnabled !== undefined
                          ? p.notificationsEnabled
                          : food.notify;
                      return (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`p-2 transition-colors ${notifyState === true ? "hover:bg-blue-50 text-blue-600" : notifyState === false ? "hover:bg-gray-100 text-gray-400" : "hover:bg-gray-50"}`}
                          onClick={() => toggleNotification(food.id!)}
                          title={
                            notifyState === true
                              ? t("notificationsEnabled")
                              : notifyState === false
                                ? t("notificationsDisabled")
                                : t("toggleNotification")
                          }
                        >
                          {notifyState === true ? (
                            <Bell className="h-4 w-4" />
                          ) : notifyState === false ? (
                            <BellOff className="h-4 w-4" />
                          ) : (
                            <Bell className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      );
                    })()}

                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`p-2 transition-all ${p.isMarkedForDelete ? "bg-red-100" : "hover:bg-red-50 text-red-600"}`}
                      onClick={() => toggleDeleteMark(food.id!)}
                      title={
                        p.isMarkedForDelete
                          ? t("clickToUndoDeletion")
                          : t("clickToMarkForDeletion")
                      }
                    >
                      <Trash2
                        className={`h-4 w-4 ${p.isMarkedForDelete ? "text-red-700" : "text-red-600"}`}
                      />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Badge
                    className={`${status.color} px-3 py-1 text-xs font-medium border`}
                  >
                    {status.icon} {status.label}
                  </Badge>

                  {food.purchaseDate && (
                    <div
                      className={`flex items-center text-sm ${p.isMarkedForDelete ? "text-red-500" : "text-gray-600"}`}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {t("date")}: {formatDate(food.purchaseDate)}
                      {/* {food.time && (
                        <span className="ml-2 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {food.time.replace("-", ":")}
                        </span>
                      )} */}
                    </div>
                  )}

                  <div
                    className={`flex items-center text-sm ${p.isMarkedForDelete ? "text-red-500" : "text-gray-600"}`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t("expires")} {formatDate(food.expiryDate)}
                  </div>

                  {food.daysUntilExpiry >= 0 && (
                    <p
                      className={`text-sm ${p.isMarkedForDelete ? "text-red-500" : "text-gray-600"}`}
                    >
                      {food.daysUntilExpiry === 0
                        ? t("expiresEarlyToday")
                        : food.daysUntilExpiry === 1
                          ? t("expiresEarlyTomorrow")
                          : t("expiresInDayCount", {
                              days: food.daysUntilExpiry,
                            })}
                    </p>
                  )}

                  {food.daysUntilExpiry < 0 && (
                    <p
                      className={`text-sm font-medium ${p.isMarkedForDelete ? "text-red-700" : "text-red-600"}`}
                    >
                      {t("expired")} {Math.abs(food.daysUntilExpiry)}{" "}
                      {t("expiredDaysAgo")}
                    </p>
                  )}

                  {p.isMarkedForDelete && (
                    <p className="text-xs text-red-700 font-semibold pt-2 border-t border-red-200">
                      ⚠️ {t("markedForDeletionSaveChanges")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state (keeps the same behavior as before) */}
      {filteredFoods.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔍</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t("noFoodItemsFound")}
          </h3>
          <p className="text-gray-600 mb-4">{t("startByAdding")}</p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-red-500 hover:bg-red-700 text-white rounded-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addYourFirstFood")}
          </Button>
        </div>
      )}
    </div>
  );
}
