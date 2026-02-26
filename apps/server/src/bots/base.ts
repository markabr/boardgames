import type { GameState, GameAction } from '@railbound/game-logic/ticket-to-ride';

export type BotDifficulty = 'easy' | 'medium';

export interface Bot {
  readonly difficulty: BotDifficulty;
  chooseAction(state: GameState, playerId: string): GameAction;
}

/** Delay range for bot actions to feel more natural */
export function getBotDelay(difficulty: BotDifficulty): number {
  const min = difficulty === 'easy' ? 800 : 1200;
  const max = difficulty === 'easy' ? 1500 : 2000;
  return min + Math.random() * (max - min);
}
