"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, CheckCircle2 } from "lucide-react";
import AddGroceryItemForm from "@/components/AddGroceryItemForm";
import GroceryItemRow from "@/components/GroceryItemRow";
import { useLanguage } from "@/contexts/LanguageContext";

interface GroceryItem {
  uid: string;
  name: string;
  quantity: string;
  unit: string;
  checked: boolean;
}

interface GroceryList {
  list_id: string;
  list_name: string;
  items: GroceryItem[];
}

interface Props {
  list: GroceryList;
  currentUserId: string;
  onItemsUpdate: (items: GroceryItem[]) => void;
  pendingChanges: Record<string, any>;
  onToggleChecked: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: string, unit: string) => void;
  onMarkDelete: (itemId: string) => void;
  onSaveChanges: () => Promise<void>;
  isSaving: boolean;
  onNewItemPending?: (itemId: string) => void;
  onCheckAttempt?: (item: GroceryItem) => void;
}

const GroceryListDetail: React.FC<Props> = ({
  list,
  currentUserId,
  onItemsUpdate,
  pendingChanges,
  onToggleChecked,
  onUpdateQuantity,
  onMarkDelete,
  onSaveChanges,
  isSaving,
  onNewItemPending,
  onCheckAttempt,
}) => {
  const { t } = useLanguage();
  const checkedCount = list.items.filter((item) => item.checked).length;
  const uncheckedItems = list.items.filter((item) => !item.checked);
  const checkedItems = list.items.filter((item) => item.checked);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const handleItemAdded = (newItem: GroceryItem) => {
    onItemsUpdate([...list.items, newItem]);
  };

  const handleItemUpdate = (updated: GroceryItem) => {
    const updatedItems = list.items.map((item) =>
      item.uid === updated.uid ? updated : item,
    );
    onItemsUpdate(updatedItems);
  };

  const handleItemDelete = (itemId: string) => {
    const updatedItems = list.items.filter((item) => item.uid !== itemId);
    onItemsUpdate(updatedItems);
  };

  return (
    <div className="space-y-6">
      {/* List Header with Stats */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{list.list_name}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" />
              {list.items.length} {t("item")}
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              {checkedCount} {t("completed")}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {list.items.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{t("progress")}</span>
            <span className="font-semibold text-red-600">
              {Math.round((checkedCount / list.items.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-400 to-red-700 h-full transition-all duration-300"
              style={{
                width: `${(checkedCount / list.items.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Add Item Form */}
      <AddGroceryItemForm
        listId={list.list_id}
        userId={currentUserId}
        onItemAdded={handleItemAdded}
        onNewItemPending={onNewItemPending}
      />

      {/* Items List */}
      {list.items.length === 0 ? (
        <Card className="border-red-200 py-12">
          <CardContent className="text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t("noItemsYetAddOne")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Unchecked Items */}
          {uncheckedItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                {t("toBuy")} ({uncheckedItems.length})
              </h3>
              <div className="space-y-2">
                {uncheckedItems.map((item) => (
                  <GroceryItemRow
                    key={item.uid}
                    item={item}
                    listId={list.list_id}
                    userId={currentUserId}
                    pendingChange={pendingChanges[item.uid]}
                    onToggleChecked={() => onToggleChecked(item.uid)}
                    onUpdateQuantity={(qty, unit) =>
                      onUpdateQuantity(item.uid, qty, unit)
                    }
                    onMarkDelete={() => onMarkDelete(item.uid)}
                    onCheckAttempt={onCheckAttempt}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Checked Items */}
          {checkedItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                {t("bought")} ({checkedItems.length})
              </h3>
              <div className="space-y-2">
                {checkedItems.map((item) => (
                  <GroceryItemRow
                    key={item.uid}
                    item={item}
                    listId={list.list_id}
                    userId={currentUserId}
                    pendingChange={pendingChanges[item.uid]}
                    onToggleChecked={() => onToggleChecked(item.uid)}
                    onUpdateQuantity={(qty, unit) =>
                      onUpdateQuantity(item.uid, qty, unit)
                    }
                    onMarkDelete={() => onMarkDelete(item.uid)}
                    onCheckAttempt={onCheckAttempt}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completion Message */}
          {checkedCount === list.items.length && list.items.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-semibold">
                  {t("allDoneGreatJob")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Save Changes Button */}
          {hasPendingChanges && (
            <div className="flex gap-2 sticky bottom-0 bg-gradient-to-t from-white to-white/80 pt-4">
              <Button
                onClick={onSaveChanges}
                disabled={isSaving}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full"
              >
                {isSaving
                  ? t("saving")
                  : t("saveChangesWithCount", {
                      count: Object.keys(pendingChanges).length,
                    })}
              </Button>
              <Button
                variant="outline"
                disabled={isSaving}
                className="px-6 rounded-full"
              >
                {t("cancel")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroceryListDetail;
