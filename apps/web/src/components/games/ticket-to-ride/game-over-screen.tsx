"use client";

import type { ScoreBreakdown } from "@railbound/game-logic/ticket-to-ride";
import { PLAYER_COLORS } from "@railbound/game-logic/ticket-to-ride";

interface GameOverScreenProps {
  scores: ScoreBreakdown[];
  playerIndexMap: Record<string, number>; // playerId -> playerIndex for colors
  onPlayAgain?: () => void;
}

export function GameOverScreen({
  scores,
  playerIndexMap,
  onPlayAgain,
}: GameOverScreenProps) {
  const sorted = [...scores].sort((a, b) => b.finalScore - a.finalScore);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
      <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-8 max-w-[540px] w-[92%] border-4 border-amber-800 text-center">
        <div className="text-[40px] mb-1">&#x1F3C6;</div>
        <h2 className="text-amber-800 text-2xl font-bold mb-1">Game Over!</h2>
        <p className="text-gray-500 text-sm mb-5">
          <b style={{ color: PLAYER_COLORS[playerIndexMap[sorted[0].playerId]] }}>
            {sorted[0].playerName}
          </b>{" "}
          wins!
        </p>
        <div className="flex flex-col gap-2.5 mb-5">
          {sorted.map((p, rank) => {
            const colorIdx = playerIndexMap[p.playerId];
            return (
              <div
                key={p.playerId}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                style={{
                  background:
                    rank === 0 ? "#FEF3C7" : "rgba(255,255,255,0.7)",
                  border: `2px solid ${PLAYER_COLORS[colorIdx]}`,
                }}
              >
                <div
                  className="font-bold text-lg w-7"
                  style={{ color: PLAYER_COLORS[colorIdx] }}
                >
                  #{rank + 1}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-gray-800 text-sm">
                    {p.playerName}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Routes: {p.routePoints} | Tickets:{" "}
                    {p.ticketBonus > 0 ? "+" : ""}
                    {p.ticketBonus} | Longest:{" "}
                    {p.longestPathBonus > 0 ? "+10" : "0"}
                  </div>
                </div>
                <div
                  className="font-bold text-xl"
                  style={{ color: PLAYER_COLORS[colorIdx] }}
                >
                  {p.finalScore}
                </div>
              </div>
            );
          })}
        </div>
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 rounded-xl bg-amber-800 text-white text-base font-bold cursor-pointer hover:bg-amber-700"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
