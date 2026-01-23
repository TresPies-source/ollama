import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChatLayout } from "../components/chat/ChatLayout";
import type { Message } from "../types/dgd";

export const Route = createFileRoute("/chat-demo")({
  component: ChatDemo,
});

const mockMessages: Message[] = [
  {
    id: "1",
    session_id: "demo",
    role: "user",
    content: "Hello, can you help me understand the Dojo Genesis architecture?",
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: "2",
    session_id: "demo",
    role: "assistant",
    content:
      "Of course! Dojo Genesis is built with a multi-agent architecture. We have four main agents:\n\n1. **Supervisor**: Routes your intent to the right agent\n2. **Dojo**: The core reasoning agent with four modes (Mirror, Scout, Gardener, Implementation)\n3. **Librarian**: Handles file search and seed retrieval\n4. **Builder**: Executes code generation and tool usage\n\nEach agent specializes in different tasks to provide you with the best assistance.",
    created_at: new Date(Date.now() - 240000).toISOString(),
    agent_type: "dojo",
    mode: "mirror",
  },
  {
    id: "3",
    session_id: "demo",
    role: "user",
    content: "What's the difference between Mirror and Scout mode?",
    created_at: new Date(Date.now() - 180000).toISOString(),
  },
  {
    id: "4",
    session_id: "demo",
    role: "assistant",
    content:
      "Great question! Here's the key difference:\n\n**Mirror Mode**: This is for exploration and reflection. I help you think through problems, explore different perspectives, and clarify your thoughts. It's more conversational and open-ended.\n\n**Scout Mode**: This is for investigation and analysis. I actively search through your codebase, files, and seeds to find relevant information. It's more research-focused.\n\nThink of Mirror as a thinking partner, and Scout as a research assistant.",
    created_at: new Date(Date.now() - 120000).toISOString(),
    agent_type: "dojo",
    mode: "scout",
  },
];

function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: String(Date.now()),
      session_id: "demo",
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);

    setIsStreaming(true);
    setTimeout(() => {
      const responseMessage: Message = {
        id: String(Date.now() + 1),
        session_id: "demo",
        role: "assistant",
        content: `You said: "${content}"\n\nThis is a demo response. In a real chat, I would process your message and provide a helpful response based on the context and your needs.`,
        created_at: new Date().toISOString(),
        agent_type: "dojo",
        mode: "mirror",
      };
      setMessages((prev) => [...prev, responseMessage]);
      setIsStreaming(false);
    }, 2000);
  };

  return (
    <ChatLayout
      messages={messages}
      isStreaming={isStreaming}
      onSendMessage={handleSendMessage}
      headerContent={
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center text-2xl">
            🥋
          </div>
          <div>
            <h1 className="text-lg font-semibold text-dojo-text-primary">
              Chat Demo
            </h1>
            <p className="text-sm text-dojo-text-secondary">
              Testing chat interface components
            </p>
          </div>
        </div>
      }
    />
  );
}
