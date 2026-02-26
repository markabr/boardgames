import type { ComponentType } from "react";
import type { PlayerView, GameAction, ScoreBreakdown } from "@railbound/game-logic/ticket-to-ride";

export interface GameComponentProps {
  gameState: PlayerView;
  scores?: ScoreBreakdown[];
  onAction: (action: GameAction) => void;
  onPlayAgain?: () => void;
  statusMessage?: string;
}

interface GameMeta {
  name: string;
  slug: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedMinutes: string;
  component: () => Promise<{ default: ComponentType<GameComponentProps> }>;
}

export const GAME_REGISTRY: Record<string, GameMeta> = {
  ticket_to_ride: {
    name: "Ticket to Ride",
    slug: "ticket-to-ride",
    minPlayers: 2,
    maxPlayers: 4,
    estimatedMinutes: "30-60",
    component: () =>
      import("@/components/games/ticket-to-ride").then((m) => ({
        default: m.TicketToRideGame as ComponentType<GameComponentProps>,
      })),
  },
};

export function getGameMeta(gameType: string): GameMeta | undefined {
  return GAME_REGISTRY[gameType];
}
