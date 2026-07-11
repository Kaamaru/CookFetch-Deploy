"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Camera,
  Loader,
  AlertTriangle,
  Trash2,
  ScanLine,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type BatchDetectItem } from "@/lib/apiClient";
import { FOOD_CATEGORIES } from "@/lib/foodCategories";

const ACCEPTED_FORMATS = ["image/png", "image/jpeg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 12;
/** Rows at or below this confidence are visually flagged for review. */
const LOW_CONFIDENCE = 0.5;

// A local, editable copy of a detected item (adds a stable id + edit fields).
type DraftRow = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  suggestedExpiry: string;
  confidence: number;
};

type Props = {
  /** Called after items are successfully added so the parent can refresh. */
  onAdded?: () => void;
};

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const draftFromDetected = (item: BatchDetectItem, index: number): DraftRow => ({
  id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
  name: (item.name_en || item.name_th || "").trim(),
  category: item.category || "Other",
  quantity: item.estimated_quantity || "",
  unit: item.unit || "",
  suggestedExpiry: item.suggested_expiry || "",
  confidence: item.confidence ?? 0,
});

const BatchScan: React.FC<Props> = ({ onAdded }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<"capture" | "review">("capture");
  const [files, setFiles] = useState<File[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [notifyAll, setNotifyAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length === 0) return;
    setError(null);

    const valid: File[] = [];
    for (const file of picked) {
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        setError(t("uploadPngOrJpg"));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t("imageSizeLimit"));
        continue;
      }
      valid.push(file);
    }

    // Append (and de-dupe) so users can capture several photos across taps.
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
      const merged = [...prev];
      for (const f of valid) {
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(f);
        }
      }
      return merged.slice(0, MAX_IMAGES);
    });

    // Allow re-selecting the same file again if needed.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearPhotos = () => {
    setFiles([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDetect = async () => {
    if (!currentUser?.uid) {
      setError(t("batchLoginRequired"));
      return;
    }
    if (files.length === 0) {
      setError(t("batchNoImages"));
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));

      const data = await apiClient.batchDetect(formData);
      const drafts = (data.items ?? []).map(draftFromDetected);
      setRows(drafts);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("batchDetectFailed"));
    } finally {
      setIsDetecting(false);
    }
  };

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const resetAll = () => {
    setPhase("capture");
    setFiles([]);
    setRows([]);
    setNotifyAll(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmAddAll = async () => {
    if (!currentUser?.uid) {
      setError(t("batchLoginRequired"));
      return;
    }
    const toAdd = rows.filter((r) => r.name.trim().length > 0);
    if (toAdd.length === 0) return;

    setIsAdding(true);
    setError(null);

    const now = new Date();
    const formattedDate = getLocalDateString(now);
    // Match the existing manual-add "time" convention (DD-MM-YYYY).
    const formattedTime = `${String(now.getDate()).padStart(2, "0")}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}-${now.getFullYear()}`;

    let added = 0;
    let failed = 0;

    // Sequential writes via the existing single-item add function.
    for (const row of toAdd) {
      const quantity = [row.quantity.trim(), row.unit.trim()]
        .filter(Boolean)
        .join(" ")
        .trim();

      try {
        await apiClient.addSchedule(currentUser.uid, {
          name: row.name.trim(),
          time: formattedTime,
          date: formattedDate,
          expiry: row.suggestedExpiry,
          notify: notifyAll,
          category: row.category,
          quantity: quantity || t("notSet"),
        });
        added += 1;
      } catch (err) {
        console.error("batch add failed for", row.name, err);
        failed += 1;
      }
    }

    setIsAdding(false);

    if (failed === 0) {
      toast({
        title: t("batchAddedSuccess", { count: added }),
      });
      onAdded?.();
      resetAll();
    } else if (added > 0) {
      setError(
        t("batchAddPartial", { added, total: toAdd.length, failed }),
      );
      onAdded?.();
    } else {
      setError(t("batchAddFailed"));
    }
  };

  if (!currentUser?.uid) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{t("batchLoginRequired")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {phase === "capture" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              {t("batchScanTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{t("batchScanHelp")}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              aria-label={t("addPhotos")}
            />

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={isDetecting || files.length >= MAX_IMAGES}
              >
                <Camera className="w-4 h-4 mr-2" />
                {t("addPhotos")}
              </Button>
              {files.length > 0 && (
                <Button
                  onClick={clearPhotos}
                  variant="ghost"
                  disabled={isDetecting}
                >
                  {t("clearPhotos")}
                </Button>
              )}
              <Button
                onClick={handleDetect}
                disabled={files.length === 0 || isDetecting}
                className="bg-red-600 hover:bg-red-700 text-white ml-auto"
              >
                {isDetecting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    {t("detecting")}
                  </>
                ) : (
                  t("detectItems")
                )}
              </Button>
            </div>

            {files.length > 0 && (
              <>
                <p className="text-sm text-gray-600">
                  {t("photosSelectedCount", { count: files.length })}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {files.map((file, i) => (
                    <img
                      key={`${file.name}-${file.lastModified}-${i}`}
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </>
            )}

            {isDetecting && (
              <div className="flex items-center gap-3 text-gray-600">
                <Loader className="w-4 h-4 animate-spin" />
                <span>{t("batchDetecting")}</span>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {phase === "review" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              {t("batchReviewTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{t("batchReviewHelp")}</p>

            {rows.length === 0 ? (
              <div className="rounded-lg border border-gray-200 p-6 text-center text-gray-500">
                {t("batchNoItemsDetected")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("batchColName")}</TableHead>
                      <TableHead>{t("batchColCategory")}</TableHead>
                      <TableHead className="w-20">{t("batchColQuantity")}</TableHead>
                      <TableHead className="w-24">{t("batchColUnit")}</TableHead>
                      <TableHead>{t("batchColExpiry")}</TableHead>
                      <TableHead>{t("batchColConfidence")}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      const isLow = row.confidence <= LOW_CONFIDENCE;
                      return (
                        <TableRow
                          key={row.id}
                          className={isLow ? "bg-amber-50" : undefined}
                        >
                          <TableCell>
                            <Input
                              value={row.name}
                              onChange={(e) =>
                                updateRow(row.id, { name: e.target.value })
                              }
                              className="min-w-[9rem]"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.category}
                              onValueChange={(v) =>
                                updateRow(row.id, { category: v })
                              }
                            >
                              <SelectTrigger className="min-w-[8rem]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FOOD_CATEGORIES.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>
                                    {c.emoji} {t(c.labelKey)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.quantity}
                              onChange={(e) =>
                                updateRow(row.id, { quantity: e.target.value })
                              }
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={row.unit}
                              onChange={(e) =>
                                updateRow(row.id, { unit: e.target.value })
                              }
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={row.suggestedExpiry}
                              onChange={(e) =>
                                updateRow(row.id, {
                                  suggestedExpiry: e.target.value,
                                })
                              }
                              className="min-w-[8.5rem]"
                            />
                          </TableCell>
                          <TableCell>
                            {isLow ? (
                              <Badge className="bg-amber-100 text-amber-800 gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {Math.round(row.confidence * 100)}%
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700">
                                {Math.round(row.confidence * 100)}%
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => removeRow(row.id)}
                              title={t("removeRow")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notifyAll}
                onChange={(e) => setNotifyAll(e.target.checked)}
                className="h-4 w-4"
              />
              {t("notifyAll")}
            </label>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={resetAll}
                disabled={isAdding}
              >
                {t("startOver")}
              </Button>
              <Button
                onClick={handleConfirmAddAll}
                disabled={isAdding || rows.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white ml-auto"
              >
                {isAdding ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    {t("addingItems")}
                  </>
                ) : (
                  t("confirmAndAddAll", { count: rows.length })
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchScan;
