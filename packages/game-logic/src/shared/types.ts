export type GameType = 'acquire' | 'puerto_rico' | 'ticket_to_ride';

export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'abandoned';

export interface Player {
  id: string;
  name: string;
  avatarId: string;
  themeId: string;
}

export interface LobbyPlayer extends Player {
  isReady: boolean;
  isHost: boolean;
  isBot: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface Lobby {
  id: string;
  gameType: GameType;
  roomCode: string;
  isPublic: boolean;
  hostId: string;
  players: LobbyPlayer[];
  settings: GameSettings;
  createdAt: string;
}

export interface GameSettings {
  maxPlayers: number;
  turnTimeLimit?: number;
  // Game-specific settings can be extended
  [key: string]: unknown;
}

export interface GameMeta {
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedTime: string;
  thumbnail?: string;
}
