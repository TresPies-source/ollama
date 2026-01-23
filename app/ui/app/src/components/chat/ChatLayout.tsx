import clsx from "clsx";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import type { Message } from "../../types/dgd";

type ChatLayoutProps = {
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  headerContent?: React.ReactNode;
  className?: string;
};

export function ChatLayout({
  messages,
  isStreaming = false,
  streamingContent = "",
  onSendMessage,
  disabled = false,
  headerContent,
  className,
}: ChatLayoutProps) {
  return (
    <div
      className={clsx(
        "flex flex-col h-screen w-full",
        "bg-gradient-to-br from-dojo-bg-primary via-dojo-bg-secondary to-dojo-bg-tertiary",
        className,
      )}
    >
      {headerContent && (
        <header
          className={clsx(
            "flex items-center justify-between",
            "px-6 py-4",
            "bg-[rgba(15,42,61,0.7)] backdrop-blur-dojo",
            "border-b border-white/10",
            "shadow-dojo-md",
          )}
        >
          {headerContent}
        </header>
      )}

      <div className="flex flex-col flex-1 min-h-0">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          className="flex-1"
        />

        <div
          className={clsx(
            "px-6 py-4",
            "bg-[rgba(15,42,61,0.5)] backdrop-blur-dojo",
            "border-t border-white/10",
          )}
        >
          <MessageInput
            onSend={onSendMessage}
            disabled={disabled || isStreaming}
            placeholder={
              isStreaming
                ? "Waiting for response..."
                : "Type your message... (Shift+Enter for new line)"
            }
          />
        </div>
      </div>
    </div>
  );
}
