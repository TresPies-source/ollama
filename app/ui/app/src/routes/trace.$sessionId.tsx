import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTrace } from "@/hooks/useTrace";
import { TraceGraph } from "@/components/trace/TraceGraph";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export const Route = createFileRoute("/trace/$sessionId")({
  component: TracePage,
});

function TracePage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();

  const { data: trace, isLoading, error } = useTrace(sessionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-dojo-bg-primary via-dojo-bg-secondary to-dojo-bg-tertiary">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-dojo-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-dojo-text-secondary">Loading trace data...</p>
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
            Failed to Load Trace
          </h2>
          <p className="text-dojo-text-secondary">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <Button primary onClick={() => navigate({ to: "/sessions" })}>
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  if (!trace || !trace.events || trace.events.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-dojo-bg-primary via-dojo-bg-secondary to-dojo-bg-tertiary">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">📊</div>
          <h2 className="text-xl font-semibold text-dojo-text-primary">
            No Trace Data Available
          </h2>
          <p className="text-dojo-text-secondary">
            This session doesn't have any trace data yet. Send some messages to
            generate trace events.
          </p>
          <Button
            primary
            onClick={() =>
              navigate({ to: "/chat/$sessionId", params: { sessionId } })
            }
          >
            Go to Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-dojo-bg-primary via-dojo-bg-secondary to-dojo-bg-tertiary">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 bg-glass-bg backdrop-blur-dojo border-b border-white/10 shadow-dojo-md">
        <Link
          to="/chat/$sessionId"
          params={{ sessionId }}
          className="text-dojo-text-secondary hover:text-dojo-text-primary transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center text-2xl">
            🧠
          </div>
          <div>
            <h1 className="text-lg font-semibold text-dojo-text-primary">
              Trail of Thought
            </h1>
            <p className="text-sm text-dojo-text-secondary">
              Session: {sessionId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-dojo-text-secondary">
            {trace.events.length} events
          </span>
        </div>
      </header>

      {/* Trace Graph */}
      <div className="flex-1 overflow-hidden">
        <TraceGraph trace={trace} />
      </div>

      {/* Legend */}
      <div className="px-6 py-3 bg-glass-bg backdrop-blur-dojo border-t border-white/10 shadow-dojo-md">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-dojo-text-secondary font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-sunset" />
            <span className="text-dojo-text-secondary">Mode Transition</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-dojo-text-secondary">Tool Invocation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-dojo-text-secondary">
              Perspective Integration
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-dojo-text-secondary">LLM Call</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-dojo-text-secondary">Agent Routing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-500" />
            <span className="text-dojo-text-secondary">File Operation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-dojo-text-secondary">Error</span>
          </div>
        </div>
      </div>
    </div>
  );
}
