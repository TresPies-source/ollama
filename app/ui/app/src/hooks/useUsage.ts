import { useQuery } from "@tanstack/react-query";
import { getUsageStats, getSessionUsage } from "@/api";
import type { UsageStats, SessionUsage } from "@/api";

export function useUsage() {
  return useQuery<UsageStats, Error>({
    queryKey: ["usage"],
    queryFn: getUsageStats,
    staleTime: 30000,
    retry: 3,
  });
}

export function useSessionUsage(sessionId: string) {
  return useQuery<SessionUsage, Error>({
    queryKey: ["sessionUsage", sessionId],
    queryFn: () => getSessionUsage(sessionId),
    enabled: !!sessionId && sessionId !== "new",
    staleTime: 30000,
    retry: 3,
  });
}
