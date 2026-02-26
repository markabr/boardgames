"use client";

import { useState } from "react";
import type { DestinationTicket } from "@railbound/game-logic/ticket-to-ride";
import { DestTicket } from "./dest-ticket";

interface DestinationModalProps {
  tickets: DestinationTicket[];
  minKeep: number;
  playerName: string;
  onConfirm: (ticketIds: number[]) => void;
}

export function DestinationModal({
  tickets,
  minKeep,
  playerName,
  onConfirm,
}: DestinationModalProps) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(tickets.map((t) => t.id))
  );

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const canConfirm = selected.size >= minKeep;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-amber-50 rounded-2xl p-6 max-w-md w-[92%] border-[3px] border-amber-800 shadow-2xl">
        <h3 className="text-lg font-bold text-amber-800 mb-0.5">
          {playerName}&apos;s Destination Tickets
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Keep at least {minKeep}. Click to toggle.
        </p>
        <div className="flex flex-col gap-2 mb-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => toggle(t.id)}
              className="cursor-pointer transition-all rounded-lg"
              style={{
                opacity: selected.has(t.id) ? 1 : 0.35,
                transform: selected.has(t.id) ? "scale(1)" : "scale(0.97)",
                border: selected.has(t.id)
                  ? "2px solid #92400E"
                  : "2px solid transparent",
              }}
            >
              <DestTicket ticket={t} completed={false} />
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            canConfirm && onConfirm([...selected])
          }
          disabled={!canConfirm}
          className={`w-full py-2.5 rounded-lg text-sm font-bold text-white ${
            canConfirm
              ? "bg-amber-800 hover:bg-amber-700 cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Keep {selected.size} Ticket{selected.size !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
