"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { apiClient } from "@/lib/apiClient";
import { useLanguage } from "@/contexts/LanguageContext";

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [name, setName] = useState(
    currentUser?.displayName || "noppanut Khamhang",
  );
  const [loading, setLoading] = useState(false);

  const handleRename = async () => {
    if (!currentUser) {
      toast({
        title: t("notSignedIn"),
        description: t("signInToRenameProfile"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.changeDisplayName(currentUser.uid, name);

      // attempt to update Firebase auth profile displayName so UI reflects change
      try {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name });
        }
      } catch (e) {
        console.warn("Failed to update auth profile locally:", e);
      }

      toast({
        title: t("nameUpdated"),
        description: data?.message || t("displayNameUpdatedDescription"),
      });
    } catch (err: any) {
      console.error("Rename error:", err);
      toast({
        title: t("renameFailed"),
        description: err?.message || t("unknownError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">{t("profile")}</h1>

        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-shrink-0">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={t("profileAvatarAlt")}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                    {(name || "?").split(" ")[0]?.charAt(0)?.toUpperCase() ||
                      "U"}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="text-sm text-gray-600">
                  {t("displayNameLabel")}
                </label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleRename}
                    disabled={loading || !name.trim()}
                  >
                    {loading ? t("saving") : t("save")}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t("displayNameUsageHint")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
