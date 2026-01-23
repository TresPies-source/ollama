import { motion } from "framer-motion";
import clsx from "clsx";
import type { Session } from "../../types/dgd";
import { SessionCard } from "./SessionCard";

type SessionGridProps = {
  sessions: Session[];
  onSessionClick?: (session: Session) => void;
  sessionMessages?: Map<string, string>;
  className?: string;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
};

export function SessionGrid({
  sessions,
  onSessionClick,
  sessionMessages,
  className,
}: SessionGridProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={clsx(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className,
      )}
    >
      {sessions.map((session) => (
        <motion.div key={session.id} variants={item}>
          <SessionCard
            session={session}
            lastMessage={sessionMessages?.get(session.id)}
            onClick={() => onSessionClick?.(session)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
