import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  useSessions,
  useCreateSession,
  useSessionMessages,
} from "../hooks/useSessions";
import { SessionGrid } from "../components/sessions/SessionGrid";
import { NewSessionModal } from "../components/sessions/NewSessionModal";
import { Button } from "../components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export const Route = createFileRoute("/sessions")({
  component: SessionsPage,
});

function SessionsPage() {
  const navigate = useNavigate();
  const { data: sessions, isLoading, error } = useSessions();
  const createSessionMutation = useCreateSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sessionMessages = useSessionMessages(sessions);

  const handleCreateSession = async (title: string, workingDir: string) => {
    try {
      const response = await createSessionMutation.mutateAsync({
        title,
        workingDir,
      });

      navigate({ to: `/chat/${response.session_id}` });
    } catch (error) {
      console.error("Failed to create session:", error);
      throw error;
    }
  };

  const handleSessionClick = (session: { id: string }) => {
    navigate({ to: `/chat/${session.id}` });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dojo-bg-primary">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            Error loading sessions
          </h2>
          <p className="text-dojo-text-secondary">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dojo-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dojo-text-primary mb-2">
              Sessions
            </h1>
            <p className="text-dojo-text-secondary">
              Manage your Dojo Genesis sessions
            </p>
          </div>

          <Button
            primary
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Session
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-dojo-text-secondary">Loading sessions...</div>
          </div>
        ) : sessions && sessions.length > 0 ? (
          <SessionGrid
            sessions={sessions}
            onSessionClick={handleSessionClick}
            sessionMessages={sessionMessages}
          />
        ) : (
          <div
            className={clsx(
              "flex flex-col items-center justify-center py-20",
              "rounded-dojo-lg border border-white/10",
              "bg-[rgba(15,42,61,0.7)] backdrop-blur-dojo",
            )}
          >
            <h3 className="text-xl font-semibold text-dojo-text-primary mb-2">
              No sessions yet
            </h3>
            <p className="text-dojo-text-secondary mb-6">
              Create your first session to get started
            </p>
            <Button primary onClick={() => setIsModalOpen(true)}>
              Create Session
            </Button>
          </div>
        )}
      </div>

      <NewSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateSession}
      />
    </div>
  );
}
