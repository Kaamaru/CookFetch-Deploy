"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  ShoppingCart,
  Loader,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import GroceryListCard from "@/components/GroceryListCard";
import GroceryListDetail from "@/components/GroceryListDetail";
import ConvertToScheduleModal from "@/components/ConvertToScheduleModal";
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

const GroceryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const [lists, setLists] = useState<GroceryList[]>([]);
  const [activeList, setActiveList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Batch update tracking - similar to Foods.tsx pattern
  const [pendingChanges, setPendingChanges] = useState<
    Record<
      string,
      {
        checked?: boolean;
        quantity?: string;
        unit?: string;
        isMarkedForDelete?: boolean;
        isNew?: boolean;
      }
    >
  >({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Conversion modal state
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [itemToConvert, setItemToConvert] = useState<GroceryItem | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Cache key for localStorage
  const getCacheKey = () => `grocery_lists_${currentUser?.uid}`;
  const getCacheTimestampKey = () =>
    `grocery_lists_timestamp_${currentUser?.uid}`;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Load from localStorage cache
  const loadFromCache = (targetListId?: string | null) => {
    try {
      const cached = localStorage.getItem(getCacheKey());
      const timestamp = localStorage.getItem(getCacheTimestampKey());

      if (cached && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp);
        if (cacheAge < CACHE_TTL) {
          const parsed = JSON.parse(cached);
          // Never trust an empty cache snapshot; force a backend check instead.
          if (!Array.isArray(parsed) || parsed.length === 0) {
            return false;
          }
          setLists(parsed);
          if (targetListId) {
            const matchedList = parsed.find(
              (list: GroceryList) => list.list_id === targetListId,
            );
            setActiveList(matchedList || parsed[0] || null);
          } else if (!activeList && parsed.length > 0) {
            setActiveList(parsed[0]);
          }
          return true;
        }
      }
    } catch (e) {
      console.warn("Failed to load from cache:", e);
    }
    return false;
  };

  // Save to localStorage cache
  const saveToCache = (listData: GroceryList[]) => {
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(listData));
      localStorage.setItem(getCacheTimestampKey(), Date.now().toString());
    } catch (e) {
      console.warn("Failed to save to cache:", e);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  // Load all grocery lists
  const loadLists = async (forceRefresh = false) => {
    if (!currentUser?.uid) return;
    const targetListId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("list_id")
        : null;

    // Try cache first if not forcing refresh
    if (!forceRefresh && loadFromCache(targetListId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getAllGroceryLists(currentUser.uid);

      if (data.success) {
        const listData = data.lists || [];
        setLists(listData);
        saveToCache(listData); // Cache the data

        // Update activeList with fresh data from server
        if (targetListId) {
          const matchedList = listData.find((l) => l.list_id === targetListId);
          if (matchedList) {
            setActiveList(matchedList);
          } else if (listData.length > 0) {
            setActiveList(listData[0]);
          }
        } else if (activeList) {
          const updatedActiveList = listData.find(
            (l) => l.list_id === activeList.list_id,
          );
          if (updatedActiveList) {
            setActiveList(updatedActiveList);
          }
        } else if (listData.length > 0) {
          setActiveList(listData[0]);
        }
      } else {
        setError(data.error || t("failedToLoadGroceryLists"));
      }
    } catch (err) {
      // Try cache as fallback on error
      const cached = loadFromCache();
      if (!cached) {
        const message =
          err instanceof Error ? err.message : t("failedToLoadGroceryLists");
        setError(message);
        console.error("Error loading grocery lists:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh lists from server
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLists(true); // Force refresh from server
    setIsRefreshing(false);
    toast({
      title: t("refreshed"),
      description: t("groceryListsUpdatedFromServer"),
    });
  };

  // Load lists on mount
  useEffect(() => {
    if (currentUser?.uid) {
      loadLists();
    }
  }, [currentUser?.uid]);

  // Create new list
  const handleCreateList = async () => {
    if (!currentUser?.uid || !newListName.trim()) return;

    setIsCreatingList(true);

    try {
      const data = await apiClient.createGroceryList(currentUser.uid, {
        list_name: newListName,
      });

      if (data.success) {
        const newList = data.list;
        setLists([...lists, newList]);
        setActiveList(newList);
        setNewListName("");
        setShowCreateDialog(false);
        toast({
          title: t("listCreated"),
          description: t("listCreatedWithName", { name: newListName }),
        });
      } else {
        toast({
          title: t("failed"),
          description: data.error || t("failedToCreateList"),
          variant: "destructive",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("failedToCreateList");
      toast({
        title: t("failed"),
        description: message,
        variant: "destructive",
      });
      console.error("Error creating list:", err);
    } finally {
      setIsCreatingList(false);
    }
  };

  // Delete list
  const handleDeleteList = async (listId: string) => {
    if (!currentUser?.uid) return;

    const confirmed = window.confirm(t("deleteGroceryListConfirm"));
    if (!confirmed) return;

    try {
      const data = await apiClient.deleteGroceryList(currentUser.uid, listId);

      if (data.success) {
        const updatedLists = lists.filter((l) => l.list_id !== listId);
        setLists(updatedLists);
        if (activeList?.list_id === listId) {
          setActiveList(updatedLists[0] || null);
        }
        toast({
          title: t("listDeleted"),
          description: t("groceryListRemoved"),
        });
      } else {
        toast({
          title: t("failed"),
          description: data.error || t("failedToDeleteList"),
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting list:", err);
      toast({
        title: t("failed"),
        description: t("failedToDeleteList"),
        variant: "destructive",
      });
    }
  };

  // Track local changes without API calls (batch update pattern)
  const toggleItemChecked = (itemId: string) => {
    if (!activeList) return;
    const item = activeList.items.find((i) => i.uid === itemId);
    if (!item) return;

    const currentChange = pendingChanges[itemId] || {};
    const currentChecked =
      currentChange.checked !== undefined
        ? currentChange.checked
        : item.checked;
    const newChecked = !currentChecked;

    // Create new change object
    const newChange: any = { ...currentChange };

    if (newChecked === item.checked) {
      // Back to original - remove the checked field
      delete newChange.checked;
    } else {
      // Different from original - include it
      newChange.checked = newChecked;
    }

    // If no changes left, remove the item entirely
    if (Object.keys(newChange).length === 0) {
      const { [itemId]: _, ...rest } = pendingChanges;
      setPendingChanges(rest);
    } else {
      // Keep other pending changes, just update
      setPendingChanges((prev) => ({
        ...prev,
        [itemId]: newChange,
      }));
    }
  };

  const updateItemQuantity = (
    itemId: string,
    quantity: string,
    unit: string,
  ) => {
    if (!activeList) return;
    const item = activeList.items.find((i) => i.uid === itemId);
    if (!item) return;

    const currentChange = pendingChanges[itemId] || {};
    const hasChanged = quantity !== item.quantity || unit !== item.unit;

    // Create new change object
    const newChange: any = { ...currentChange };

    if (!hasChanged) {
      // Back to original - remove quantity and unit fields
      delete newChange.quantity;
      delete newChange.unit;
    } else {
      // Different from original - include them
      newChange.quantity = quantity;
      newChange.unit = unit;
    }

    // If no changes left, remove the item entirely
    if (Object.keys(newChange).length === 0) {
      const { [itemId]: _, ...rest } = pendingChanges;
      setPendingChanges(rest);
    } else {
      // Keep other pending changes, just update
      setPendingChanges((prev) => ({
        ...prev,
        [itemId]: newChange,
      }));
    }
  };

  const markItemForDelete = (itemId: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        isMarkedForDelete: !prev[itemId]?.isMarkedForDelete,
      },
    }));
  };

  const markNewItemPending = (itemId: string) => {
    // Mark new items as pending so they get created
    setPendingChanges((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], isNew: true },
    }));
  };

  // Handle checkout attempt - show conversion modal
  const handleCheckAttempt = (item: GroceryItem) => {
    setItemToConvert(item);
    setConvertModalOpen(true);
  };

  // Convert grocery item to schedule
  const handleConvertToSchedule = async (data: {
    date: string;
    time: string;
    category?: string;
    expiry: string;
    location?: string;
  }) => {
    if (!currentUser?.uid || !activeList || !itemToConvert) return;

    setIsConverting(true);

    try {
      const responseData = await apiClient.convertGroceryToSchedule(
        currentUser.uid,
        activeList.list_id,
        itemToConvert.uid,
        {
          date: data.date,
          time: data.time,
          category: data.category || "cooking",
          expiry: data.expiry,
          location: data.location?.trim() || undefined,
        },
      );

      if (responseData.success) {
        // Mark the item as checked
        toggleItemChecked(itemToConvert.uid);

        toast({
          title: t("convertedToSchedule"),
          description: t("scheduledForAt", {
            name: itemToConvert.name,
            date: data.date,
            time: data.time.replace("-", ":"),
          }),
        });

        // Refresh data
        await loadLists(true);
        setConvertModalOpen(false);
        setItemToConvert(null);
      } else {
        toast({
          title: t("conversionFailed"),
          description: responseData.message || t("failedToConvertToSchedule"),
          variant: "destructive",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("conversionFailed");
      toast({
        title: t("failed"),
        description: message,
        variant: "destructive",
      });
      console.error("Error converting item:", err);
    } finally {
      setIsConverting(false);
    }
  };

  // Batch save all changes
  const handleSaveChanges = async () => {
    if (!currentUser?.uid || !activeList) return;

    const changes = Object.entries(pendingChanges);
    if (changes.length === 0) {
      toast({
        title: t("noChanges"),
        description: t("noPendingChangesToSave"),
      });
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Process NEW items first (create them on backend)
      for (const [itemId, change] of changes) {
        if (change.isNew) {
          const item = activeList.items.find((i) => i.uid === itemId);
          if (!item) continue;

          try {
            const data = await apiClient.addGroceryItem(
              currentUser.uid,
              activeList.list_id,
              {
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                checked: item.checked,
              },
            );
            if (data.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (err) {
            errorCount++;
            console.error(`Error creating item ${itemId}:`, err);
          }
        }
      }

      // Process deletions
      for (const [itemId, change] of changes) {
        if (change.isMarkedForDelete) {
          try {
            const data = await apiClient.deleteGroceryItem(
              currentUser.uid,
              activeList.list_id,
              itemId,
            );

            if (data.success !== false) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (err) {
            errorCount++;
            console.error(`Error deleting item ${itemId}:`, err);
          }
        }
      }

      // Then process updates (checked, quantity, unit)
      for (const [itemId, change] of changes) {
        if (change.isMarkedForDelete || change.isNew) continue;

        if (
          change.checked !== undefined ||
          change.quantity !== undefined ||
          change.unit !== undefined
        ) {
          const updatePayload: any = {};
          if (change.checked !== undefined)
            updatePayload.checked = change.checked;
          if (change.quantity !== undefined)
            updatePayload.quantity = change.quantity;
          if (change.unit !== undefined) updatePayload.unit = change.unit;

          try {
            const data = await apiClient.updateGroceryItem(
              currentUser.uid,
              activeList.list_id,
              itemId,
              updatePayload,
            );

            if (data.success !== false) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (err) {
            errorCount++;
            console.error(`Error updating item ${itemId}:`, err);
          }
        }
      }

      // Reload to sync with backend (force refresh, don't use cache)
      await loadLists(true);
      setPendingChanges({});

      toast({
        title: t("changesSaved"),
        description: t("itemsUpdatedFailedCount", {
          updated: successCount,
          failed: errorCount,
        }),
        variant: errorCount > 0 ? "destructive" : "default",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("failedToSaveChanges");
      setError(message);
      toast({
        title: t("failed"),
        description: message,
        variant: "destructive",
      });
      console.error("Error saving changes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Update active list items
  const updateActiveListItems = (updatedItems: GroceryItem[]) => {
    if (!activeList) return;

    const updatedActiveList = { ...activeList, items: updatedItems };
    setActiveList(updatedActiveList);

    // Also update in lists array
    setLists(
      lists.map((l) =>
        l.list_id === activeList.list_id ? updatedActiveList : l,
      ),
    );
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              {t("groceryLists")}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="rounded-full px-6"
              title={t("refreshGroceryListsTooltip")}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {t("refresh")}
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("newList")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lists Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg">{t("yourLists")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader className="w-6 h-6 text-red-600 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="flex gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                ) : lists.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    {t("noListsYetCreateOne")}
                  </p>
                ) : (
                  lists.map((list) => (
                    <GroceryListCard
                      key={list.list_id}
                      list={list}
                      isActive={activeList?.list_id === list.list_id}
                      onSelect={() => setActiveList(list)}
                      onDelete={() => handleDeleteList(list.list_id)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* List Details */}
          <div className="lg:col-span-2">
            {activeList ? (
              <GroceryListDetail
                list={activeList}
                currentUserId={currentUser.uid}
                onItemsUpdate={updateActiveListItems}
                pendingChanges={pendingChanges}
                onToggleChecked={toggleItemChecked}
                onUpdateQuantity={updateItemQuantity}
                onMarkDelete={markItemForDelete}
                onSaveChanges={handleSaveChanges}
                isSaving={isSaving}
                onNewItemPending={markNewItemPending}
                onCheckAttempt={handleCheckAttempt}
              />
            ) : (
              <Card className="border-red-200 h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {lists.length === 0
                      ? t("createListToGetStarted")
                      : t("selectListToViewItems")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Create List Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createNewGroceryList")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("groceryListNamePlaceholder")}
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleCreateList();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleCreateList}
              disabled={!newListName.trim() || isCreatingList}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCreatingList ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                t("create")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Schedule Modal */}
      <ConvertToScheduleModal
        item={itemToConvert}
        open={convertModalOpen}
        onOpenChange={setConvertModalOpen}
        onConvert={handleConvertToSchedule}
        isLoading={isConverting}
      />
    </div>
  );
};

export default GroceryPage;
