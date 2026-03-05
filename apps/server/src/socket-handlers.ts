import type { Server, Socket } from 'socket.io';
import { GameManager } from './engine/game-manager.js';
import { LobbyManager } from './lobby.js';

const RECONNECT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Map socket ID to { playerId, gameId }
const socketToPlayer = new Map<string, { playerId: string; gameId: string }>();
// Map playerId to socket ID (for reconnection)
const playerToSocket = new Map<string, string>();
// Map socket ID to { playerId, lobbyId }
const socketToLobby = new Map<string, { playerId: string; lobbyId: string }>();

export function setupSocketHandlers(io: Server, gameManager: GameManager, lobbyManager: LobbyManager): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Lobby Events ──────────────────────────────────────────────

    socket.on('create_lobby', (data: { gameType: string; playerId: string; playerName: string }) => {
      const { gameType, playerId, playerName } = data;
      const lobby = lobbyManager.createLobby(gameType, playerId, playerName);
      socket.join(`lobby:${lobby.id}`);
      socketToLobby.set(socket.id, { playerId, lobbyId: lobby.id });
      socket.emit('lobby_created', { lobbyId: lobby.id, roomCode: lobby.roomCode });
      io.to(`lobby:${lobby.id}`).emit('lobby_state', lobby);
    });

    socket.on('join_lobby', (data: { roomCode: string; playerId: string; playerName: string }) => {
      const { roomCode, playerId, playerName } = data;
      const existing = lobbyManager.findByRoomCode(roomCode);
      if (!existing) {
        socket.emit('lobby_error', { message: 'Lobby not found' });
        return;
      }
      const lobby = lobbyManager.joinLobby(existing.id, playerId, playerName);
      if (!lobby) {
        socket.emit('lobby_error', { message: 'Lobby is full' });
        return;
      }
      socket.join(`lobby:${lobby.id}`);
      socketToLobby.set(socket.id, { playerId, lobbyId: lobby.id });
      io.to(`lobby:${lobby.id}`).emit('lobby_state', lobby);
    });

    socket.on('leave_lobby', (data: { lobbyId: string; playerId: string }) => {
      const { lobbyId, playerId } = data;
      const result = lobbyManager.leaveLobby(lobbyId, playerId);
      socket.leave(`lobby:${lobbyId}`);
      socketToLobby.delete(socket.id);

      if (result.destroyed) {
        io.to(`lobby:${lobbyId}`).emit('lobby_closed');
      } else if (result.lobby) {
        io.to(`lobby:${lobbyId}`).emit('lobby_state', result.lobby);
      }
    });

    socket.on('toggle_ready', (data: { lobbyId: string; playerId: string }) => {
      const { lobbyId, playerId } = data;
      const lobby = lobbyManager.toggleReady(lobbyId, playerId);
      if (lobby) {
        io.to(`lobby:${lobby.id}`).emit('lobby_state', lobby);
      }
    });

    socket.on('start_game', (data: { lobbyId: string }) => {
      const { lobbyId } = data;
      const lobby = lobbyManager.getLobby(lobbyId);
      if (!lobby) {
        socket.emit('lobby_error', { message: 'Lobby not found' });
        return;
      }

      // Verify sender is host
      const senderMapping = socketToLobby.get(socket.id);
      if (!senderMapping || senderMapping.playerId !== lobby.hostId) {
        socket.emit('lobby_error', { message: 'Only the host can start the game' });
        return;
      }

      // Check all non-host players are ready
      const nonHostPlayers = lobby.players.filter((p) => !p.isHost);
      if (nonHostPlayers.length === 0) {
        socket.emit('lobby_error', { message: 'Need at least 2 players' });
        return;
      }
      const allReady = nonHostPlayers.every((p) => p.isReady);
      if (!allReady) {
        socket.emit('lobby_error', { message: 'Not all players are ready' });
        return;
      }

      // Create game
      const gameId = `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const players = lobby.players.map((p) => ({ id: p.id, name: p.name }));

      const onBotAction = (gId: string) => {
        const game = gameManager.getGame(gId);
        if (!game) return;
        for (const pid of game.playerIds) {
          if (game.bots.has(pid)) continue;
          const view = game.engine.getPlayerView(pid);
          io.to(`player:${pid}`).emit('game_state', view);
        }
        if (game.engine.isGameOver()) {
          const engine = game.engine as any;
          const scores = engine.getScores ? engine.getScores() : [];
          io.to(`game:${gId}`).emit('game_over', { scores });
        }
      };

      try {
        gameManager.createGame(gameId, lobby.gameType as any, players, undefined, onBotAction);
        io.to(`lobby:${lobbyId}`).emit('game_started', { gameId });
        // Clean up lobby
        lobbyManager.removeLobby(lobbyId);
      } catch (err: any) {
        socket.emit('lobby_error', { message: err.message });
      }
    });

    // ── Game Events ───────────────────────────────────────────────

    socket.on('join_game', (data: { gameId: string; playerId: string; playerName: string }) => {
      const { gameId, playerId, playerName } = data;
      const game = gameManager.getGame(gameId);

      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (!game.playerIds.includes(playerId)) {
        socket.emit('error', { message: 'You are not in this game' });
        return;
      }

      // Join the Socket.io room
      socket.join(`game:${gameId}`);
      socketToPlayer.set(socket.id, { playerId, gameId });
      playerToSocket.set(playerId, socket.id);

      // Handle reconnection
      const wasDisconnected = gameManager.markPlayerReconnected(gameId, playerId);
      if (wasDisconnected) {
        io.to(`game:${gameId}`).emit('player_reconnected', { playerId, playerName });
        console.log(`Player ${playerId} reconnected to game ${gameId}`);
      }

      // Send current state to the joining player
      const playerView = game.engine.getPlayerView(playerId);
      socket.emit('game_state', playerView);
    });

    socket.on('game_action', (data: { gameId: string; action: unknown }) => {
      const mapping = socketToPlayer.get(socket.id);
      if (!mapping) {
        socket.emit('action_error', { message: 'Not connected to a game' });
        return;
      }

      const { gameId } = mapping;
      const playerId = mapping.playerId;

      if (data.gameId !== gameId) {
        socket.emit('action_error', { message: 'Game ID mismatch' });
        return;
      }

      const result = gameManager.processAction(gameId, playerId, data.action);

      if (!result.success) {
        socket.emit('action_error', { message: result.error });
        return;
      }

      const game = gameManager.getGame(gameId)!;

      // Broadcast updated state to all players (filtered per player)
      for (const pid of game.playerIds) {
        const sid = playerToSocket.get(pid);
        if (sid) {
          const view = game.engine.getPlayerView(pid);
          io.to(sid).emit('game_state', view);
        }
      }

      // Check game over
      if (game.engine.isGameOver()) {
        const engine = game.engine as any;
        const scores = engine.getScores ? engine.getScores() : [];
        io.to(`game:${gameId}`).emit('game_over', { scores });
      } else {
        // Schedule bot turn if next player is a bot
        gameManager.scheduleBotTurn(gameId);
      }
    });

    socket.on('disconnect', () => {
      // Handle lobby disconnect
      const lobbyMapping = socketToLobby.get(socket.id);
      if (lobbyMapping) {
        const { playerId, lobbyId } = lobbyMapping;
        const result = lobbyManager.leaveLobby(lobbyId, playerId);
        socketToLobby.delete(socket.id);
        if (result.destroyed) {
          io.to(`lobby:${lobbyId}`).emit('lobby_closed');
        } else if (result.lobby) {
          io.to(`lobby:${lobbyId}`).emit('lobby_state', result.lobby);
        }
      }

      // Handle game disconnect
      const mapping = socketToPlayer.get(socket.id);
      if (!mapping) return;

      const { playerId, gameId } = mapping;
      socketToPlayer.delete(socket.id);
      playerToSocket.delete(playerId);

      const game = gameManager.getGame(gameId);
      if (!game) return;

      // Don't remove from game immediately — allow reconnection
      io.to(`game:${gameId}`).emit('player_disconnected', { playerId });

      gameManager.markPlayerDisconnected(gameId, playerId, () => {
        // Timeout: player didn't reconnect
        console.log(`Player ${playerId} timed out from game ${gameId}`);
        io.to(`game:${gameId}`).emit('player_timeout', { playerId });
      }, RECONNECT_TIMEOUT_MS);

      console.log(`Socket disconnected: ${socket.id} (player: ${playerId}, game: ${gameId})`);
    });
  });
}
