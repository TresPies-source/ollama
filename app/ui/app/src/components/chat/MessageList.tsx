import { useEffect, useRef } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { StreamingIndicator } from "./StreamingIndicator";
import { Card } from "../ui/card";
import { AgentAvatar } from "./AgentAvatar";
import type { Message } from "../../types/dgd";

type MessageListProps = {
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
  className?: string;
};

export function MessageList({
  messages,
  isStreaming = false,
  streamingContent = "",
  className,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, streamingContent]);

  return (
    <div
      ref={listRef}
      className={clsx(
        "flex-1 overflow-y-auto",
        "px-4 py-6 space-y-4",
        "scroll-smooth",
        className,
      )}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <div className="text-4xl">🥋</div>
            <h2 className="text-xl font-semibold text-dojo-text-primary">
              Welcome to Dojo Genesis
            </h2>
            <p className="text-dojo-text-secondary max-w-md">
              Start a conversation with the Dojo agent. Ask questions, explore
              ideas, or work on your projects.
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isStreaming && streamingContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0.0, 0.2, 1],
              }}
              className="flex gap-3 w-full"
            >
              <AgentAvatar agentType="dojo" size="md" />
              <Card className="flex-1 p-4 max-w-3xl">
                <div className="prose prose-invert max-w-none">
                  <p className="text-dojo-text-primary whitespace-pre-wrap m-0">
                    {streamingContent}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
          {isStreaming && !streamingContent && (
            <div className="flex gap-3">
              <StreamingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
}
