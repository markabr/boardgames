import {
  createInitialState,
  validateAction,
  applyAction,
  getPlayerView,
  isGameOver,
  calculateScores,
} from '@railbound/game-logic/ticket-to-ride';
import type {
  GameState,
  GameAction,
  PlayerView,
  ScoreBreakdown,
  ValidationResult,
} from '@railbound/game-logic/ticket-to-ride';
import type { GameEngine } from './base.js';

export class TicketToRideEngine implements GameEngine<GameState, GameAction> {
  readonly gameType = 'ticket_to_ride';
  state: GameState;
  private moveCount = 0;

  constructor(
    readonly gameId: string,
    state: GameState
  ) {
    this.state = state;
  }

  static create(
    gameId: string,
    players: { id: string; name: string }[],
    seed?: number
  ): TicketToRideEngine {
    const actualSeed = seed ?? Date.now();
    const state = createInitialState(players, actualSeed);
    return new TicketToRideEngine(gameId, state);
  }

  validateAction(playerId: string, action: GameAction): ValidationResult {
    return validateAction(this.state, playerId, action);
  }

  applyAction(playerId: string, action: GameAction): GameState {
    const reshuffleSeed = Date.now();
    this.state = applyAction(this.state, playerId, action, reshuffleSeed);
    this.moveCount++;
    return this.state;
  }

  getPlayerView(playerId: string): PlayerView {
    return getPlayerView(this.state, playerId);
  }

  isGameOver(): boolean {
    return isGameOver(this.state);
  }

  getScores(): ScoreBreakdown[] {
    return calculateScores(this.state);
  }

  serialize(): string {
    return JSON.stringify({
      gameId: this.gameId,
      state: this.state,
      moveCount: this.moveCount,
    });
  }

  static deserialize(data: string): TicketToRideEngine {
    const parsed = JSON.parse(data);
    const engine = new TicketToRideEngine(parsed.gameId, parsed.state);
    engine.moveCount = parsed.moveCount;
    return engine;
  }

  shouldCheckpoint(): boolean {
    return this.moveCount % 5 === 0;
  }
}
