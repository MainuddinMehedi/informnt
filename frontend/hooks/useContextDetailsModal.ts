"use client";

import { create } from "zustand";
import type { ContextItem } from "@/types/chat";

interface ContextDetailsModalState {
  viewingItem: ContextItem | null;
  openContextModal: (item: ContextItem) => void;
  closeContextModal: () => void;
}

export const useContextDetailsModal = create<ContextDetailsModalState>((set) => ({
  viewingItem: null,
  openContextModal: (item: ContextItem) => set({ viewingItem: item }),
  closeContextModal: () => set({ viewingItem: null }),
}));
