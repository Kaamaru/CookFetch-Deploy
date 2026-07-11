"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Trash2, QrCode, Camera } from "lucide-react";
import QRCode from "qrcode";
import { BrowserQRCodeReader } from "@zxing/browser";

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
  const [generatedQrImage, setGeneratedQrImage] = useState("");
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanInputKey, setScanInputKey] = useState(0);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanMode, setScanMode] = useState<"camera" | "image">("camera");
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const isSubmittingRef = useRef(false);
  const [isValidating, setIsValidating] = useState(false);
  const [scannedCode, setScannedCode] = useState("");

  const submitInviteCode = useCallback(
    async (rawInviteCode: string) => {
      if (!currentUser || !rawInviteCode.trim()) return;

      setIsLoading(true);
      try {
        const normalizedCode = rawInviteCode.trim().toUpperCase();
        const res = await apiClient.redeemInvite(normalizedCode, currentUser.uid);
        if (res.success) {
          setInviteCode(normalizedCode);
          toast({ title: t("success"), description: t("welcomeLoginDescription") });
          await loadHousehold(currentUser.uid);
        } else {
          throw new Error((res as any).message || "Invalid invite code or failed to join household.");
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t("networkError");
        toast({ title: t("failed"), description: message, variant: "destructive" });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser, loadHousehold, t, toast]
  );

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
    } catch {
      toast({ title: t("failed"), description: t("networkError"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitInviteCode(inviteCode);
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
        setGeneratedQrImage("");
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
    let active = true;

    const buildQrImage = async () => {
      if (!qrModalOpen || !generatedCode) return;

      try {
        const qrImage = await QRCode.toDataURL(generatedCode, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
          color: {
            dark: "#dc2626",
            light: "#ffffff",
          },
        });

        if (active) {
          setGeneratedQrImage(qrImage);
        }
      } catch {
        if (active) {
          setGeneratedQrImage("");
        }
      }
    };

    void buildQrImage();

    return () => {
      active = false;
    };
  }, [qrModalOpen, generatedCode]);

  useEffect(() => {
    let active = true;
    let controls: { stop: () => void } | null = null;
    isSubmittingRef.current = false;

    const startCamera = async () => {
      if (!scanDialogOpen || scanMode !== "camera" || !videoElement) return;

      setScanError("");
      setScanStatus("Initializing camera...");

      try {
        const reader = new BrowserQRCodeReader();
        controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" }
            }
          },
          videoElement,
          (result, error, ctrl) => {
            if (!active) return;

            if (result) {
              const decodedText = result.getText().trim().toUpperCase();
              if (isSubmittingRef.current) return;
              isSubmittingRef.current = true;
              setScannedCode(decodedText);
              setIsValidating(true);

              setScanStatus("QR code found. Joining household...");

              submitInviteCode(decodedText)
                .then(() => {
                  ctrl.stop();
                  setScanDialogOpen(false);
                  setScanStatus("");
                  setIsValidating(false);
                })
                .catch((err: unknown) => {
                  const message = err instanceof Error ? err.message : "Failed to join household.";
                  setScanError(message);
                  setScanStatus("Ready to scan.");
                  setIsValidating(false);
                  // Reset submitting status after a 3-second delay to allow scanning again
                  setTimeout(() => {
                    isSubmittingRef.current = false;
                  }, 3000);
                });
            }
          }
        );

        if (!active) {
          controls.stop();
          controls = null;
        } else {
          setScanStatus("Camera active. Point at a QR code.");
        }
      } catch (err: unknown) {
        console.error("Camera access error:", err);
        if (active) {
          const isNotSupported = !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia;
          const message = isNotSupported
            ? "Camera scanning is not supported in this browser or context (requires HTTPS)."
            : (err instanceof Error ? err.message : "Could not access camera.");
          setScanError(`${message} Please try uploading an image instead.`);
          setScanStatus("");
        }
      }
    };

    void startCamera();

    return () => {
      active = false;
      if (controls) {
        controls.stop();
      }
    };
  }, [scanDialogOpen, scanMode, videoElement, submitInviteCode]);

  const handleScanImageClick = () => {
    setScanError("");
    setScanStatus("");
    scanInputRef.current?.click();
  };

  const handleScanImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanError("");
    setScanStatus("Reading QR code...");

    const objectUrl = URL.createObjectURL(file);
    try {
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeFromImageUrl(objectUrl);
      const decodedText = result.getText();

      setScanStatus("QR code found. Joining household...");
      await submitInviteCode(decodedText);
      setScanDialogOpen(false);
      setScanStatus("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not read that QR code.";
      setScanError(message);
      setScanStatus("");
    } finally {
      URL.revokeObjectURL(objectUrl);
      event.target.value = "";
      setScanInputKey((value) => value + 1);
    }
  };

  if (!currentUser) return null;

  const showNoHousehold = householdState === "no_household";
  const showHasHousehold = householdState === "has_household" && Boolean(household);

  return (
    <div className="mt-8 space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
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
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm text-red-600">{t("networkError")}</p>
            <Button type="button" onClick={() => loadHousehold(currentUser.uid)} variant="outline" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("reload")}
            </Button>
          </CardContent>
        </Card>
      )}

      {showNoHousehold ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-700">{t("householdCreateOrJoin")}</p>
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
                <Button type="button" variant="secondary" className="w-full" onClick={() => setScanDialogOpen(true)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR Code
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
              <CardDescription>
                {t("members")} ({(household.members?.length || 0) + 1})
              </CardDescription>
            </div>
            {household.is_host ? (
              <Button onClick={handleGenerateInvite} className="bg-red-600 hover:bg-red-700" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
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
              <div className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-red-200">
                    <AvatarFallback className="bg-red-100 font-bold text-red-600">H</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {household.host === currentUser.uid ? currentUser.displayName || currentUser.email : household.host}
                    </p>
                    <Badge variant="outline" className="border-red-200 text-red-600">
                      {t("host")}
                    </Badge>
                  </div>
                </div>
              </div>

              {household.members?.map((memberUid) => (
                <div key={memberUid} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>M</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-700">{memberUid}</p>
                    </div>
                  </div>
                  {household.is_host && (
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => handleRemoveMember(memberUid)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t("scanToJoin")}</DialogTitle>
            <DialogDescription className="text-center">{t("inviteExpiresIn")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            <div className="rounded-2xl border-4 border-red-50 bg-white p-4 shadow-inner">
              {generatedQrImage ? (
                <img src={generatedQrImage} alt={t("householdInviteQrAlt")} className="block h-[320px] w-[320px]" />
              ) : (
                <div className="flex h-[320px] w-[320px] items-center justify-center bg-gray-50 text-sm text-muted-foreground">
                  Generating QR code...
                </div>
              )}
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-gray-500">{t("inviteCode")}</p>
              <p className="text-3xl font-bold tracking-tighter text-red-600">{generatedCode}</p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button type="button" variant="secondary" onClick={() => setQrModalOpen(false)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={scanDialogOpen}
        onOpenChange={(open) => {
          setScanDialogOpen(open);
          if (!open) {
            setScanStatus("");
            setScanError("");
            setIsValidating(false);
            setScannedCode("");
          } else {
            setScanMode("camera");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t("householdScanQr")}</DialogTitle>
            <DialogDescription className="text-center">
              {t("householdScanQrDesc")}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={scanMode} onValueChange={(val) => setScanMode(val as "camera" | "image")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="camera">{t("householdUseCamera")}</TabsTrigger>
              <TabsTrigger value="image">{t("householdUploadImage")}</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl bg-black aspect-video flex items-center justify-center border border-red-100 shadow-inner">
                <video
                  ref={setVideoElement}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                />
                {isValidating ? (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 transition-opacity duration-300">
                    <div className="rounded-full bg-green-500/20 p-3 border border-green-500 animate-pulse">
                      <QrCode className="h-8 w-8 text-green-400" />
                    </div>
                    <p className="text-white font-medium text-sm">{t("householdQrDetected")}</p>
                    {scannedCode && (
                      <span className="bg-white/15 text-white text-xs px-2.5 py-1 rounded font-mono tracking-wider">
                        {scannedCode}
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-gray-300 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin text-red-500" />
                      <span>{t("householdJoining")}</span>
                    </div>
                  </div>
                ) : !scanError ? (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="border-2 border-red-500/80 w-44 h-44 rounded-xl relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500 -mt-[2px] -ml-[2px]" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500 -mt-[2px] -mr-[2px]" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500 -mb-[2px] -ml-[2px]" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500 -mb-[2px] -mr-[2px]" />
                      <div className="absolute left-0 right-0 top-0 h-[2px] bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-scan-laser" />
                    </div>
                  </div>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-red-200 bg-red-50/40 p-6 text-center">
                <Camera className="h-10 w-10 text-red-500" />
                <p className="text-sm text-gray-700">
                  Choose a QR image from your device and we will decode it immediately.
                </p>
                <Button type="button" onClick={handleScanImageClick} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
                  <QrCode className="mr-2 h-4 w-4" />
                  Pick QR image
                </Button>
                <input
                  key={scanInputKey}
                  ref={scanInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScanImageChange}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2 min-h-[1.5rem]">
            {scanStatus && <p className="text-center text-sm text-muted-foreground">{scanStatus}</p>}
            {scanError && <p className="text-center text-sm text-red-600 font-medium px-4">{scanError}</p>}
          </div>

          <DialogFooter className="sm:justify-center">
            <Button type="button" variant="secondary" onClick={() => setScanDialogOpen(false)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};