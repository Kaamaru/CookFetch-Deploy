"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertTriangle, CheckCircle, Loader } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient, type ClassificationResult, type CreateListFromInfoResponse } from "@/lib/apiClient";

const ImageClassifier: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [information, setInformation] = useState<string>("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  const ACCEPTED_FORMATS = ["image/png", "image/jpeg"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    if (!ACCEPTED_FORMATS.includes(file.type)) {
      setError(t("uploadPngOrJpg"));
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t("imageSizeLimit"));
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClassify = async () => {
    if (!selectedFile) {
      setError(t("selectImageFirst"));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const data: ClassificationResult = await apiClient.classifyImage(formData, information);
      setResult(data);

      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("failedToClassifyImage");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setResult(null);
    setInformation("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateListFromRecipe = async () => {
    if (!result) {
      setError(t("classifyImageFirst"));
      return;
    }

    if (!currentUser?.uid) {
      setError(t("logInBeforeCreateList"));
      return;
    }

    if (!result.ingredients || Object.keys(result.ingredients).length === 0) {
      setError(t("recipeHasNoIngredients"));
      return;
    }

    setIsCreatingList(true);
    setError(null);

    try {
      const nutritionPayload = result.nutrients
        ? Object.entries(result.nutrients).reduce<Record<string, string>>(
            (acc, [key, value]) => {
              if (value) acc[key] = value;
              return acc;
            },
            {},
          )
        : undefined;

      const payload: CreateListFromInfoResponse = await apiClient.createRecipeListFromInfo({
        userid: currentUser.uid,
        recipe_name: result.dishName,
        ingredients: result.ingredients,
        nutrition: nutritionPayload,
      });

      if (payload.status === "failed") {
        throw new Error(
          payload.message || "Create list failed.",
        );
      }

      const createdListId = payload.data?.list_id;
      const createdListName = payload.data?.list_name || result.dishName;
      const itemsAdded = payload.data?.items_added ?? 0;

      toast({
        title: t("groceryListCreated"),
        description: t("addedIngredientsToList", {
          count: itemsAdded,
          name: createdListName,
        }),
      });

      if (createdListId) {
        router.push(`/grocery?list_id=${encodeURIComponent(createdListId)}`);
      } else {
        router.push("/grocery");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("failedToCreateGroceryList");
      setError(message);
      toast({
        title: t("failed"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingList(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t("uploadImageToClassify")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileSelect}
              className="hidden"
              aria-label={t("uploadImageFile")}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              {t("chooseImage")}
            </Button>
            <Button
              onClick={handleClassify}
              disabled={!selectedFile || isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {t("classifying")}
                </>
              ) : (
                t("classify")
              )}
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t("dishTypeOptional")}
            </label>
            <Input
              placeholder={t("dishTypePlaceholder")}
              value={information}
              onChange={(e) => setInformation(e.target.value)}
              disabled={isLoading}
              className="border-gray-200 focus:border-red-400 focus:ring-red-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("dishTypeHelpText")}
            </p>
          </div>

          {selectedFile && (
            <div className="text-sm text-gray-600">
              <p className="font-medium">
                {t("selectedFile")}: {selectedFile.name}
              </p>
              <p className="text-xs">
                ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}

          {preview && (
            <div className="relative space-y-2">
              <img
                src={preview}
                alt={t("previewImageAlt")}
                className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
              />
              {!isLoading && (
                <Button
                  onClick={handleRemoveImage}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  {t("removeImage")}
                </Button>
              )}
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

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              {t("classificationResult")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-800 capitalize">
                {result.dishName}
              </h2>
            </div>

            {result.calories && (
              <div className="p-3 bg-white rounded border border-green-100">
                <p className="text-sm text-gray-600">{t("caloriesLabel")}</p>
                <p className="text-xl font-bold text-red-600">
                  {result.calories}
                </p>
              </div>
            )}

            {result.nutrients && Object.keys(result.nutrients).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">
                  {t("nutritionalBreakdown")}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {result.nutrients.protein && (
                    <div className="p-2 bg-white rounded border border-green-100">
                      <p className="text-xs text-gray-600">{t("protein")}</p>
                      <p className="font-semibold text-gray-800">
                        {result.nutrients.protein}
                      </p>
                    </div>
                  )}
                  {result.nutrients.carbs && (
                    <div className="p-2 bg-white rounded border border-green-100">
                      <p className="text-xs text-gray-600">{t("carbs")}</p>
                      <p className="font-semibold text-gray-800">
                        {result.nutrients.carbs}
                      </p>
                    </div>
                  )}
                  {result.nutrients.fat && (
                    <div className="p-2 bg-white rounded border border-green-100">
                      <p className="text-xs text-gray-600">{t("fat")}</p>
                      <p className="font-semibold text-gray-800">
                        {result.nutrients.fat}
                      </p>
                    </div>
                  )}
                  {result.nutrients.fiber && (
                    <div className="p-2 bg-white rounded border border-green-100">
                      <p className="text-xs text-gray-600">{t("fiber")}</p>
                      <p className="font-semibold text-gray-800">
                        {result.nutrients.fiber}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {Object.keys(result.ingredients).length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">
                  {t("ingredientsLabel")}
                </h3>
                <ul className="space-y-1">
                  {Object.entries(result.ingredients).map(
                    ([ingredient, amount]) => (
                      <li
                        key={ingredient}
                        className="flex justify-between items-center p-2 bg-white rounded border border-green-100"
                      >
                        <span className="capitalize text-gray-700">
                          {ingredient}
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          {amount || t("toTaste")}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : (
              <p className="text-gray-600 italic">
                {t("noIngredientsDetectedInImage")}
              </p>
            )}

            <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              <p>📝 {t("imageExtractedIngredientsInfo")}</p>

              {!currentUser?.uid ? (
                <div className="text-red-700 bg-white/80 border border-red-200 rounded p-3">
                  {t("loginBeforeCreateGroceryList")}
                </div>
              ) : (
                <div className="space-y-2 bg-white/80 border border-blue-100 rounded p-3">
                  <p className="text-sm text-gray-700">
                    {t("createRecipeListHelp")}
                  </p>

                  <Button
                    onClick={handleCreateListFromRecipe}
                    disabled={isCreatingList}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isCreatingList ? t("creating") : t("createGroceryList")}
                  </Button>
                </div>
              )}
            </div>

            <Button
              onClick={handleRemoveImage}
              variant="outline"
              className="w-full"
            >
              {t("tryAnotherImage")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageClassifier;
