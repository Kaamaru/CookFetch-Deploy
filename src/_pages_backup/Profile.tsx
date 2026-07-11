"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { apiClient } from "@/lib/apiClient";
import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/PageHeader";
import { UserCircle, Mail } from "lucide-react";

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [name, setName] = useState(currentUser?.displayName || "");
  const [loading, setLoading] = useState(false);

  // Sync the field once auth resolves (currentUser is often null on first render).
  useEffect(() => {
    if (currentUser?.displayName) {
      setName(currentUser.displayName);
    }
  }, [currentUser?.displayName]);

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
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          icon={UserCircle}
          title={t("profile")}
          subtitle={t("displayNameUsageHint")}
        />

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={t("profileAvatarAlt")}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-red-50"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-red-50">
                    {(name.trim() || currentUser?.email || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 w-full">
                <label className="text-sm font-medium text-gray-700">
                  {t("displayNameLabel")}
                </label>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("displayNameLabel")}
                    className="flex-1 rounded-xl"
                  />
                  <Button
                    onClick={handleRename}
                    disabled={loading || !name.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  >
                    {loading ? t("saving") : t("save")}
                  </Button>
                </div>

                {currentUser?.email && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    {currentUser.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
