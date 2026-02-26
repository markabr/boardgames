# RAILBOUND — Multiplayer Board Game Platform

## Project Spec for Claude Code

You are building a multiplayer online board game platform called **Railbound**. Three board games already exist as standalone single-player JSX/HTML files in the `/games` folder: **Acquire**, **Puerto Rico**, and **Ticket to Ride**. Your job is to turn these into a production-ready multiplayer web app where users can play against each other in real time.

---

## 1. Architecture Overview

```
railbound/
├── apps/
│   ├── web/                    # Next.js frontend (App Router)
│   │   ├── app/
│   │   │   ├── page.tsx                # Landing page
│   │   │   ├── (auth)/                 # Auth routes (login, callback)
│   │   │   ├── home/                   # Game selection dashboard
│   │   │   ├── lobby/[id]/             # Game lobby (waiting room)
│   │   │   ├── game/[id]/              # Active game session
│   │   │   ├── shop/                   # Cosmetics store
│   │   │   ├── premium/                # Premium subscription page
│   │   │   └── profile/                # User profile & stats
│   │   ├── components/
│   │   │   ├── platform/               # Shell UI (nav, chat, notifications)
│   │   │   ├── lobby/                  # Lobby components
│   │   │   └── games/                  # Game-specific rendering components
│   │   │       ├── acquire/
│   │   │       ├── puerto-rico/
│   │   │       └── ticket-to-ride/
│   │   └── lib/
│   │       ├── supabase.ts             # Supabase client
│   │       ├── game-sync.ts            # Real-time game state sync layer
│   │       └── stores/                 # Zustand stores
│   │
│   └── server/                 # Game state validation server
│       ├── src/
│       │   ├── index.ts                # Express + Socket.io entry
│       │   ├── engine/                 # Server-authoritative game logic
│       │   │   ├── base.ts             # Shared GameEngine interface
│       │   │   ├── acquire.ts
│       │   │   ├── puerto-rico.ts
│       │   │   └── ticket-to-ride.ts
│       │   ├── lobby.ts                # Lobby/matchmaking logic
│       │   └── middleware/             # Auth verification, rate limiting
│       └── package.json
│
├── packages/
│   └── game-logic/             # SHARED game rules (runs on client AND server)
│       ├── acquire/
│       │   ├── types.ts                # Game state types
│       │   ├── rules.ts                # Pure functions: validate moves, apply actions
│       │   └── constants.ts            # Board layout, card definitions, etc.
│       ├── puerto-rico/
│       │   ├── types.ts
│       │   ├── rules.ts
│       │   └── constants.ts
│       ├── ticket-to-ride/
│       │   ├── types.ts
│       │   ├── rules.ts
│       │   └── constants.ts
│       └── shared/
│           ├── types.ts                # Platform-level types (Player, Lobby, etc.)
│           └── scoring.ts
│
├── games/                      # EXISTING standalone game files (reference only)
│   ├── acquire.jsx
│   ├── puerto-rico.jsx
│   └── ticket-to-ride.jsx
│
├── supabase/
│   └── migrations/             # Database schema
│       ├── 001_users.sql
│       ├── 002_games.sql
│       ├── 003_cosmetics.sql
│       └── 004_subscriptions.sql
│
├── turbo.json                  # Turborepo config
└── package.json                # Root workspace
```

Use **Turborepo** for the monorepo. The critical architectural decision is the `packages/game-logic/` shared package — this is where all game rules live as pure functions. Both the client (for optimistic updates and local play) and the server (for authoritative validation) import from here.

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Monorepo | Turborepo | Simple, fast, works with Next.js |
| Frontend | Next.js 14 (App Router) + TypeScript | SSR for landing/SEO, client for game UI |
| Styling | Tailwind CSS | Fast iteration, no CSS files to manage |
| State management | Zustand | Lightweight, works well with real-time sync |
| Real-time (primary) | Supabase Realtime (Presence + Broadcast) | Lobby presence, game state broadcast |
| Real-time (game server) | Socket.io on Express | Server-authoritative game moves |
| Database | Supabase (PostgreSQL) | Auth + DB + Realtime in one service |
| Auth | Supabase Auth | Google, Discord, Apple OAuth + guest/anon |
| Payments | Stripe | Subscriptions + one-time cosmetic purchases |
| Hosting | Vercel (frontend) + Railway (game server) | Zero-ops, auto-scaling |

---

## 3. Database Schema

Design these tables in Supabase. Write proper migrations.

### `profiles`
- `id` (uuid, FK to auth.users)
- `username` (text, unique)
- `avatar_id` (text, default 'default')
- `theme_id` (text, default 'classic')
- `coins` (int, default 0)
- `is_premium` (bool, default false)
- `premium_until` (timestamptz, nullable)
- `elo_acquire` (int, default 1200)
- `elo_puerto_rico` (int, default 1200)
- `elo_ticket_to_ride` (int, default 1200)
- `games_played` (int, default 0)
- `games_won` (int, default 0)
- `created_at` (timestamptz)

### `games`
- `id` (uuid)
- `game_type` (enum: 'acquire', 'puerto_rico', 'ticket_to_ride')
- `status` (enum: 'waiting', 'in_progress', 'completed', 'abandoned')
- `host_id` (uuid, FK to profiles)
- `player_ids` (uuid[])
- `winner_id` (uuid, nullable)
- `state` (jsonb — serialized game state)
- `settings` (jsonb — custom rules, time limits, etc.)
- `started_at` (timestamptz)
- `completed_at` (timestamptz)
- `created_at` (timestamptz)

### `game_moves`
- `id` (bigserial)
- `game_id` (uuid, FK to games)
- `player_id` (uuid, FK to profiles)
- `move_number` (int)
- `action` (jsonb)
- `state_after` (jsonb, nullable — checkpoint every N moves)
- `created_at` (timestamptz)

### `cosmetics_owned`
- `id` (uuid)
- `user_id` (uuid, FK to profiles)
- `cosmetic_type` (enum: 'theme', 'avatar', 'card_back', 'board_skin')
- `cosmetic_id` (text)
- `purchased_at` (timestamptz)

### `transactions`
- `id` (uuid)
- `user_id` (uuid, FK to profiles)
- `type` (enum: 'coin_purchase', 'cosmetic_purchase', 'premium_subscription')
- `amount_cents` (int)
- `stripe_payment_id` (text, nullable)
- `metadata` (jsonb)
- `created_at` (timestamptz)

Create proper RLS policies:
- Users can read their own profile and all public profile data (username, avatar, elo).
- Users can only update their own profile.
- Game state is readable by players in that game.
- `cosmetics_owned` and `transactions` are private to the owning user.

---

## 4. Extracting Shared Game Logic

This is the most important step. For EACH of the three games in `/games/`:

### 4a. Create type definitions (`types.ts`)

Extract a complete TypeScript type for the game state. The state must be:
- Fully serializable (JSON-safe — no functions, no circular refs)
- Contain ALL information needed to render the game
- Separate "public" state (visible to all) from "private" state (e.g., a player's hand)

```typescript
// Example pattern for each game:
export interface GameState {
  players: PlayerState[];
  currentPlayerIndex: number;
  phase: GamePhase;
  board: BoardState;
  // ... game-specific fields
  turnNumber: number;
  gameOver: boolean;
  winner: string | null;
}

export interface PlayerState {
  id: string;
  // Public info (visible to all)
  public: {
    name: string;
    score: number;
    // game-specific public state
  };
  // Private info (only visible to this player)
  private: {
    hand: Card[];
    // game-specific private state
  };
}

// All possible player actions as a discriminated union
export type GameAction =
  | { type: 'draw_card'; source: 'deck' | 'face_up'; index?: number }
  | { type: 'claim_route'; routeIndex: number; cardsUsed: string[] }
  | { type: 'draw_tickets' }
  | { type: 'keep_tickets'; ticketIndices: number[] }
  // ... etc
```

### 4b. Create pure rule functions (`rules.ts`)

Every function must be **pure** — takes state + action, returns new state or validation result. No side effects. No randomness (pass RNG seed or pre-rolled values).

```typescript
export function validateAction(state: GameState, playerId: string, action: GameAction): 
  { valid: true } | { valid: false; reason: string };

export function applyAction(state: GameState, playerId: string, action: GameAction): GameState;

export function getValidActions(state: GameState, playerId: string): GameAction[];

export function isGameOver(state: GameState): boolean;

export function calculateScores(state: GameState): Record<string, number>;

export function createInitialState(players: { id: string; name: string }[], seed: number): GameState;
```

### 4c. Analyze each existing game file

Read through each game in `/games/` carefully. The existing code contains:
- Game constants (board layout, cards, routes, etc.) → extract to `constants.ts`
- Game logic (turn handling, validation, scoring) → extract to `rules.ts`
- UI rendering → adapt into React components in `apps/web/components/games/`
- State management → model as `types.ts` and manage via Zustand + sync

Do NOT discard any game mechanics from the originals. Port everything faithfully.

---

## 5. Real-Time Multiplayer Architecture

### How a game session works:

```
1. Player creates lobby → Supabase Realtime channel `lobby:{id}` for presence
2. Players join lobby → see each other via Presence
3. Host starts game → POST to game server → server creates GameState
4. Game server opens Socket.io room `game:{id}`
5. Each turn:
   a. Client sends action: { type: 'claim_route', routeIndex: 3, ... }
   b. Server validates via shared game-logic package
   c. If valid: server applies action, broadcasts new state to all clients
   d. If invalid: server responds with error, only to that client
6. Clients render from server-broadcast state (source of truth)
7. Optimistic updates on client for responsiveness (rollback if server rejects)
```

### The sync layer (`lib/game-sync.ts`):

```typescript
// This is the bridge between the game UI and the network layer.
// Games don't know about sockets. They dispatch actions and receive state.

interface GameSync {
  connect(gameId: string, playerId: string): Promise<void>;
  disconnect(): void;
  sendAction(action: GameAction): void;
  onStateUpdate(callback: (state: GameState) => void): void;
  onError(callback: (error: string) => void): void;
  getMyState(fullState: GameState, playerId: string): PlayerView;
}
```

### Information hiding:

The server must NEVER send a player another player's private state. Implement a `getPlayerView` function that strips private data:

```typescript
export function getPlayerView(state: GameState, playerId: string): PlayerView {
  return {
    ...state,
    players: state.players.map(p => ({
      id: p.id,
      public: p.public,
      private: p.id === playerId ? p.private : { cardCount: p.private.hand.length },
    })),
  };
}
```

---

## 6. Game Component Interface

Every game component follows the same interface. This is how you plug new games into the platform:

```typescript
interface GameComponentProps {
  gameState: PlayerView;           // State filtered for this player
  myPlayerId: string;
  isMyTurn: boolean;
  onAction: (action: GameAction) => void;  // Dispatch to sync layer
  theme: ThemeColors;
  cosmetics: PlayerCosmetics;
}

// In the game registry:
const GAME_REGISTRY = {
  'ticket-to-ride': {
    component: TicketToRideGame,    // React component
    rules: ticketToRideRules,       // From shared package
    meta: { name: 'Ticket to Ride', minPlayers: 2, maxPlayers: 4, ... }
  },
  // ...
};
```

The platform shell (`app/game/[id]/page.tsx`) handles:
- Connecting to the game server
- Receiving state updates
- Passing state + action dispatcher to the game component
- Rendering the chrome (player list, chat, timer, settings)

The game component handles:
- Rendering the board/cards/pieces
- Showing valid moves
- Calling `onAction()` when the player acts

This separation means adding a new game requires:
1. `packages/game-logic/new-game/` (types, rules, constants)
2. `apps/web/components/games/new-game/` (React rendering)
3. `apps/server/src/engine/new-game.ts` (wire up rules to server)
4. One entry in the game registry

---

## 7. Feature: Lobby System

### Creating a game:
- User picks a game from the home screen
- Creates a lobby (generates a short room code like `ABCD`)
- Options: public (appears in lobby browser) or private (invite only)
- Host can configure: player count, time per turn, any game-specific variants
- Host can add bot players (easy/medium/hard)

### Joining a game:
- Enter room code, or browse public lobbies
- Quick play: auto-matchmake into a public lobby that needs players

### Lobby UI:
- Show all players with their avatars and colors
- Chat built into the lobby
- Ready-up system: all players must ready before host can start
- If a player disconnects from lobby, remove them after 30 seconds

### Implementation:
- Use Supabase Realtime **Presence** for lobby state (who's in the room)
- Use Supabase Realtime **Broadcast** for lobby chat
- Store lobby metadata in the `games` table with status='waiting'

---

## 8. Feature: Cosmetics & Monetization

### Coin economy:
- Earn 10 coins per game completed, 25 for a win
- Coins can be purchased via Stripe ($0.99 = 100 coins, $4.99 = 600, $9.99 = 1500)
- Coins buy cosmetics in the shop

### Cosmetic types:
- **Board themes**: Color palettes affecting the entire UI (6-8 themes)
- **Avatars**: Emoji-based or illustrated profile pictures (10-15 options)
- **Card backs / piece skins**: Per-game visual customizations
- Prices range from free to 800 coins
- Some items are premium-exclusive (marked with a ⭐)

### Premium subscription:
- $5.99/month or $49.99/year
- Benefits: no ads (future), exclusive cosmetics, detailed stats, custom game rules, 500 coins/month
- Implement via Stripe Subscriptions with webhooks
- Store `is_premium` and `premium_until` on the profile
- Webhook handler at `apps/web/app/api/webhooks/stripe/route.ts`

### Stripe integration:
- Use Stripe Checkout for one-time coin purchases
- Use Stripe Customer Portal for subscription management
- All prices in USD
- Webhook events to handle: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`

---

## 9. Feature: Bot Players

Implement bot AI for each game so players can practice or fill empty slots.

### Bot design:
- Bots run **on the server**, not the client
- They use the same `getValidActions()` and `applyAction()` from the shared game logic
- Three difficulty levels:
  - **Easy**: Random valid move
  - **Medium**: Simple heuristic (e.g., prioritize high-scoring moves)
  - **Hard**: Minimax or evaluation-function-based strategy
- Bots have a random delay (800ms-2000ms) before acting to feel natural
- Bots have names and avatars drawn from a pool

Start with **Easy and Medium only**. Hard can be added later.

---

## 10. Feature: Reconnection & Disconnection

This is critical for a good multiplayer experience.

- If a player's WebSocket disconnects, the server keeps their game alive for **5 minutes**
- Other players see "[Player] reconnecting..." 
- If the player reconnects within 5 min, they get the full current state and resume
- If they don't reconnect within 5 min, their turns are skipped (they effectively "pass")
- If they don't reconnect before the game ends, they get a loss
- Game state is persisted to the database every N moves, so the server can recover from crashes too

---

## 11. UI/UX Design Requirements

### Design language:
- Dark theme by default (the theme system allows customization)
- Font: **DM Sans** for body, **Dela Gothic One** or similar bold display font for headings
- Accent-color-driven — the accent color from the user's selected theme permeates the UI
- Subtle animations: fade-ins, slide-ins, hover effects. Not flashy, not flat.
- Mobile-responsive: lobby and game must work on phones (min 375px width)

### Game UI pattern:
- Board/map takes up the main area
- Right sidebar (or bottom on mobile): player list, game log, face-up cards / available actions
- Bottom bar: player's own hand/resources
- Floating overlays for modals (ticket selection, trade dialogs, etc.)
- Current player's turn is clearly indicated
- Valid moves are highlighted (glow, color change, or animation)

### Platform chrome:
- Sticky top nav: logo, coins, premium badge, avatar + name
- In-game: minimal nav, just logo (clickable to exit) and essential info
- Toast notifications for game events
- Lobby chat and in-game chat share the same component

---

## 12. Build Order

Execute in this order. Complete each phase before moving to the next.

### Phase 1: Foundation
1. Initialize Turborepo monorepo with the folder structure above
2. Set up Next.js app with Tailwind
3. Set up the Express + Socket.io server
4. Set up Supabase project (can use local Supabase CLI for dev)
5. Write database migrations and RLS policies
6. Implement Supabase Auth (Google + Discord + anonymous/guest)
7. Build the platform shell: landing page, nav bar, auth flow, home screen

### Phase 2: Game Logic Extraction
8. For EACH game in `/games/`:
   - Read the existing code thoroughly
   - Extract `types.ts`, `constants.ts`, `rules.ts` into `packages/game-logic/{game}/`
   - Write unit tests for every rule function (at minimum: `validateAction`, `applyAction`, `createInitialState`, `isGameOver`)
   - Verify the extracted logic matches the original game's behavior

### Phase 3: Multiplayer Infrastructure
9. Implement the game server engine (`apps/server/src/engine/`)
   - Base engine class that wraps any game's rules
   - Socket.io room management
   - Move validation + state broadcast
   - Player view filtering (information hiding)
10. Implement the client sync layer (`lib/game-sync.ts`)
11. Implement lobby system (Supabase Realtime Presence + Broadcast)
12. Implement reconnection handling

### Phase 4: Game UIs
13. Build game rendering components for each game
    - Port the visual/interactive parts from the existing files
    - Connect to the `GameComponentProps` interface
    - Ensure they work with the sync layer
14. Implement bot AI (Easy + Medium for each game)

### Phase 5: Monetization
15. Implement cosmetics system (themes, avatars, skins)
16. Build the shop UI
17. Integrate Stripe for coin purchases
18. Integrate Stripe Subscriptions for premium
19. Build premium page and subscription management

### Phase 6: Polish
20. Responsive design pass (test at 375px, 768px, 1024px, 1440px)
21. Add game log / history view
22. Add player stats and ELO to profile page
23. Loading states, error states, empty states everywhere
24. Accessibility pass (keyboard navigation, ARIA labels on game elements)
25. Performance pass (memoize game renders, lazy load game components)

---

## 13. Key Principles

- **Server is the source of truth.** Never trust the client. All game logic validation happens server-side using the shared `game-logic` package.
- **Games are modular.** Adding a 4th game should require zero changes to the platform shell, lobby, or server infrastructure — only new files in `game-logic`, `components/games`, and `engine`.
- **State is serializable.** Every game state must be JSON.stringify-able at any point. This enables database persistence, replay, and debugging.
- **Optimistic updates.** The client can apply actions locally for instant feedback, but always reconciles with the server's authoritative state.
- **Fail gracefully.** Network issues, server crashes, and browser refreshes should not destroy a game. Reconnection and state persistence handle this.

---

## 14. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Game Server
GAME_SERVER_URL=
GAME_SERVER_PORT=3001

# General
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 15. Testing Requirements

- **Game logic**: Unit tests for all three games' `rules.ts`. Test every action type, every edge case, every win condition. Use Vitest.
- **Server**: Integration tests for the game engine — simulate a full game by sending actions and verifying state transitions.
- **Client**: At minimum, verify that each game component renders without errors given a valid initial state.
- **E2E**: One happy-path test per game — create lobby, start game, play a few turns, verify state updates. Use Playwright.

---

## Notes

- The existing game files in `/games/` are your reference implementations. They contain correct game logic but are written as monolithic single-file apps. Your job is to decompose them into the architecture above.
- Start simple. Get one game (Ticket to Ride) fully working end-to-end through all phases before parallelizing the other two. This validates the architecture.
- When in doubt about a game rule, the existing code in `/games/` is authoritative.
- Do not over-engineer. No microservices. No event sourcing. No CQRS. A monorepo with a Next.js frontend and one Express game server is all you need until you have 10,000+ concurrent users.