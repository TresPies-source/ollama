import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getModels } from "@/api";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Field, Label, Description } from "@/components/ui/fieldset";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

export default function SettingsModels() {
  const { settings, updateSettings, isLoading: settingsLoading } = useAppSettings();
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ["models"],
    queryFn: () => getModels(),
    retry: 3,
  });

  // Local state for form values
  const [defaultModel, setDefaultModel] = useState(settings?.default_model || "");
  const [temperature, setTemperature] = useState(
    settings?.temperature ? parseFloat(settings.temperature) : 0.7
  );
  const [maxTokens, setMaxTokens] = useState(
    settings?.max_tokens ? parseInt(settings.max_tokens, 10) : 2048
  );

  // Validation errors
  const [errors, setErrors] = useState<{
    defaultModel?: string;
    temperature?: string;
    maxTokens?: string;
  }>({});

  // Sync local state with settings
  useEffect(() => {
    if (settings) {
      if (settings.default_model) setDefaultModel(settings.default_model);
      if (settings.temperature) setTemperature(parseFloat(settings.temperature));
      if (settings.max_tokens) setMaxTokens(parseInt(settings.max_tokens, 10));
    }
  }, [settings]);

  const validateTemperature = (value: number): string | undefined => {
    if (isNaN(value)) return "Temperature must be a number";
    if (value < 0 || value > 2) return "Temperature must be between 0 and 2";
    return undefined;
  };

  const validateMaxTokens = (value: number): string | undefined => {
    if (isNaN(value)) return "Max tokens must be a number";
    if (value < 1 || value > 8192) return "Max tokens must be between 1 and 8192";
    if (!Number.isInteger(value)) return "Max tokens must be an integer";
    return undefined;
  };

  const handleDefaultModelChange = (modelName: string) => {
    setDefaultModel(modelName);
    setErrors({ ...errors, defaultModel: undefined });
    
    // Save to backend
    updateSettings({ default_model: modelName });
  };

  const handleTemperatureChange = (value: number) => {
    setTemperature(value);
    
    const error = validateTemperature(value);
    setErrors({ ...errors, temperature: error });
    
    // Only save if valid
    if (!error) {
      updateSettings({ temperature: value.toString() });
    }
  };

  const handleMaxTokensChange = (value: string) => {
    const numValue = parseInt(value, 10);
    setMaxTokens(numValue);
    
    const error = validateMaxTokens(numValue);
    setErrors({ ...errors, maxTokens: error });
    
    // Only save if valid
    if (!error) {
      updateSettings({ max_tokens: numValue.toString() });
    }
  };

  if (settingsLoading || modelsLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-20 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-20 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-20 bg-white/10 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Get list of model names for dropdown
  const modelNames = models.map(m => m.model);
  
  // If default model is not set and we have models, use the first one
  if (!defaultModel && modelNames.length > 0) {
    const firstModel = modelNames[0];
    setDefaultModel(firstModel);
    updateSettings({ default_model: firstModel });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Default Model */}
      <Field>
        <div className="w-full">
          <Label className="text-dojo-text-primary">Default model</Label>
          <Description className="text-dojo-text-secondary">
            The model used for new conversations
          </Description>
          <div className="mt-2">
            <select
              value={defaultModel}
              onChange={(e) => handleDefaultModelChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-dojo-text-primary focus:outline-none focus:ring-2 focus:ring-dojo-accent-primary/50 focus:border-dojo-accent-primary transition-all"
            >
              {modelNames.length === 0 ? (
                <option value="">No models available</option>
              ) : (
                modelNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
          </div>
          {errors.defaultModel && (
            <Text className="text-sm text-dojo-error mt-1">{errors.defaultModel}</Text>
          )}
        </div>
      </Field>

      {/* Temperature */}
      <Field>
        <div className="w-full">
          <Label className="text-dojo-text-primary">
            Temperature: {temperature.toFixed(1)}
          </Label>
          <Description className="text-dojo-text-secondary">
            Controls randomness. Lower is more focused, higher is more creative.
          </Description>
          <div className="mt-3">
            <Slider
              value={temperature}
              onChange={handleTemperatureChange}
              options={[
                { value: 0.0, label: "0.0" },
                { value: 0.3, label: "0.3" },
                { value: 0.5, label: "0.5" },
                { value: 0.7, label: "0.7" },
                { value: 1.0, label: "1.0" },
                { value: 1.5, label: "1.5" },
                { value: 2.0, label: "2.0" },
              ]}
            />
          </div>
          {errors.temperature && (
            <Text className="text-sm text-dojo-error mt-1">{errors.temperature}</Text>
          )}
        </div>
      </Field>

      {/* Max Tokens */}
      <Field>
        <div className="w-full">
          <Label className="text-dojo-text-primary">Max tokens</Label>
          <Description className="text-dojo-text-secondary">
            Maximum length of model responses (1-8192)
          </Description>
          <div className="mt-2">
            <Input
              type="number"
              min={1}
              max={8192}
              value={maxTokens}
              onChange={(e) => handleMaxTokensChange(e.target.value)}
              className="bg-white/5 border-white/10 text-dojo-text-primary focus:ring-dojo-accent-primary/50 focus:border-dojo-accent-primary"
            />
          </div>
          {errors.maxTokens && (
            <Text className="text-sm text-dojo-error mt-1">{errors.maxTokens}</Text>
          )}
        </div>
      </Field>
    </div>
  );
}
