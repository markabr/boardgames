export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface GameEngine<TState = unknown, TAction = unknown> {
  readonly gameId: string;
  readonly gameType: string;
  state: TState;

  validateAction(playerId: string, action: TAction): ValidationResult;
  applyAction(playerId: string, action: TAction): TState;
  getPlayerView(playerId: string): unknown;
  isGameOver(): boolean;
  serialize(): string;
}
