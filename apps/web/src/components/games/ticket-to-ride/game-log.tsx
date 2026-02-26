"use client";

import { useRef, useEffect } from "react";
import type { PlayerViewPlayer } from "@railbound/game-logic/ticket-to-ride";
import { PLAYER_COLORS } from "@railbound/game-logic/ticket-to-ride";

export interface LogEntry {
  id: number;
  playerIndex: number;
  message: string;
  timestamp: number;
}

interface GameLogProps {
  entries: LogEntry[];
  players: PlayerViewPlayer[];
}

export function GameLog({ entries, players }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="text-[11px] text-gray-500 italic">
        No actions yet...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 text-[11px]">
      {entries.map((entry) => {
        const player = players[entry.playerIndex];
        return (
          <div key={entry.id} className="flex gap-1.5 items-start">
            <span
              className="font-bold shrink-0"
              style={{ color: PLAYER_COLORS[entry.playerIndex] }}
            >
              {player?.name ?? `P${entry.playerIndex + 1}`}
            </span>
            <span className="text-gray-400">{entry.message}</span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
