"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  Route,
  PlayerView,
  GameAction,
  ScoreBreakdown,
  TrainCardColor,
} from "@railbound/game-logic/ticket-to-ride";
import {
  PLAYER_COLORS,
  routeKey,
  areCitiesConnected,
} from "@railbound/game-logic/ticket-to-ride";
import { GameMap } from "./game-map";
import { Scoreboard } from "./scoreboard";
import { PlayerHand } from "./player-hand";
import { FaceUpCards } from "./face-up-cards";
import { DestTicket } from "./dest-ticket";
import { DestinationModal } from "./destination-modal";
import { RouteClaimModal } from "./route-claim-modal";
import { GameOverScreen } from "./game-over-screen";

export interface TicketToRideProps {
  gameState: PlayerView;
  scores?: ScoreBreakdown[];
  onAction: (action: GameAction) => void;
  onPlayAgain?: () => void;
  statusMessage?: string;
}

export function TicketToRideGame({
  gameState,
  scores,
  onAction,
  onPlayAgain,
  statusMessage,
}: TicketToRideProps) {
  const [routeModal, setRouteModal] = useState<Route | null>(null);

  const myPlayerIndex = gameState.players.findIndex(
    (p) => p.id === gameState.myPlayerId
  );
  const isMyTurn = gameState.currentPlayerIndex === myPlayerIndex;
  const drawing = gameState.turnAction === "drawingCards";
  const me = gameState.players[myPlayerIndex];

  // Derive status message
  const msg = useMemo(() => {
    if (statusMessage) return statusMessage;
    if (gameState.phase === "setup") return "Selecting destination tickets...";
    if (gameState.phase === "gameOver") return "Game over!";
    const currentName = gameState.players[gameState.currentPlayerIndex]?.name;
    if (isMyTurn) {
      if (drawing) return `Your turn - draw ${gameState.drawsLeft} more card(s)`;
      if (gameState.pendingDestinations.length > 0)
        return "Choose destination tickets to keep";
      return "Your turn";
    }
    return `${currentName}'s turn`;
  }, [gameState, isMyTurn, drawing, statusMessage]);

  // Build playerIndex map for game over screen
  const playerIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    gameState.players.forEach((p, i) => {
      map[p.id] = i;
    });
    return map;
  }, [gameState.players]);

  const handleDrawCard = useCallback(
    (faceUpIndex: number) => {
      onAction({
        type: "draw_card",
        source: "faceUp",
        faceUpIndex,
      });
    },
    [onAction]
  );

  const handleDrawDeck = useCallback(() => {
    onAction({ type: "draw_card", source: "deck" });
  }, [onAction]);

  const handleClaimRoute = useCallback(
    (route: Route) => {
      if (drawing) return;
      setRouteModal(route);
    },
    [drawing]
  );

  const handleConfirmClaim = useCallback(
    (colorUsed: TrainCardColor) => {
      if (!routeModal) return;
      onAction({
        type: "claim_route",
        routeKey: routeKey(routeModal),
        colorUsed,
      });
      setRouteModal(null);
    },
    [routeModal, onAction]
  );

  const handleDrawDestinations = useCallback(() => {
    onAction({ type: "draw_destinations" });
  }, [onAction]);

  const handleKeepDestinations = useCallback(
    (ticketIds: number[]) => {
      onAction({ type: "keep_destinations", ticketIds });
    },
    [onAction]
  );

  const canDrawDest =
    isMyTurn &&
    !drawing &&
    gameState.phase !== "gameOver" &&
    gameState.phase !== "setup" &&
    gameState.destinationDeckSize > 0 &&
    gameState.pendingDestinations.length === 0;

  const canDrawCards =
    isMyTurn &&
    gameState.phase !== "gameOver" &&
    gameState.phase !== "setup" &&
    (gameState.turnAction === null || drawing) &&
    gameState.pendingDestinations.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700 font-sans text-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-700 px-4 py-1.5 flex items-center justify-between text-orange-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">&#x1F682;</span>
          <span className="font-bold text-[15px] font-serif">
            Ticket to Ride
          </span>
        </div>
        {msg && (
          <div className="text-[13px] bg-black/25 px-3.5 py-0.5 rounded-md font-bold">
            {msg}
          </div>
        )}
        <div className="text-[11px] opacity-85">
          Deck: {gameState.trainCardDeckSize} | Tickets:{" "}
          {gameState.destinationDeckSize}
          {gameState.phase === "lastRound" && (
            <span className="ml-2 text-yellow-300 font-bold">
              &#x26A0; FINAL ROUND
            </span>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="px-2.5 py-1.5">
        <Scoreboard
          players={gameState.players}
          currentPlayerIndex={gameState.currentPlayerIndex}
        />
      </div>

      {/* Main: Map + Side Panel */}
      <div className="flex-1 flex px-2.5 pb-2 gap-2 min-h-0">
        {/* Map */}
        <div className="flex-1 bg-[#F5E6C8] rounded-lg border-[3px] border-amber-800 overflow-hidden">
          <GameMap
            gameState={gameState}
            onClaimRoute={handleClaimRoute}
          />
        </div>

        {/* Side panel */}
        <div className="w-[270px] flex flex-col gap-1.5">
          {/* Hand */}
          <div
            className="bg-white/[0.92] rounded-lg p-2.5"
            style={{
              border: `2px solid ${PLAYER_COLORS[myPlayerIndex] || "#6B7280"}`,
            }}
          >
            <div
              className="text-xs font-bold mb-1"
              style={{
                color: PLAYER_COLORS[myPlayerIndex] || "#6B7280",
              }}
            >
              Your Hand{" "}
              {drawing && `(Draw ${gameState.drawsLeft} more)`}
            </div>
            <PlayerHand cards={gameState.myTrainCards} />
          </div>

          {/* Face-up cards */}
          <div className="bg-white/[0.92] rounded-lg p-2.5">
            <div className="text-[11px] font-bold text-gray-500 mb-1">
              Available Cards
            </div>
            <FaceUpCards
              cards={gameState.faceUpCards}
              onDraw={handleDrawCard}
              onDrawDeck={handleDrawDeck}
              canDraw={canDrawCards}
              drawsLeft={drawing ? gameState.drawsLeft : 2}
            />
          </div>

          {/* Destinations */}
          <div className="bg-white/[0.92] rounded-lg p-2.5 flex-1 overflow-y-auto">
            <div className="text-[11px] font-bold text-gray-500 mb-1 flex justify-between items-center">
              <span>Your Destinations</span>
              <button
                onClick={handleDrawDestinations}
                disabled={!canDrawDest}
                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                  canDrawDest
                    ? "border-amber-600 bg-amber-100 text-amber-800 cursor-pointer hover:bg-amber-200"
                    : "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                + Draw
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {gameState.myDestinationTickets.map((t) => (
                <DestTicket
                  key={t.id}
                  ticket={t}
                  completed={areCitiesConnected(
                    t.city1,
                    t.city2,
                    me?.claimedRoutes ?? []
                  )}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {gameState.pendingDestinations.length > 0 && (
        <DestinationModal
          tickets={gameState.pendingDestinations}
          minKeep={gameState.pendingDestinationMinKeep}
          playerName={
            gameState.phase === "setup"
              ? gameState.players[gameState.currentPlayerIndex]?.name ?? ""
              : me?.name ?? ""
          }
          onConfirm={handleKeepDestinations}
        />
      )}

      {routeModal && (
        <RouteClaimModal
          route={routeModal}
          playerCards={gameState.myTrainCards}
          onConfirm={handleConfirmClaim}
          onCancel={() => setRouteModal(null)}
        />
      )}

      {gameState.phase === "gameOver" && scores && (
        <GameOverScreen
          scores={scores}
          playerIndexMap={playerIndexMap}
          onPlayAgain={onPlayAgain}
        />
      )}
    </div>
  );
}
