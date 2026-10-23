"use client";

import type { ChatSessionListItem } from "@/components/chat/layout/ChatHistoryPanel";
import { getDefaultModel } from "@/lib/ai/modelRegistry";
import type { ContextItem } from "@/types/chat";
import type { UIMessage } from "ai";
import {
  getGuestSessions,
  saveGuestSession,
  removeGuestSession,
} from "@/lib/storage/guestChatStorage";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type ChatSessionPayload = {
  id: string;
  title: string;
  model: string;
  responseMode: "concise" | "descriptive";
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  messages?: UIMessage[];
  contexts?: ContextItem[];
};

interface UseChatSessionsProps {
  setMessages: (messages: UIMessage[]) => void;
  setContexts: (contexts: ContextItem[]) => void;
  setSelectedModel: (model: string) => void;
  isGuest: boolean;
  isAuthLoading?: boolean;
  activeSessionId?: string;
  locallyCreatedSessionRef?: React.RefObject<string | null> | React.MutableRefObject<string | null>;
  stop?: () => void;
}

export function useChatSessions({
  setMessages,
  setContexts,
  setSelectedModel,
  isGuest,
  isAuthLoading,
  activeSessionId,
  locallyCreatedSessionRef,
  stop,
}: UseChatSessionsProps) {
  const router = useRouter();

  const [sessions, setSessions] = useState<ChatSessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    if (isAuthLoading) return;

    setSessionsLoading(true);
    try {
      if (isGuest) {
        setSessions(getGuestSessions());
        return;
      }

      const res = await fetch("/api/chat/sessions");
      if (!res.ok) throw new Error("Failed to load chat sessions");

      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load chat history");
    } finally {
      setSessionsLoading(false);
    }
  }, [isAuthLoading, isGuest]);

  const selectSession = useCallback(
    (id: string) => {
      router.replace(`/chat?session=${id}`, { scroll: false });
    },
    [router],
  );

  const handleNewChat = useCallback(() => {
    stop?.();
    router.replace("/chat", { scroll: false });
  }, [router, stop]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      try {
        if (isGuest) {
          removeGuestSession(id);
        }

        const res = await fetch(`/api/chat/sessions/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete chat");

        setSessions((prev) => prev.filter((session) => session.id !== id));

        if (id === activeSessionId) {
          router.replace("/chat", { scroll: false });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete chat");
      }
    },
    [activeSessionId, isGuest, router],
  );

  // Derived loading state of the active session
  useEffect(() => {
    if (isAuthLoading) return;

    if (!activeSessionId) {
      if (locallyCreatedSessionRef) {
        locallyCreatedSessionRef.current = null;
      }
      setMessages([]);
      setContexts([]);
      setSelectedModel(getDefaultModel(isGuest));
      return;
    }

    // Skip hydrating if this session was created locally in the current tab
    if (locallyCreatedSessionRef?.current) {
      if (locallyCreatedSessionRef.current === activeSessionId) {
        return;
      }
      locallyCreatedSessionRef.current = null;
    }

    let isMounted = true;
    async function loadActiveSession(id: string) {
      try {
        const res = await fetch(`/api/chat/sessions/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("Chat not found or expired. Starting a new chat.");
            if (isGuest) {
              removeGuestSession(id);
              setSessions(getGuestSessions());
            }
            if (isMounted) {
              router.replace("/chat", { scroll: false });
            }
            return;
          }
          throw new Error("Failed to load chat");
        }
        const data = await res.json();
        const session = data.session as ChatSessionPayload;

        if (isGuest) {
          saveGuestSession({
            id: session.id,
            title: session.title,
            model: session.model,
            responseMode: session.responseMode,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            messageCount: session.messages?.length ?? 0,
          });
          setSessions(getGuestSessions());
        }

        if (isMounted) {
          setSelectedModel(session.model || getDefaultModel(isGuest));
          setContexts(session.contexts ?? []);
          setMessages(
            session.messages && session.messages.length > 0
              ? session.messages
              : [],
          );
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to open chat");
      }
    }

    loadActiveSession(activeSessionId);

    return () => {
      isMounted = false;
    };
  }, [
    activeSessionId,
    router,
    setContexts,
    setMessages,
    setSelectedModel,
    isGuest,
    isAuthLoading,
    locallyCreatedSessionRef,
  ]);

  // Initial load
  useEffect(() => {
    if (!isAuthLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSessions();
    }
  }, [isAuthLoading, loadSessions]);

  return {
    activeSessionId,
    sessions,
    setSessions,
    sessionsLoading,
    loadSessions,
    selectSession,
    handleNewChat,
    handleDeleteSession,
  };
}
