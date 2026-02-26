import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './engine/game-manager.js';
import { setupSocketHandlers } from './socket-handlers.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const gameManager = new GameManager();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create and start a game
app.post('/api/games/start', (req, res) => {
  const { gameId, gameType, players, bots } = req.body as {
    gameId: string;
    gameType: 'ticket_to_ride' | 'acquire' | 'puerto_rico';
    players: { id: string; name: string }[];
    bots?: { id: string; name: string; difficulty: 'easy' | 'medium' }[];
  };

  if (!gameId || !gameType || !players?.length) {
    res.status(400).json({ error: 'Missing gameId, gameType, or players' });
    return;
  }

  try {
    const allPlayers = [...players, ...(bots || [])];
    const onBotAction = (gId: string) => {
      // Broadcast updated state to all human players
      const game = gameManager.getGame(gId);
      if (!game) return;
      for (const pid of game.playerIds) {
        if (game.bots.has(pid)) continue; // Don't send to bots
        const view = game.engine.getPlayerView(pid);
        io.to(`player:${pid}`).emit('game_state', view);
      }
      // Check game over
      if (game.engine.isGameOver()) {
        const engine = game.engine as any;
        const scores = engine.getScores ? engine.getScores() : [];
        io.to(`game:${gId}`).emit('game_over', { scores });
      }
    };
    gameManager.createGame(gameId, gameType, allPlayers, bots, onBotAction);
    res.json({ success: true, gameId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get game state (for reconnection / initial load)
app.get('/api/games/:gameId/state/:playerId', (req, res) => {
  const { gameId, playerId } = req.params;
  const game = gameManager.getGame(gameId);

  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  const view = game.engine.getPlayerView(playerId);
  res.json(view);
});

setupSocketHandlers(io, gameManager);

const PORT = process.env.GAME_SERVER_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});

export { io, gameManager };
