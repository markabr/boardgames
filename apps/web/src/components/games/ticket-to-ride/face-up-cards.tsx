"use client";

import type { CardColor } from "@railbound/game-logic/ticket-to-ride";
import { TrainCard } from "./train-card";

interface FaceUpCardsProps {
  cards: CardColor[];
  onDraw: (faceUpIndex: number) => void;
  onDrawDeck: () => void;
  canDraw: boolean;
  drawsLeft: number;
}

export function FaceUpCards({
  cards,
  onDraw,
  onDrawDeck,
  canDraw,
  drawsLeft,
}: FaceUpCardsProps) {
  return (
    <div className="flex gap-1.5 items-center flex-wrap">
      {cards.map((color, i) => {
        const isLocoSecond = color === "locomotive" && drawsLeft === 1;
        return (
          <TrainCard
            key={i}
            color={color}
            onClick={() => onDraw(i)}
            disabled={!canDraw || isLocoSecond}
          />
        );
      })}
      <div
        onClick={canDraw ? onDrawDeck : undefined}
        className="flex items-center justify-center rounded-md text-[9px] text-gray-300 font-bold tracking-wide"
        style={{
          width: 52,
          height: 36,
          background: "linear-gradient(135deg, #4B5563, #1F2937)",
          border: "2px solid #6B7280",
          cursor: canDraw ? "pointer" : "default",
          opacity: canDraw ? 1 : 0.5,
        }}
      >
        DRAW
      </div>
    </div>
  );
}
