export interface LobbyPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
}

export interface Lobby {
  id: string;
  roomCode: string;
  gameType: string;
  hostId: string;
  players: LobbyPlayer[];
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // No I or O to avoid confusion
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateLobbyId(): string {
  return `lobby-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class LobbyManager {
  private lobbies = new Map<string, Lobby>();
  private roomCodeIndex = new Map<string, string>(); // roomCode → lobbyId

  createLobby(gameType: string, hostId: string, hostName: string): Lobby {
    const id = generateLobbyId();
    let roomCode = generateRoomCode();
    // Ensure unique room code
    while (this.roomCodeIndex.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const lobby: Lobby = {
      id,
      roomCode,
      gameType,
      hostId,
      players: [{ id: hostId, name: hostName, isReady: false, isHost: true }],
    };

    this.lobbies.set(id, lobby);
    this.roomCodeIndex.set(roomCode, id);
    return lobby;
  }

  joinLobby(lobbyId: string, playerId: string, playerName: string): Lobby | null {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;
    if (lobby.players.length >= 4) return null;
    if (lobby.players.some((p) => p.id === playerId)) return lobby; // Already in lobby

    lobby.players.push({ id: playerId, name: playerName, isReady: false, isHost: false });
    return lobby;
  }

  leaveLobby(lobbyId: string, playerId: string): { lobby: Lobby | null; destroyed: boolean } {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { lobby: null, destroyed: false };

    if (playerId === lobby.hostId) {
      // Host left — destroy lobby
      this.lobbies.delete(lobbyId);
      this.roomCodeIndex.delete(lobby.roomCode);
      return { lobby: null, destroyed: true };
    }

    lobby.players = lobby.players.filter((p) => p.id !== playerId);
    return { lobby, destroyed: false };
  }

  toggleReady(lobbyId: string, playerId: string): Lobby | null {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    const player = lobby.players.find((p) => p.id === playerId);
    if (player) {
      player.isReady = !player.isReady;
    }
    return lobby;
  }

  getLobby(lobbyId: string): Lobby | null {
    return this.lobbies.get(lobbyId) || null;
  }

  findByRoomCode(roomCode: string): Lobby | null {
    const lobbyId = this.roomCodeIndex.get(roomCode.toUpperCase());
    if (!lobbyId) return null;
    return this.lobbies.get(lobbyId) || null;
  }

  removeLobby(lobbyId: string): void {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      this.roomCodeIndex.delete(lobby.roomCode);
      this.lobbies.delete(lobbyId);
    }
  }
}
