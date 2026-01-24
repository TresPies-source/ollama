import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  checkForUpdates,
  applyUpdate,
  type UpdateCheckResponse,
  type UpdateApplyRequest,
} from "@/api";

/**
 * Hook for checking for application updates
 * 
 * Polls the backend periodically to check for new versions.
 * The backend performs the actual update check against GitHub releases.
 * 
 * @param options Configuration options
 * @param options.enabled Whether to enable automatic update checks (default: true)
 * @param options.refetchInterval How often to check for updates in ms (default: 1 hour)
 * @returns Query result with update availability information
 */
export const useUpdateCheck = (options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) => {
  const { enabled = true, refetchInterval = 60 * 60 * 1000 } = options || {}; // Default: 1 hour

  return useQuery<UpdateCheckResponse>({
    queryKey: ["update-check"],
    queryFn: checkForUpdates,
    enabled,
    refetchInterval,
    staleTime: 30 * 60 * 1000, // Consider data stale after 30 minutes
    retry: 1, // Only retry once on failure
  });
};

/**
 * Hook for applying an available update
 * 
 * Triggers the update installation process on the backend.
 * The backend will download, verify, and install the update,
 * then restart the application.
 * 
 * @returns Mutation object for applying updates
 */
export const useApplyUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateApplyRequest) => applyUpdate(request),
    onSuccess: () => {
      // Clear update check cache since we're applying the update
      queryClient.invalidateQueries({ queryKey: ["update-check"] });
    },
  });
};
