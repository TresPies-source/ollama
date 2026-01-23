import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  SessionGrid,
  SessionCard,
  NewSessionModal,
  DeleteConfirmDialog,
} from "@/components/sessions";
import { Button } from "@/components/ui/button";
import type { Session } from "@/types/dgd";

export const Route = createFileRoute("/test-sessions")({
  component: TestSessionsPage,
});

const mockSessions: Session[] = [
  {
    id: "1",
    title: "React Performance Optimization",
    working_dir: "/home/user/projects/react-app",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    id: "2",
    title: "API Integration with TypeScript",
    working_dir: "/home/user/projects/api-client",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    id: "3",
    title: "Database Schema Design",
    working_dir: "/home/user/projects/database",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "archived",
  },
  {
    id: "4",
    title: "CI/CD Pipeline Setup",
    working_dir: "/home/user/projects/devops",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
];

const mockMessages = new Map([
  [
    "1",
    "Let's optimize the React rendering by using useMemo and useCallback...",
  ],
  [
    "2",
    "Here's how to set up Axios with TypeScript types for type-safe API calls...",
  ],
  [
    "3",
    "The database schema should have normalized tables with proper foreign keys...",
  ],
  ["4", "Setting up GitHub Actions for automated testing and deployment..."],
]);

function TestSessionsPage() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const handleSessionClick = (session: Session) => {
    console.log("Session clicked:", session.id);
  };

  const handleCreateSession = async (title: string, workingDir: string) => {
    console.log("Creating session:", { title, workingDir });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`Session created: ${title}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    console.log("Deleting session:", sessionId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(`Session deleted: ${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dojo-bg-primary to-dojo-bg-secondary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-dojo-text-primary mb-2">
              Session Management Components Test
            </h1>
            <p className="text-dojo-text-secondary">
              Testing SessionCard, SessionGrid, NewSessionModal, and
              DeleteConfirmDialog
            </p>
          </div>
          <div className="flex gap-3">
            <Button primary onClick={() => setIsNewModalOpen(true)}>
              New Session
            </Button>
            <Button
              secondary
              onClick={() => {
                setSelectedSession(mockSessions[0]);
                setIsDeleteDialogOpen(true);
              }}
            >
              Test Delete
            </Button>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-dojo-text-primary mb-6">
            SessionGrid Component
          </h2>
          <SessionGrid
            sessions={mockSessions}
            onSessionClick={handleSessionClick}
            sessionMessages={mockMessages}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-2xl font-semibold text-dojo-text-primary mb-6">
              SessionCard - Active
            </h2>
            <SessionCard
              session={mockSessions[0]}
              lastMessage={mockMessages.get("1")}
              onClick={() => handleSessionClick(mockSessions[0])}
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-dojo-text-primary mb-6">
              SessionCard - Archived
            </h2>
            <SessionCard
              session={mockSessions[2]}
              lastMessage={mockMessages.get("3")}
              onClick={() => handleSessionClick(mockSessions[2])}
            />
          </div>
        </div>
      </div>

      <NewSessionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateSession}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        session={selectedSession}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteSession}
      />
    </div>
  );
}
