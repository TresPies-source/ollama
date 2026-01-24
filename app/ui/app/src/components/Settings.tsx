import { useEffect, useState, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Field, Label, Description } from "@/components/ui/fieldset";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  WifiIcon,
  FolderIcon,
  BoltIcon,
  WrenchIcon,
  XMarkIcon,
  CogIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from "@heroicons/react/20/solid";
import { Settings as SettingsType } from "@/gotypes";
import { useNavigate } from "@tanstack/react-router";
import { useUser } from "@/hooks/useUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "@/api";
import SettingsModels from "@/components/SettingsModels";
import SettingsAppearance from "@/components/SettingsAppearance";
import { ShortcutsPanel } from "@/components/ShortcutsPanel";
import SettingsData from "@/components/SettingsData";

function AnimatedDots() {
  return (
    <span className="inline-flex">
      <span className="animate-pulse">.</span>
      <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>
        .
      </span>
      <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>
        .
      </span>
    </span>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [showSaved, setShowSaved] = useState(false);
  const [restartMessage, setRestartMessage] = useState(false);
  const {
    user,
    isAuthenticated,
    refreshUser,
    isRefreshing,
    refetchUser,
    fetchConnectUrl,
    isLoading,
    disconnectUser,
  } = useUser();
  const [isAwaitingConnection, setIsAwaitingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const navigate = useNavigate();

  const {
    data: settingsData,
    isLoading: loading,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    retry: false,
  });

  const settings = settingsData?.settings || new SettingsType({
    Expose: false,
    Browser: false,
    Models: "",
    Agent: false,
    Tools: false,
    ContextLength: 4096,
    AirplaneMode: false,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1500);
    },
  });

  useEffect(() => {
    refetchUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleFocus = () => {
      if (isAwaitingConnection && pollingInterval) {
        // Stop polling when window gets focus
        clearInterval(pollingInterval);
        setPollingInterval(null);
        // Reset awaiting connection state
        setIsAwaitingConnection(false);
        // Make one last refresh request
        refreshUser();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAwaitingConnection, refreshUser, pollingInterval]);

  // Check if user is authenticated after refresh
  useEffect(() => {
    if (isAwaitingConnection && isAuthenticated) {
      setIsAwaitingConnection(false);
      setConnectionError(null);
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isAuthenticated, isAwaitingConnection, pollingInterval]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleChange = useCallback(
    (field: keyof SettingsType, value: boolean | string | number) => {
      if (settings) {
        const updatedSettings = new SettingsType({
          ...settings,
          [field]: value,
        });

        // If context length is being changed, show restart message
        if (field === "ContextLength" && value !== settings.ContextLength) {
          setRestartMessage(true);
          // Hide restart message after 3 seconds
          setTimeout(() => setRestartMessage(false), 3000);
        }

        updateSettingsMutation.mutate(updatedSettings);
      }
    },
    [settings, updateSettingsMutation],
  );

  // const handleResetToDefaults = () => {
  //   if (settings) {
  //     const defaultSettings = new SettingsType({
  //       Expose: false,
  //       Browser: false,
  //       Models: "",
  //       Agent: false,
  //       Tools: false,
  //       ContextLength: 4096,
  //       AirplaneMode: false,
  //     });
  //     updateSettingsMutation.mutate(defaultSettings);
  //   }
  // };

  const handleConnectOllamaAccount = async () => {
    setConnectionError(null);

    // If user is already authenticated, no need to connect
    if (isAuthenticated) {
      return;
    }

    try {
      // If we don't have a user or user has no name, get connect URL
      if (!user || !user?.name) {
        const { data: connectUrl } = await fetchConnectUrl();
        if (connectUrl) {
          window.open(connectUrl, "_blank");
          setIsAwaitingConnection(true);
          // Start polling every 5 seconds
          const interval = setInterval(() => {
            refreshUser();
          }, 5000);
          setPollingInterval(interval);
        } else {
          setConnectionError("Failed to get connect URL");
        }
      }
    } catch (error) {
      console.error("Error connecting to Ollama account:", error);
      setConnectionError(
        error instanceof Error
          ? error.message
          : "Failed to connect to Ollama account",
      );
      setIsAwaitingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-dojo-bg-primary via-dojo-bg-secondary to-dojo-bg-tertiary">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-dojo-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-dojo-text-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  const isWindows = navigator.platform.toLowerCase().includes("win");

  return (
    <main className="flex h-screen w-full flex-col select-none bg-gradient-to-br from-dojo-bg-primary via-dojo-bg-secondary to-dojo-bg-tertiary">
      <header
        className="w-full flex flex-none justify-between h-[52px] py-2.5 items-center border-b border-white/10 backdrop-blur-dojo select-none"
        onMouseDown={() => window.drag && window.drag()}
        onDoubleClick={() => window.doubleClick && window.doubleClick()}
      >
        <h1
          className={`${isWindows ? "pl-4" : "pl-24"} flex items-center font-brand text-lg font-semibold text-dojo-text-primary`}
        >
          {isWindows && (
            <button
              onClick={() => navigate({ to: "/" })}
              className="hover:bg-white/10 mr-3 rounded-full p-1.5 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-dojo-text-primary" />
            </button>
          )}
          Settings
        </h1>
        {!isWindows && (
          <button
            onClick={() => navigate({ to: "/" })}
            className="p-1 hover:bg-white/10 mr-3 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-dojo-text-primary" />
          </button>
        )}
      </header>
      <div className="w-full p-6 overflow-y-auto flex-1 overscroll-contain">
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Connect Ollama Account */}
          <div className="overflow-hidden rounded-dojo-lg bg-white/5 backdrop-blur-dojo border border-white/10">
            <div className="p-4 border-b border-white/10">
              <Field>
                {isLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded animate-pulse w-24"></div>
                      <div className="h-3 bg-white/10 rounded animate-pulse w-32"></div>
                    </div>
                    <div className="h-10 w-10 bg-white/10 rounded-full animate-pulse"></div>
                  </div>
                ) : user && user.name ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm font-medium text-dojo-text-primary">
                          {user?.name}
                        </Label>
                      </div>
                      <Description className="text-sm text-dojo-text-secondary">
                        {user?.email}
                      </Description>
                      <div className="flex items-center space-x-2 mt-2">
                        {user?.plan === "free" && (
                          <Button
                            type="button"
                            color="dark"
                            className="px-3 py-2 text-sm font-medium bg-gradient-to-r from-dojo-accent-primary to-dojo-accent-secondary text-white rounded-lg shadow-dojo-glow transition-all duration-300 hover:shadow-dojo-glow-strong"
                            onClick={() =>
                              window.open(
                                "https://ollama.com/upgrade",
                                "_blank",
                              )
                            }
                          >
                            Upgrade
                          </Button>
                        )}
                        <Button
                          type="button"
                          color="white"
                          className="px-3 py-2 text-sm"
                          onClick={() =>
                            window.open("https://ollama.com/settings", "_blank")
                          }
                        >
                          Manage
                        </Button>
                        <Button
                          type="button"
                          color="zinc"
                          className="px-3 py-2 text-sm"
                          onClick={() => disconnectUser()}
                        >
                          Sign out
                        </Button>
                      </div>
                    </div>
                    {user?.avatarurl && (
                      <img
                        src={user.avatarurl}
                        alt={user?.name}
                        className="h-10 w-10 rounded-full bg-white/10 flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.className = "hidden";
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-dojo-text-primary">Ollama account</div>
                      <div className="text-sm text-dojo-text-secondary">Not connected</div>
                    </div>
                    <Button
                      type="button"
                      color="white"
                      onClick={handleConnectOllamaAccount}
                      disabled={isRefreshing || isAwaitingConnection}
                    >
                      {isRefreshing || isAwaitingConnection ? (
                        <AnimatedDots />
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </div>
                )}
              </Field>
              {connectionError && (
                <div className="mt-3 p-3 bg-dojo-error/10 border border-dojo-error/20 rounded-lg">
                  <Text className="text-sm text-dojo-error">
                    {connectionError}
                  </Text>
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Models */}
          <section className="overflow-hidden rounded-dojo-lg bg-white/5 backdrop-blur-dojo border border-white/10">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-dojo-text-primary flex items-center gap-2">
                <CogIcon className="h-5 w-5 text-dojo-accent-primary" />
                Models
              </h2>
              <p className="text-sm text-dojo-text-secondary mt-1">
                Configure default model settings and context length
              </p>
            </div>
            
            {/* v0.2.0 Model Settings */}
            <SettingsModels />

            <div className="space-y-4 p-4 border-t border-white/10">
              {/* Model Directory */}
              <Field>
                <div className="flex items-start space-x-3">
                  <FolderIcon className="mt-1 h-5 w-5 flex-shrink-0 text-dojo-accent-primary" />
                  <div className="w-full">
                    <Label className="text-dojo-text-primary">Model location</Label>
                    <Description className="text-dojo-text-secondary">
                      Location where models are stored
                    </Description>
                    <div className="mt-2 flex items-center space-x-2">
                      <Input
                        value={settings.Models || ""}
                        onChange={(e) => handleChange("Models", e.target.value)}
                        readOnly
                        className="bg-white/5 border-white/10 text-dojo-text-primary"
                      />
                      <Button
                        type="button"
                        color="white"
                        className="px-2"
                        onClick={async () => {
                          if (window.webview?.selectModelsDirectory) {
                            try {
                              const directory =
                                await window.webview.selectModelsDirectory();
                              if (directory) {
                                handleChange("Models", directory);
                              }
                            } catch (error) {
                              console.error(
                                "Error selecting models directory:",
                                error,
                              );
                            }
                          }
                        }}
                      >
                        <FolderIcon className="w-4 h-4 mr-1" />
                        Browse
                      </Button>
                    </div>
                  </div>
                </div>
              </Field>

              {/* Context Length */}
              <Field>
                <div className="flex items-start space-x-3">
                  <CogIcon className="mt-1 h-5 w-5 flex-shrink-0 text-dojo-accent-primary" />
                  <div className="w-full">
                    <Label className="text-dojo-text-primary">Context length</Label>
                    <Description className="text-dojo-text-secondary">
                      How much conversation history LLMs can remember
                    </Description>
                    <div className="mt-3">
                      <Slider
                        value={settings.ContextLength || 4096}
                        onChange={(value) => {
                          handleChange("ContextLength", value);
                        }}
                        options={[
                          { value: 4096, label: "4k" },
                          { value: 8192, label: "8k" },
                          { value: 16384, label: "16k" },
                          { value: 32768, label: "32k" },
                          { value: 65536, label: "64k" },
                          { value: 131072, label: "128k" },
                          { value: 262144, label: "256k" },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </Field>
            </div>
          </section>

          {/* Section 2: Appearance */}
          <section className="overflow-hidden rounded-dojo-lg bg-white/5 backdrop-blur-dojo border border-white/10">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-dojo-text-primary flex items-center gap-2">
                <svg className="h-5 w-5 text-dojo-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Appearance
              </h2>
              <p className="text-sm text-dojo-text-secondary mt-1">
                Customize the look and feel of the application
              </p>
            </div>
            <SettingsAppearance />
          </section>

          {/* Section 3: Shortcuts */}
          <section className="overflow-hidden rounded-dojo-lg bg-white/5 backdrop-blur-dojo border border-white/10">
            <div className="p-4">
              <ShortcutsPanel />
            </div>
          </section>

          {/* Section 4: Data */}
          <section className="overflow-hidden rounded-dojo-lg bg-white/5 backdrop-blur-dojo border border-white/10">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-dojo-text-primary flex items-center gap-2">
                <svg className="h-5 w-5 text-dojo-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Data Management
              </h2>
              <p className="text-sm text-dojo-text-secondary mt-1">
                Export, import, and manage your conversation data
              </p>
            </div>
            
            {/* Usage Dashboard Link */}
            <div className="p-4 border-b border-white/10">
              <button
                onClick={() => navigate({ to: "/usage" })}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <ChartBarIcon className="h-5 w-5 flex-shrink-0 text-dojo-accent-primary" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-dojo-text-primary">
                      Usage Dashboard
                    </div>
                    <div className="text-sm text-dojo-text-secondary">
                      View token usage and estimated costs
                    </div>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-dojo-text-tertiary group-hover:text-dojo-accent-primary transition-colors" />
              </button>
            </div>

            {/* Data Management Controls */}
            <SettingsData />
          </section>

          {/* Additional Configuration */}
          <section className="overflow-hidden rounded-dojo-lg bg-white/5 backdrop-blur-dojo border border-white/10">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-dojo-text-primary">
                Advanced Settings
              </h2>
            </div>
            <div className="space-y-4 p-4">
              {/* Expose Ollama */}
              <Field>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <WifiIcon className="mt-1 h-5 w-5 flex-shrink-0 text-dojo-accent-primary" />
                    <div>
                      <Label className="text-dojo-text-primary">Expose Ollama to the network</Label>
                      <Description className="text-dojo-text-secondary">
                        Allow other devices or services to access Ollama
                      </Description>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Switch
                      checked={settings.Expose}
                      onChange={(checked) => handleChange("Expose", checked)}
                    />
                  </div>
                </div>
              </Field>

              {/* Airplane Mode */}
              <Field>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <svg
                      className="mt-1 h-5 w-5 flex-shrink-0 text-dojo-accent-primary"
                      viewBox="0 0 21.5508 17.9033"
                      fill="currentColor"
                    >
                      <path d="M21.5508 8.94727C21.542 7.91895 20.1445 7.17188 18.4658 7.17188L14.9238 7.17188C14.4316 7.17188 14.2471 7.09277 13.957 6.75879L8.05078 0.316406C7.86621 0.105469 7.6377 0 7.37402 0L6.35449 0C6.12598 0 5.99414 0.202148 6.1084 0.448242L9.14941 7.17188L4.68457 7.68164L3.09375 4.76367C2.97949 4.54395 2.78613 4.44727 2.49609 4.44727L2.11816 4.44727C1.88965 4.44727 1.74023 4.59668 1.74023 4.8252L1.74023 13.0693C1.74023 13.2979 1.88965 13.4385 2.11816 13.4385L2.49609 13.4385C2.78613 13.4385 2.97949 13.3418 3.09375 13.1309L4.68457 10.2129L9.14941 10.7227L6.1084 17.4463C5.99414 17.6836 6.12598 17.8945 6.35449 17.8945L7.37402 17.8945C7.6377 17.8945 7.86621 17.7803 8.05078 17.5781L13.957 11.127C14.2471 10.8018 14.4316 10.7227 14.9238 10.7227L18.4658 10.7227C20.1445 10.7227 21.542 9.9668 21.5508 8.94727Z" />
                    </svg>
                    <div>
                      <Label className="text-dojo-text-primary">Airplane mode</Label>
                      <Description className="text-dojo-text-secondary">
                        Keep data local, disable cloud models and web search
                      </Description>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Switch
                      checked={settings.AirplaneMode}
                      onChange={(checked) =>
                        handleChange("AirplaneMode", checked)
                      }
                    />
                  </div>
                </div>
              </Field>

              {/* Agent Mode */}
              {window.OLLAMA_TOOLS && (
                <>
                  <Field>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3 flex-1">
                        <BoltIcon className="mt-1 h-5 w-5 flex-shrink-0 text-dojo-accent-primary" />
                        <div>
                          <Label className="text-dojo-text-primary">Enable Agent Mode</Label>
                          <Description className="text-dojo-text-secondary">
                            Use multi-turn tools to fulfill user requests
                          </Description>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Switch
                          checked={settings.Agent}
                          onChange={(checked) => handleChange("Agent", checked)}
                        />
                      </div>
                    </div>
                  </Field>

                  <Field>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3 flex-1">
                        <WrenchIcon className="mt-1 h-5 w-5 flex-shrink-0 text-dojo-accent-primary" />
                        <div>
                          <Label className="text-dojo-text-primary">Enable Tools Mode</Label>
                          <Description className="text-dojo-text-secondary">
                            Use single-turn tools to fulfill user requests
                          </Description>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Switch
                          checked={settings.Tools}
                          onChange={(checked) => handleChange("Tools", checked)}
                        />
                      </div>
                    </div>
                  </Field>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Saved indicator */}
        {(showSaved || restartMessage) && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 z-50 animate-fade-in">
            <div className="px-4 py-2 rounded-lg bg-dojo-success/90 backdrop-blur-dojo border border-dojo-success text-white shadow-dojo-lg">
              <span className="font-medium">✓ Saved</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
