import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { getSettings } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";

function RootComponent() {
  // This hook ensures settings are fetched on app startup
  useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  return (
    <div>
      <GlobalShortcuts />
      <Outlet />
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});
