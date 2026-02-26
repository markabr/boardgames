"use client";

import { io, Socket } from "socket.io-client";
import type { PlayerView, GameAction, ScoreBreakdown } from "@railbound/game-logic/ticket-to-ride";

type StateCallback = (state: PlayerView) => void;
type ErrorCallback = (error: string) => void;
type ConnectionCallback = (connected: boolean) => void;
type GameOverCallback = (scores: ScoreBreakdown[]) => void;

export class GameSync {
  private socket: Socket | null = null;
  private stateCallbacks: StateCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private gameOverCallbacks: GameOverCallback[] = [];

  async connect(gameId: string, playerId: string, playerName: string): Promise<void> {
    const serverUrl = process.env.NEXT_PUBLIC_GAME_SERVER_URL || "http://localhost:3001";

    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => {
      this.connectionCallbacks.forEach((cb) => cb(true));
      this.socket?.emit("join_game", { gameId, playerId, playerName });
    });

    this.socket.on("disconnect", () => {
      this.connectionCallbacks.forEach((cb) => cb(false));
    });

    this.socket.on("game_state", (state: PlayerView) => {
      this.stateCallbacks.forEach((cb) => cb(state));
    });

    this.socket.on("action_error", (data: { message: string }) => {
      this.errorCallbacks.forEach((cb) => cb(data.message));
    });

    this.socket.on("error", (data: { message: string }) => {
      this.errorCallbacks.forEach((cb) => cb(data.message));
    });

    this.socket.on("game_over", (data: { scores: ScoreBreakdown[] }) => {
      this.gameOverCallbacks.forEach((cb) => cb(data.scores));
    });

    return new Promise<void>((resolve) => {
      this.socket?.on("connect", () => resolve());
      // If already connected
      if (this.socket?.connected) resolve();
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.stateCallbacks = [];
    this.errorCallbacks = [];
    this.connectionCallbacks = [];
    this.gameOverCallbacks = [];
  }

  sendAction(gameId: string, action: GameAction): void {
    this.socket?.emit("game_action", { gameId, action });
  }

  onStateUpdate(callback: StateCallback): () => void {
    this.stateCallbacks.push(callback);
    return () => {
      this.stateCallbacks = this.stateCallbacks.filter((cb) => cb !== callback);
    };
  }

  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
    };
  }

  onGameOver(callback: GameOverCallback): () => void {
    this.gameOverCallbacks.push(callback);
    return () => {
      this.gameOverCallbacks = this.gameOverCallbacks.filter((cb) => cb !== callback);
    };
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
