import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Railbound
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Classic board games, reimagined for online multiplayer.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/home"
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
          >
            Play Now
          </Link>
          <Link
            href="/(auth)/login"
            className="px-8 py-3 border border-gray-600 hover:border-gray-400 text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-6">
          {[
            { name: "Ticket to Ride", emoji: "🚂" },
            { name: "Acquire", emoji: "🏢" },
            { name: "Puerto Rico", emoji: "🏝️" },
          ].map((game) => (
            <div
              key={game.name}
              className="p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-amber-600/50 transition-colors"
            >
              <div className="text-4xl mb-3">{game.emoji}</div>
              <h3 className="font-semibold text-gray-200">{game.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
