import type { Bot, BotDifficulty } from './base.js';
import {
  getValidActions,
  routeByKey,
  areCitiesConnected,
  countCards,
} from '@railbound/game-logic/ticket-to-ride';
import type {
  GameState,
  GameAction,
  Route,
  CityName,
  CardColor,
} from '@railbound/game-logic/ticket-to-ride';
import { ROUTES, CITIES, routeKey } from '@railbound/game-logic/ticket-to-ride';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============ EASY BOT ============

export class EasyBot implements Bot {
  readonly difficulty: BotDifficulty = 'easy';

  chooseAction(state: GameState, playerId: string): GameAction {
    const actions = getValidActions(state, playerId);
    if (actions.length === 0) {
      throw new Error('No valid actions for bot');
    }

    // Bias toward drawing cards (60%), with some route claiming (30%) and destinations (10%)
    const drawActions = actions.filter((a) => a.type === 'draw_card');
    const claimActions = actions.filter((a) => a.type === 'claim_route');
    const destActions = actions.filter((a) => a.type === 'draw_destinations');
    const keepActions = actions.filter((a) => a.type === 'keep_destinations');

    // Must keep destinations if that's the only option
    if (keepActions.length > 0 && claimActions.length === 0 && drawActions.length === 0) {
      // Keep all offered tickets (simplest easy bot strategy)
      const maxKeep = keepActions.reduce(
        (best, a) => (a.type === 'keep_destinations' && a.ticketIds.length > best.ticketIds.length ? a : best),
        keepActions[0] as Extract<GameAction, { type: 'keep_destinations' }>
      );
      return maxKeep;
    }

    const roll = Math.random();
    if (roll < 0.6 && drawActions.length > 0) {
      return pick(drawActions);
    }
    if (roll < 0.9 && claimActions.length > 0) {
      return pick(claimActions);
    }
    if (destActions.length > 0) {
      return pick(destActions);
    }
    return pick(actions);
  }
}

// ============ MEDIUM BOT ============

/**
 * Medium bot strategy:
 * - Prioritize claiming routes that connect destination ticket cities
 * - Draw cards that match needed route colors
 * - Use BFS shortest path heuristic to plan toward destination completion
 */
export class MediumBot implements Bot {
  readonly difficulty: BotDifficulty = 'medium';

  chooseAction(state: GameState, playerId: string): GameAction {
    const actions = getValidActions(state, playerId);
    if (actions.length === 0) {
      throw new Error('No valid actions for bot');
    }

    const keepActions = actions.filter((a) => a.type === 'keep_destinations');
    const claimActions = actions.filter((a) => a.type === 'claim_route');
    const drawActions = actions.filter((a) => a.type === 'draw_card');

    // If we must keep destinations, pick the best subset
    if (keepActions.length > 0 && claimActions.length === 0 && drawActions.length === 0) {
      return this.chooseBestKeep(state, playerId, keepActions as Extract<GameAction, { type: 'keep_destinations' }>[]);
    }

    const player = state.players.find((p) => p.id === playerId)!;
    const playerIdx = state.players.indexOf(player);

    // If we can claim a route toward a destination, prioritize it
    if (claimActions.length > 0) {
      const bestClaim = this.scoreClaims(player, claimActions as Extract<GameAction, { type: 'claim_route' }>[], state);
      if (bestClaim) return bestClaim;
    }

    // If drawing cards, pick ones that help toward needed routes
    if (drawActions.length > 0) {
      return this.chooseBestDraw(state, player, drawActions as Extract<GameAction, { type: 'draw_card' }>[]);
    }

    return pick(actions);
  }

  private chooseBestKeep(
    state: GameState,
    playerId: string,
    keepActions: Extract<GameAction, { type: 'keep_destinations' }>[]
  ): GameAction {
    const player = state.players.find((p) => p.id === playerId)!;

    // Score each keep option by how achievable the tickets are
    let bestAction = keepActions[0];
    let bestScore = -Infinity;

    for (const action of keepActions) {
      let score = 0;
      for (const ticketId of action.ticketIds) {
        const ticket = state.pendingDestinations.find((t) => t.id === ticketId);
        if (!ticket) continue;
        // Short distance = easier to complete = higher score
        const dist = this.bfsDistance(ticket.city1, ticket.city2, player.claimedRoutes);
        if (dist === 0) {
          score += ticket.points * 2; // Already connected
        } else if (dist <= 3) {
          score += ticket.points; // Close
        } else if (dist <= 5) {
          score += ticket.points * 0.5;
        } else {
          score -= ticket.points * 0.3; // Far away, slight penalty
        }
      }
      // Slight bonus for keeping fewer tickets (less risk)
      score -= action.ticketIds.length * 0.5;
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }
    return bestAction;
  }

  private scoreClaims(
    player: GameState['players'][0],
    claimActions: Extract<GameAction, { type: 'claim_route' }>[],
    state: GameState
  ): GameAction | null {
    const incomplete = player.destinationTickets.filter(
      (t) => !areCitiesConnected(t.city1, t.city2, player.claimedRoutes)
    );

    // Score each claim action
    let bestAction: GameAction | null = null;
    let bestScore = -1;

    for (const action of claimActions) {
      const route = routeByKey(action.routeKey);
      if (!route) continue;

      let score = 0;

      // Bonus if this route helps connect a destination ticket
      for (const ticket of incomplete) {
        const helpsFwd = this.routeHelpsConnect(
          route,
          ticket.city1,
          ticket.city2,
          player.claimedRoutes
        );
        if (helpsFwd) {
          score += ticket.points * 2;
        }
      }

      // Bonus for route points
      score += route.length;

      // Slight bonus for using fewer wilds
      const colorCount = countCards(player.trainCards, action.colorUsed);
      const locosNeeded = Math.max(0, route.length - colorCount);
      score -= locosNeeded * 0.5;

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    // Only claim if score is positive (helps a destination or is long)
    if (bestScore > 2) return bestAction;

    // 30% chance to claim anyway for variety
    if (Math.random() < 0.3 && claimActions.length > 0) {
      return pick(claimActions);
    }

    return null;
  }

  private chooseBestDraw(
    state: GameState,
    player: GameState['players'][0],
    drawActions: Extract<GameAction, { type: 'draw_card' }>[]
  ): GameAction {
    // Determine which colors we need for incomplete destinations
    const neededColors = this.getNeededColors(state, player);

    // Check face-up cards for desired colors
    const faceUpDraws = drawActions.filter((a) => a.source === 'faceUp');
    for (const action of faceUpDraws) {
      const card = state.faceUpCards[action.faceUpIndex!];
      if (card === 'locomotive') {
        // Locomotives are always good (if allowed as first draw)
        return action;
      }
      if (neededColors.has(card)) {
        return action;
      }
    }

    // Default: draw from deck
    const deckDraw = drawActions.find((a) => a.source === 'deck');
    if (deckDraw) return deckDraw;

    return pick(drawActions);
  }

  private getNeededColors(state: GameState, player: GameState['players'][0]): Set<CardColor> {
    const needed = new Set<CardColor>();
    const incomplete = player.destinationTickets.filter(
      (t) => !areCitiesConnected(t.city1, t.city2, player.claimedRoutes)
    );

    for (const ticket of incomplete) {
      // Find unclaimed routes on a shortest path between ticket cities
      for (const route of ROUTES) {
        if (state.claimedRoutes[routeKey(route)] !== undefined) continue;
        if (
          (route.city1 === ticket.city1 || route.city1 === ticket.city2 ||
            route.city2 === ticket.city1 || route.city2 === ticket.city2)
        ) {
          if (route.color !== 'gray') {
            needed.add(route.color);
          }
        }
      }
    }

    return needed;
  }

  /** Check if claiming a route helps connect two cities */
  private routeHelpsConnect(
    route: Route,
    city1: CityName,
    city2: CityName,
    existingRoutes: string[]
  ): boolean {
    // Simulate claiming this route and check if it reduces distance
    const before = this.bfsDistance(city1, city2, existingRoutes);
    if (before === 0) return false; // Already connected

    const after = this.bfsDistance(city1, city2, [
      ...existingRoutes,
      routeKey(route),
    ]);
    return after < before;
  }

  /** BFS distance between two cities using claimed routes. Returns Infinity if not reachable. */
  private bfsDistance(
    from: CityName,
    to: CityName,
    claimedRouteKeys: string[]
  ): number {
    if (from === to) return 0;

    // Build adjacency from claimed routes
    const adj = new Map<CityName, CityName[]>();
    for (const key of claimedRouteKeys) {
      const route = routeByKey(key);
      if (!route) continue;
      if (!adj.has(route.city1)) adj.set(route.city1, []);
      if (!adj.has(route.city2)) adj.set(route.city2, []);
      adj.get(route.city1)!.push(route.city2);
      adj.get(route.city2)!.push(route.city1);
    }

    const visited = new Set<CityName>();
    const queue: [CityName, number][] = [[from, 0]];
    visited.add(from);

    while (queue.length > 0) {
      const [current, dist] = queue.shift()!;
      const neighbors = adj.get(current) || [];
      for (const next of neighbors) {
        if (next === to) return dist + 1;
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([next, dist + 1]);
        }
      }
    }

    return Infinity;
  }
}

export function createBot(difficulty: BotDifficulty): Bot {
  switch (difficulty) {
    case 'easy':
      return new EasyBot();
    case 'medium':
      return new MediumBot();
  }
}
