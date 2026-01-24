import { useEffect, useState } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Field, Label, Description } from "@/components/ui/fieldset";
import { Slider } from "@/components/ui/slider";
import { Text } from "@/components/ui/text";

type Theme = "light" | "dark" | "auto";

export default function SettingsAppearance() {
  const { settings, updateSettings, isLoading } = useAppSettings();

  // Local state for form values
  const [theme, setTheme] = useState<Theme>(
    (settings?.theme as Theme) || "auto"
  );
  const [fontSize, setFontSize] = useState(
    settings?.font_size ? parseInt(settings.font_size, 10) : 16
  );
  const [glassIntensity, setGlassIntensity] = useState(
    settings?.glass_intensity ? parseInt(settings.glass_intensity, 10) : 70
  );

  // Sync local state with settings
  useEffect(() => {
    if (settings) {
      if (settings.theme) setTheme(settings.theme as Theme);
      if (settings.font_size) setFontSize(parseInt(settings.font_size, 10));
      if (settings.glass_intensity)
        setGlassIntensity(parseInt(settings.glass_intensity, 10));
    }
  }, [settings]);

  // Apply CSS variable changes immediately
  useEffect(() => {
    const root = document.documentElement;

    // Apply font size
    root.style.fontSize = `${fontSize}px`;

    // Apply glassmorphism intensity
    // Intensity is a percentage (0-100), convert to opacity (0.0-1.0)
    const baseOpacity = glassIntensity / 100;
    const lightOpacity = baseOpacity * 0.5;
    const strongOpacity = Math.min(baseOpacity * 0.9, 0.95);

    root.style.setProperty("--glass-bg", `rgba(15, 42, 61, ${baseOpacity})`);
    root.style.setProperty(
      "--glass-bg-light",
      `rgba(15, 42, 61, ${lightOpacity})`
    );
    root.style.setProperty(
      "--glass-bg-strong",
      `rgba(15, 42, 61, ${strongOpacity})`
    );

    // Apply theme
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      // Auto mode: use system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    }
  }, [theme, fontSize, glassIntensity]);

  // Listen for system theme changes in auto mode
  useEffect(() => {
    if (theme !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
    updateSettings({ font_size: value.toString() });
  };

  const handleGlassIntensityChange = (value: number) => {
    setGlassIntensity(value);
    updateSettings({ glass_intensity: value.toString() });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-20 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-20 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-20 bg-white/10 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Theme */}
      <Field>
        <div className="w-full">
          <Label className="text-dojo-text-primary">Theme</Label>
          <Description className="text-dojo-text-secondary">
            Choose between light, dark, or automatic theme
          </Description>
          <div className="mt-2">
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value as Theme)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-dojo-text-primary focus:outline-none focus:ring-2 focus:ring-dojo-accent-primary/50 focus:border-dojo-accent-primary transition-all"
            >
              <option value="auto">Auto (system)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </Field>

      {/* Font Size */}
      <Field>
        <div className="w-full">
          <Label className="text-dojo-text-primary">
            Font size: {fontSize}px
          </Label>
          <Description className="text-dojo-text-secondary">
            Adjust the base font size for better readability
          </Description>
          <div className="mt-3">
            <Slider
              value={fontSize}
              onChange={handleFontSizeChange}
              options={[
                { value: 12, label: "12px" },
                { value: 14, label: "14px" },
                { value: 16, label: "16px" },
                { value: 18, label: "18px" },
                { value: 20, label: "20px" },
              ]}
            />
          </div>
        </div>
      </Field>

      {/* Glassmorphism Intensity */}
      <Field>
        <div className="w-full">
          <Label className="text-dojo-text-primary">
            Glassmorphism intensity: {glassIntensity}%
          </Label>
          <Description className="text-dojo-text-secondary">
            Control the transparency and blur effect of glass elements
          </Description>
          <div className="mt-3">
            <Slider
              value={glassIntensity}
              onChange={handleGlassIntensityChange}
              options={[
                { value: 0, label: "0%" },
                { value: 25, label: "25%" },
                { value: 50, label: "50%" },
                { value: 70, label: "70%" },
                { value: 100, label: "100%" },
              ]}
            />
          </div>
        </div>
      </Field>

      {/* Preview Card */}
      <div className="mt-6 p-4 bg-white/5 backdrop-blur-dojo border border-white/10 rounded-lg">
        <Text className="text-sm text-dojo-text-secondary mb-2">
          Preview
        </Text>
        <div className="p-3 glass rounded-lg">
          <Text className="text-dojo-text-primary">
            This is a glassmorphism preview card
          </Text>
        </div>
      </div>
    </div>
  );
}
