"use client";

import type { CardColor } from "@railbound/game-logic/ticket-to-ride";
import { TrainCard } from "./train-card";

interface PlayerHandProps {
  cards: CardColor[];
}

const CARD_ORDER: CardColor[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "black",
  "white",
  "locomotive",
];

export function PlayerHand({ cards }: PlayerHandProps) {
  const grouped: Partial<Record<CardColor, number>> = {};
  for (const c of cards) {
    grouped[c] = (grouped[c] || 0) + 1;
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {CARD_ORDER.map((c) =>
        grouped[c] ? <TrainCard key={c} color={c} count={grouped[c]} /> : null
      )}
      {cards.length === 0 && (
        <span className="text-[11px] text-gray-400">No cards</span>
      )}
    </div>
  );
}
