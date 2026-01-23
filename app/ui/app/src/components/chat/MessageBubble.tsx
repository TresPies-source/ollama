import clsx from "clsx";
import { motion } from "framer-motion";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { AgentAvatar, type AgentType } from "./AgentAvatar";
import type { Message } from "../../types/dgd";

type MessageBubbleProps = {
  message: Message;
  className?: string;
};

const isValidAgentType = (type: string | undefined): type is AgentType => {
  return ["supervisor", "dojo", "librarian", "builder", "user"].includes(
    type || "",
  );
};

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const rawAgentType = isUser ? "user" : message.agent_type;
  const agentType: AgentType = isValidAgentType(rawAgentType)
    ? rawAgentType
    : "dojo";
  const timestamp = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className={clsx(
        "flex gap-3 w-full",
        isUser ? "flex-row-reverse" : "flex-row",
        className,
      )}
    >
      <AgentAvatar agentType={agentType} size="md" />

      <Card
        className={clsx(
          "flex-1 p-4 max-w-3xl",
          "transition-all duration-300 ease-natural",
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            {!isUser && message.agent_type && (
              <Badge color="accent" className="capitalize">
                {message.agent_type}
              </Badge>
            )}
            {!isUser && message.mode && (
              <Badge color="blue" className="capitalize">
                {message.mode}
              </Badge>
            )}
          </div>
          <time className="text-xs text-dojo-text-tertiary shrink-0">
            {timestamp}
          </time>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-dojo-text-primary whitespace-pre-wrap m-0">
            {message.content}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
