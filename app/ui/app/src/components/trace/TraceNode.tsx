import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import clsx from "clsx";
import { Badge } from "../ui/badge";
import type { TraceNodeData } from "../../utils/traceParser";
import { EVENT_TYPE_COLORS } from "../../utils/traceParser";
import type { EventType } from "../../types/dgd";

/**
 * Valid badge color types from the Badge component
 */
type BadgeColor =
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "zinc"
  | "accent";

/**
 * Color variant mapping for badges based on event type
 */
const EVENT_TYPE_BADGE_COLORS: Record<EventType, BadgeColor> = {
  MODE_TRANSITION: "accent",
  TOOL_INVOCATION: "blue",
  PERSPECTIVE_INTEGRATION: "green",
  LLM_CALL: "yellow",
  AGENT_ROUTING: "purple",
  FILE_OPERATION: "teal",
  ERROR: "red",
};

/**
 * Format timestamp to relative time
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;

    return date.toLocaleDateString();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to format timestamp:", timestamp, error);
    }
    return timestamp;
  }
}

/**
 * Check if event type uses gradient border
 */
function isGradientBorder(eventType: EventType): boolean {
  return eventType === "MODE_TRANSITION";
}

/**
 * Get border classes and inline style based on event type
 */
function getBorderStyle(eventType: EventType): {
  className?: string;
  style?: React.CSSProperties;
} {
  const color = EVENT_TYPE_COLORS[eventType];

  if (isGradientBorder(eventType)) {
    // Use class-based gradient border
    return { className: "trace-node-gradient-border" };
  }

  return {
    style: {
      borderColor: color,
      borderWidth: "2px",
      borderStyle: "solid",
    },
  };
}

/**
 * Props for TraceNode component
 */
interface TraceNodeProps {
  data: TraceNodeData;
  selected?: boolean;
}

/**
 * Custom TraceNode component for React Flow
 * Displays trace events with glassmorphism design and color-coded borders
 */
export const TraceNode = memo(({ data, selected }: TraceNodeProps) => {
  const { event, summary, expanded } = data;
  const { event_type, timestamp, inputs, outputs } = event;

  const borderStyle = getBorderStyle(event_type);
  const relativeTime = formatTimestamp(timestamp);
  const badgeColor = EVENT_TYPE_BADGE_COLORS[event_type];

  // Determine if there's data to show when expanded
  const hasExpandableData = inputs || outputs;

  return (
    <div
      className={clsx(
        "relative min-w-[280px] max-w-[320px]",
        "rounded-dojo-lg",
        "bg-[rgba(15,42,61,0.8)] backdrop-blur-dojo",
        "shadow-dojo-md",
        "transition-all duration-300 ease-natural",
        selected && "shadow-dojo-xl ring-2 ring-white/20",
        "hover:shadow-dojo-lg hover:-translate-y-0.5",
        hasExpandableData && "cursor-pointer",
        borderStyle.className,
      )}
      style={borderStyle.style}
    >
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-white/50 !border-white/30 !w-2 !h-2"
      />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <Badge color={badgeColor} className="flex-shrink-0">
            {event_type.replace(/_/g, " ")}
          </Badge>
          <span className="text-xs text-white/50 flex-shrink-0">
            {relativeTime}
          </span>
        </div>

        {/* Summary */}
        <div className="text-sm text-white/90 font-medium">{summary}</div>

        {/* Expanded content */}
        {expanded && hasExpandableData && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            {inputs && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-white/70">Inputs:</div>
                <pre className="text-xs text-white/60 overflow-x-auto max-h-32 overflow-y-auto bg-black/20 rounded p-2 font-mono">
                  {JSON.stringify(inputs, null, 2)}
                </pre>
              </div>
            )}

            {outputs && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-white/70">
                  Outputs:
                </div>
                <pre className="text-xs text-white/60 overflow-x-auto max-h-32 overflow-y-auto bg-black/20 rounded p-2 font-mono">
                  {JSON.stringify(outputs, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Expand indicator */}
        {hasExpandableData && (
          <div className="flex items-center justify-center pt-2">
            <div className="text-xs text-white/40 flex items-center gap-1">
              {expanded ? (
                <>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  <span>Click to collapse</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span>Click to expand</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-white/50 !border-white/30 !w-2 !h-2"
      />
    </div>
  );
});

TraceNode.displayName = "TraceNode";
