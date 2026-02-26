"use client";

import { Navbar } from "@/components/platform/navbar";

interface StatCard {
  label: string;
  value: string | number;
}

function StatBox({ label, value }: StatCard) {
  return (
    <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700 text-center">
      <div className="text-2xl font-bold text-orange-50">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  // TODO: Pull from Supabase auth + profile table
  const profile = {
    name: "Guest Player",
    elo: 1200,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    recentGames: [] as {
      id: string;
      gameType: string;
      result: "win" | "loss";
      eloChange: number;
      date: string;
    }[],
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700 pt-4 px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-800 flex items-center justify-center text-2xl text-orange-50 font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-orange-50">
                {profile.name}
              </h1>
              <div className="text-sm text-gray-400">
                ELO Rating:{" "}
                <span className="text-amber-400 font-bold">{profile.elo}</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatBox label="Games Played" value={profile.gamesPlayed} />
            <StatBox label="Wins" value={profile.wins} />
            <StatBox label="Losses" value={profile.losses} />
            <StatBox
              label="Win Rate"
              value={`${profile.winRate}%`}
            />
          </div>

          {/* ELO History placeholder */}
          <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700 mb-6">
            <h2 className="text-sm font-bold text-gray-300 mb-3">
              ELO History
            </h2>
            <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
              Play games to see your rating history
            </div>
          </div>

          {/* Recent Games */}
          <div className="bg-stone-800/50 rounded-xl p-4 border border-stone-700">
            <h2 className="text-sm font-bold text-gray-300 mb-3">
              Recent Games
            </h2>
            {profile.recentGames.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                No games played yet
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {profile.recentGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-stone-900/30"
                  >
                    <div>
                      <span className="text-sm text-gray-300 font-medium">
                        {game.gameType}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {game.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          game.result === "win"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {game.result === "win" ? "WIN" : "LOSS"}
                      </span>
                      <span
                        className={`text-xs ${
                          game.eloChange >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {game.eloChange >= 0 ? "+" : ""}
                        {game.eloChange}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
