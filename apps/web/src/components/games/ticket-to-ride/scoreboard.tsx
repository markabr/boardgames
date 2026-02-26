"use client";

import type { PlayerViewPlayer } from "@railbound/game-logic/ticket-to-ride";
import { PLAYER_COLORS, PLAYER_BG } from "@railbound/game-logic/ticket-to-ride";

interface ScoreboardProps {
  players: PlayerViewPlayer[];
  currentPlayerIndex: number;
}

export function Scoreboard({ players, currentPlayerIndex }: ScoreboardProps) {
  return (
    <div className="flex gap-1.5">
      {players.map((p, i) => (
        <div
          key={p.id}
          className="flex-1 rounded-lg px-2.5 py-1.5 transition-all"
          style={{
            background:
              currentPlayerIndex === i
                ? PLAYER_BG[i]
                : "rgba(255,255,255,0.75)",
            border: `3px solid ${PLAYER_COLORS[i]}`,
            boxShadow:
              currentPlayerIndex === i
                ? `0 0 10px ${PLAYER_COLORS[i]}50`
                : "none",
          }}
        >
          <div
            className="font-bold text-[13px] mb-px"
            style={{ color: PLAYER_COLORS[i] }}
          >
            {currentPlayerIndex === i ? "\u25B6 " : ""}
            {p.name}
          </div>
          <div className="text-[11px] text-gray-600 flex gap-2">
            <span>
              Pts: <b>{p.score}</b>
            </span>
            <span>
              Trains: <b>{p.trainsRemaining}</b>
            </span>
            <span>
              Cards: <b>{p.trainCardCount}</b>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
