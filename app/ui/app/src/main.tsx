import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { fetchUser } from "./api";
import { StreamingProvider } from "./contexts/StreamingContext";
import { CommandPaletteProvider } from "./contexts/CommandPaletteContext";
import { ShortcutsProvider } from "./contexts/ShortcutsContext";
import { CommandPalette } from "./components/CommandPalette";
import { UpdateNotification } from "./components/UpdateNotification";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      networkMode: "always", // Run mutations regardless of network state
    },
    queries: {
      networkMode: "always", // Allow queries even when offline (local server)
    },
  },
});

fetchUser()
  .then((userData) => {
    if (userData) {
      queryClient.setQueryData(["user"], userData);
    }
  })
  .catch((error) => {
    console.log("User authentication not available:", error.message);
  });

const router = createRouter({
  routeTree,
  context: { queryClient },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <StreamingProvider>
          <ShortcutsProvider>
            <CommandPaletteProvider>
              <RouterProvider router={router} />
              <CommandPalette />
              <UpdateNotification />
            </CommandPaletteProvider>
          </ShortcutsProvider>
        </StreamingProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
