"use client";

import type { DestinationTicket } from "@railbound/game-logic/ticket-to-ride";
import { CITY_LABELS } from "@railbound/game-logic/ticket-to-ride";

interface DestTicketProps {
  ticket: DestinationTicket;
  completed: boolean;
  compact?: boolean;
}

export function DestTicket({ ticket, completed, compact }: DestTicketProps) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border-2 ${
        completed
          ? "bg-green-100 border-green-500"
          : "bg-amber-50 border-amber-600"
      } ${compact ? "px-2 py-0.5" : "px-2.5 py-1"}`}
    >
      <span
        className={`font-bold ${compact ? "text-[11px]" : "text-xs"} ${
          completed ? "text-green-800" : "text-amber-800"
        }`}
      >
        {CITY_LABELS[ticket.city1]}
      </span>
      <span className="text-gray-400 text-[10px]">{"\u2192"}</span>
      <span
        className={`font-bold ${compact ? "text-[11px]" : "text-xs"} ${
          completed ? "text-green-800" : "text-amber-800"
        }`}
      >
        {CITY_LABELS[ticket.city2]}
      </span>
      <span
        className={`ml-auto rounded-full px-1.5 py-px font-bold whitespace-nowrap ${
          compact ? "text-[10px]" : "text-[11px]"
        } ${completed ? "bg-green-500" : "bg-amber-600"} text-white`}
      >
        {completed ? "+" : ""}
        {ticket.points}
      </span>
    </div>
  );
}
