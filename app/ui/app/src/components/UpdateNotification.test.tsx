import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UpdateNotification } from "./UpdateNotification";
import * as updateHooks from "@/hooks/useUpdateCheck";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe("UpdateNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering States", () => {
    it("should not render when loading", () => {
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      expect(screen.queryByRole("status")).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("should not render when no update available", () => {
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: false,
          current_version: "0.2.0",
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      expect(screen.queryByRole("status")).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("should render notification when update available", () => {
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: true,
          current_version: "0.2.0",
          latest_version: "0.2.1",
          download_url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      expect(screen.getByRole("status")).toBeTruthy();
      expect(screen.getByText(/Update available: v0.2.1/i)).toBeTruthy();
      expect(screen.getByText(/Current version: v0.2.0/i)).toBeTruthy();
    });

    it("should render error state when update check fails", () => {
      const mockError = new Error("Network error");
      
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText(/Failed to check for updates/i)).toBeTruthy();
      expect(screen.getByText(/Network error/i)).toBeTruthy();
    });

    it("should render installing state during update", () => {
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: true,
          current_version: "0.2.0",
          latest_version: "0.2.1",
          download_url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      expect(screen.getByRole("status")).toBeTruthy();
      expect(screen.getByText(/Installing update\.\.\./i)).toBeTruthy();
      expect(screen.getByText(/Downloading and verifying v0.2.1/i)).toBeTruthy();
      expect(screen.getByText(/The application will restart automatically/i)).toBeTruthy();
    });

    it("should render error state when update apply fails", () => {
      const mockError = new Error("Checksum mismatch");
      
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: true,
          current_version: "0.2.0",
          latest_version: "0.2.1",
          download_url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: true,
        error: mockError,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText(/Update failed/i)).toBeTruthy();
      expect(screen.getByText(/Checksum mismatch/i)).toBeTruthy();
    });
  });

  describe("User Interactions", () => {
    it("should call mutate when Install Now button is clicked", async () => {
      const mockMutate = vi.fn();
      
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: true,
          current_version: "0.2.0",
          latest_version: "0.2.1",
          download_url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      const installButton = screen.getByLabelText(/Install update now/i);
      fireEvent.click(installButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          version: "0.2.1",
          url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        });
      });
    });

    it("should dismiss notification when Later button is clicked", async () => {
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: true,
          current_version: "0.2.0",
          latest_version: "0.2.1",
          download_url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      const laterButton = screen.getByLabelText(/Install later/i);
      fireEvent.click(laterButton);

      await waitFor(() => {
        expect(screen.queryByRole("status")).toBeNull();
      });
    });

    it("should call refetch when Retry is clicked on check error", async () => {
      const mockRefetch = vi.fn();
      const mockError = new Error("Network error");
      
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      const retryButton = screen.getByLabelText(/Retry update check/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it("should retry installation when Retry is clicked on apply error", async () => {
      const mockMutate = vi.fn();
      const mockError = new Error("Installation failed");
      
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: true,
          current_version: "0.2.0",
          latest_version: "0.2.1",
          download_url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: true,
        error: mockError,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      const retryButton = screen.getByLabelText(/Retry update installation/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          version: "0.2.1",
          url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        });
      });
    });

    it("should dismiss error notification when dismiss button is clicked", async () => {
      const mockError = new Error("Network error");
      
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      const dismissButton = screen.getByLabelText(/Dismiss notification/i);
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByRole("alert")).toBeNull();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes for status", () => {
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: true,
          current_version: "0.2.0",
          latest_version: "0.2.1",
          download_url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      const statusElement = screen.getByRole("status");
      expect(statusElement.getAttribute("aria-live")).toBe("polite");
    });

    it("should have proper ARIA attributes for alerts", () => {
      const mockError = new Error("Network error");
      
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      const alertElement = screen.getByRole("alert");
      expect(alertElement.getAttribute("aria-live")).toBe("polite");
    });

    it("should have accessible button labels", () => {
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: true,
          current_version: "0.2.0",
          latest_version: "0.2.1",
          download_url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      expect(screen.getByLabelText(/Install update now/i)).toBeTruthy();
      expect(screen.getByLabelText(/Install later/i)).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("should not call mutate if update data is incomplete", async () => {
      const mockMutate = vi.fn();
      
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: true,
          current_version: "0.2.0",
          latest_version: undefined,
          download_url: undefined,
          checksum: undefined,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      const installButton = screen.getByLabelText(/Install update now/i);
      fireEvent.click(installButton);

      await waitFor(() => {
        expect(mockMutate).not.toHaveBeenCalled();
      });
    });

    it("should show fallback error message when error has no message", () => {
      vi.spyOn(updateHooks, "useUpdateCheck").mockReturnValue({
        data: {
          update_available: true,
          current_version: "0.2.0",
          latest_version: "0.2.1",
          download_url: "https://example.com/dgd-0.2.1",
          checksum: "abc123",
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.spyOn(updateHooks, "useApplyUpdate").mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: true,
        error: {} as Error,
        reset: vi.fn(),
      } as any);

      renderWithQueryClient(<UpdateNotification />);
      
      expect(screen.getByText(/Failed to install update/i)).toBeTruthy();
    });
  });
});
