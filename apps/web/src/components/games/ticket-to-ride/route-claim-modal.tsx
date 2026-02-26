"use client";

import { useState, useEffect } from "react";
import type {
  Route,
  CardColor,
  TrainCardColor,
} from "@railbound/game-logic/ticket-to-ride";
import {
  CITY_LABELS,
  ROUTE_POINTS,
  CARD_COLORS,
  CARD_TEXT_COLOR,
  CARD_COLOR_DISPLAY,
  TRAIN_CARD_COLORS,
} from "@railbound/game-logic/ticket-to-ride";
import { countCards } from "@railbound/game-logic/ticket-to-ride";

interface RouteClaimModalProps {
  route: Route;
  playerCards: CardColor[];
  onConfirm: (colorUsed: TrainCardColor) => void;
  onCancel: () => void;
}

export function RouteClaimModal({
  route,
  playerCards,
  onConfirm,
  onCancel,
}: RouteClaimModalProps) {
  const validColors: TrainCardColor[] =
    route.color === "gray"
      ? TRAIN_CARD_COLORS.filter(
          (c) =>
            countCards(playerCards, c) +
              countCards(playerCards, "locomotive") >=
            route.length
        )
      : [route.color];

  const [selColor, setSelColor] = useState<TrainCardColor | null>(
    validColors.length === 1 ? validColors[0] : null
  );

  useEffect(() => {
    if (route.color === "gray" && validColors.length === 1) {
      setSelColor(validColors[0]);
    }
  }, [route.color, validColors.length]);

  const chosen = selColor || validColors[0];
  const colorCt = countCards(playerCards, chosen);
  const locosNeeded = Math.max(0, route.length - colorCt);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-amber-50 rounded-2xl p-6 max-w-md w-[92%] border-[3px] border-amber-800">
        <h3 className="text-lg font-bold text-amber-800 mb-1">Claim Route</h3>
        <p className="text-sm text-gray-600 mb-3">
          <b>{CITY_LABELS[route.city1]}</b> {"\u2192"}{" "}
          <b>{CITY_LABELS[route.city2]}</b> ({route.length} trains,{" "}
          {ROUTE_POINTS[route.length]} pts)
        </p>
        {route.color === "gray" && validColors.length > 1 && (
          <div className="mb-3">
            <p className="text-[11px] text-gray-500 mb-1.5">Choose color:</p>
            <div className="flex gap-1.5 flex-wrap">
              {validColors.map((c) => (
                <div
                  key={c}
                  onClick={() => setSelColor(c)}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer"
                  style={{
                    background: CARD_COLORS[c],
                    color: CARD_TEXT_COLOR[c],
                    border:
                      selColor === c
                        ? "2px solid #FCD34D"
                        : "2px solid transparent",
                    boxShadow: selColor === c ? "0 0 6px #FCD34D" : "none",
                  }}
                >
                  {CARD_COLOR_DISPLAY[c]} ({countCards(playerCards, c)})
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-gray-600 mb-4">
          Using: {Math.min(colorCt, route.length)} {CARD_COLOR_DISPLAY[chosen]}
          {locosNeeded > 0 &&
            ` + ${locosNeeded} Wild${locosNeeded > 1 ? "s" : ""}`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border-2 border-gray-400 bg-transparent text-sm font-bold cursor-pointer hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(chosen)}
            className="flex-1 py-2.5 rounded-lg bg-amber-800 text-white text-sm font-bold cursor-pointer hover:bg-amber-700"
          >
            Claim Route
          </button>
        </div>
      </div>
    </div>
  );
}
