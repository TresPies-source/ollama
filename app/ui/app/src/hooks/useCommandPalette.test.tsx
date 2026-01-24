import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { useCommandPalette } from "./useCommandPalette";
import { CommandPaletteProvider } from "@/contexts/CommandPaletteContext";

const wrapper = ({ children }: { children: ReactNode }) => (
  <CommandPaletteProvider>{children}</CommandPaletteProvider>
);

describe("useCommandPalette", () => {
  it("should return command palette context", () => {
    const { result } = renderHook(() => useCommandPalette(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.state).toBeDefined();
    expect(result.current.open).toBeDefined();
    expect(result.current.close).toBeDefined();
    expect(result.current.toggle).toBeDefined();
    expect(result.current.search).toBeDefined();
    expect(result.current.execute).toBeDefined();
    expect(result.current.selectNext).toBeDefined();
    expect(result.current.selectPrevious).toBeDefined();
  });

  it("should throw error when used outside provider", () => {
    expect(() => {
      renderHook(() => useCommandPalette());
    }).toThrow(
      "useCommandPaletteContext must be used within a CommandPaletteProvider",
    );
  });

  it("should provide same context as useCommandPaletteContext", () => {
    const { result } = renderHook(() => useCommandPalette(), { wrapper });

    expect(typeof result.current.state.isOpen).toBe("boolean");
    expect(typeof result.current.state.query).toBe("string");
    expect(typeof result.current.state.selectedIndex).toBe("number");
    expect(Array.isArray(result.current.state.results)).toBe(true);
  });
});
