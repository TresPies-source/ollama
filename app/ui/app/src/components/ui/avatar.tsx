import clsx from "clsx";

export type AvatarProps = {
  src?: string;
  alt?: string;
  initials?: string;
  status?: "online" | "offline" | "away" | "busy";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
};

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-500",
  away: "bg-yellow-500",
  busy: "bg-red-500",
};

export function Avatar({
  src,
  alt = "Avatar",
  initials,
  status,
  size = "md",
  className,
}: AvatarProps) {
  return (
    <div className={clsx("relative inline-block", className)}>
      <div
        className={clsx(
          sizeClasses[size],
          "rounded-full border-2 border-white/20",
          "bg-[rgba(15,42,61,0.7)] backdrop-blur-dojo",
          "flex items-center justify-center",
          "text-white font-medium",
          "overflow-hidden",
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span>{initials || alt.charAt(0).toUpperCase()}</span>
        )}
      </div>
      {status && (
        <span
          className={clsx(
            "absolute bottom-0 right-0",
            "w-3 h-3 rounded-full border-2 border-dojo-bg-primary",
            statusColors[status],
          )}
        />
      )}
    </div>
  );
}
