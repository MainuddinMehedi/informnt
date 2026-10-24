export interface GuestChatSession {
  id: string;
  title: string;
  model: string;
  responseMode: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

const GUEST_CHATS_STORAGE_KEY = "gna_guest_chat_sessions_v1";
const GUEST_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Checks if a session has exceeded the 24-hour retention window.
 */
function isExpired(session: GuestChatSession, now: number): boolean {
  const timestamp = new Date(session.updatedAt || session.createdAt).getTime();
  if (Number.isNaN(timestamp)) return true;
  return now - timestamp > GUEST_SESSION_MAX_AGE_MS;
}

/**
 * Retrieves all stored guest sessions from localStorage, automatically
 * pruning any that have exceeded the 24-hour retention threshold.
 */
export function getGuestSessions(): GuestChatSession[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(GUEST_CHATS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    const validSessions = parsed.filter(
      (item): item is GuestChatSession =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        !isExpired(item, now),
    );

    // If some stale sessions were pruned, write the clean list back
    if (validSessions.length !== parsed.length) {
      localStorage.setItem(
        GUEST_CHATS_STORAGE_KEY,
        JSON.stringify(validSessions),
      );
    }

    return validSessions.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    );
  } catch (err) {
    console.error("Failed to read guest chat sessions from localStorage:", err);
    return [];
  }
}

/**
 * Saves or updates a guest chat session in localStorage.
 */
export function saveGuestSession(session: GuestChatSession): void {
  if (typeof window === "undefined" || !session.id) return;

  try {
    const current = getGuestSessions();
    const existingIndex = current.findIndex((s) => s.id === session.id);

    let updated: GuestChatSession[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...session,
        updatedAt: session.updatedAt || new Date().toISOString(),
      };
    } else {
      updated = [session, ...current];
    }

    const now = Date.now();
    const pruned = updated.filter((s) => !isExpired(s, now));

    localStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(pruned));
  } catch (err) {
    console.error("Failed to save guest chat session to localStorage:", err);
  }
}

/**
 * Partially updates an existing guest chat session's metadata.
 */
export function updateGuestSessionMeta(
  id: string,
  updates: Partial<GuestChatSession>,
): void {
  if (typeof window === "undefined" || !id) return;

  try {
    const current = getGuestSessions();
    const existingIndex = current.findIndex((s) => s.id === id);
    if (existingIndex === -1) return;

    current[existingIndex] = {
      ...current[existingIndex],
      ...updates,
      updatedAt: updates.updatedAt || new Date().toISOString(),
    };

    localStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error("Failed to update guest chat session in localStorage:", err);
  }
}

/**
 * Removes a single guest chat session from localStorage.
 */
export function removeGuestSession(id: string): void {
  if (typeof window === "undefined" || !id) return;

  try {
    const current = getGuestSessions();
    const filtered = current.filter((s) => s.id !== id);
    localStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error("Failed to remove guest chat session from localStorage:", err);
  }
}

/**
 * Clears all guest chat sessions from localStorage.
 */
export function clearAllGuestSessions(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(GUEST_CHATS_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear guest chat sessions from localStorage:", err);
  }
}
