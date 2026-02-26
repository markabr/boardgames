"use client";

import { useEffect, useRef, useState, useCallback, use, lazy, Suspense } from "react";
import type {
  PlayerView,
  GameAction,
  ScoreBreakdown,
} from "@railbound/game-logic/ticket-to-ride";
import { GameSync } from "@/lib/game-sync";
import { useGameStore } from "@/lib/stores/game-store";
import { showToast } from "@/components/platform/toast";

// Lazy-load the TTR game component
const TicketToRideGame = lazy(() =>
  import("@/components/games/ticket-to-ride").then((m) => ({
    default: m.TicketToRideGame,
  }))
);

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: gameId } = use(params);
  const syncRef = useRef<GameSync | null>(null);
  const { gameState, setGameState, setConnected, setError, isConnected, error } =
    useGameStore();
  const [scores, setScores] = useState<ScoreBreakdown[] | undefined>();

  // TODO: Get from auth/session. For now use query params or localStorage
  const [playerId] = useState(
    () =>
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("playerId")) ||
      "player-1"
  );
  const [playerName] = useState(
    () =>
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("playerName")) ||
      "Player 1"
  );

  useEffect(() => {
    const sync = new GameSync();
    syncRef.current = sync;

    const unsubState = sync.onStateUpdate((state: PlayerView) => {
      setGameState(state);
    });

    const unsubError = sync.onError((err: string) => {
      setError(err);
      showToast(err, "error");
    });

    const unsubConn = sync.onConnectionChange((connected: boolean) => {
      setConnected(connected);
    });

    const unsubGameOver = sync.onGameOver((s: ScoreBreakdown[]) => {
      setScores(s);
    });

    sync.connect(gameId, playerId, playerName).catch((err) => {
      setError(err instanceof Error ? err.message : "Connection failed");
    });

    return () => {
      unsubState();
      unsubError();
      unsubConn();
      unsubGameOver();
      sync.disconnect();
      syncRef.current = null;
    };
  }, [gameId, playerId, playerName, setGameState, setConnected, setError]);

  const handleAction = useCallback(
    (action: GameAction) => {
      syncRef.current?.sendAction(gameId, action);
    },
    [gameId]
  );

  // Loading state
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700">
        <div className="text-center">
          {error ? (
            <>
              <div className="text-red-400 text-lg font-bold mb-2">
                Connection Error
              </div>
              <p className="text-gray-400 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-lg bg-amber-800 text-white text-sm font-bold hover:bg-amber-700"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <div className="text-orange-50 text-lg font-bold mb-2">
                Connecting to game...
              </div>
              <div className="w-8 h-8 border-4 border-amber-800 border-t-amber-400 rounded-full animate-spin mx-auto" />
            </>
          )}
        </div>
      </div>
    );
  }

  // Reconnecting overlay
  const reconnecting = !isConnected && gameState;

  return (
    <div className="relative">
      {reconnecting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-stone-800 rounded-xl px-6 py-4 text-center border border-stone-600">
            <div className="w-6 h-6 border-3 border-amber-700 border-t-amber-400 rounded-full animate-spin mx-auto mb-2" />
            <div className="text-orange-50 text-sm font-bold">
              Reconnecting...
            </div>
          </div>
        </div>
      )}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700">
            <div className="text-orange-50">Loading game...</div>
          </div>
        }
      >
        <TicketToRideGame
          gameState={gameState}
          scores={scores}
          onAction={handleAction}
        />
      </Suspense>
    </div>
  );
}
