import type { Server, Socket } from 'socket.io';
import { GameManager } from './engine/game-manager.js';

const RECONNECT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Map socket ID to { playerId, gameId }
const socketToPlayer = new Map<string, { playerId: string; gameId: string }>();
// Map playerId to socket ID (for reconnection)
const playerToSocket = new Map<string, string>();

export function setupSocketHandlers(io: Server, gameManager: GameManager): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

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
