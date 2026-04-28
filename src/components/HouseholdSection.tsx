"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, LogOut, Trash2, QrCode } from "lucide-react";
import QRCode from "qrcode";

export const HouseholdSection = () => {
  const { household, householdState, loadHousehold, setHousehold } = useGlobalContext();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !householdName.trim()) return;

    setIsLoading(true);
    try {
      const res = await apiClient.createHousehold(currentUser.uid, householdName.trim());
      if (res.success) {
        toast({ title: t("success"), description: t("foodAddedDesc") });
        await loadHousehold(currentUser.uid);
      }
    } catch (error) {
      toast({ title: t("failed"), description: t("networkError"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !inviteCode.trim()) return;

    setIsLoading(true);
    try {
      const res = await apiClient.redeemInvite(inviteCode.trim().toUpperCase(), currentUser.uid);
      if (res.success) {
        toast({ title: t("success"), description: t("welcomeLoginDescription") });
        await loadHousehold(currentUser.uid);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("networkError");
      toast({ title: t("failed"), description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveHousehold = async () => {
    if (!currentUser || !household) return;

    setIsLoading(true);
    try {
      const res = await apiClient.leaveHousehold(household.household_id, currentUser.uid);
      if (res.success) {
        toast({ title: t("success"), description: t("loggedOutDescription") });
        setHousehold(null);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("networkError");
      toast({ title: t("failed"), description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!currentUser || !household) return;

    try {
      const res = await apiClient.removeMember(household.household_id, memberUid, currentUser.uid);
      if (res.success) {
        toast({ title: t("success"), description: t("foodRemovedDesc") });
        await loadHousehold(currentUser.uid);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("networkError");
      toast({ title: t("failed"), description: message, variant: "destructive" });
    }
  };

  const handleGenerateInvite = async () => {
    if (!currentUser || !household) return;

    setIsLoading(true);
    try {
      const res = await apiClient.generateInvite(household.household_id, currentUser.uid);
      if (res.success) {
        setGeneratedCode(res.invite_code);
        setQrModalOpen(true);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("networkError");
      toast({ title: t("failed"), description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (qrModalOpen && generatedCode && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, generatedCode, {
        width: 256,
        margin: 2,
        color: {
          dark: "#ef4444", // red-500
          light: "#ffffff",
        },
      });
    }
  }, [qrModalOpen, generatedCode]);

  if (!currentUser) return null;

  const showNoHousehold = householdState === "no_household";
  const showHasHousehold = householdState === "has_household" && Boolean(household);

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <QrCode className="h-5 w-5 text-red-500" />
        {t("household")}
      </h2>

      {householdState === "loading" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("loading")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {householdState === "error" && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-red-600">{t("networkError")}</p>
            <Button
              type="button"
              onClick={() => loadHousehold(currentUser.uid)}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("reload")}
            </Button>
          </CardContent>
        </Card>
      )}

      {showNoHousehold ? (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-700">Create or Join Household</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("createHousehold")}</CardTitle>
              <CardDescription>{t("smartFoodManagement")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateHousehold} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("householdName")}</label>
                  <Input
                    placeholder={t("enterHouseholdName")}
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("create")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("joinHousehold")}</CardTitle>
              <CardDescription>{t("scanToJoin")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinHousehold} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("inviteCode")}</label>
                  <Input
                    placeholder={t("enterInviteCode")}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                    className="uppercase"
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("join")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : showHasHousehold ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xl font-bold">{household.name}</CardTitle>
              <CardDescription>{t("members")} ({(household.members?.length || 0) + 1})</CardDescription>
            </div>
            {household.is_host ? (
              <Button onClick={handleGenerateInvite} className="bg-red-600 hover:bg-red-700">
                <QrCode className="mr-2 h-4 w-4" />
                {t("generateQR")}
              </Button>
            ) : (
              <Button onClick={handleLeaveHousehold} variant="destructive" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                {t("leaveHousehold")}
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* Host */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-red-200">
                    <AvatarFallback className="bg-red-100 text-red-600 font-bold">
                      H
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{household.host === currentUser.uid ? (currentUser.displayName || currentUser.email) : household.host}</p>
                    <Badge variant="outline" className="text-red-600 border-red-200">{t("host")}</Badge>
                  </div>
                </div>
              </div>

              {/* Members */}
              {household.members?.map((memberUid) => (
                <div key={memberUid} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>M</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-700">{memberUid}</p>
                    </div>
                  </div>
                  {household.is_host && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => handleRemoveMember(memberUid)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* QR Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t("scanToJoin")}</DialogTitle>
            <DialogDescription className="text-center">
              {t("inviteExpiresIn")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            <div className="p-4 bg-white rounded-2xl shadow-inner border-4 border-red-50">
              <canvas ref={qrCanvasRef} className="w-full h-full" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{t("inviteCode")}</p>
              <p className="text-3xl font-bold text-red-600 tracking-tighter">{generatedCode}</p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button type="button" variant="secondary" onClick={() => setQrModalOpen(false)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
