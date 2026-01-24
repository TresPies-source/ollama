// Settings API client for v0.2.0 key-value settings system
// This is separate from the old Settings API in api.ts which uses /api/v1/settings

const API_BASE = import.meta.env.VITE_DGD_API_BASE || "http://localhost:8080";

export interface SettingsResponse {
  settings: Record<string, string>;
}

export interface UpdateSettingsRequest {
  settings: Record<string, string>;
}

/**
 * Fetches all settings from the v0.2.0 key-value settings store
 * @returns Promise resolving to settings object
 * @throws Error on network or server errors
 */
export async function fetchSettings(): Promise<Record<string, string>> {
  const response = await fetch(`${API_BASE}/api/settings`);
  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.statusText}`);
  }
  const data: SettingsResponse = await response.json();
  return data.settings;
}

/**
 * Updates multiple settings in the v0.2.0 key-value settings store
 * @param settings Object containing key-value pairs to update
 * @returns Promise resolving to updated settings object
 * @throws Error on network or server errors
 */
export async function updateSettings(
  settings: Record<string, string>,
): Promise<Record<string, string>> {
  const response = await fetch(`${API_BASE}/api/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ settings } as UpdateSettingsRequest),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to update settings: ${response.statusText}`);
  }
  const data: SettingsResponse = await response.json();
  return data.settings;
}
