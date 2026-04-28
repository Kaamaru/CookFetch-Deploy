'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const GroceryListCard: React.FC<Props> = ({ list, isActive, onSelect, onDelete }) => {
  const checkedCount = list.items.filter((item) => item.checked).length;

  return (
    <div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isActive
          ? "border-red-600 bg-red-50"
          : "border-gray-200 bg-white hover:border-red-300"
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{list.list_name}</h3>
          <p className="text-sm text-gray-500">
            {checkedCount} of {list.items.length} items
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress bar */}
      {list.items.length > 0 && (
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-red-500 h-full transition-all"
            style={{
              width: `${(checkedCount / list.items.length) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GroceryListCard;
