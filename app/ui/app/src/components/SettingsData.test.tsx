import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@testing-library/jest-dom/vitest";
import SettingsData from "./SettingsData";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

// Helper to wrap component with providers
function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
}

describe("SettingsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all data management options", () => {
    renderWithProviders(<SettingsData />);

    expect(screen.getByText("Export all sessions")).toBeInTheDocument();
    expect(screen.getByText("Import sessions")).toBeInTheDocument();
    expect(screen.getByText("Clear history")).toBeInTheDocument();
  });

  it("shows export button", () => {
    renderWithProviders(<SettingsData />);

    const exportButton = screen.getByRole("button", { name: /export all/i });
    expect(exportButton).toBeInTheDocument();
  });

  it("shows import button", () => {
    renderWithProviders(<SettingsData />);

    const importButton = screen.getByText(/^Import$/);
    expect(importButton).toBeInTheDocument();
  });

  it("shows clear all button", () => {
    renderWithProviders(<SettingsData />);

    const clearButton = screen.getByRole("button", { name: /clear all/i });
    expect(clearButton).toBeInTheDocument();
  });

  it("displays error when no sessions to export", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [] }),
    });

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const exportButton = screen.getByRole("button", { name: /export all/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText("No sessions to export")).toBeInTheDocument();
    });
  });

  it("exports all sessions successfully", async () => {
    const mockSessions = [
      { id: "session-1", title: "Test Session 1" },
      { id: "session-2", title: "Test Session 2" },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: mockSessions }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          "Content-Disposition": 'attachment; filename="session_1.md"',
        }),
        blob: async () => new Blob(["session 1 content"]),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          "Content-Disposition": 'attachment; filename="session_2.md"',
        }),
        blob: async () => new Blob(["session 2 content"]),
      });

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const exportButton = screen.getByRole("button", { name: /export all/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText(/successfully exported 2 session\(s\)/i)).toBeInTheDocument();
    });
  });

  it("opens confirmation dialog when clearing history", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const clearButton = screen.getByRole("button", { name: /clear all/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText("Clear All History?")).toBeInTheDocument();
    });
  });

  it("closes confirmation dialog when cancel is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const clearButton = screen.getByRole("button", { name: /clear all/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText("Clear All History?")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("Clear All History?")).not.toBeInTheDocument();
    });
  });

  it("clears all sessions when confirmed", async () => {
    const mockSessions = [
      { id: "session-1", title: "Test Session 1" },
      { id: "session-2", title: "Test Session 2" },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: mockSessions }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "session deleted successfully" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "session deleted successfully" }),
      });

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const clearButton = screen.getByRole("button", { name: /clear all/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText("Clear All History?")).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole("button", { name: /clear all/i })[1];
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/successfully cleared 2 session\(s\)/i)).toBeInTheDocument();
    });
  });

  it("handles import file selection", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        session_id: "new-session-id",
        message: "Successfully imported session",
      }),
    });

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const file = new File(["session content"], "session.md", { type: "text/markdown" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/successfully imported 1 session\(s\)/i)).toBeInTheDocument();
    });
  });

  it.skip("handles non-markdown files on import gracefully", async () => {
    // Mock fetch for queryClient.invalidateQueries - sessions refetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [] }),
    });

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    // Wait for the import process to complete
    await waitFor(() => {
      // Should show error message when no valid markdown files imported
      expect(screen.getByText(/failed to import sessions/i)).toBeInTheDocument();
    });
  });

  it("shows loading state when exporting", async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ sessions: [] }),
            });
          }, 100);
        })
    );

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const exportButton = screen.getByRole("button", { name: /export all/i });
    await user.click(exportButton);

    expect(screen.getByRole("button", { name: /exporting.../i })).toBeInTheDocument();
  });

  it("shows loading state when importing", async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                session_id: "new-id",
                message: "Success",
              }),
            });
          }, 100);
        })
    );

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const file = new File(["content"], "session.md", { type: "text/markdown" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/importing.../i)).toBeInTheDocument();
    });
  });

  it("shows loading state when clearing", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [{ id: "1", title: "Test" }] }),
      })
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ message: "deleted" }),
              });
            }, 100);
          })
      );

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const clearButton = screen.getByRole("button", { name: /clear all/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText("Clear All History?")).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole("button", { name: /clear all/i })[1];
    await user.click(confirmButton);

    expect(screen.getByRole("button", { name: /clearing.../i })).toBeInTheDocument();
  });

  it("handles export API error gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const exportButton = screen.getByRole("button", { name: /export all/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to export sessions")).toBeInTheDocument();
    });
  });

  it("handles import API error gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const file = new File(["content"], "session.md", { type: "text/markdown" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("Failed to import sessions")).toBeInTheDocument();
    });
  });

  it("handles clear API error gracefully", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [{ id: "1", title: "Test" }] }),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    const user = userEvent.setup();
    renderWithProviders(<SettingsData />);

    const clearButton = screen.getByRole("button", { name: /clear all/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText("Clear All History?")).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole("button", { name: /clear all/i })[1];
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to clear history")).toBeInTheDocument();
    });
  });
});
