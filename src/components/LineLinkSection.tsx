"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageCircle,
  Loader,
  CheckCircle,
  Copy,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type LineLinkCodeResponse } from "@/lib/apiClient";

const LineLinkSection: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [linked, setLinked] = useState<boolean | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [code, setCode] = useState<LineLinkCodeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = React.useCallback(async () => {
    if (!currentUser?.uid) return;
    setIsCheckingStatus(true);
    try {
      const res = await apiClient.getLineStatus(currentUser.uid);
      setLinked(res.linked);
      // Once linked, the pending code is no longer relevant.
      if (res.linked) setCode(null);
    } catch (err) {
      console.error("Failed to fetch LINE status", err);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleGenerate = async () => {
    if (!currentUser?.uid) {
      setError(t("lineLoginRequired"));
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const res = await apiClient.generateLineLinkCode(currentUser.uid);
      setCode(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("lineLinkError"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!code?.code) return;
    try {
      await navigator.clipboard.writeText(code.code);
      toast({ title: t("codeCopied") });
    } catch {
      // Clipboard may be unavailable; ignore silently.
    }
  };

  if (!currentUser?.uid) {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{t("lineLoginRequired")}</AlertDescription>
      </Alert>
    );
  }

  const minutes = code?.expires_in_minutes ?? 10;

  return (
    <Card className="mb-6 border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-800">
            <MessageCircle className="w-5 h-5 text-green-600" />
            {t("lineNotificationsTitle")}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={checkStatus}
            disabled={isCheckingStatus}
            title={t("lineCheckStatus")}
          >
            <RefreshCcw
              className={`w-4 h-4 ${isCheckingStatus ? "animate-spin" : ""}`}
            />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {linked ? (
          <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">
                {t("lineLinkedTitle")}
              </p>
              <p className="text-sm text-green-700">{t("lineLinkedDesc")}</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">{t("lineNotLinkedDesc")}</p>

            {!code ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    {t("generatingCode")}
                  </>
                ) : (
                  t("generateLinkCode")
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    {t("lineYourCode")}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold tracking-[0.3em] text-gray-900">
                      {code.code}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopy}
                      className="ml-auto"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {t("copyCode")}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {t("lineCodeExpiresIn", { minutes })}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                  <p className="font-semibold text-gray-800 mb-2">
                    {t("lineInstructionsTitle")}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    <li>{t("lineStep1")}</li>
                    <li>{t("lineStep2", { minutes })}</li>
                    <li>{t("lineStep3")}</li>
                  </ol>
                </div>

                <Button
                  variant="outline"
                  onClick={checkStatus}
                  disabled={isCheckingStatus}
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      {t("lineCheckStatus")}
                    </>
                  ) : (
                    t("lineCheckStatus")
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default LineLinkSection;
