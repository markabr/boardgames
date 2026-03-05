"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/platform/navbar";
import { useLobbyStore } from "@/lib/stores/lobby-store";
import { LobbySync } from "@/lib/lobby-sync";
import { getGuestId, getGuestName } from "@/lib/guest-auth";
import { showToast } from "@/components/platform/toast";

export default function LobbyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameType = searchParams.get("gameType") || "ticket_to_ride";

  const syncRef = useRef<LobbySync | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [connecting, setConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const playerIdRef = useRef(getGuestId());
  const playerNameRef = useRef(getGuestName());

  const {
    lobbyId,
    roomCode,
    players,
    isHost,
    setLobby,
    setPlayers,
    setIsHost,
    reset,
  } = useLobbyStore();

  const handleGameStarted = useCallback(
    (data: { gameId: string }) => {
      const pid = playerIdRef.current;
      const pname = playerNameRef.current;
      router.push(
        `/game/${data.gameId}?playerId=${encodeURIComponent(pid)}&playerName=${encodeURIComponent(pname)}`
      );
    },
    [router]
  );

  useEffect(() => {
    const sync = new LobbySync();
    syncRef.current = sync;

    const unsubState = sync.onLobbyState((lobby) => {
      setLobby(lobby.id, lobby.roomCode, lobby.gameType);
      setPlayers(lobby.players);
      setIsHost(lobby.hostId === playerIdRef.current);
      setConnecting(false);
    });

    const unsubError = sync.onLobbyError((err) => {
      showToast(err, "error");
      setConnectionError(err);
      setConnecting(false);
    });

    const unsubStarted = sync.onGameStarted(handleGameStarted);

    const unsubClosed = sync.onLobbyClosed(() => {
      showToast("Lobby was closed by the host", "error");
      reset();
      router.push("/home");
    });

    sync.connect().then(async () => {
      if (id === "new") {
        const result = await sync.createLobby(
          gameType,
          playerIdRef.current,
          playerNameRef.current
        );
        // Use history.replaceState to update URL without unmounting the component.
        // router.replace() would change the [id] param, causing Next.js to unmount
        // and remount — which destroys the socket connection and the lobby.
        window.history.replaceState(
          null,
          "",
          `/lobby/${result.roomCode}?gameType=${gameType}`
        );
      } else {
        sync.joinLobby(
          id.toUpperCase(),
          playerIdRef.current,
          playerNameRef.current
        );
      }
    });

    return () => {
      unsubState();
      unsubError();
      unsubStarted();
      unsubClosed();
      const currentLobbyId = useLobbyStore.getState().lobbyId;
      if (currentLobbyId) {
        sync.leaveLobby(currentLobbyId, playerIdRef.current);
      }
      sync.disconnect();
      syncRef.current = null;
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLeave = () => {
    if (lobbyId) {
      syncRef.current?.leaveLobby(lobbyId, playerIdRef.current);
    }
    reset();
    router.push("/home");
  };

  const handleToggleReady = () => {
    if (lobbyId) {
      syncRef.current?.toggleReady(lobbyId, playerIdRef.current);
    }
  };

  const handleStartGame = () => {
    if (lobbyId) {
      syncRef.current?.startGame(lobbyId);
    }
  };

  const displayCode = roomCode || id.slice(0, 4).toUpperCase();
  const myPlayer = players.find((p) => p.id === playerIdRef.current);
  const canStart =
    isHost &&
    players.length >= 2 &&
    players.filter((p) => !p.isHost).every((p) => p.isReady);

  if (connecting || connectionError) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700 flex items-center justify-center">
          <div className="text-center">
            {connectionError ? (
              <>
                <div className="text-red-400 text-lg font-bold mb-2">
                  {connectionError}
                </div>
                <button
                  onClick={() => router.push("/home")}
                  className="mt-4 px-4 py-2 rounded-lg bg-amber-800 text-white text-sm font-bold hover:bg-amber-700 cursor-pointer"
                >
                  Back to Home
                </button>
              </>
            ) : (
              <>
                <div className="w-8 h-8 border-4 border-amber-800 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
                <div className="text-orange-50 text-lg font-bold">
                  {id === "new" ? "Creating lobby..." : "Joining lobby..."}
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

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
                <span className="font-mono text-amber-400 font-bold tracking-wider text-lg">
                  {displayCode}
                </span>
                <span className="text-gray-500 ml-2 text-xs">
                  (share this with friends)
                </span>
              </div>
            </div>
            <button
              onClick={handleLeave}
              className="px-4 py-2 rounded-lg bg-red-900/50 text-red-300 text-sm font-bold border border-red-800 hover:bg-red-900/70 cursor-pointer"
            >
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
                            {p.id === playerIdRef.current && (
                              <span className="text-gray-500 ml-1">(you)</span>
                            )}
                          </span>
                          {p.isHost && (
                            <span className="text-[10px] bg-amber-900/50 text-amber-400 px-1.5 py-0.5 rounded">
                              Host
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            p.isHost
                              ? "text-amber-400"
                              : p.isReady
                                ? "text-green-400"
                                : "text-gray-500"
                          }`}
                        >
                          {p.isHost
                            ? "Host"
                            : p.isReady
                              ? "Ready"
                              : "Not Ready"}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {!isHost && (
                    <button
                      onClick={handleToggleReady}
                      className={`flex-1 py-2.5 rounded-lg text-white text-sm font-bold cursor-pointer transition-colors ${
                        myPlayer?.isReady
                          ? "bg-gray-600 hover:bg-gray-500"
                          : "bg-amber-800 hover:bg-amber-700"
                      }`}
                    >
                      {myPlayer?.isReady ? "Unready" : "Ready Up"}
                    </button>
                  )}
                  {isHost && (
                    <button
                      onClick={handleStartGame}
                      className="flex-1 py-2.5 rounded-lg bg-green-800 text-white text-sm font-bold hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={!canStart}
                    >
                      {players.length < 2
                        ? "Waiting for players..."
                        : !canStart
                          ? "Waiting for ready..."
                          : "Start Game"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Chat placeholder */}
            <div className="bg-stone-800/50 rounded-xl border border-stone-700 flex flex-col h-[400px]">
              <div className="p-3 border-b border-stone-700">
                <h2 className="text-sm font-bold text-gray-300">Chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="text-gray-500 text-xs text-center">
                  Chat coming soon
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
                    disabled
                  />
                  <button
                    className="px-3 py-2 rounded-lg bg-amber-800 text-white text-sm font-bold hover:bg-amber-700 cursor-pointer disabled:opacity-50"
                    disabled
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Join instructions */}
          <div className="mt-6 p-4 rounded-xl bg-stone-800/30 border border-stone-700/50 text-center">
            <p className="text-sm text-gray-400">
              Friends can join by visiting{" "}
              <span className="text-amber-400 font-mono">
                {typeof window !== "undefined"
                  ? window.location.origin
                  : ""}{"/lobby/"}{displayCode}
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
