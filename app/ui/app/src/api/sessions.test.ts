import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { exportSession, importSession } from "../api";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const API_BASE = "http://127.0.0.1:8080";

describe("Sessions Export/Import API", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    
    // Mock DOM methods
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
    window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("exportSession", () => {
    it("should export session successfully with default filename", async () => {
      const mockBlob = new Blob(["# Test Session"], { type: "text/markdown" });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        blob: async () => mockBlob,
      });

      await exportSession("test-session-id");

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/sessions/test-session-id/export`
      );
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should export session with filename from Content-Disposition header", async () => {
      const mockBlob = new Blob(["# Test Session"], { type: "text/markdown" });
      const headers = new Headers();
      headers.set("Content-Disposition", 'attachment; filename="my_session_20240124.md"');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers,
        blob: async () => mockBlob,
      });

      await exportSession("test-session-id");

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/sessions/test-session-id/export`
      );
      
      // Verify the anchor element was created with correct filename
      const appendCall = (document.body.appendChild as any).mock.calls[0];
      const anchor = appendCall[0] as HTMLAnchorElement;
      expect(anchor.download).toBe("my_session_20240124.md");
    });

    it("should throw error when export fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      await expect(exportSession("invalid-session")).rejects.toThrow(
        "Failed to export session: Not Found"
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(exportSession("test-session-id")).rejects.toThrow(
        "Network error"
      );
    });

    it("should strip quotes from filename", async () => {
      const mockBlob = new Blob(["# Test Session"], { type: "text/markdown" });
      const headers = new Headers();
      headers.set("Content-Disposition", 'attachment; filename="\'quoted_file.md\'"');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers,
        blob: async () => mockBlob,
      });

      await exportSession("test-session-id");
      
      const appendCall = (document.body.appendChild as any).mock.calls[0];
      const anchor = appendCall[0] as HTMLAnchorElement;
      expect(anchor.download).toBe("quoted_file.md");
    });
  });

  describe("importSession", () => {
    it("should import markdown file successfully", async () => {
      const mockFile = new File(["# Test Content"], "test.md", {
        type: "text/markdown",
      });

      const mockResponse = {
        session_id: "new-session-123",
        message: "Successfully imported session with 5 messages",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await importSession(mockFile);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/sessions/import`,
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should reject non-markdown files", async () => {
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });

      await expect(importSession(mockFile)).rejects.toThrow(
        "File must be a markdown file (.md or .markdown)"
      );
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should accept .markdown extension", async () => {
      const mockFile = new File(["# Test"], "test.markdown", {
        type: "text/markdown",
      });

      const mockResponse = {
        session_id: "new-session-456",
        message: "Successfully imported session with 3 messages",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await importSession(mockFile);

      expect(result).toEqual(mockResponse);
    });

    it("should throw error when import fails with error message", async () => {
      const mockFile = new File(["# Invalid"], "test.md", {
        type: "text/markdown",
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({ error: "Invalid markdown format" }),
      });

      await expect(importSession(mockFile)).rejects.toThrow(
        "Invalid markdown format"
      );
    });

    it("should throw error when import fails without error message", async () => {
      const mockFile = new File(["# Test"], "test.md", {
        type: "text/markdown",
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
        json: async () => ({}),
      });

      await expect(importSession(mockFile)).rejects.toThrow(
        "Failed to import session: Internal Server Error"
      );
    });

    it("should handle network errors", async () => {
      const mockFile = new File(["# Test"], "test.md", {
        type: "text/markdown",
      });

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(importSession(mockFile)).rejects.toThrow("Network error");
    });

    it("should send FormData with file", async () => {
      const mockFile = new File(["# Test"], "test.md", {
        type: "text/markdown",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          session_id: "new-session",
          message: "Success",
        }),
      });

      await importSession(mockFile);

      const callArgs = mockFetch.mock.calls[0];
      const formData = callArgs[1].body as FormData;
      
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("file")).toBe(mockFile);
    });
  });
});
