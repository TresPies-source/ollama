import clsx from "clsx";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import type { Session } from "../../types/dgd";
import { formatRelativeTime } from "../../utils/formatTime";

type SessionCardProps = {
  session: Session;
  lastMessage?: string;
  onClick?: () => void;
  className?: string;
};

export function SessionCard({
  session,
  lastMessage,
  onClick,
  className,
}: SessionCardProps) {
  const relativeTime = formatRelativeTime(session.updated_at);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
      className={clsx("cursor-pointer", className)}
      onClick={onClick}
    >
      <Card
        hover
        className={clsx(
          "p-5 h-full",
          "border-white/10 hover:border-dojo-accent-primary/30",
          "transition-all duration-300 ease-natural",
        )}
      >
        <div className="flex flex-col gap-3 h-full">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-dojo-text-primary line-clamp-1 flex-1">
              {session.title}
            </h3>
            <Badge
              color={session.status === "active" ? "green" : "zinc"}
              className="shrink-0 capitalize"
            >
              {session.status}
            </Badge>
          </div>

          {lastMessage && (
            <p className="text-sm text-dojo-text-secondary line-clamp-2 flex-1">
              {lastMessage}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-white/5">
            <span className="text-xs text-dojo-text-tertiary truncate">
              {session.working_dir}
            </span>
            <time className="text-xs text-dojo-text-tertiary shrink-0">
              {relativeTime}
            </time>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
