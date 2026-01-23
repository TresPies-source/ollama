import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessions, getSession, createSession } from "../api/dgd-client";
import type { Session, SessionWithMessages } from "../types/dgd";

export const useSessions = () => {
  return useQuery({
    queryKey: ["dgd-sessions"],
    queryFn: getSessions,
    staleTime: 5000,
  });
};

export const useSession = (sessionId: string) => {
  return useQuery({
    queryKey: ["dgd-session", sessionId],
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
    staleTime: 5000,
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      title,
      workingDir,
    }: {
      title: string;
      workingDir: string;
    }) => createSession(title, workingDir),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dgd-sessions"] });
    },
  });
};

export const useSessionMessages = (sessions: Session[] | undefined) => {
  const queryClient = useQueryClient();
  const sessionMessages = new Map<string, string>();

  if (!sessions) return sessionMessages;

  for (const session of sessions) {
    const cachedData = queryClient.getQueryData<SessionWithMessages>([
      "dgd-session",
      session.id,
    ]);

    if (cachedData?.messages && cachedData.messages.length > 0) {
      const lastMessage = cachedData.messages[cachedData.messages.length - 1];
      sessionMessages.set(session.id, lastMessage.content);
    }
  }

  return sessionMessages;
};
