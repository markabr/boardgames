"use client";

import { io, Socket } from "socket.io-client";

export interface LobbyData {
  id: string;
  roomCode: string;
  gameType: string;
  hostId: string;
  players: { id: string; name: string; isReady: boolean; isHost: boolean }[];
}

type LobbyStateCallback = (lobby: LobbyData) => void;
type LobbyErrorCallback = (error: string) => void;
type GameStartedCallback = (data: { gameId: string }) => void;
type LobbyClosedCallback = () => void;

export class LobbySync {
  private socket: Socket | null = null;
  private lobbyStateCallbacks: LobbyStateCallback[] = [];
  private lobbyErrorCallbacks: LobbyErrorCallback[] = [];
  private gameStartedCallbacks: GameStartedCallback[] = [];
  private lobbyClosedCallbacks: LobbyClosedCallback[] = [];

  connect(): Promise<void> {
    const serverUrl =
      process.env.NEXT_PUBLIC_GAME_SERVER_URL || "http://localhost:3001";

    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("lobby_state", (lobby: LobbyData) => {
      this.lobbyStateCallbacks.forEach((cb) => cb(lobby));
    });

    this.socket.on("lobby_error", (data: { message: string }) => {
      this.lobbyErrorCallbacks.forEach((cb) => cb(data.message));
    });

    this.socket.on("game_started", (data: { gameId: string }) => {
      this.gameStartedCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on("lobby_closed", () => {
      this.lobbyClosedCallbacks.forEach((cb) => cb());
    });

    return new Promise<void>((resolve) => {
      this.socket?.on("connect", () => resolve());
      if (this.socket?.connected) resolve();
    });
  }

  createLobby(
    gameType: string,
    playerId: string,
    playerName: string
  ): Promise<{ lobbyId: string; roomCode: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Not connected"));
        return;
      }
      this.socket.once(
        "lobby_created",
        (data: { lobbyId: string; roomCode: string }) => {
          resolve(data);
        }
      );
      this.socket.emit("create_lobby", { gameType, playerId, playerName });
    });
  }

  joinLobby(
    roomCode: string,
    playerId: string,
    playerName: string
  ): void {
    this.socket?.emit("join_lobby", { roomCode, playerId, playerName });
  }

  leaveLobby(lobbyId: string, playerId: string): void {
    this.socket?.emit("leave_lobby", { lobbyId, playerId });
  }

  toggleReady(lobbyId: string, playerId: string): void {
    this.socket?.emit("toggle_ready", { lobbyId, playerId });
  }

  startGame(lobbyId: string): void {
    this.socket?.emit("start_game", { lobbyId });
  }

  onLobbyState(callback: LobbyStateCallback): () => void {
    this.lobbyStateCallbacks.push(callback);
    return () => {
      this.lobbyStateCallbacks = this.lobbyStateCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onLobbyError(callback: LobbyErrorCallback): () => void {
    this.lobbyErrorCallbacks.push(callback);
    return () => {
      this.lobbyErrorCallbacks = this.lobbyErrorCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onGameStarted(callback: GameStartedCallback): () => void {
    this.gameStartedCallbacks.push(callback);
    return () => {
      this.gameStartedCallbacks = this.gameStartedCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onLobbyClosed(callback: LobbyClosedCallback): () => void {
    this.lobbyClosedCallbacks.push(callback);
    return () => {
      this.lobbyClosedCallbacks = this.lobbyClosedCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.lobbyStateCallbacks = [];
    this.lobbyErrorCallbacks = [];
    this.gameStartedCallbacks = [];
    this.lobbyClosedCallbacks = [];
  }
}
