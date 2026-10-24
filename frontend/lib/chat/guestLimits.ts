import prisma from "@/lib/prisma";

export async function checkAndHandleGuestLimits({
  isGuest,
  messages,
  activeSessionId,
}: {
  isGuest: boolean;
  messages: Array<{ role: string }>;
  activeSessionId?: string;
}): Promise<Response | null> {
  if (!isGuest) return null;

  let userMessageCount = messages.filter((m) => m.role === "user").length;
  if (activeSessionId) {
    try {
      const dbCount = await prisma.chatMessage.count({
        where: { sessionId: activeSessionId, role: "user" },
      });
      userMessageCount = Math.max(userMessageCount, dbCount);
    } catch (err) {
      console.error("Failed to query guest message count:", err);
    }
  }

  if (userMessageCount <= 10) return null;

  const limitMessage =
    "You've reached the 10-message limit for guest sessions. We rely on limited free-tier AI APIs to keep this platform accessible, and capping unauthenticated chats helps us manage API quotas and prevent database bloat. Please sign in to continue this conversation and help us prevent abuse.";

  return new Response(
    JSON.stringify({
      error: limitMessage,
      message: limitMessage,
      code: "guest_limit_reached",
    }),
    {
      status: 429,
      headers: { "Content-Type": "application/json" },
    },
  );
}
