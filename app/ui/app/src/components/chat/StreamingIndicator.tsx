import clsx from "clsx";

type StreamingIndicatorProps = {
  className?: string;
};

export function StreamingIndicator({ className }: StreamingIndicatorProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2",
        "text-dojo-text-secondary text-sm",
        className,
      )}
    >
      <div className="flex gap-1">
        <span
          className={clsx(
            "w-2 h-2 rounded-full",
            "bg-dojo-accent-primary",
            "animate-pulse",
            "shadow-dojo-glow",
          )}
          style={{ animationDelay: "0ms", animationDuration: "1.4s" }}
        />
        <span
          className={clsx(
            "w-2 h-2 rounded-full",
            "bg-dojo-accent-primary",
            "animate-pulse",
            "shadow-dojo-glow",
          )}
          style={{ animationDelay: "200ms", animationDuration: "1.4s" }}
        />
        <span
          className={clsx(
            "w-2 h-2 rounded-full",
            "bg-dojo-accent-primary",
            "animate-pulse",
            "shadow-dojo-glow",
          )}
          style={{ animationDelay: "400ms", animationDuration: "1.4s" }}
        />
      </div>
      <span>Thinking...</span>
    </div>
  );
}
