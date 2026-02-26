import { create } from "zustand";

export interface LobbyPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
}

interface LobbyStore {
  lobbyId: string | null;
  roomCode: string | null;
  gameType: string | null;
  players: LobbyPlayer[];
  isHost: boolean;
  chatMessages: { sender: string; text: string; timestamp: number }[];

  setLobby: (lobbyId: string, roomCode: string, gameType: string) => void;
  setPlayers: (players: LobbyPlayer[]) => void;
  addPlayer: (player: LobbyPlayer) => void;
  removePlayer: (playerId: string) => void;
  toggleReady: (playerId: string) => void;
  addChatMessage: (sender: string, text: string) => void;
  setIsHost: (isHost: boolean) => void;
  reset: () => void;
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  lobbyId: null,
  roomCode: null,
  gameType: null,
  players: [],
  isHost: false,
  chatMessages: [],

  setLobby: (lobbyId, roomCode, gameType) =>
    set({ lobbyId, roomCode, gameType }),
  setPlayers: (players) => set({ players }),
  addPlayer: (player) =>
    set((state) => ({ players: [...state.players, player] })),
  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),
  toggleReady: (playerId) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, isReady: !p.isReady } : p
      ),
    })),
  addChatMessage: (sender, text) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        { sender, text, timestamp: Date.now() },
      ],
    })),
  setIsHost: (isHost) => set({ isHost }),
  reset: () =>
    set({
      lobbyId: null,
      roomCode: null,
      gameType: null,
      players: [],
      isHost: false,
      chatMessages: [],
    }),
}));
