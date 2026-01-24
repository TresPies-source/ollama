import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { useChatStream } from "@/hooks/useChatStream";
import { getSession, createSession } from "@/api/dgd-client";
import type { Message } from "@/types/dgd";
import { NetworkIcon } from "lucide-react";

export const Route = createFileRoute("/chat/$sessionId")({
  component: ChatPage,
});

function ChatPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const totalTokens = messages.reduce((sum, msg) => {
    const promptTokens = msg.prompt_tokens || 0;
    const completionTokens = msg.completion_tokens || 0;
    return sum + promptTokens + completionTokens;
  }, 0);

  const {
    sendMessage,
    isStreaming,
    streamingContent,
    error: streamError,
  } = useChatStream({
    onMessageComplete: (message) => {
      setMessages((prev) => [...prev, message]);
    },
    onError: (err) => {
      console.error("Streaming error:", err);
    },
  });

  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      setError(null);

      try {
        if (sessionId === "new") {
          const result = await createSession("New Chat", "~");
          navigate({
            to: "/chat/$sessionId",
            params: { sessionId: result.session_id },
            replace: true,
          });
          return;
        }

        const sessionData = await getSession(sessionId);
        setSessionTitle(sessionData.session.title);
        setMessages(sessionData.messages || []);
      } catch (err) {
        console.error("Failed to load session:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId, navigate]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    await sendMessage(content, sessionId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-dojo-bg-primary via-dojo-bg-secondary to-dojo-bg-tertiary">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-dojo-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-dojo-text-secondary">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-dojo-bg-primary via-dojo-bg-secondary to-dojo-bg-tertiary">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-xl font-semibold text-dojo-text-primary">
            Failed to Load Session
          </h2>
          <p className="text-dojo-text-secondary">{error.message}</p>
          <button
            onClick={() =>
              navigate({ to: "/chat/$sessionId", params: { sessionId: "new" } })
            }
            className="px-4 py-2 bg-dojo-accent-primary text-white rounded-lg hover:bg-dojo-accent-secondary transition-colors"
          >
            Start New Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatLayout
      messages={messages}
      isStreaming={isStreaming}
      streamingContent={streamingContent}
      onSendMessage={handleSendMessage}
      headerContent={
        <div className="flex items-center gap-4 w-full">
          <div className="w-8 h-8 flex items-center justify-center text-2xl">
            🥋
          </div>
          <div>
            <h1 className="text-lg font-semibold text-dojo-text-primary">
              {sessionTitle || "Dojo Genesis"}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-dojo-text-secondary">
                {isStreaming ? "Thinking..." : "Ready"}
              </p>
              {totalTokens > 0 && (
                <span className="text-sm text-dojo-text-tertiary">
                  {totalTokens.toLocaleString()} tokens
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {streamError && (
              <div className="text-sm text-dojo-error">
                Error: {streamError.message}
              </div>
            )}
            <Link
              to="/trace/$sessionId"
              params={{ sessionId }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-dojo-text-secondary hover:text-dojo-text-primary bg-glass-bg backdrop-blur-dojo border border-white/10 rounded-lg transition-all hover:border-dojo-accent-primary/50 hover:shadow-dojo-sm"
              title="View Trail of Thought"
            >
              <NetworkIcon className="w-4 h-4" />
              <span>Trail</span>
            </Link>
          </div>
        </div>
      }
    />
  );
}
