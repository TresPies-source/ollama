import { useState } from "react";
import { useUpdateCheck, useApplyUpdate } from "@/hooks/useUpdateCheck";

/**
 * UpdateNotification - Notification banner for application updates
 * 
 * Features:
 * - Displays when an update is available
 * - Shows current and latest version
 * - Install Now button to trigger update
 * - Later button to dismiss
 * - Shows progress during update installation
 * - Error handling with retry option
 * - Positioned at top-right with glassmorphism design
 */
export function UpdateNotification() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { data: updateCheck, isLoading, error, refetch } = useUpdateCheck();
  const applyUpdateMutation = useApplyUpdate();

  const handleInstallNow = () => {
    if (updateCheck?.latest_version && updateCheck?.download_url && updateCheck?.checksum) {
      applyUpdateMutation.mutate({
        version: updateCheck.latest_version,
        url: updateCheck.download_url,
        checksum: updateCheck.checksum,
      });
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleRetry = () => {
    applyUpdateMutation.reset();
    refetch();
  };

  // Don't show if loading or dismissed
  if (isLoading || isDismissed) {
    return null;
  }

  // Error state from update check
  if (error) {
    return (
      <div
        className="fixed top-4 right-4 z-[var(--z-toast)] max-w-md glass-medium rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] animate-slide-down"
        role="alert"
        aria-live="polite"
      >
        <div className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--danger)]/20 flex items-center justify-center">
            <svg
              className="w-3 h-3 text-[var(--danger)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Failed to check for updates
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {error.message}
            </p>
          </div>
          <button
            onClick={handleRetry}
            className="flex-shrink-0 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
            aria-label="Retry update check"
          >
            Retry
          </button>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Installing state
  if (applyUpdateMutation.isPending) {
    return (
      <div
        className="fixed top-4 right-4 z-[var(--z-toast)] max-w-md glass-medium rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] animate-slide-down"
        role="status"
        aria-live="polite"
      >
        <div className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Installing update...
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Downloading and verifying v{updateCheck?.latest_version || "latest"}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              The application will restart automatically
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state from update apply
  if (applyUpdateMutation.isError) {
    return (
      <div
        className="fixed top-4 right-4 z-[var(--z-toast)] max-w-md glass-medium rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] animate-slide-down"
        role="alert"
        aria-live="polite"
      >
        <div className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--danger)]/20 flex items-center justify-center">
            <svg
              className="w-3 h-3 text-[var(--danger)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Update failed
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {applyUpdateMutation.error?.message || "Failed to install update"}
            </p>
          </div>
          <button
            onClick={handleInstallNow}
            className="flex-shrink-0 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
            aria-label="Retry update installation"
          >
            Retry
          </button>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Don't show if no update available (after handling all error states)
  if (!updateCheck?.update_available) {
    return null;
  }

  // Success state - update available
  return (
    <div
      className="fixed top-4 right-4 z-[var(--z-toast)] max-w-md glass-medium rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] animate-slide-down"
      role="status"
      aria-live="polite"
    >
      <div className="p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
          <svg
            className="w-3 h-3 text-[var(--accent-primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Update available: v{updateCheck.latest_version}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Current version: v{updateCheck.current_version}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInstallNow}
            className="px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] rounded-[var(--radius-md)] transition-colors"
            aria-label="Install update now"
          >
            Install Now
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Install later"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
