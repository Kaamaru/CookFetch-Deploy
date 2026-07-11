"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { X, Check, Smartphone, Loader2, Wifi, WifiOff } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const toggleItem = (list: string[], value: string) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

const Devices = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const isDemo = !currentUser;

  const demoDevices = ["DemoDevice01", "DemoDevice02"];
  const demoRequests = ["PendingDevice01"];
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [refreshRate, setRefreshRate] = useState<string>("5");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingDevice, setStreamingDevice] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [pendingChanges, setPendingChanges] = useState({
    add: [] as string[],
    remove: [] as string[],
    reject: [] as string[],
  });

  const fetchDevices = async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    try {
      const data = await apiClient.getHardwareDevices(currentUser.uid);

      setConnectedDevices(data.devices || []);
      setConnectionRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
      toast({
        title: t("failed"),
        description: t("failedToFetchDevices"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDemo) {
      setConnectedDevices(demoDevices);
      setConnectionRequests(demoRequests);
    } else {
      fetchDevices();
    }
  }, [currentUser?.uid, isDemo]);

  // Cleanup WebSocket on unmount or when stopping stream
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const startStreaming = (device: string) => {
    setStreamingDevice(device);
    setIsStreaming(true);
    setStreamError(null);
    setStreamConnected(false);

    try {
      // Try connecting with device name as query parameter
      const wsUrl = `ws://localhost:4444/ws/view?device=${encodeURIComponent(
        device,
      )}`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "blob";

      const connectTimeout = setTimeout(() => {
        if (!streamConnected) {
          ws.close();
          setStreamError(t("connectionTimeoutServerNotResponding"));
          setIsStreaming(false);
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(connectTimeout);
        console.log("WebSocket connected for streaming");
        setStreamConnected(true);
        setStreamError(null);
      };

      ws.onmessage = (e) => {
        if (imgRef.current && e.data instanceof Blob) {
          const url = URL.createObjectURL(e.data);
          imgRef.current.src = url;
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectTimeout);
        console.error("WebSocket error:", error);
        console.error(
          "WebSocket readyState:",
          ws.readyState,
          "(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)",
        );
        console.error("WebSocket URL:", ws.url);
        setStreamError(t("connectionFailedEnsureStreamingServer"));
        setStreamConnected(false);
      };

      ws.onclose = () => {
        clearTimeout(connectTimeout);
        console.log("WebSocket closed");
        setStreamConnected(false);
        setIsStreaming(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to start streaming:", error);
      setStreamError(t("failedToInitializeStreamConnection"));
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
    setStreamingDevice(null);
    setStreamConnected(false);
    setStreamError(null);
  };

  const terminateConnection = async () => {
    if (!currentUser?.uid && !isDemo) return;

    try {
      // Demo mode: just close the modal
      if (isDemo) {
        setSelectedDevice(null);
        toast({
          title: t("success"),
          description: t("connectionTerminatedDemoMode"),
        });
        return;
      }

      await apiClient.terminatePendingHardware(currentUser.uid);

      setSelectedDevice(null);
      toast({
        title: t("success"),
        description: t("connectionTerminatedSuccessfully"),
      });

      fetchDevices();
    } catch (error) {
      console.error("Error terminating connection:", error);
      toast({
        title: t("failed"),
        description: t("failedToTerminateConnection"),
        variant: "destructive",
      });
    }
  };

  const [deviceImage, setDeviceImage] = useState<string | null>(null);
  const [deviceImageError, setDeviceImageError] = useState<string | null>(null);
  const deviceImageRef = useRef<HTMLImageElement>(null);
  const [classificationResult, setClassificationResult] = useState<
    string | null
  >(null);

  // Fetch device image every 5 seconds when device is selected
  useEffect(() => {
    if (!selectedDevice) return;

    const interval = setInterval(() => {
      if (!deviceImageRef.current) return;

      const img = deviceImageRef.current;
      const streamUrl = `${apiClient.fetchHardwareStream
        ? ""
        : ""}`;

      img.src = `${window.location.origin}/stream/${selectedDevice}?v=${Date.now()}`;
      setDeviceImageError(null);
    }, 5000); // 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [selectedDevice]);

  // Auto-hide classification result after 3 seconds
  useEffect(() => {
    if (!classificationResult) return;

    const timer = setTimeout(() => {
      setClassificationResult(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [classificationResult]);

  const takePhoto = async () => {
    try {
      if (!selectedDevice) {
        throw new Error(t("noDeviceSelected"));
      }

      const streamResponse = await apiClient.fetchHardwareStream(selectedDevice);
      const response = streamResponse;
      const blob = await response.blob();

      const data = await apiClient.sendHardwareImage(selectedDevice, blob);

      if (data.classification_result) {
        setClassificationResult(data.classification_result);
      }

      toast({
        title: t("success"),
        description: t("photoClassifiedSuccessfully"),
      });
    } catch (error) {
      console.error("Error taking photo:", error);
      toast({
        title: t("failed"),
        description: t("failedToSendPhoto"),
        variant: "destructive",
      });
    }
  };

  const getDeviceStatus = (device: string) => {
    if (connectedDevices.includes(device)) return "connected";
    if (connectionRequests.includes(device)) return "waiting";
    return "not connected";
  };

  const pendingCounts = {
    add: pendingChanges.add.length,
    remove: pendingChanges.remove.length,
    reject: pendingChanges.reject.length,
  };
  const hasPending =
    pendingCounts.add > 0 ||
    pendingCounts.remove > 0 ||
    pendingCounts.reject > 0;

  const toggleRemoveDevice = (deviceName: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      remove: toggleItem(prev.remove, deviceName),
    }));
  };

  const toggleAcceptRequest = (requestName: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      add: toggleItem(prev.add, requestName),
      reject: prev.reject.filter((item) => item !== requestName),
    }));
  };

  const toggleRejectRequest = (requestName: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      reject: toggleItem(prev.reject, requestName),
      add: prev.add.filter((item) => item !== requestName),
    }));
  };

  const resetPendingChanges = () =>
    setPendingChanges({ add: [], remove: [], reject: [] });

  const sendBatch = async (
    method: "POST" | "DELETE" | "PATCH",
    payload: string[],
  ) => {
    if (!currentUser?.uid) return {};

    if (method === "POST") {
      return apiClient.addHardwareDevices(currentUser.uid, payload);
    }

    if (method === "DELETE") {
      return apiClient.removeHardwareDevices(currentUser.uid, payload);
    }

    return apiClient.patchHardwareRequests(currentUser.uid, payload);
  };

  const applyPendingChanges = async () => {
    if (!currentUser?.uid && !isDemo) return;

    const { add, remove, reject } = pendingChanges;
    const hasPending = add.length || remove.length || reject.length;
    if (!hasPending) return;

    setSaving(true);

    try {
      // Demo mode: only update local state
      if (isDemo) {
        // Remove devices
        setConnectedDevices((prev) =>
          prev.filter((device) => !remove.includes(device)),
        );

        // Add accepted requests to connected devices
        setConnectedDevices((prev) => {
          const merged = [...prev];
          add.forEach((device) => {
            if (!merged.includes(device)) {
              merged.push(device);
            }
          });
          return merged;
        });

        // Remove rejected or accepted requests
        setConnectionRequests((prev) =>
          prev.filter((req) => !add.includes(req) && !reject.includes(req)),
        );

        resetPendingChanges();
        toast({
          title: t("success"),
          description: t("changesAppliedLocally"),
        });

        setSaving(false);
        return;
      }

      // Real mode: API calls
      if (remove.length) {
        await sendBatch("DELETE", remove);
      }

      if (add.length) {
        await sendBatch("POST", add);
        await sendBatch("PATCH", add);
      }

      if (reject.length) {
        await apiClient.removeHardwareRequests(currentUser.uid, reject);
      }

      setConnectedDevices((prev) => {
        const withoutRemoved = prev.filter(
          (device) => !remove.includes(device),
        );
        const merged = [...withoutRemoved];
        add.forEach((device) => {
          if (!merged.includes(device)) {
            merged.push(device);
          }
        });
        return merged;
      });

      setConnectionRequests((prev) =>
        prev.filter((req) => !add.includes(req) && !reject.includes(req)),
      );

      resetPendingChanges();
      toast({
        title: t("success"),
        description: t("changesAppliedSuccessfully"),
      });

      // Re-sync from backend to avoid drift
      fetchDevices();
    } catch (error) {
      console.error("Error applying changes:", error);
      toast({
        title: t("failed"),
        description: t("failedToApplyChanges"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 text-center font-semibold mb-4 flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          <Smartphone className="w-4 h-4 shrink-0" />
          {t("demoModePreview")}{" "}
          <Button
            variant="ghost"
            className="text-white underline ml-2"
            onClick={() => router.push("/login")}
          >
            {t("loginNow")}
          </Button>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("devices")}
          </h1>
          <p className="text-xl text-gray-600">
            {t("manageConnectedDevicesDescription")}
          </p>
        </div>

        {hasPending && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50/60 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {pendingCounts.add > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-100 text-green-700 px-3 py-1">
                  <Check className="w-4 h-4" />{" "}
                  {t("acceptCount", { count: pendingCounts.add })}
                </span>
              )}
              {pendingCounts.remove > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-red-100 text-red-700 px-3 py-1">
                  <X className="w-4 h-4" />{" "}
                  {t("removeCount", { count: pendingCounts.remove })}
                </span>
              )}
              {pendingCounts.reject > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-200 text-gray-800 px-3 py-1">
                  {t("rejectCount", { count: pendingCounts.reject })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={applyPendingChanges}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-60"
              >
                {saving ? t("applying") : t("applyChanges")}
              </button>
              <button
                onClick={resetPendingChanges}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {t("undoChanges")}
              </button>
            </div>
          </div>
        )}

        {/* Connected Devices Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100 mb-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {t("connectedDevices")}
            </h2>
            <button
              onClick={() => setEditMode((prev) => !prev)}
              className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                editMode
                  ? "border-green-500 text-green-700 bg-green-50 hover:bg-green-100"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {editMode ? t("done") : t("edit")}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
          ) : connectedDevices.length > 0 ? (
            <div className="space-y-4">
              {connectedDevices.map((device, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-transparent rounded-lg border border-red-100 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => !editMode && setSelectedDevice(device)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-red-100 rounded-full p-3">
                      <Smartphone className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{device}</h3>
                      <p className="text-sm text-gray-600">
                        {t("connectedLastSyncedJustNow")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRemoveDevice(device);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      pendingChanges.remove.includes(device)
                        ? "text-white bg-red-500 hover:bg-red-600"
                        : "text-red-500 hover:bg-red-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={
                      pendingChanges.remove.includes(device)
                        ? t("queuedForRemoval")
                        : t("markForRemoval")
                    }
                    disabled={saving || !editMode}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">
                {t("noDevicesConnectedDescription")}
              </p>
              <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 transition-colors">
                {t("addDevice")}
              </button>
            </div>
          )}
        </div>

        {/* Connection Requests Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {t("connectionRequests")}
            </h2>
            <button
              onClick={() => setEditMode((prev) => !prev)}
              className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                editMode
                  ? "border-green-500 text-green-700 bg-green-50 hover:bg-green-100"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {editMode ? t("done") : t("edit")}
            </button>
          </div>

          {connectionRequests.length > 0 ? (
            <div className="space-y-4">
              {connectionRequests.map((request, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-100 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => !editMode && setSelectedDevice(request)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{request}</h3>
                      <p className="text-sm text-gray-600">
                        {t("requestingConnection")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAcceptRequest(request);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        pendingChanges.add.includes(request)
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "text-green-500 hover:bg-green-50"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={
                        pendingChanges.add.includes(request)
                          ? t("queuedToAccept")
                          : t("markToAccept")
                      }
                      disabled={saving || !editMode}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRejectRequest(request);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        pendingChanges.reject.includes(request)
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "text-red-500 hover:bg-red-50"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={
                        pendingChanges.reject.includes(request)
                          ? t("queuedToReject")
                          : t("markToReject")
                      }
                      disabled={saving || !editMode}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {t("noPendingConnectionRequests")}
              </p>
            </div>
          )}
        </div>
        {/* Device Detail Modal */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-1/2 p-8 animate-in zoom-in-95 duration-200">
              {/* Header with close button */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-bold text-gray-900">
                      {t("deviceDetails")}
                    </h2>
                    <Select value={refreshRate} onValueChange={setRefreshRate}>
                      <SelectTrigger className="w-32 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">
                          {t("refreshRateSeconds", { seconds: 2 })}
                        </SelectItem>
                        <SelectItem value="5">
                          {t("refreshRateSeconds", { seconds: 5 })}
                        </SelectItem>
                        <SelectItem value="10">
                          {t("refreshRateSeconds", { seconds: 10 })}
                        </SelectItem>
                        <SelectItem value="15">
                          {t("refreshRateSeconds", { seconds: 15 })}
                        </SelectItem>
                        <SelectItem value="30">
                          {t("refreshRateSeconds", { seconds: 30 })}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-gray-600 mt-2">{selectedDevice}</p>
                </div>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={t("close")}
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Device Info */}
              <div className="space-y-6">
                {/* <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-8 border border-red-200">
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-white rounded-full p-6 shadow-lg">
                      <Smartphone className="w-16 h-16 text-red-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">{selectedDevice}</h3>
                  <p className="text-center text-gray-600">
                    {getDeviceStatus(selectedDevice) === 'connected' && 'Connected Device'}
                    {getDeviceStatus(selectedDevice) === 'waiting' && 'Awaiting Connection'}
                    {getDeviceStatus(selectedDevice) === 'not connected' && 'Not Connected'}
                  </p>
                </div> */}

                {/* Device Image Stream */}
                <div className="bg-gray-900 rounded-xl p-4 flex items-center justify-center min-h-64">
                  {deviceImageError ? (
                    <div className="text-center space-y-4">
                      <p className="text-red-400 text-sm font-semibold">
                        {deviceImageError}
                      </p>
                      <button
                        onClick={() => {
                          setDeviceImageError(null);
                          setDeviceImage(null);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        {t("retrySearch")}
                      </button>
                    </div>
                  ) : (
                    <img
                      ref={deviceImageRef}
                      alt={t("deviceStreamAlt")}
                      className="max-w-full max-h-64 object-contain rounded-lg"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-4">
                  {classificationResult && (
                    <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                      <p className="text-sm text-gray-600">
                        {t("classification")}:
                      </p>
                      <p className="text-lg font-semibold text-green-700 capitalize">
                        {classificationResult}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    {getDeviceStatus(selectedDevice) === "connected" ? (
                      <>
                        <button
                          onClick={takePhoto}
                          className="flex-1 px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
                        >
                          {t("classifyAndAdd")}
                        </button>
                      </>
                    ) : getDeviceStatus(selectedDevice) === "waiting" ? (
                      <>
                        <button
                          onClick={() => {
                            toggleAcceptRequest(selectedDevice);
                            setSelectedDevice(null);
                            setEditMode(true);
                          }}
                          className="flex-1 px-6 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                        >
                          {t("connect")}
                        </button>
                        <button
                          onClick={() => {
                            toggleRejectRequest(selectedDevice);
                            setSelectedDevice(null);
                            setEditMode(true);
                          }}
                          className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                        >
                          {t("reject")}
                        </button>
                      </>
                    ) : (
                      <button
                        disabled
                        className="flex-1 px-6 py-3 rounded-xl bg-gray-400 text-white font-semibold cursor-not-allowed opacity-60"
                      >
                        {t("notConnected")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Streaming Modal */}
      {isStreaming && streamingDevice && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-in fade-in duration-200">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">
                {streamingDevice}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/50 backdrop-blur">
                {streamConnected ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">
                      {t("connected")}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">
                      {t("connecting")}
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={stopStreaming}
                className="p-3 rounded-lg hover:bg-gray-800 transition-colors"
                aria-label={t("stopStreamingLabel")}
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Stream Content */}
          <div className="flex-1 flex items-center justify-center w-full">
            {streamError ? (
              <div className="text-center space-y-4 bg-red-900/20 border border-red-500 rounded-2xl p-8">
                <p className="text-red-400 text-lg font-semibold">
                  {t("streamError")}
                </p>
                <p className="text-gray-300">{streamError}</p>
                <button
                  onClick={stopStreaming}
                  className="px-6 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                >
                  {t("close")}
                </button>
              </div>
            ) : !streamConnected ? (
              <div className="text-center space-y-4">
                <Loader2 className="w-16 h-16 text-white animate-spin mx-auto" />
                <p className="text-white text-lg font-semibold">
                  {t("connectingToStream")}
                </p>
              </div>
            ) : (
              <img
                ref={imgRef}
                id="cam"
                className="max-w-full max-h-full object-contain"
                alt={t("liveStreamFromDeviceAlt")}
              />
            )}
          </div>

          {/* Footer Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 flex items-center justify-center">
            <button
              onClick={stopStreaming}
              className="px-8 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
            >
              {t("stopStreaming")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
