import type {
  CardColor,
  TrainCardColor,
  CityName,
  Route,
  DestinationTicket,
  GameState,
  PlayerState,
  PlayerView,
  PlayerViewPlayer,
  GameAction,
  ValidationResult,
  ScoreBreakdown,
  GamePhase,
} from './types.js';
import {
  ROUTES,
  DESTINATION_TICKETS,
  ROUTE_POINTS,
  STARTING_TRAINS,
  INITIAL_HAND_SIZE,
  FACE_UP_COUNT,
  TRAIN_CARD_COLORS,
  CARDS_PER_COLOR,
  LOCOMOTIVE_COUNT,
  LAST_ROUND_TRAIN_THRESHOLD,
  LONGEST_PATH_BONUS,
  SETUP_MIN_KEEP,
  GAMEPLAY_MIN_KEEP,
  DESTINATION_DRAW_COUNT,
} from './constants.js';

// ============ SEEDED PRNG ============

/** Mulberry32 PRNG - returns a function that produces numbers in [0, 1) */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic Fisher-Yates shuffle using a seed */
export function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const a = [...arr];
  const rng = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============ ROUTE UTILITIES ============

/** Generate a unique key for a route */
export function routeKey(route: Route): string {
  return `${route.city1}-${route.city2}-${route.color}-${route.routeIndex}`;
}

/** Find a route by its key */
export function routeByKey(key: string): Route | undefined {
  return ROUTES.find((r) => routeKey(r) === key);
}

/** Count cards of a specific color in a hand */
export function countCards(hand: readonly CardColor[], color: CardColor): number {
  return hand.filter((c) => c === color).length;
}

// ============ GRAPH ALGORITHMS ============

/** Check if two cities are connected via a player's claimed routes (BFS) */
export function areCitiesConnected(
  city1: CityName,
  city2: CityName,
  claimedRouteKeys: readonly string[]
): boolean {
  if (city1 === city2) return true;

  const adj: Record<string, string[]> = {};
  for (const key of claimedRouteKeys) {
    const r = routeByKey(key);
    if (!r) continue;
    (adj[r.city1] = adj[r.city1] || []).push(r.city2);
    (adj[r.city2] = adj[r.city2] || []).push(r.city1);
  }

  const visited = new Set<string>([city1]);
  const queue: string[] = [city1];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === city2) return true;
    for (const neighbor of adj[cur] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return false;
}

/** Find the longest continuous path through claimed routes (DFS with backtracking) */
export function longestPath(claimedRouteKeys: readonly string[]): number {
  const adj: Record<string, { to: string; len: number; key: string }[]> = {};
  for (const key of claimedRouteKeys) {
    const r = routeByKey(key);
    if (!r) continue;
    const edge = { to: r.city2, len: r.length, key };
    const edgeRev = { to: r.city1, len: r.length, key };
    (adj[r.city1] = adj[r.city1] || []).push(edge);
    (adj[r.city2] = adj[r.city2] || []).push(edgeRev);
  }

  let max = 0;
  function dfs(city: string, used: Set<string>, cur: number): void {
    if (cur > max) max = cur;
    for (const e of adj[city] || []) {
      if (!used.has(e.key)) {
        used.add(e.key);
        dfs(e.to, used, cur + e.len);
        used.delete(e.key);
      }
    }
  }

  for (const city of Object.keys(adj)) {
    dfs(city, new Set(), 0);
  }
  return max;
}

// ============ CARD MANAGEMENT ============

/** Create a full train card deck (unshuffled) */
export function createTrainCardDeckUnshuffled(): CardColor[] {
  const deck: CardColor[] = [];
  for (const color of TRAIN_CARD_COLORS) {
    for (let i = 0; i < CARDS_PER_COLOR; i++) {
      deck.push(color);
    }
  }
  for (let i = 0; i < LOCOMOTIVE_COUNT; i++) {
    deck.push('locomotive');
  }
  return deck;
}

/** Remove cards from hand to pay for a route (returns new hand) */
export function removeCardsForRoute(
  hand: readonly CardColor[],
  color: TrainCardColor,
  length: number
): CardColor[] {
  const h = [...hand];
  let remaining = length;

  // First remove matching color cards
  for (let i = h.length - 1; i >= 0 && remaining > 0; i--) {
    if (h[i] === color) {
      h.splice(i, 1);
      remaining--;
    }
  }
  // Then remove locomotives for the remainder
  for (let i = h.length - 1; i >= 0 && remaining > 0; i--) {
    if (h[i] === 'locomotive') {
      h.splice(i, 1);
      remaining--;
    }
  }
  return h;
}

/**
 * For a gray route, determine which color to use (the one with the most cards).
 * If the player specified a color, use that. Otherwise pick the best.
 */
export function bestColorForGrayRoute(
  hand: readonly CardColor[],
  length: number
): TrainCardColor | null {
  const locos = countCards(hand, 'locomotive');
  let bestColor: TrainCardColor | null = null;
  let bestCount = -1;

  for (const c of TRAIN_CARD_COLORS) {
    const n = countCards(hand, c);
    if (n + locos >= length && n > bestCount) {
      bestCount = n;
      bestColor = c;
    }
  }
  return bestColor;
}

// ============ ROUTE VALIDATION ============

/** Check if a player can claim a specific route */
export function canClaimRoute(
  player: PlayerState,
  route: Route,
  claimedRoutes: Record<string, number>,
  playerCount: number
): boolean {
  const key = routeKey(route);

  // Already claimed
  if (claimedRoutes[key] !== undefined) return false;

  // Not enough trains
  if (player.trainsRemaining < route.length) return false;

  // Can't claim both sides of a double route (same player)
  const siblings = ROUTES.filter(
    (r) =>
      (r.city1 === route.city1 && r.city2 === route.city2) ||
      (r.city1 === route.city2 && r.city2 === route.city1)
  );
  if (siblings.some((r) => claimedRoutes[routeKey(r)] === findPlayerIndex(player, claimedRoutes))) {
    return false;
  }

  // In 2-3 player games, only one route of a double can be claimed by anyone
  if (playerCount <= 3) {
    if (siblings.some((r) => claimedRoutes[routeKey(r)] !== undefined)) {
      return false;
    }
  }

  // Card check
  const locos = countCards(player.trainCards, 'locomotive');
  if (route.color === 'gray') {
    return TRAIN_CARD_COLORS.some(
      (c) => countCards(player.trainCards, c) + locos >= route.length
    );
  }
  return countCards(player.trainCards, route.color) + locos >= route.length;
}

function findPlayerIndex(
  player: PlayerState,
  claimedRoutes: Record<string, number>
): number {
  // We need the player's index in the game, but we only have the claimed routes map
  // which maps routeKey -> playerIndex. We check if this player has claimed any route.
  for (const [, idx] of Object.entries(claimedRoutes)) {
    // We'll handle this differently - pass playerIndex directly
  }
  return -1; // fallback
}

/** Check if a player can claim a route, given their index */
export function canClaimRouteByIndex(
  player: PlayerState,
  playerIndex: number,
  route: Route,
  claimedRoutes: Record<string, number>,
  playerCount: number
): boolean {
  const key = routeKey(route);

  if (claimedRoutes[key] !== undefined) return false;
  if (player.trainsRemaining < route.length) return false;

  const siblings = ROUTES.filter(
    (r) =>
      (r.city1 === route.city1 && r.city2 === route.city2) ||
      (r.city1 === route.city2 && r.city2 === route.city1)
  );

  // Can't claim both sides (same player)
  if (siblings.some((r) => claimedRoutes[routeKey(r)] === playerIndex)) {
    return false;
  }

  // In 2-3 player games, only one route of a double can be claimed
  if (playerCount <= 3) {
    if (siblings.some((r) => claimedRoutes[routeKey(r)] !== undefined)) {
      return false;
    }
  }

  const locos = countCards(player.trainCards, 'locomotive');
  if (route.color === 'gray') {
    return TRAIN_CARD_COLORS.some(
      (c) => countCards(player.trainCards, c) + locos >= route.length
    );
  }
  return countCards(player.trainCards, route.color) + locos >= route.length;
}

// ============ GAME STATE CREATION ============

/** Create the initial game state for a new game */
export function createInitialState(
  players: { id: string; name: string }[],
  seed: number
): GameState {
  if (players.length < 2 || players.length > 4) {
    throw new Error(`Invalid player count: ${players.length}. Must be 2-4.`);
  }

  // Create and shuffle decks
  const rawDeck = createTrainCardDeckUnshuffled();
  const deck = seededShuffle(rawDeck, seed);
  const rawDestDeck = DESTINATION_TICKETS.map((t) => ({ ...t }));
  const destDeck = seededShuffle(rawDestDeck, seed + 1);

  let deckIdx = 0;

  // Deal initial hands
  const playerStates: PlayerState[] = players.map((p) => {
    const hand = deck.slice(deckIdx, deckIdx + INITIAL_HAND_SIZE);
    deckIdx += INITIAL_HAND_SIZE;
    return {
      id: p.id,
      name: p.name,
      score: 0,
      trainsRemaining: STARTING_TRAINS,
      trainCards: hand,
      destinationTickets: [],
      claimedRoutes: [],
    };
  });

  // Set up face-up cards
  const faceUpCards = deck.slice(deckIdx, deckIdx + FACE_UP_COUNT);
  deckIdx += FACE_UP_COUNT;

  const remainingDeck = deck.slice(deckIdx);

  // Draw first player's destination tickets for setup
  const drawCount = Math.min(DESTINATION_DRAW_COUNT, destDeck.length);
  const pendingDest = destDeck.slice(0, drawCount);
  const remainingDestDeck = destDeck.slice(drawCount);

  return {
    players: playerStates,
    trainCardDeck: remainingDeck,
    faceUpCards,
    destinationDeck: remainingDestDeck,
    currentPlayerIndex: 0,
    turnAction: null,
    drawsLeft: 0,
    claimedRoutes: {},
    phase: 'setup',
    lastRoundTrigger: -1,
    turnsUntilEnd: -1,
    turnNumber: 0,
    setupPlayerIndex: 0,
    pendingDestinations: pendingDest,
  };
}

// ============ VALIDATION ============

/** Validate whether an action is legal in the current game state */
export function validateAction(
  state: GameState,
  playerId: string,
  action: GameAction
): ValidationResult {
  // Setup phase: only keep_destinations from the setup player
  if (state.phase === 'setup') {
    if (action.type !== 'keep_destinations') {
      return { valid: false, reason: 'During setup, you can only keep destination tickets.' };
    }
    const setupPlayer = state.players[state.setupPlayerIndex];
    if (setupPlayer.id !== playerId) {
      return { valid: false, reason: 'It is not your turn to pick destinations.' };
    }
    return validateKeepDestinations(state, action.ticketIds, SETUP_MIN_KEEP);
  }

  if (state.phase === 'gameOver') {
    return { valid: false, reason: 'The game is over.' };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    return { valid: false, reason: 'It is not your turn.' };
  }

  switch (action.type) {
    case 'draw_card':
      return validateDrawCard(state, action);
    case 'claim_route':
      return validateClaimRoute(state, currentPlayer, action);
    case 'draw_destinations':
      return validateDrawDestinations(state);
    case 'keep_destinations':
      return validateKeepDestinations(state, action.ticketIds, GAMEPLAY_MIN_KEEP);
    default:
      return { valid: false, reason: 'Unknown action type.' };
  }
}

function validateDrawCard(
  state: GameState,
  action: { type: 'draw_card'; source: 'deck' | 'faceUp'; faceUpIndex?: number }
): ValidationResult {
  // Can draw cards if no action taken yet or already drawing cards
  if (state.turnAction !== null && state.turnAction !== 'drawingCards') {
    return { valid: false, reason: 'You are in the middle of another action.' };
  }

  // If drawing from face-up, check the index
  if (action.source === 'faceUp') {
    if (action.faceUpIndex === undefined || action.faceUpIndex < 0 || action.faceUpIndex >= state.faceUpCards.length) {
      return { valid: false, reason: 'Invalid face-up card index.' };
    }
    // Can't take face-up locomotive as second draw
    const card = state.faceUpCards[action.faceUpIndex];
    if (card === 'locomotive' && state.turnAction === 'drawingCards' && state.drawsLeft === 1) {
      return { valid: false, reason: 'Cannot take a face-up locomotive as your second draw.' };
    }
  }

  // Check deck has cards (for deck draw)
  if (action.source === 'deck' && state.trainCardDeck.length === 0) {
    // If both deck and face-up are empty, can't draw
    if (state.faceUpCards.length === 0) {
      return { valid: false, reason: 'No cards available to draw.' };
    }
    return { valid: false, reason: 'The draw pile is empty.' };
  }

  // Can't draw cards if pending destination pick
  if (state.pendingDestinations.length > 0) {
    return { valid: false, reason: 'You must finish choosing destination tickets first.' };
  }

  return { valid: true };
}

function validateClaimRoute(
  state: GameState,
  player: PlayerState,
  action: { type: 'claim_route'; routeKey: string; colorUsed: TrainCardColor }
): ValidationResult {
  // Can't claim route mid-draw
  if (state.turnAction === 'drawingCards') {
    return { valid: false, reason: 'You are in the middle of drawing cards.' };
  }

  // Can't claim if pending destinations
  if (state.pendingDestinations.length > 0) {
    return { valid: false, reason: 'You must finish choosing destination tickets first.' };
  }

  const route = routeByKey(action.routeKey);
  if (!route) {
    return { valid: false, reason: 'Invalid route.' };
  }

  // Check already claimed
  if (state.claimedRoutes[action.routeKey] !== undefined) {
    return { valid: false, reason: 'This route is already claimed.' };
  }

  // Check trains
  if (player.trainsRemaining < route.length) {
    return { valid: false, reason: 'Not enough trains remaining.' };
  }

  // Double route: can't claim both sides
  const siblings = ROUTES.filter(
    (r) =>
      (r.city1 === route.city1 && r.city2 === route.city2) ||
      (r.city1 === route.city2 && r.city2 === route.city1)
  );
  const playerIndex = state.players.findIndex((p) => p.id === player.id);
  if (siblings.some((r) => state.claimedRoutes[routeKey(r)] === playerIndex)) {
    return { valid: false, reason: 'You already claimed one side of this double route.' };
  }

  // 2-3 player: only one side of double routes
  if (state.players.length <= 3) {
    if (siblings.some((r) => state.claimedRoutes[routeKey(r)] !== undefined)) {
      return { valid: false, reason: 'In a 2-3 player game, only one route between two cities can be claimed.' };
    }
  }

  // Card check
  const colorUsed = action.colorUsed;
  if (route.color !== 'gray' && colorUsed !== route.color) {
    return { valid: false, reason: `This route requires ${route.color} cards, not ${colorUsed}.` };
  }
  const colorCount = countCards(player.trainCards, colorUsed);
  const locoCount = countCards(player.trainCards, 'locomotive');
  if (colorCount + locoCount < route.length) {
    return { valid: false, reason: 'Not enough cards to claim this route.' };
  }

  return { valid: true };
}

function validateDrawDestinations(state: GameState): ValidationResult {
  if (state.turnAction === 'drawingCards') {
    return { valid: false, reason: 'You are in the middle of drawing cards.' };
  }
  if (state.pendingDestinations.length > 0) {
    return { valid: false, reason: 'You already have pending destination tickets to choose from.' };
  }
  if (state.destinationDeck.length === 0) {
    return { valid: false, reason: 'No destination tickets remaining.' };
  }
  return { valid: true };
}

function validateKeepDestinations(
  state: GameState,
  ticketIds: number[],
  minKeep: number
): ValidationResult {
  if (state.pendingDestinations.length === 0) {
    return { valid: false, reason: 'No pending destination tickets to choose from.' };
  }
  if (ticketIds.length < minKeep) {
    return { valid: false, reason: `You must keep at least ${minKeep} ticket(s).` };
  }

  // All kept ticket IDs must be in the pending list
  const pendingIds = new Set(state.pendingDestinations.map((t) => t.id));
  for (const id of ticketIds) {
    if (!pendingIds.has(id)) {
      return { valid: false, reason: `Ticket ${id} is not in your pending choices.` };
    }
  }
  // No duplicate IDs
  if (new Set(ticketIds).size !== ticketIds.length) {
    return { valid: false, reason: 'Duplicate ticket IDs.' };
  }

  return { valid: true };
}

// ============ STATE TRANSITIONS ============

/** Apply a validated action to the game state, returning a new state */
export function applyAction(
  state: GameState,
  playerId: string,
  action: GameAction,
  reshuffleSeed?: number
): GameState {
  // Deep-ish clone: clone players array and individual players
  const newState: GameState = {
    ...state,
    players: state.players.map((p) => ({ ...p, trainCards: [...p.trainCards], destinationTickets: [...p.destinationTickets], claimedRoutes: [...p.claimedRoutes] })),
    trainCardDeck: [...state.trainCardDeck],
    faceUpCards: [...state.faceUpCards],
    destinationDeck: [...state.destinationDeck],
    claimedRoutes: { ...state.claimedRoutes },
    pendingDestinations: [...state.pendingDestinations],
  };

  switch (action.type) {
    case 'draw_card':
      return applyDrawCard(newState, action, reshuffleSeed);
    case 'claim_route':
      return applyClaimRoute(newState, action);
    case 'draw_destinations':
      return applyDrawDestinations(newState);
    case 'keep_destinations':
      return applyKeepDestinations(newState, playerId, action);
    default:
      return newState;
  }
}

function applyDrawCard(
  state: GameState,
  action: { type: 'draw_card'; source: 'deck' | 'faceUp'; faceUpIndex?: number },
  reshuffleSeed?: number
): GameState {
  const player = state.players[state.currentPlayerIndex];
  const isFirst = state.turnAction === null;
  const draws = isFirst ? 2 : state.drawsLeft;
  let card: CardColor;

  if (action.source === 'deck') {
    card = state.trainCardDeck.shift()!;
  } else {
    const idx = action.faceUpIndex!;
    card = state.faceUpCards[idx];

    // Replace face-up card from deck
    if (state.trainCardDeck.length > 0) {
      state.faceUpCards[idx] = state.trainCardDeck.shift()!;
    } else {
      state.faceUpCards.splice(idx, 1);
    }

    // 3+ locomotive reset
    while (
      state.faceUpCards.filter((c) => c === 'locomotive').length >= 3 &&
      state.trainCardDeck.length >= 5
    ) {
      const combined = [...state.trainCardDeck, ...state.faceUpCards];
      const seed = reshuffleSeed ?? (state.turnNumber * 1000 + state.currentPlayerIndex);
      const shuffled = seededShuffle(combined, seed);
      state.faceUpCards = shuffled.slice(0, FACE_UP_COUNT);
      state.trainCardDeck = shuffled.slice(FACE_UP_COUNT);
    }
  }

  player.trainCards.push(card);

  const locoFaceUp = action.source === 'faceUp' && card === 'locomotive';
  const newDraws = draws - (locoFaceUp ? 2 : 1);

  if (newDraws <= 0) {
    state.turnAction = null;
    state.drawsLeft = 0;
    advanceTurn(state);
  } else {
    state.turnAction = 'drawingCards';
    state.drawsLeft = newDraws;
  }

  return state;
}

function applyClaimRoute(
  state: GameState,
  action: { type: 'claim_route'; routeKey: string; colorUsed: TrainCardColor }
): GameState {
  const player = state.players[state.currentPlayerIndex];
  const route = routeByKey(action.routeKey)!;

  player.trainCards = removeCardsForRoute(player.trainCards, action.colorUsed, route.length);
  player.trainsRemaining -= route.length;
  player.score += ROUTE_POINTS[route.length];
  player.claimedRoutes.push(action.routeKey);
  state.claimedRoutes[action.routeKey] = state.currentPlayerIndex;

  // Check last round trigger
  if (player.trainsRemaining <= LAST_ROUND_TRAIN_THRESHOLD && state.phase === 'playing') {
    state.phase = 'lastRound';
    state.lastRoundTrigger = state.currentPlayerIndex;
    state.turnsUntilEnd = state.players.length;
  }

  state.turnAction = null;
  state.drawsLeft = 0;
  advanceTurn(state);

  return state;
}

function applyDrawDestinations(state: GameState): GameState {
  const drawCount = Math.min(DESTINATION_DRAW_COUNT, state.destinationDeck.length);
  state.pendingDestinations = state.destinationDeck.slice(0, drawCount);
  state.destinationDeck = state.destinationDeck.slice(drawCount);
  return state;
}

function applyKeepDestinations(
  state: GameState,
  playerId: string,
  action: { type: 'keep_destinations'; ticketIds: number[] }
): GameState {
  const keptIds = new Set(action.ticketIds);
  const kept = state.pendingDestinations.filter((t) => keptIds.has(t.id));
  const unkept = state.pendingDestinations.filter((t) => !keptIds.has(t.id));

  if (state.phase === 'setup') {
    // Setup phase: add to setup player, advance setup
    const setupPlayer = state.players[state.setupPlayerIndex];
    setupPlayer.destinationTickets.push(...kept);
    // Return unkept to bottom of deck
    state.destinationDeck.push(...unkept);
    state.pendingDestinations = [];

    const nextSetup = state.setupPlayerIndex + 1;
    if (nextSetup < state.players.length) {
      // Next player picks destinations
      state.setupPlayerIndex = nextSetup;
      const drawCount = Math.min(DESTINATION_DRAW_COUNT, state.destinationDeck.length);
      state.pendingDestinations = state.destinationDeck.slice(0, drawCount);
      state.destinationDeck = state.destinationDeck.slice(drawCount);
    } else {
      // All players have picked, start the game
      state.phase = 'playing';
      state.currentPlayerIndex = 0;
      state.setupPlayerIndex = -1;
    }
  } else {
    // Gameplay: add to current player, advance turn
    const player = state.players[state.currentPlayerIndex];
    player.destinationTickets.push(...kept);
    state.destinationDeck.push(...unkept);
    state.pendingDestinations = [];
    state.turnAction = null;
    state.drawsLeft = 0;
    advanceTurn(state);
  }

  return state;
}

function advanceTurn(state: GameState): void {
  if (state.phase === 'lastRound') {
    state.turnsUntilEnd--;
    if (state.turnsUntilEnd <= 0) {
      endGame(state);
      return;
    }
  }
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.turnAction = null;
  state.drawsLeft = 0;
  state.turnNumber++;
}

function endGame(state: GameState): void {
  state.phase = 'gameOver';
}

// ============ SCORING ============

/** Calculate final scores including destination ticket bonuses and longest path */
export function calculateScores(state: GameState): ScoreBreakdown[] {
  const breakdowns: ScoreBreakdown[] = state.players.map((p) => {
    const ticketDetails = p.destinationTickets.map((t) => {
      const completed = areCitiesConnected(t.city1, t.city2, p.claimedRoutes);
      return {
        ticket: t,
        completed,
        points: completed ? t.points : -t.points,
      };
    });
    const ticketBonus = ticketDetails.reduce((sum, td) => sum + td.points, 0);
    const pathLength = longestPath(p.claimedRoutes);

    return {
      playerId: p.id,
      playerName: p.name,
      routePoints: p.score,
      ticketBonus,
      longestPathLength: pathLength,
      longestPathBonus: 0, // will be set below
      finalScore: 0, // will be set below
      ticketDetails,
    };
  });

  // Find longest path and award bonus
  const maxPath = Math.max(...breakdowns.map((b) => b.longestPathLength));
  if (maxPath > 0) {
    for (const b of breakdowns) {
      if (b.longestPathLength === maxPath) {
        b.longestPathBonus = LONGEST_PATH_BONUS;
      }
    }
  }

  // Calculate final scores
  for (const b of breakdowns) {
    b.finalScore = b.routePoints + b.ticketBonus + b.longestPathBonus;
  }

  return breakdowns;
}

// ============ VALID ACTIONS ============

/** Get all valid actions for a player in the current state */
export function getValidActions(state: GameState, playerId: string): GameAction[] {
  const actions: GameAction[] = [];

  if (state.phase === 'setup') {
    const setupPlayer = state.players[state.setupPlayerIndex];
    if (setupPlayer.id !== playerId || state.pendingDestinations.length === 0) return [];

    // Generate all valid combinations of keeping destinations
    const pending = state.pendingDestinations;
    for (let mask = 1; mask < (1 << pending.length); mask++) {
      const ids: number[] = [];
      for (let i = 0; i < pending.length; i++) {
        if (mask & (1 << i)) ids.push(pending[i].id);
      }
      if (ids.length >= SETUP_MIN_KEEP) {
        actions.push({ type: 'keep_destinations', ticketIds: ids });
      }
    }
    return actions;
  }

  if (state.phase === 'gameOver') return [];

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return [];

  // If there are pending destinations, must keep some
  if (state.pendingDestinations.length > 0) {
    const pending = state.pendingDestinations;
    for (let mask = 1; mask < (1 << pending.length); mask++) {
      const ids: number[] = [];
      for (let i = 0; i < pending.length; i++) {
        if (mask & (1 << i)) ids.push(pending[i].id);
      }
      if (ids.length >= GAMEPLAY_MIN_KEEP) {
        actions.push({ type: 'keep_destinations', ticketIds: ids });
      }
    }
    return actions;
  }

  // If mid-draw, can only draw more cards
  if (state.turnAction === 'drawingCards') {
    // Draw from deck
    if (state.trainCardDeck.length > 0) {
      actions.push({ type: 'draw_card', source: 'deck' });
    }
    // Draw face-up (no locomotive as second draw)
    for (let i = 0; i < state.faceUpCards.length; i++) {
      if (state.faceUpCards[i] !== 'locomotive' || state.drawsLeft > 1) {
        actions.push({ type: 'draw_card', source: 'faceUp', faceUpIndex: i });
      }
    }
    return actions;
  }

  // Start of turn: can draw cards, claim routes, or draw destinations

  // Draw cards
  if (state.trainCardDeck.length > 0) {
    actions.push({ type: 'draw_card', source: 'deck' });
  }
  for (let i = 0; i < state.faceUpCards.length; i++) {
    actions.push({ type: 'draw_card', source: 'faceUp', faceUpIndex: i });
  }

  // Claim routes
  const playerIndex = state.currentPlayerIndex;
  for (const route of ROUTES) {
    if (canClaimRouteByIndex(currentPlayer, playerIndex, route, state.claimedRoutes, state.players.length)) {
      // Determine valid colors to use
      if (route.color === 'gray') {
        for (const c of TRAIN_CARD_COLORS) {
          const colorCount = countCards(currentPlayer.trainCards, c);
          const locoCount = countCards(currentPlayer.trainCards, 'locomotive');
          if (colorCount + locoCount >= route.length) {
            actions.push({ type: 'claim_route', routeKey: routeKey(route), colorUsed: c });
          }
        }
      } else {
        actions.push({ type: 'claim_route', routeKey: routeKey(route), colorUsed: route.color });
      }
    }
  }

  // Draw destinations
  if (state.destinationDeck.length > 0) {
    actions.push({ type: 'draw_destinations' });
  }

  return actions;
}

// ============ GAME STATE QUERIES ============

/** Check if the game is over */
export function isGameOver(state: GameState): boolean {
  return state.phase === 'gameOver';
}

// ============ INFORMATION HIDING ============

/** Create a filtered view of the game state for a specific player */
export function getPlayerView(state: GameState, playerId: string): PlayerView {
  const viewPlayers: PlayerViewPlayer[] = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    trainsRemaining: p.trainsRemaining,
    trainCardCount: p.trainCards.length,
    destinationTicketCount: p.destinationTickets.length,
    claimedRoutes: p.claimedRoutes,
  }));

  const myPlayer = state.players.find((p) => p.id === playerId);

  // Determine pending destination state for this player
  let pendingDest: DestinationTicket[] = [];
  let pendingMinKeep = 0;
  if (state.phase === 'setup' && state.players[state.setupPlayerIndex]?.id === playerId) {
    pendingDest = state.pendingDestinations;
    pendingMinKeep = SETUP_MIN_KEEP;
  } else if (
    state.phase !== 'setup' &&
    state.players[state.currentPlayerIndex]?.id === playerId &&
    state.pendingDestinations.length > 0
  ) {
    pendingDest = state.pendingDestinations;
    pendingMinKeep = GAMEPLAY_MIN_KEEP;
  }

  return {
    players: viewPlayers,
    faceUpCards: [...state.faceUpCards],
    trainCardDeckSize: state.trainCardDeck.length,
    destinationDeckSize: state.destinationDeck.length,
    currentPlayerIndex: state.currentPlayerIndex,
    turnAction: state.turnAction,
    drawsLeft: state.drawsLeft,
    claimedRoutes: { ...state.claimedRoutes },
    phase: state.phase,
    turnsUntilEnd: state.turnsUntilEnd,
    turnNumber: state.turnNumber,
    myPlayerId: playerId,
    myTrainCards: myPlayer ? [...myPlayer.trainCards] : [],
    myDestinationTickets: myPlayer ? [...myPlayer.destinationTickets] : [],
    pendingDestinations: pendingDest,
    pendingDestinationMinKeep: pendingMinKeep,
  };
}
