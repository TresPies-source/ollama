import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, updateSettings } from "@/api/settings";

/**
 * Hook for accessing and updating v0.2.0 application settings
 * This uses the new key-value settings store (/api/settings)
 * which is separate from the old settings system (/api/v1/settings)
 * 
 * @returns {Object} Settings state and update function
 * @property {Record<string, string> | undefined} settings - Current settings object
 * @property {boolean} isLoading - Loading state
 * @property {Error | null} error - Error state
 * @property {Function} updateSettings - Function to update settings with optimistic updates
 */
export function useAppSettings() {
  const queryClient = useQueryClient();

  // Fetch settings with useQuery
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery<Record<string, string>, Error>({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
    staleTime: 30000, // 30 seconds
    retry: 3,
  });

  // Update settings with useMutation and optimistic updates
  const mutation = useMutation<
    Record<string, string>,
    Error,
    Record<string, string>,
    { previousSettings: Record<string, string> | undefined }
  >({
    mutationFn: updateSettings,
    // Optimistic update: immediately update the cache before the server responds
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["appSettings"] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<Record<string, string>>(
        ["appSettings"],
      );

      // Optimistically update to the new value
      queryClient.setQueryData<Record<string, string>>(
        ["appSettings"],
        (old) => ({
          ...old,
          ...newSettings,
        }),
      );

      // Return context with previous value for rollback
      return { previousSettings };
    },
    // If mutation fails, rollback to previous value
    onError: (_error, _newSettings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(["appSettings"], context.previousSettings);
      }
    },
    // Always refetch after error or success to ensure sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["appSettings"] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: mutation.mutate,
    updateSettingsAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
