"use client";

/**
 * ChatInterface — orchestrator for the /chat page.
 *
 * Responsibilities:
 *   - Own the shared state: message list, context items, voice-mode toggle
 *   - Provide the send + AI response logic
 *   - Wire child components via callbacks / slot props
 *
 * What it does NOT do:
 *   - Render any UI directly (delegates to sub-components)
 *   - Contain any voice session logic (→ VoiceSession)
 *   - Contain any input logic (→ ChatInput)
 *   - Contain any context UI (→ ContextPanel / ContextPills)
 *   - Manage session lifecycle and routing sync (→ useChatSessions)
 */

import { ContextDetailsModal } from "@/components/chat/context/ContextDetailsModal";
import { useContextDetailsModal } from "@/hooks/useContextDetailsModal";
import ContextPanel from "@/components/chat/context/ContextPanel";
import ContextPickerModal from "@/components/chat/context/ContextPickerModal";
import { ContextPills } from "@/components/chat/context/ContextPills";
import ChatInput from "@/components/chat/input/ChatInput";
import VoiceSession from "@/components/chat/input/VoiceSession";
import ChatHeader from "@/components/chat/layout/ChatHeader";
import MessageList from "@/components/chat/messages/MessageList";
import { WelcomeScreen } from "@/components/chat/messages/WelcomeScreen";
import { useChatContext } from "@/hooks/useChatContext";
import { useChatFlow } from "@/hooks/useChatFlow";
import { useChatSessions } from "@/hooks/useChatSessions";
import { getActiveModels, getDefaultModel } from "@/lib/ai/modelRegistry";
import { useSetLoginModalOpen, useSetSidebarCollapsed } from "@/store";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  saveGuestSession,
  updateGuestSessionMeta,
  getGuestSessions,
} from "@/lib/storage/guestChatStorage";

export default function ChatInterface({
  activeSessionId,
}: {
  activeSessionId?: string;
}) {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const isAuthLoading = authStatus === "loading";
  const isGuest = authStatus === "unauthenticated";
  const locallyCreatedSessionRef = useRef<string | null>(null);
  const setLoginModalOpen = useSetLoginModalOpen();
  const {
    contexts,
    setContexts,
    contextPickerOpen,
    setContextPickerOpen,
    addContext,
    handleAddContexts,
    removeContext,
  } = useChatContext(activeSessionId);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel(isGuest));
  const [responseMode, setResponseMode] = useState<"concise" | "descriptive">(
    "concise",
  );
  const { openContextModal } = useContextDetailsModal();
  const { messages, status, setMessages, stop, handleSend } = useChatFlow({
    sessionId: activeSessionId,
    onSessionCreated: (id, newSession) => {
      locallyCreatedSessionRef.current = id;
      router.replace(`/chat?session=${id}`, { scroll: false });

      if (newSession) {
        if (isGuest) {
          saveGuestSession({
            id: newSession.id,
            title: newSession.title,
            model: newSession.model,
            responseMode: newSession.responseMode,
            createdAt: newSession.createdAt,
            updatedAt: newSession.updatedAt,
            messageCount: 0,
          });
        }
        setSessions((prev) => {
          if (prev.some((s) => s.id === id)) return prev;
          return [{ ...newSession, messageCount: 0 }, ...prev];
        });
      } else {
        loadSessions();
      }
    },
    contexts,
    selectedModel,
    responseMode,
  });
  const {
    sessions,
    sessionsLoading,
    selectSession,
    handleNewChat,
    handleDeleteSession,
    loadSessions,
    setSessions,
  } = useChatSessions({
    setMessages,
    setContexts,
    setSelectedModel,
    isGuest,
    isAuthLoading,
    activeSessionId,
    locallyCreatedSessionRef,
    stop,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const setSidebarCollapsed = useSetSidebarCollapsed();

  // Sync guest session message count and timestamp to localStorage when messages update
  useEffect(() => {
    if (!isGuest || !activeSessionId || messages.length === 0 || isLoading) return;
    updateGuestSessionMeta(activeSessionId, {
      messageCount: messages.length,
      updatedAt: new Date().toISOString(),
    });
    setSessions(getGuestSessions());
  }, [isGuest, activeSessionId, messages.length, isLoading, setSessions]);

  useEffect(() => {
    setSidebarCollapsed(true);
  }, [setSidebarCollapsed]);

  const handleVoiceTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        handleSend(text);
      }
    },
    [handleSend],
  );

  const handleVoiceAIResponse = useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `voice-${Date.now()}`,
          role: "assistant",
          parts: [{ type: "text", text }],
        },
      ]);
    },
    [setMessages],
  );

  const handleVoiceClose = useCallback(() => {
    setIsVoiceMode(false);
  }, []);

  return (
    <div className="flex relative h-full w-full overflow-hidden min-h-0">
      {/* ── Main chat column ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 min-h-0">
        <ChatHeader
          activeSessionId={activeSessionId}
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          onNewChat={handleNewChat}
          onSelectSession={selectSession}
          onDeleteSession={handleDeleteSession}
          isGuest={isGuest}
          onLoginClick={() => setLoginModalOpen(true)}
        />

        <div className="flex-1 overflow-hidden relative pt-12 sm:pt-14">
          {messages.length === 0 ? (
            <WelcomeScreen onNewChat={handleNewChat} onSend={handleSend} />
          ) : (
            <MessageList messages={messages} isLoading={isLoading} />
          )}

          {/* Voice session overlays the message area */}
          <VoiceSession
            isOpen={isVoiceMode}
            onTranscript={handleVoiceTranscript}
            onAIResponse={handleVoiceAIResponse}
            onClose={handleVoiceClose}
          />
        </div>

        {/* Input */}
        <ChatInput
          compact
          onSend={handleSend}
          onStop={stop}
          isLoading={isLoading}
          onVoiceToggle={() => setIsVoiceMode((v) => !v)}
          isVoiceMode={isVoiceMode}
          onAddContext={addContext}
          models={getActiveModels()}
          isGuest={isGuest}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          responseMode={responseMode}
          onResponseModeChange={setResponseMode}
          contextPillsSlot={
            <ContextPills
              items={contexts}
              onRemove={removeContext}
              onViewContext={openContextModal}
              className="lg:hidden"
            />
          }
        />
      </div>
      {/* ── Floating context panel (desktop) ──────────────────────────────── */}
      <ContextPanel
        items={contexts}
        onRemove={removeContext}
        onAdd={addContext}
        onViewContext={openContextModal}
      />
      <ContextPickerModal
        isOpen={contextPickerOpen}
        onClose={() => setContextPickerOpen(false)}
        onAdd={handleAddContexts}
        existingItems={contexts}
      />
      <ContextDetailsModal />
    </div>
  );
}
