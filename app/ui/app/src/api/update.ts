import { API_BASE } from "./dgd-client";

/**
 * Response from the update check endpoint
 */
export interface UpdateCheckResponse {
  update_available: boolean;
  current_version: string;
  latest_version?: string;
  download_url?: string;
  checksum?: string;
}

/**
 * Request payload for applying an update
 */
export interface UpdateApplyRequest {
  version: string;
  url: string;
  checksum: string;
}

/**
 * Response from the update apply endpoint
 */
export interface UpdateApplyResponse {
  success: boolean;
  message: string;
}

/**
 * Checks for available updates from the backend
 * 
 * @returns Promise resolving to update check response
 * @throws Error on network or server errors
 */
export async function checkForUpdates(): Promise<UpdateCheckResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/update/check`);
    
    if (!response.ok) {
      throw new Error(`Failed to check for updates: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error while checking for updates");
  }
}

/**
 * Applies an available update by downloading and installing it
 * 
 * The backend will:
 * 1. Download the new version
 * 2. Verify the checksum
 * 3. Replace the current executable
 * 4. Restart the application
 * 
 * @param request Update details including version, URL, and checksum
 * @returns Promise resolving to update apply response
 * @throws Error on network or server errors
 */
export async function applyUpdate(
  request: UpdateApplyRequest
): Promise<UpdateApplyResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/update/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to apply update: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error while applying update");
  }
}
