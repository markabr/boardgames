// Train card colors (non-wild)
export type TrainCardColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'black'
  | 'white';

// All card types including locomotive (wild)
export type CardColor = TrainCardColor | 'locomotive';

// Route colors include gray (any color can be used)
export type RouteColor = TrainCardColor | 'gray';

// All city names in the USA map
export type CityName =
  | 'Vancouver'
  | 'Seattle'
  | 'Portland'
  | 'SanFrancisco'
  | 'LosAngeles'
  | 'LasVegas'
  | 'Phoenix'
  | 'SaltLakeCity'
  | 'Helena'
  | 'Calgary'
  | 'Winnipeg'
  | 'Duluth'
  | 'SaultSteMarie'
  | 'Montreal'
  | 'Boston'
  | 'NewYork'
  | 'Pittsburgh'
  | 'Washington'
  | 'Raleigh'
  | 'Charleston'
  | 'Miami'
  | 'Atlanta'
  | 'Nashville'
  | 'SaintLouis'
  | 'Chicago'
  | 'Omaha'
  | 'KansasCity'
  | 'OklahomaCity'
  | 'Dallas'
  | 'Houston'
  | 'NewOrleans'
  | 'LittleRock'
  | 'ElPaso'
  | 'SantaFe'
  | 'Denver'
  | 'Toronto';

export interface Route {
  city1: CityName;
  city2: CityName;
  color: RouteColor;
  length: number;
  routeIndex: number; // 0 or 1 for double routes
}

export interface DestinationTicket {
  id: number;
  city1: CityName;
  city2: CityName;
  points: number;
}

export type GamePhase = 'setup' | 'playing' | 'lastRound' | 'gameOver';

// Full player state (server-side, all info)
export interface PlayerState {
  id: string;
  name: string;
  score: number;
  trainsRemaining: number;
  trainCards: CardColor[];
  destinationTickets: DestinationTicket[];
  claimedRoutes: string[]; // route keys
}

// Public player info visible to all players
export interface PlayerPublicState {
  id: string;
  name: string;
  score: number;
  trainsRemaining: number;
  trainCardCount: number;
  destinationTicketCount: number;
  claimedRoutes: string[];
}

// Private player info (only visible to the player themselves)
export interface PlayerPrivateState {
  trainCards: CardColor[];
  destinationTickets: DestinationTicket[];
}

// Full authoritative game state (server-side)
export interface GameState {
  players: PlayerState[];
  trainCardDeck: CardColor[];
  faceUpCards: CardColor[];
  destinationDeck: DestinationTicket[];
  currentPlayerIndex: number;
  turnAction: null | 'drawingCards';
  drawsLeft: number;
  claimedRoutes: Record<string, number>; // routeKey -> playerIndex
  phase: GamePhase;
  lastRoundTrigger: number;
  turnsUntilEnd: number;
  turnNumber: number;
  // Setup tracking
  setupPlayerIndex: number; // which player is currently picking destinations in setup
  pendingDestinations: DestinationTicket[]; // tickets offered to current player
}

// Filtered state sent to each client
export interface PlayerView {
  players: PlayerViewPlayer[];
  faceUpCards: CardColor[];
  trainCardDeckSize: number;
  destinationDeckSize: number;
  currentPlayerIndex: number;
  turnAction: null | 'drawingCards';
  drawsLeft: number;
  claimedRoutes: Record<string, number>;
  phase: GamePhase;
  turnsUntilEnd: number;
  turnNumber: number;
  // This player's private data
  myPlayerId: string;
  myTrainCards: CardColor[];
  myDestinationTickets: DestinationTicket[];
  // Pending destination choices (only during setup or draw_destinations)
  pendingDestinations: DestinationTicket[];
  pendingDestinationMinKeep: number;
}

export interface PlayerViewPlayer {
  id: string;
  name: string;
  score: number;
  trainsRemaining: number;
  trainCardCount: number;
  destinationTicketCount: number;
  claimedRoutes: string[];
}

// All possible player actions
export type GameAction =
  | { type: 'draw_card'; source: 'deck' | 'faceUp'; faceUpIndex?: number }
  | { type: 'claim_route'; routeKey: string; colorUsed: TrainCardColor }
  | { type: 'draw_destinations' }
  | { type: 'keep_destinations'; ticketIds: number[] };

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface ScoreBreakdown {
  playerId: string;
  playerName: string;
  routePoints: number;
  ticketBonus: number;
  longestPathLength: number;
  longestPathBonus: number;
  finalScore: number;
  ticketDetails: {
    ticket: DestinationTicket;
    completed: boolean;
    points: number; // positive or negative
  }[];
}
