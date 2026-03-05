"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/platform/navbar";

const GAMES = [
  {
    id: "ticket_to_ride",
    name: "Ticket to Ride",
    description: "Build railway routes across America",
    emoji: "🚂",
    players: "2-4",
    time: "30-60 min",
    available: true,
  },
  {
    id: "acquire",
    name: "Acquire",
    description: "Build a hotel empire through mergers and acquisitions",
    emoji: "🏢",
    players: "2-6",
    time: "60-90 min",
    available: false,
  },
  {
    id: "puerto_rico",
    name: "Puerto Rico",
    description: "Develop plantations and trade goods in the New World",
    emoji: "🏝️",
    players: "3-5",
    time: "90-120 min",
    available: false,
  },
];

export default function HomePage() {
  const router = useRouter();

  const handleCreateLobby = (gameId: string) => {
    router.push(`/lobby/new?gameType=${gameId}`);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">Choose a Game</h1>
          <p className="text-gray-400 mb-8">
            Select a game to create or join a lobby.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GAMES.map((game) => (
              <div
                key={game.id}
                className={`p-6 rounded-xl bg-gray-800/50 border border-gray-700 transition-all group ${
                  game.available
                    ? "hover:border-amber-600/50 cursor-pointer"
                    : "opacity-60"
                }`}
              >
                <div className="text-5xl mb-4">{game.emoji}</div>
                <h2 className="text-xl font-bold mb-1 group-hover:text-amber-400 transition-colors">
                  {game.name}
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  {game.description}
                </p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{game.players} players</span>
                  <span>{game.time}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  {game.available ? (
                    <>
                      <button
                        onClick={() => handleCreateLobby(game.id)}
                        className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Create Lobby
                      </button>
                      <button
                        onClick={() => handleCreateLobby(game.id)}
                        className="flex-1 px-3 py-2 border border-gray-600 hover:border-gray-400 text-gray-300 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Quick Play
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 px-3 py-2 text-center text-gray-500 text-sm font-semibold">
                      Coming Soon
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
