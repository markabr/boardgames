import { create } from "zustand";
import type { PlayerView, GameAction } from "@railbound/game-logic/ticket-to-ride";

interface GameStore {
  gameState: PlayerView | null;
  isConnected: boolean;
  error: string | null;

  setGameState: (state: PlayerView) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  isConnected: false,
  error: null,

  setGameState: (state) => set({ gameState: state, error: null }),
  setConnected: (connected) => set({ isConnected: connected }),
  setError: (error) => set({ error }),
  reset: () => set({ gameState: null, isConnected: false, error: null }),
}));
