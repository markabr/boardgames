# Puerto Rico

A web-based implementation of the classic board game **Puerto Rico**, playable in a browser with 3, 4, or 5 players in hot-seat (pass-and-play) mode.

## How to Play

Open `index.html` in any modern browser. No server or build step required.

1. Select the number of players (3, 4, or 5)
2. Enter player names
3. Click **Start Game**
4. Pass the device between players when prompted by the turn interstitial screen

## Features

- Full base game rules with all 23 buildings, 7 roles, and complete scoring
- Scales correctly for 3, 4, or 5 players (VP pool, ships, colonists, roles, starting resources)
- 4-column builder market matching the physical game board layout
- 4x3 city grid matching the physical player mat
- Hot-seat privacy with turn interstitial screens
- Single-step undo support
- Collapsible player boards to reduce clutter
- Persistent last-action bar for game state awareness

## Tech Stack

- **React 18** (via CDN)
- **Babel Standalone** for JSX transpilation (no build step)
- **CSS3** with custom properties for theming
- **Google Fonts** (Cinzel + Inter)

## File Structure

```
puertorico/
├── index.html    # HTML shell with CDN imports
├── styles.css    # All CSS (theming, layout, components)
├── game.jsx      # React components and game logic
└── README.md
```

## Player Count Scaling

| Setting | 3 Players | 4 Players | 5 Players |
|---|---|---|---|
| Victory Points | 75 | 100 | 122 |
| Colonist Pool | 55 | 75 | 95 |
| Ship Sizes | 4/5/6 | 5/6/7 | 6/7/8 |
| Starting Doubloons | 2 | 3 | 4 |
| Face-up Plantations | 4 | 5 | 6 |
| Roles | 6 | 7 | 8 |
| Prospectors | 0 | 1 | 2 |
