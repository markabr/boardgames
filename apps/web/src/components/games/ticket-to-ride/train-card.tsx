"use client";

import type { CardColor } from "@railbound/game-logic/ticket-to-ride";
import {
  CARD_COLORS,
  CARD_BORDER,
  CARD_TEXT_COLOR,
  CARD_COLOR_DISPLAY,
} from "@railbound/game-logic/ticket-to-ride";

interface TrainCardProps {
  color: CardColor;
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export function TrainCard({ color, count, onClick, disabled }: TrainCardProps) {
  const isLoco = color === "locomotive";
  const bg = isLoco
    ? "linear-gradient(135deg, #DC2626, #EA580C, #FACC15, #16A34A, #2563EB, #7C3AED)"
    : CARD_COLORS[color];

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className="relative flex items-center justify-center rounded-md shadow-sm transition-transform"
      style={{
        width: 52,
        height: 36,
        background: bg,
        border: `2px solid ${isLoco ? "#92400E" : CARD_BORDER[color]}`,
        cursor: onClick && !disabled ? "pointer" : "default",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span
        className="text-[9px] font-bold tracking-wide"
        style={{
          color: CARD_TEXT_COLOR[color] || "#fff",
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        }}
      >
        {CARD_COLOR_DISPLAY[color]}
      </span>
      {count !== undefined && (
        <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center border border-white">
          {count}
        </div>
      )}
    </div>
  );
}
