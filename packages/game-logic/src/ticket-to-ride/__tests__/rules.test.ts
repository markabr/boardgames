import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  validateAction,
  applyAction,
  getValidActions,
  isGameOver,
  calculateScores,
  areCitiesConnected,
  longestPath,
  getPlayerView,
  seededShuffle,
  routeKey,
  countCards,
  removeCardsForRoute,
  canClaimRouteByIndex,
} from '../rules';
import { ROUTES, DESTINATION_TICKETS, STARTING_TRAINS, ROUTE_POINTS } from '../constants';
import type { GameState, PlayerState, Route, GameAction } from '../types';

// ============ HELPERS ============

function makeTestState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialState(
    [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
      { id: 'p3', name: 'Charlie' },
    ],
    42
  );
  return { ...base, ...overrides };
}

function setupToPlaying(state: GameState): GameState {
  // Quickly get through setup by having each player keep all offered tickets
  let s = state;
  for (let i = 0; i < s.players.length; i++) {
    const ticketIds = s.pendingDestinations.map((t) => t.id);
    s = applyAction(s, s.players[s.setupPlayerIndex].id, {
      type: 'keep_destinations',
      ticketIds,
    });
  }
  return s;
}

// ============ TESTS ============

describe('seededShuffle', () => {
  it('should produce deterministic results with the same seed', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result1 = seededShuffle(arr, 123);
    const result2 = seededShuffle(arr, 123);
    expect(result1).toEqual(result2);
  });

  it('should produce different results with different seeds', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result1 = seededShuffle(arr, 123);
    const result2 = seededShuffle(arr, 456);
    expect(result1).not.toEqual(result2);
  });

  it('should not modify the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    seededShuffle(arr, 42);
    expect(arr).toEqual(original);
  });

  it('should contain all original elements', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = seededShuffle(arr, 42);
    expect(result.sort()).toEqual(arr.sort());
  });
});

describe('routeKey', () => {
  it('should generate unique keys for routes', () => {
    const route: Route = { city1: 'Vancouver', city2: 'Seattle', color: 'gray', length: 1, routeIndex: 0 };
    expect(routeKey(route)).toBe('Vancouver-Seattle-gray-0');
  });

  it('should differentiate double routes by routeIndex', () => {
    const route0: Route = { city1: 'Vancouver', city2: 'Seattle', color: 'gray', length: 1, routeIndex: 0 };
    const route1: Route = { city1: 'Vancouver', city2: 'Seattle', color: 'gray', length: 1, routeIndex: 1 };
    expect(routeKey(route0)).not.toBe(routeKey(route1));
  });
});

describe('countCards', () => {
  it('should count matching cards', () => {
    const hand = ['red', 'blue', 'red', 'locomotive', 'red'] as const;
    expect(countCards(hand, 'red')).toBe(3);
    expect(countCards(hand, 'blue')).toBe(1);
    expect(countCards(hand, 'locomotive')).toBe(1);
    expect(countCards(hand, 'green')).toBe(0);
  });
});

describe('removeCardsForRoute', () => {
  it('should remove matching color cards first, then locomotives', () => {
    const hand = ['red', 'red', 'locomotive', 'blue', 'red'] as const;
    const result = removeCardsForRoute(hand, 'red', 4);
    expect(result).toEqual(['blue']);
  });

  it('should return a new array without modifying the original', () => {
    const hand = ['red', 'red', 'locomotive'] as const;
    const result = removeCardsForRoute(hand, 'red', 2);
    expect(hand).toHaveLength(3);
    expect(result).toHaveLength(1);
  });
});

describe('areCitiesConnected', () => {
  it('should return true for same city', () => {
    expect(areCitiesConnected('Denver', 'Denver', [])).toBe(true);
  });

  it('should return false for disconnected cities', () => {
    expect(areCitiesConnected('Denver', 'Miami', [])).toBe(false);
  });

  it('should return true for directly connected cities', () => {
    const denverSLC = ROUTES.find(
      (r) => r.city1 === 'Denver' && r.city2 === 'SaltLakeCity' && r.routeIndex === 0
    )!;
    expect(areCitiesConnected('Denver', 'SaltLakeCity', [routeKey(denverSLC)])).toBe(true);
  });

  it('should return true for multi-hop connections', () => {
    const denverSLC = ROUTES.find(
      (r) => r.city1 === 'Denver' && r.city2 === 'SaltLakeCity' && r.routeIndex === 0
    )!;
    const slcHelena = ROUTES.find(
      (r) => r.city1 === 'SaltLakeCity' && r.city2 === 'Helena'
    )!;
    const keys = [routeKey(denverSLC), routeKey(slcHelena)];
    expect(areCitiesConnected('Denver', 'Helena', keys)).toBe(true);
  });

  it('should return false when path does not exist through claimed routes', () => {
    const denverSLC = ROUTES.find(
      (r) => r.city1 === 'Denver' && r.city2 === 'SaltLakeCity' && r.routeIndex === 0
    )!;
    expect(areCitiesConnected('Denver', 'Helena', [routeKey(denverSLC)])).toBe(false);
  });
});

describe('longestPath', () => {
  it('should return 0 for no routes', () => {
    expect(longestPath([])).toBe(0);
  });

  it('should return route length for a single route', () => {
    const denverSLC = ROUTES.find(
      (r) => r.city1 === 'Denver' && r.city2 === 'SaltLakeCity' && r.routeIndex === 0
    )!;
    expect(longestPath([routeKey(denverSLC)])).toBe(3);
  });

  it('should find longest continuous path through connected routes', () => {
    const denverSLC = ROUTES.find(
      (r) => r.city1 === 'Denver' && r.city2 === 'SaltLakeCity' && r.routeIndex === 0
    )!; // 3
    const slcHelena = ROUTES.find(
      (r) => r.city1 === 'SaltLakeCity' && r.city2 === 'Helena'
    )!; // 3
    const keys = [routeKey(denverSLC), routeKey(slcHelena)];
    expect(longestPath(keys)).toBe(6); // 3 + 3
  });

  it('should not count disconnected routes together', () => {
    const denverSLC = ROUTES.find(
      (r) => r.city1 === 'Denver' && r.city2 === 'SaltLakeCity' && r.routeIndex === 0
    )!; // 3
    const miamAtl = ROUTES.find(
      (r) => r.city1 === 'Miami' && r.city2 === 'Atlanta'
    )!; // 5
    const keys = [routeKey(denverSLC), routeKey(miamAtl)];
    // Longest continuous is max(3, 5) = 5
    expect(longestPath(keys)).toBe(5);
  });
});

describe('createInitialState', () => {
  it('should create a valid initial state for 2 players', () => {
    const state = createInitialState(
      [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }],
      42
    );
    expect(state.players).toHaveLength(2);
    expect(state.phase).toBe('setup');
    expect(state.faceUpCards).toHaveLength(5);
    expect(state.pendingDestinations).toHaveLength(3);
    expect(state.setupPlayerIndex).toBe(0);
  });

  it('should create a valid initial state for 4 players', () => {
    const state = createInitialState(
      [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
        { id: 'p3', name: 'C' },
        { id: 'p4', name: 'D' },
      ],
      42
    );
    expect(state.players).toHaveLength(4);
    expect(state.players.every((p) => p.trainCards.length === 4)).toBe(true);
    expect(state.players.every((p) => p.trainsRemaining === STARTING_TRAINS)).toBe(true);
    // Total cards: 110. Dealt: 4*4=16 + 5 face-up = 21. Deck should have 89.
    expect(state.trainCardDeck.length).toBe(89);
  });

  it('should be deterministic with the same seed', () => {
    const players = [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }];
    const state1 = createInitialState(players, 999);
    const state2 = createInitialState(players, 999);
    expect(state1.players[0].trainCards).toEqual(state2.players[0].trainCards);
    expect(state1.faceUpCards).toEqual(state2.faceUpCards);
    expect(state1.pendingDestinations).toEqual(state2.pendingDestinations);
  });

  it('should throw for invalid player counts', () => {
    expect(() => createInitialState([{ id: 'p1', name: 'A' }], 42)).toThrow();
    expect(() =>
      createInitialState(
        Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, name: `P${i}` })),
        42
      )
    ).toThrow();
  });

  it('should deal 4 cards to each player', () => {
    const state = createInitialState(
      [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }, { id: 'p3', name: 'C' }],
      42
    );
    for (const p of state.players) {
      expect(p.trainCards).toHaveLength(4);
    }
  });

  it('should have all destination tickets accounted for', () => {
    const state = createInitialState(
      [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }],
      42
    );
    const total = state.destinationDeck.length + state.pendingDestinations.length;
    expect(total).toBe(30);
  });
});

describe('validateAction - setup phase', () => {
  it('should reject non-keep_destinations actions during setup', () => {
    const state = makeTestState();
    const result = validateAction(state, 'p1', { type: 'draw_card', source: 'deck' });
    expect(result.valid).toBe(false);
  });

  it('should reject if not the setup player', () => {
    const state = makeTestState();
    const ticketIds = state.pendingDestinations.map((t) => t.id);
    const result = validateAction(state, 'p2', { type: 'keep_destinations', ticketIds });
    expect(result.valid).toBe(false);
  });

  it('should reject keeping fewer than minimum', () => {
    const state = makeTestState();
    const result = validateAction(state, 'p1', {
      type: 'keep_destinations',
      ticketIds: [state.pendingDestinations[0].id],
    });
    expect(result.valid).toBe(false); // min 2 during setup
  });

  it('should accept keeping 2 or more tickets during setup', () => {
    const state = makeTestState();
    const ticketIds = state.pendingDestinations.slice(0, 2).map((t) => t.id);
    const result = validateAction(state, 'p1', { type: 'keep_destinations', ticketIds });
    expect(result.valid).toBe(true);
  });

  it('should accept keeping all 3 tickets during setup', () => {
    const state = makeTestState();
    const ticketIds = state.pendingDestinations.map((t) => t.id);
    const result = validateAction(state, 'p1', { type: 'keep_destinations', ticketIds });
    expect(result.valid).toBe(true);
  });
});

describe('applyAction - setup phase', () => {
  it('should advance setup player after keeping destinations', () => {
    const state = makeTestState();
    const ticketIds = state.pendingDestinations.map((t) => t.id);
    const newState = applyAction(state, 'p1', { type: 'keep_destinations', ticketIds });
    expect(newState.setupPlayerIndex).toBe(1);
    expect(newState.players[0].destinationTickets).toHaveLength(3);
    expect(newState.pendingDestinations.length).toBeGreaterThan(0);
  });

  it('should transition to playing after all players pick', () => {
    const state = makeTestState();
    const finalState = setupToPlaying(state);
    expect(finalState.phase).toBe('playing');
    expect(finalState.currentPlayerIndex).toBe(0);
    // All players should have destination tickets
    for (const p of finalState.players) {
      expect(p.destinationTickets.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should return unkept tickets to bottom of deck', () => {
    const state = makeTestState();
    const kept = state.pendingDestinations.slice(0, 2).map((t) => t.id);
    const unkept = state.pendingDestinations[2];
    const deckSizeBefore = state.destinationDeck.length;

    const newState = applyAction(state, 'p1', { type: 'keep_destinations', ticketIds: kept });

    // Deck grew by 1 (the unkept ticket) minus 3 new draws
    // New deck = old deck + 1 unkept - 3 drawn = deckSizeBefore + 1 - 3
    expect(newState.destinationDeck.length).toBe(deckSizeBefore + 1 - 3);
    expect(newState.players[0].destinationTickets).toHaveLength(2);
  });
});

describe('validateAction - playing phase', () => {
  let playingState: GameState;

  beforeEach(() => {
    playingState = setupToPlaying(makeTestState());
  });

  it('should reject actions when it is not the player turn', () => {
    const result = validateAction(playingState, 'p2', { type: 'draw_card', source: 'deck' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not your turn');
  });

  it('should accept drawing a card from the deck', () => {
    const result = validateAction(playingState, 'p1', { type: 'draw_card', source: 'deck' });
    expect(result.valid).toBe(true);
  });

  it('should accept drawing a face-up card', () => {
    const result = validateAction(playingState, 'p1', {
      type: 'draw_card',
      source: 'faceUp',
      faceUpIndex: 0,
    });
    expect(result.valid).toBe(true);
  });

  it('should reject invalid face-up index', () => {
    const result = validateAction(playingState, 'p1', {
      type: 'draw_card',
      source: 'faceUp',
      faceUpIndex: 10,
    });
    expect(result.valid).toBe(false);
  });

  it('should accept drawing destination tickets', () => {
    const result = validateAction(playingState, 'p1', { type: 'draw_destinations' });
    expect(result.valid).toBe(true);
  });

  it('should reject claiming a route with insufficient cards', () => {
    // Find a long route the player definitely can't afford
    const longRoute = ROUTES.find((r) => r.length === 6)!;
    const result = validateAction(playingState, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(longRoute),
      colorUsed: longRoute.color === 'gray' ? 'red' : longRoute.color,
    });
    // Player starts with only 4 cards, so a 6-length route should fail
    expect(result.valid).toBe(false);
  });
});

describe('applyAction - draw cards', () => {
  let playingState: GameState;

  beforeEach(() => {
    playingState = setupToPlaying(makeTestState());
  });

  it('should add a card to hand when drawing from deck', () => {
    const handSizeBefore = playingState.players[0].trainCards.length;
    const deckSizeBefore = playingState.trainCardDeck.length;

    const newState = applyAction(playingState, 'p1', { type: 'draw_card', source: 'deck' });

    expect(newState.players[0].trainCards.length).toBe(handSizeBefore + 1);
    expect(newState.trainCardDeck.length).toBe(deckSizeBefore - 1);
    expect(newState.turnAction).toBe('drawingCards');
    expect(newState.drawsLeft).toBe(1);
  });

  it('should end turn after second draw from deck', () => {
    let state = applyAction(playingState, 'p1', { type: 'draw_card', source: 'deck' });
    state = applyAction(state, 'p1', { type: 'draw_card', source: 'deck' });

    expect(state.currentPlayerIndex).toBe(1); // Advanced to next player
    expect(state.turnAction).toBeNull();
  });

  it('should draw from face-up and refill from deck', () => {
    const faceUpCard = playingState.faceUpCards[0];
    const newState = applyAction(playingState, 'p1', {
      type: 'draw_card',
      source: 'faceUp',
      faceUpIndex: 0,
    });

    expect(newState.players[0].trainCards).toContain(faceUpCard);
    expect(newState.faceUpCards).toHaveLength(5);
  });

  it('should end turn immediately when drawing face-up locomotive', () => {
    // Set up a state with a locomotive face-up
    const stateWithLoco = { ...playingState, faceUpCards: ['locomotive', 'red', 'blue', 'green', 'yellow'] as const };
    Object.assign(stateWithLoco, { faceUpCards: ['locomotive', 'red', 'blue', 'green', 'yellow'] });

    const newState = applyAction(stateWithLoco, 'p1', {
      type: 'draw_card',
      source: 'faceUp',
      faceUpIndex: 0,
    });

    expect(newState.currentPlayerIndex).toBe(1); // Turn ended
    expect(newState.turnAction).toBeNull();
  });

  it('should reject face-up locomotive as second draw', () => {
    // First draw from deck
    let state = applyAction(playingState, 'p1', { type: 'draw_card', source: 'deck' });
    // Set up a locomotive in face-up for second draw
    state.faceUpCards[0] = 'locomotive';

    const result = validateAction(state, 'p1', {
      type: 'draw_card',
      source: 'faceUp',
      faceUpIndex: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('locomotive');
  });

  it('should reject claim_route while mid-draw', () => {
    let state = applyAction(playingState, 'p1', { type: 'draw_card', source: 'deck' });
    const route = ROUTES[0];
    const result = validateAction(state, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(route),
      colorUsed: 'red',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('drawing');
  });
});

describe('applyAction - claim route', () => {
  it('should successfully claim a short route with sufficient cards', () => {
    let state = setupToPlaying(makeTestState());

    // Give player 1 enough cards to claim a 1-length gray route
    state.players[0].trainCards = ['red', 'red', 'blue', 'green'];
    const shortRoute = ROUTES.find((r) => r.length === 1 && r.color === 'gray')!;

    const result = validateAction(state, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(shortRoute),
      colorUsed: 'red',
    });
    expect(result.valid).toBe(true);

    const newState = applyAction(state, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(shortRoute),
      colorUsed: 'red',
    });

    expect(newState.players[0].score).toBe(ROUTE_POINTS[1]);
    expect(newState.players[0].trainsRemaining).toBe(STARTING_TRAINS - 1);
    expect(newState.claimedRoutes[routeKey(shortRoute)]).toBe(0);
    expect(newState.players[0].claimedRoutes).toContain(routeKey(shortRoute));
    expect(newState.currentPlayerIndex).toBe(1); // Turn advanced
  });

  it('should use locomotives when not enough matching color', () => {
    let state = setupToPlaying(makeTestState());
    state.players[0].trainCards = ['red', 'locomotive', 'locomotive', 'blue'];

    // Find a 3-length red route
    const redRoute = ROUTES.find((r) => r.color === 'red' && r.length === 3)!;

    const result = validateAction(state, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(redRoute),
      colorUsed: 'red',
    });
    expect(result.valid).toBe(true);

    const newState = applyAction(state, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(redRoute),
      colorUsed: 'red',
    });

    expect(newState.players[0].trainCards).toEqual(['blue']);
  });

  it('should reject claiming an already-claimed route', () => {
    let state = setupToPlaying(makeTestState());
    const shortRoute = ROUTES.find((r) => r.length === 1 && r.color === 'gray')!;
    state.claimedRoutes[routeKey(shortRoute)] = 1; // claimed by player 2

    state.players[0].trainCards = ['red', 'red', 'blue', 'green'];
    const result = validateAction(state, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(shortRoute),
      colorUsed: 'red',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('already claimed');
  });

  it('should reject claiming both sides of a double route (same player)', () => {
    let state = setupToPlaying(makeTestState());
    const doubleRoutes = ROUTES.filter(
      (r) => r.city1 === 'Vancouver' && r.city2 === 'Seattle'
    );
    expect(doubleRoutes).toHaveLength(2);

    // Player 0 claims route index 0
    state.claimedRoutes[routeKey(doubleRoutes[0])] = 0;
    state.players[0].claimedRoutes.push(routeKey(doubleRoutes[0]));
    state.players[0].trainCards = ['red', 'red', 'blue', 'green'];

    // Player 0 tries to claim route index 1
    const result = validateAction(state, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(doubleRoutes[1]),
      colorUsed: 'red',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('double route');
  });

  it('should reject second side of double route in 2-3 player game', () => {
    let state = setupToPlaying(makeTestState()); // 3 players
    const doubleRoutes = ROUTES.filter(
      (r) => r.city1 === 'Vancouver' && r.city2 === 'Seattle'
    );

    // Player 1 claims route index 0
    state.claimedRoutes[routeKey(doubleRoutes[0])] = 1;
    state.players[0].trainCards = ['red', 'red', 'blue', 'green'];

    // Player 0 tries to claim the other side - should fail in 3-player game
    const result = validateAction(state, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(doubleRoutes[1]),
      colorUsed: 'red',
    });
    expect(result.valid).toBe(false);
  });

  it('should reject wrong color for colored routes', () => {
    let state = setupToPlaying(makeTestState());
    const blueRoute = ROUTES.find((r) => r.color === 'blue')!;
    state.players[0].trainCards = ['red', 'red', 'red', 'red', 'red', 'red'];

    const result = validateAction(state, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(blueRoute),
      colorUsed: 'red',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('requires');
  });

  it('should trigger last round when trains drop to 2 or fewer', () => {
    let state = setupToPlaying(makeTestState());
    state.players[0].trainsRemaining = 3;
    state.players[0].trainCards = ['red', 'red', 'red', 'red', 'red', 'locomotive'];

    // Find a 1-length gray route
    const shortRoute = ROUTES.find((r) => r.length === 1 && r.color === 'gray')!;

    const newState = applyAction(state, 'p1', {
      type: 'claim_route',
      routeKey: routeKey(shortRoute),
      colorUsed: 'red',
    });

    expect(newState.phase).toBe('lastRound');
    // turnsUntilEnd starts at players.length but advanceTurn (called by applyAction) decrements it once
    expect(newState.turnsUntilEnd).toBe(state.players.length - 1);
  });
});

describe('applyAction - draw destinations', () => {
  it('should draw 3 destination tickets and set them pending', () => {
    let state = setupToPlaying(makeTestState());
    const deckSizeBefore = state.destinationDeck.length;

    const newState = applyAction(state, 'p1', { type: 'draw_destinations' });

    expect(newState.pendingDestinations).toHaveLength(3);
    expect(newState.destinationDeck.length).toBe(deckSizeBefore - 3);
  });

  it('should require keeping at least 1 during gameplay', () => {
    let state = setupToPlaying(makeTestState());
    state = applyAction(state, 'p1', { type: 'draw_destinations' });

    // Try keeping 0
    const result = validateAction(state, 'p1', { type: 'keep_destinations', ticketIds: [] });
    expect(result.valid).toBe(false);

    // Keep 1 should work
    const result2 = validateAction(state, 'p1', {
      type: 'keep_destinations',
      ticketIds: [state.pendingDestinations[0].id],
    });
    expect(result2.valid).toBe(true);
  });

  it('should advance turn after keeping destinations', () => {
    let state = setupToPlaying(makeTestState());
    state = applyAction(state, 'p1', { type: 'draw_destinations' });

    const newState = applyAction(state, 'p1', {
      type: 'keep_destinations',
      ticketIds: [state.pendingDestinations[0].id],
    });

    expect(newState.currentPlayerIndex).toBe(1);
    expect(newState.pendingDestinations).toHaveLength(0);
    expect(newState.players[0].destinationTickets.length).toBeGreaterThanOrEqual(3); // 3 from setup + 1 from gameplay
  });
});

describe('game over and scoring', () => {
  it('should end the game after last round countdown', () => {
    let state = setupToPlaying(makeTestState());
    state.phase = 'lastRound';
    state.turnsUntilEnd = 1;

    // Draw a card to trigger turn advance (which decrements turnsUntilEnd)
    state = applyAction(state, 'p1', { type: 'draw_card', source: 'deck' });
    state = applyAction(state, state.players[state.currentPlayerIndex].id, {
      type: 'draw_card',
      source: 'deck',
    });

    expect(state.phase).toBe('gameOver');
  });

  it('should calculate scores correctly', () => {
    let state = setupToPlaying(makeTestState());
    state.phase = 'gameOver';

    // Give player 0 some claimed routes and completed tickets
    const denverSLC = ROUTES.find(
      (r) => r.city1 === 'Denver' && r.city2 === 'SaltLakeCity' && r.routeIndex === 0
    )!;
    state.players[0].score = ROUTE_POINTS[denverSLC.length]; // 4 points for length 3
    state.players[0].claimedRoutes = [routeKey(denverSLC)];
    state.players[0].destinationTickets = [
      { id: 10, city1: 'Calgary', city2: 'SaltLakeCity', points: 7 },
    ];
    // Calgary-SaltLakeCity is NOT connected via just Denver-SLC, so ticket is incomplete

    const scores = calculateScores(state);
    const p0Score = scores.find((s) => s.playerId === 'p1')!;

    expect(p0Score.routePoints).toBe(4);
    expect(p0Score.ticketBonus).toBe(-7); // Not connected = negative
    // Player 0 also gets longest path bonus (10) since they have the only routes (length 3)
    expect(p0Score.longestPathBonus).toBe(10);
    expect(p0Score.finalScore).toBe(4 - 7 + 10); // 7
  });

  it('should award positive ticket bonus for completed tickets', () => {
    let state = setupToPlaying(makeTestState());
    state.phase = 'gameOver';

    const denverSLC = ROUTES.find(
      (r) => r.city1 === 'Denver' && r.city2 === 'SaltLakeCity' && r.routeIndex === 0
    )!;
    state.players[0].score = ROUTE_POINTS[denverSLC.length];
    state.players[0].claimedRoutes = [routeKey(denverSLC)];
    state.players[0].destinationTickets = [
      { id: 99, city1: 'Denver', city2: 'SaltLakeCity', points: 5 },
    ];

    const scores = calculateScores(state);
    const p0Score = scores.find((s) => s.playerId === 'p1')!;

    expect(p0Score.ticketBonus).toBe(5);
    expect(p0Score.ticketDetails[0].completed).toBe(true);
  });

  it('should award longest path bonus to player with longest path', () => {
    let state = setupToPlaying(makeTestState());
    state.phase = 'gameOver';

    // Give player 0 a longer path than others
    const denverSLC = ROUTES.find(
      (r) => r.city1 === 'Denver' && r.city2 === 'SaltLakeCity' && r.routeIndex === 0
    )!;
    const slcHelena = ROUTES.find(
      (r) => r.city1 === 'SaltLakeCity' && r.city2 === 'Helena'
    )!;
    state.players[0].claimedRoutes = [routeKey(denverSLC), routeKey(slcHelena)]; // 3+3=6

    const scores = calculateScores(state);
    const p0Score = scores.find((s) => s.playerId === 'p1')!;
    const p1Score = scores.find((s) => s.playerId === 'p2')!;

    expect(p0Score.longestPathBonus).toBe(10);
    expect(p1Score.longestPathBonus).toBe(0);
  });

  it('should award longest path bonus to all tied players', () => {
    let state = setupToPlaying(makeTestState());
    state.phase = 'gameOver';

    const denverSLC = ROUTES.find(
      (r) => r.city1 === 'Denver' && r.city2 === 'SaltLakeCity' && r.routeIndex === 0
    )!;
    const nashAtl = ROUTES.find(
      (r) => r.city1 === 'Atlanta' && r.city2 === 'Nashville'
    )!;

    // Both have path length 3
    state.players[0].claimedRoutes = [routeKey(denverSLC)]; // 3
    state.players[1].claimedRoutes = [routeKey(nashAtl)]; // 1... not tied
    // Actually Atlanta-Nashville is length 1. Let me find a 3-length route for player 1
    const dulChicago = ROUTES.find(
      (r) => r.city1 === 'Duluth' && r.city2 === 'Chicago'
    )!;
    state.players[1].claimedRoutes = [routeKey(dulChicago)]; // 3

    const scores = calculateScores(state);
    const p0Score = scores.find((s) => s.playerId === 'p1')!;
    const p1Score = scores.find((s) => s.playerId === 'p2')!;

    expect(p0Score.longestPathLength).toBe(3);
    expect(p1Score.longestPathLength).toBe(3);
    expect(p0Score.longestPathBonus).toBe(10);
    expect(p1Score.longestPathBonus).toBe(10);
  });
});

describe('getValidActions', () => {
  it('should return keep_destinations options during setup', () => {
    const state = makeTestState();
    const actions = getValidActions(state, 'p1');
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every((a) => a.type === 'keep_destinations')).toBe(true);
    // All should keep at least 2
    for (const a of actions) {
      if (a.type === 'keep_destinations') {
        expect(a.ticketIds.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('should return empty for non-current player', () => {
    const state = makeTestState();
    const actions = getValidActions(state, 'p2');
    expect(actions).toHaveLength(0);
  });

  it('should return draw, claim, and destination actions at start of turn', () => {
    let state = setupToPlaying(makeTestState());
    const actions = getValidActions(state, 'p1');

    const types = new Set(actions.map((a) => a.type));
    expect(types.has('draw_card')).toBe(true);
    expect(types.has('draw_destinations')).toBe(true);
    // May or may not have claim_route depending on hand
  });

  it('should only return draw_card actions mid-draw', () => {
    let state = setupToPlaying(makeTestState());
    state = applyAction(state, 'p1', { type: 'draw_card', source: 'deck' });

    const actions = getValidActions(state, 'p1');
    expect(actions.every((a) => a.type === 'draw_card')).toBe(true);
  });

  it('should return empty for game over', () => {
    let state = setupToPlaying(makeTestState());
    state.phase = 'gameOver';
    const actions = getValidActions(state, 'p1');
    expect(actions).toHaveLength(0);
  });
});

describe('isGameOver', () => {
  it('should return false for non-gameOver phases', () => {
    expect(isGameOver(makeTestState())).toBe(false);
    expect(isGameOver(setupToPlaying(makeTestState()))).toBe(false);
  });

  it('should return true for gameOver phase', () => {
    const state = makeTestState();
    state.phase = 'gameOver';
    expect(isGameOver(state)).toBe(true);
  });
});

describe('getPlayerView', () => {
  it('should include own hand and destination tickets', () => {
    const state = setupToPlaying(makeTestState());
    const view = getPlayerView(state, 'p1');

    expect(view.myPlayerId).toBe('p1');
    expect(view.myTrainCards).toEqual(state.players[0].trainCards);
    expect(view.myDestinationTickets).toEqual(state.players[0].destinationTickets);
  });

  it('should hide other players hands (show only count)', () => {
    const state = setupToPlaying(makeTestState());
    const view = getPlayerView(state, 'p1');

    for (const p of view.players) {
      expect(p.trainCardCount).toBeDefined();
      expect(p.destinationTicketCount).toBeDefined();
      // Should not have actual cards or tickets
      expect((p as any).trainCards).toBeUndefined();
      expect((p as any).destinationTickets).toBeUndefined();
    }
  });

  it('should include deck sizes not contents', () => {
    const state = setupToPlaying(makeTestState());
    const view = getPlayerView(state, 'p1');

    expect(view.trainCardDeckSize).toBe(state.trainCardDeck.length);
    expect(view.destinationDeckSize).toBe(state.destinationDeck.length);
    expect((view as any).trainCardDeck).toBeUndefined();
    expect((view as any).destinationDeck).toBeUndefined();
  });

  it('should include pending destinations for setup player', () => {
    const state = makeTestState();
    const view = getPlayerView(state, 'p1');

    expect(view.pendingDestinations).toEqual(state.pendingDestinations);
    expect(view.pendingDestinationMinKeep).toBe(2);
  });

  it('should not include pending destinations for non-setup player', () => {
    const state = makeTestState();
    const view = getPlayerView(state, 'p2');

    expect(view.pendingDestinations).toHaveLength(0);
    expect(view.pendingDestinationMinKeep).toBe(0);
  });

  it('should include face-up cards', () => {
    const state = setupToPlaying(makeTestState());
    const view = getPlayerView(state, 'p1');

    expect(view.faceUpCards).toEqual(state.faceUpCards);
  });
});

describe('canClaimRouteByIndex', () => {
  it('should allow claiming with exact color match', () => {
    const player: PlayerState = {
      id: 'p1', name: 'Test', score: 0, trainsRemaining: 45,
      trainCards: ['red', 'red', 'red'],
      destinationTickets: [], claimedRoutes: [],
    };
    const route = ROUTES.find((r) => r.color === 'red' && r.length === 3)!;
    expect(canClaimRouteByIndex(player, 0, route, {}, 4)).toBe(true);
  });

  it('should allow gray routes with any single color', () => {
    const player: PlayerState = {
      id: 'p1', name: 'Test', score: 0, trainsRemaining: 45,
      trainCards: ['blue', 'blue'],
      destinationTickets: [], claimedRoutes: [],
    };
    const grayRoute = ROUTES.find((r) => r.color === 'gray' && r.length === 2)!;
    expect(canClaimRouteByIndex(player, 0, grayRoute, {}, 4)).toBe(true);
  });

  it('should reject when not enough cards', () => {
    const player: PlayerState = {
      id: 'p1', name: 'Test', score: 0, trainsRemaining: 45,
      trainCards: ['red'],
      destinationTickets: [], claimedRoutes: [],
    };
    const route = ROUTES.find((r) => r.color === 'red' && r.length === 3)!;
    expect(canClaimRouteByIndex(player, 0, route, {}, 4)).toBe(false);
  });

  it('should reject when not enough trains', () => {
    const player: PlayerState = {
      id: 'p1', name: 'Test', score: 0, trainsRemaining: 1,
      trainCards: ['red', 'red', 'red'],
      destinationTickets: [], claimedRoutes: [],
    };
    const route = ROUTES.find((r) => r.color === 'red' && r.length === 3)!;
    expect(canClaimRouteByIndex(player, 0, route, {}, 4)).toBe(false);
  });
});

describe('constants validation', () => {
  it('should have 30 destination tickets', () => {
    expect(DESTINATION_TICKETS).toHaveLength(30);
  });

  it('should have unique destination ticket IDs', () => {
    const ids = DESTINATION_TICKETS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have valid route references', () => {
    for (const route of ROUTES) {
      expect(route.length).toBeGreaterThanOrEqual(1);
      expect(route.length).toBeLessThanOrEqual(6);
      expect(route.routeIndex).toBeGreaterThanOrEqual(0);
      expect(route.routeIndex).toBeLessThanOrEqual(1);
    }
  });
});
