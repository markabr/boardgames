"use client";

import { use, useState } from "react";
import { Navbar } from "@/components/platform/navbar";
import { useLobbyStore } from "@/lib/stores/lobby-store";

export default function LobbyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { players } = useLobbyStore();
  const [chatInput, setChatInput] = useState("");

  // TODO: Connect to Supabase Realtime for player presence + chat
  // For now, render the lobby shell UI

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700 pt-4 px-4 pb-8">
        <div className="max-w-3xl mx-auto">
          {/* Room header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-orange-50 font-serif">
                Game Lobby
              </h1>
              <div className="text-sm text-gray-400 mt-1">
                Room Code:{" "}
                <span className="font-mono text-amber-400 font-bold tracking-wider">
                  {id.slice(0, 4).toUpperCase()}
                </span>
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-red-900/50 text-red-300 text-sm font-bold border border-red-800 hover:bg-red-900/70 cursor-pointer">
              Leave
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Player list */}
            <div className="md:col-span-2">
              <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
                <h2 className="text-sm font-bold text-gray-300 mb-3">
                  Players ({players.length}/4)
                </h2>
                <div className="space-y-2">
                  {players.length === 0 ? (
                    <div className="text-gray-500 text-sm text-center py-4">
                      Waiting for players to join...
                    </div>
                  ) : (
                    players.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-stone-900/30"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-800 flex items-center justify-center text-sm text-orange-50 font-bold">
                            {p.name.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-200 font-medium">
                            {p.name}
                          </span>
                          {p.isHost && (
                            <span className="text-[10px] bg-amber-900/50 text-amber-400 px-1.5 py-0.5 rounded">
                              Host
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            p.isReady ? "text-green-400" : "text-gray-500"
                          }`}
                        >
                          {p.isReady ? "Ready" : "Not Ready"}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2.5 rounded-lg bg-amber-800 text-white text-sm font-bold hover:bg-amber-700 cursor-pointer">
                    Ready Up
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-lg bg-green-800 text-white text-sm font-bold hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={players.length < 2}
                  >
                    Start Game
                  </button>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-stone-800/50 rounded-xl border border-stone-700 flex flex-col h-[400px]">
              <div className="p-3 border-b border-stone-700">
                <h2 className="text-sm font-bold text-gray-300">Chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="text-gray-500 text-xs text-center">
                  No messages yet
                </div>
              </div>
              <div className="p-2 border-t border-stone-700">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-stone-900/50 text-sm text-gray-200 rounded-lg px-3 py-2 border border-stone-600 outline-none focus:border-amber-700"
                  />
                  <button className="px-3 py-2 rounded-lg bg-amber-800 text-white text-sm font-bold hover:bg-amber-700 cursor-pointer">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
