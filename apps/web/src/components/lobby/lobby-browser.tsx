"use client";

import { useState } from "react";

interface LobbyListing {
  id: string;
  roomCode: string;
  gameType: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
}

export function LobbyBrowser() {
  const [lobbies] = useState<LobbyListing[]>([]);
  const [joinCode, setJoinCode] = useState("");

  return (
    <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-300">Public Lobbies</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={4}
            className="w-24 bg-stone-900/50 text-sm text-gray-200 rounded-lg px-3 py-1.5 border border-stone-600 outline-none focus:border-amber-700 font-mono tracking-wider text-center uppercase"
          />
          <button
            disabled={joinCode.length < 4}
            className="px-3 py-1.5 rounded-lg bg-amber-800 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join
          </button>
        </div>
      </div>

      {lobbies.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-6">
          No public lobbies available. Create one!
        </div>
      ) : (
        <div className="space-y-2">
          {lobbies.map((lobby) => (
            <div
              key={lobby.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-stone-900/30 hover:bg-stone-900/50 cursor-pointer transition-colors"
            >
              <div>
                <div className="text-sm text-gray-200 font-medium">
                  {lobby.gameType} - {lobby.hostName}
                </div>
                <div className="text-xs text-gray-500">
                  {lobby.playerCount}/{lobby.maxPlayers} players
                </div>
              </div>
              <button className="px-3 py-1 rounded bg-amber-800 text-white text-xs font-bold hover:bg-amber-700">
                Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
