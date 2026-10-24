"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { ContextItem } from "@/types/chat";

export function useChatContext(activeSessionId?: string) {
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [contextPickerOpen, setContextPickerOpen] = useState(false);

  const contextsRef = useRef<ContextItem[]>(contexts);
  useEffect(() => {
    contextsRef.current = contexts;
  }, [contexts]);

  const addContext = useCallback(() => {
    setContextPickerOpen(true);
  }, []);

  const handleAddContexts = useCallback(
    (newItems: ContextItem[]) => {
      const prev = contextsRef.current;
      const filtered = newItems.filter(
        (newItem) => !prev.some((existing) => existing.id === newItem.id),
      );
      if (filtered.length === 0) return;

      const updatedContexts = [...prev, ...filtered];
      contextsRef.current = updatedContexts;
      setContexts(updatedContexts);

      if (activeSessionId) {
        fetch(`/api/chat/sessions/${activeSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contexts: updatedContexts }),
        }).catch((error) => {
          console.error(error);
          toast.error("Failed to save context");
        });
      }
    },
    [activeSessionId],
  );

  const removeContext = useCallback(
    (id: string) => {
      const prev = contextsRef.current;
      const updatedContexts = prev.filter((c) => c.id !== id);
      if (updatedContexts.length === prev.length) return;

      contextsRef.current = updatedContexts;
      setContexts(updatedContexts);

      if (activeSessionId) {
        fetch(`/api/chat/sessions/${activeSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contexts: updatedContexts }),
        }).catch((error) => {
          console.error(error);
          toast.error("Failed to update contexts");
        });
      }
    },
    [activeSessionId],
  );

  return {
    contexts,
    setContexts,
    contextPickerOpen,
    setContextPickerOpen,
    addContext,
    handleAddContexts,
    removeContext,
  };
}
