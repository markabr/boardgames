import type { GameEngine } from './base.js';
import { TicketToRideEngine } from './ticket-to-ride.js';
import type { Bot, BotDifficulty } from '../bots/base.js';
import { getBotDelay } from '../bots/base.js';
import { createBot } from '../bots/ticket-to-ride.js';
import type { GameState } from '@railbound/game-logic/ticket-to-ride';

type GameType = 'ticket_to_ride' | 'acquire' | 'puerto_rico';

interface ActiveGame {
  engine: GameEngine;
  gameType: GameType;
  playerIds: string[];
  disconnectedPlayers: Map<string, NodeJS.Timeout>;
  bots: Map<string, Bot>; // playerId -> Bot
  onBotAction?: (gameId: string) => void;
}

export class GameManager {
  private games = new Map<string, ActiveGame>();

  createGame(
    gameId: string,
    gameType: GameType,
    players: { id: string; name: string }[],
    botPlayers?: { id: string; name: string; difficulty: BotDifficulty }[],
    onBotAction?: (gameId: string) => void
  ): GameEngine {
    let engine: GameEngine;

    switch (gameType) {
      case 'ticket_to_ride':
        engine = TicketToRideEngine.create(gameId, players);
        break;
      default:
        throw new Error(`Unsupported game type: ${gameType}`);
    }

    const bots = new Map<string, Bot>();
    if (botPlayers) {
      for (const bp of botPlayers) {
        bots.set(bp.id, createBot(bp.difficulty));
      }
    }

    this.games.set(gameId, {
      engine,
      gameType,
      playerIds: players.map((p) => p.id),
      disconnectedPlayers: new Map(),
      bots,
      onBotAction,
    });

    // Schedule initial bot action if setup phase starts with a bot
    if (bots.size > 0) {
      this.scheduleBotTurn(gameId);
    }

    return engine;
  }

  getGame(gameId: string): ActiveGame | undefined {
    return this.games.get(gameId);
  }

  processAction(
    gameId: string,
    playerId: string,
    action: unknown
  ): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) return { success: false, error: 'Game not found' };

    if (!game.playerIds.includes(playerId)) {
      return { success: false, error: 'You are not in this game' };
    }

    const validation = game.engine.validateAction(playerId, action);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    game.engine.applyAction(playerId, action);
    return { success: true };
  }

  removeGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      for (const timeout of game.disconnectedPlayers.values()) {
        clearTimeout(timeout);
      }
      this.games.delete(gameId);
    }
  }

  markPlayerDisconnected(
    gameId: string,
    playerId: string,
    onTimeout: () => void,
    timeoutMs = 5 * 60 * 1000
  ): void {
    const game = this.games.get(gameId);
    if (!game) return;

    const timeout = setTimeout(onTimeout, timeoutMs);
    game.disconnectedPlayers.set(playerId, timeout);
  }

  markPlayerReconnected(gameId: string, playerId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;

    const timeout = game.disconnectedPlayers.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      game.disconnectedPlayers.delete(playerId);
      return true;
    }
    return false;
  }

  isPlayerDisconnected(gameId: string, playerId: string): boolean {
    const game = this.games.get(gameId);
    return game?.disconnectedPlayers.has(playerId) ?? false;
  }

  /** Schedule a bot action if the current player is a bot */
  scheduleBotTurn(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    const ttrEngine = game.engine as TicketToRideEngine;
    const state = ttrEngine.state;
    if (state.phase === 'gameOver') return;

    // Determine who needs to act
    const activePlayerId = state.phase === 'setup'
      ? state.players[state.setupPlayerIndex]?.id
      : state.players[state.currentPlayerIndex]?.id;

    if (!activePlayerId) return;

    const bot = game.bots.get(activePlayerId);
    if (!bot) return; // Human player's turn

    const delay = getBotDelay(bot.difficulty);
    setTimeout(() => {
      const currentGame = this.games.get(gameId);
      if (!currentGame) return;

      const currentEngine = currentGame.engine as TicketToRideEngine;
      if (currentEngine.isGameOver()) return;

      try {
        const action = bot.chooseAction(currentEngine.state, activePlayerId);
        const result = this.processAction(gameId, activePlayerId, action);

        if (result.success) {
          // Notify listeners to broadcast state
          currentGame.onBotAction?.(gameId);
          // Schedule next bot turn if needed
          this.scheduleBotTurn(gameId);
        }
      } catch (err) {
        console.error(`Bot error in game ${gameId}:`, err);
      }
    }, delay);
  }
}
