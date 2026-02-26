import { useState, useCallback, useEffect, useRef } from "react";

// ============================================================
// TICKET TO RIDE - USA Edition (v2 - Improved Map & Visuals)
// ============================================================

const PLAYER_COLORS = ["#DC2626", "#2563EB", "#16A34A", "#CA8A04"];
const PLAYER_COLOR_NAMES = ["Red", "Blue", "Green", "Yellow"];
const PLAYER_BG = ["#FEE2E2", "#DBEAFE", "#DCFCE7", "#FEF9C3"];
const STARTING_TRAINS = 45;

const CARD_COLORS = {
  red: "#DC2626",
  orange: "#EA580C",
  yellow: "#FACC15",
  green: "#16A34A",
  blue: "#2563EB",
  purple: "#7C3AED",
  black: "#1E293B",
  white: "#F1F5F9",
  locomotive: "#F59E0B",
};
const CARD_BORDER = {
  red: "#991B1B",
  orange: "#9A3412",
  yellow: "#A16207",
  green: "#166534",
  blue: "#1E40AF",
  purple: "#5B21B6",
  black: "#0F172A",
  white: "#94A3B8",
  locomotive: "#B45309",
};
const CARD_TEXT_COLOR = {
  red: "#fff", orange: "#fff", yellow: "#422006", green: "#fff",
  blue: "#fff", purple: "#fff", black: "#fff", white: "#334155", locomotive: "#fff",
};
const CARD_COLOR_DISPLAY = {
  red: "Red", orange: "Orange", yellow: "Yellow", green: "Green",
  blue: "Blue", purple: "Purple", black: "Black", white: "White", locomotive: "Wild",
};
const ROUTE_POINTS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15 };

// --- CITY DATA - Spread out, especially Denver/SLC/SantaFe corridor ---
const CITIES = {
  Vancouver:     { x: 130, y: 48 },
  Seattle:       { x: 118, y: 100 },
  Portland:      { x: 82,  y: 160 },
  SanFrancisco:  { x: 52,  y: 320 },
  LosAngeles:    { x: 105, y: 425 },
  LasVegas:      { x: 170, y: 380 },
  Phoenix:       { x: 230, y: 465 },
  SaltLakeCity:  { x: 230, y: 230 },
  Helena:        { x: 290, y: 105 },
  Calgary:       { x: 225, y: 35 },
  Winnipeg:      { x: 460, y: 48 },
  Duluth:        { x: 560, y: 115 },
  SaultSteMarie: { x: 680, y: 82 },
  Montreal:      { x: 850, y: 62 },
  Boston:        { x: 920, y: 108 },
  NewYork:       { x: 895, y: 180 },
  Pittsburgh:    { x: 800, y: 200 },
  Washington:    { x: 875, y: 245 },
  Raleigh:       { x: 830, y: 325 },
  Charleston:    { x: 830, y: 390 },
  Miami:         { x: 860, y: 520 },
  Atlanta:       { x: 745, y: 375 },
  Nashville:     { x: 690, y: 310 },
  SaintLouis:    { x: 610, y: 270 },
  Chicago:       { x: 630, y: 175 },
  Omaha:         { x: 500, y: 200 },
  KansasCity:    { x: 530, y: 285 },
  OklahomaCity:  { x: 500, y: 370 },
  Dallas:        { x: 500, y: 440 },
  Houston:       { x: 530, y: 500 },
  NewOrleans:    { x: 630, y: 475 },
  LittleRock:    { x: 590, y: 370 },
  ElPaso:        { x: 310, y: 480 },
  SantaFe:       { x: 330, y: 375 },
  Denver:        { x: 360, y: 270 },
  Toronto:       { x: 760, y: 120 },
};

const CITY_LABELS = {
  Vancouver: "Vancouver", Seattle: "Seattle", Portland: "Portland",
  SanFrancisco: "San Francisco", LosAngeles: "Los Angeles", LasVegas: "Las Vegas",
  Phoenix: "Phoenix", SaltLakeCity: "Salt Lake City", Helena: "Helena",
  Calgary: "Calgary", Winnipeg: "Winnipeg", Duluth: "Duluth",
  SaultSteMarie: "Sault Ste. Marie", Montreal: "Montreal", Boston: "Boston",
  NewYork: "New York", Pittsburgh: "Pittsburgh", Washington: "Washington",
  Raleigh: "Raleigh", Charleston: "Charleston", Miami: "Miami",
  Atlanta: "Atlanta", Nashville: "Nashville", SaintLouis: "St. Louis",
  Chicago: "Chicago", Omaha: "Omaha", KansasCity: "Kansas City",
  OklahomaCity: "Oklahoma City", Dallas: "Dallas", Houston: "Houston",
  NewOrleans: "New Orleans", LittleRock: "Little Rock", ElPaso: "El Paso",
  SantaFe: "Santa Fe", Denver: "Denver", Toronto: "Toronto",
};

// label anchor overrides so labels don't overlap routes
const LABEL_OFFSETS = {
  Vancouver: { dx: 0, dy: -14 },
  Seattle: { dx: -40, dy: 0 },
  Portland: { dx: -40, dy: 0 },
  SanFrancisco: { dx: -5, dy: -14 },
  LosAngeles: { dx: 0, dy: 18 },
  LasVegas: { dx: 0, dy: -14 },
  Phoenix: { dx: 0, dy: 18 },
  SaltLakeCity: { dx: -5, dy: -14 },
  Helena: { dx: 0, dy: -14 },
  Calgary: { dx: 0, dy: -14 },
  Winnipeg: { dx: 0, dy: -14 },
  Duluth: { dx: 0, dy: -14 },
  SaultSteMarie: { dx: 0, dy: -14 },
  Montreal: { dx: 0, dy: -14 },
  Boston: { dx: 20, dy: -8 },
  NewYork: { dx: 30, dy: 5 },
  Pittsburgh: { dx: -5, dy: -14 },
  Washington: { dx: 30, dy: 5 },
  Raleigh: { dx: 30, dy: 5 },
  Charleston: { dx: 35, dy: 5 },
  Miami: { dx: 25, dy: 5 },
  Atlanta: { dx: -35, dy: 5 },
  Nashville: { dx: 0, dy: -14 },
  SaintLouis: { dx: 0, dy: -14 },
  Chicago: { dx: 0, dy: -14 },
  Omaha: { dx: 0, dy: -14 },
  KansasCity: { dx: -5, dy: -14 },
  OklahomaCity: { dx: -50, dy: 5 },
  Dallas: { dx: -30, dy: 10 },
  Houston: { dx: 0, dy: 18 },
  NewOrleans: { dx: 0, dy: 18 },
  LittleRock: { dx: 30, dy: 5 },
  ElPaso: { dx: 0, dy: 18 },
  SantaFe: { dx: -35, dy: 5 },
  Denver: { dx: -35, dy: 0 },
  Toronto: { dx: 0, dy: -14 },
};

// --- ROUTES: [city1, city2, color, length, routeIndex] ---
const ROUTES = [
  ["Vancouver","Seattle","gray",1,0],["Vancouver","Seattle","gray",1,1],
  ["Seattle","Portland","gray",1,0],["Seattle","Portland","gray",1,1],
  ["Portland","SanFrancisco","green",5,0],["Portland","SanFrancisco","purple",5,1],
  ["SanFrancisco","LosAngeles","yellow",3,0],["SanFrancisco","LosAngeles","purple",3,1],
  ["LosAngeles","LasVegas","gray",2,0],["LosAngeles","Phoenix","gray",3,0],
  ["LosAngeles","ElPaso","black",6,0],["LasVegas","SaltLakeCity","orange",3,0],
  ["Phoenix","ElPaso","gray",3,0],["Phoenix","SantaFe","gray",3,0],
  ["Phoenix","Denver","white",5,0],["ElPaso","SantaFe","gray",2,0],
  ["ElPaso","Dallas","red",4,0],["ElPaso","Houston","green",6,0],
  ["ElPaso","OklahomaCity","yellow",5,0],["SantaFe","Denver","gray",2,0],
  ["SantaFe","OklahomaCity","blue",3,0],["Denver","SaltLakeCity","red",3,0],
  ["Denver","SaltLakeCity","yellow",3,1],["Denver","Helena","green",4,0],
  ["Denver","Omaha","purple",4,0],["Denver","KansasCity","black",4,0],
  ["Denver","KansasCity","orange",4,1],["Denver","OklahomaCity","red",4,0],
  ["SaltLakeCity","Helena","purple",3,0],["SaltLakeCity","Portland","blue",6,0],
  ["SaltLakeCity","SanFrancisco","orange",5,0],["SaltLakeCity","SanFrancisco","white",5,1],
  ["Helena","Calgary","gray",4,0],["Helena","Winnipeg","blue",4,0],
  ["Helena","Duluth","orange",6,0],["Helena","Omaha","red",5,0],
  ["Helena","Seattle","yellow",6,0],["Calgary","Vancouver","gray",3,0],
  ["Calgary","Winnipeg","white",6,0],["Winnipeg","Duluth","black",4,0],
  ["Winnipeg","SaultSteMarie","gray",6,0],["Duluth","SaultSteMarie","gray",3,0],
  ["Duluth","Toronto","purple",6,0],["Duluth","Chicago","red",3,0],
  ["Duluth","Omaha","gray",2,0],["Duluth","Omaha","gray",2,1],
  ["SaultSteMarie","Montreal","black",5,0],["SaultSteMarie","Toronto","gray",2,0],
  ["Montreal","Boston","gray",2,0],["Montreal","Boston","gray",2,1],
  ["Montreal","NewYork","blue",3,0],["Montreal","Toronto","gray",3,0],
  ["Boston","NewYork","yellow",2,0],["Boston","NewYork","red",2,1],
  ["NewYork","Pittsburgh","white",2,0],["NewYork","Pittsburgh","green",2,1],
  ["NewYork","Washington","orange",2,0],["NewYork","Washington","black",2,1],
  ["Pittsburgh","Toronto","gray",2,0],["Pittsburgh","Chicago","orange",3,0],
  ["Pittsburgh","Chicago","black",3,1],["Pittsburgh","SaintLouis","green",5,0],
  ["Pittsburgh","Nashville","yellow",4,0],["Pittsburgh","Raleigh","gray",2,0],
  ["Pittsburgh","Washington","gray",2,0],["Washington","Raleigh","gray",2,0],
  ["Washington","Raleigh","gray",2,1],["Raleigh","Charleston","gray",2,0],
  ["Raleigh","Atlanta","gray",2,0],["Raleigh","Atlanta","gray",2,1],
  ["Raleigh","Nashville","black",3,0],["Charleston","Atlanta","gray",2,0],
  ["Charleston","Miami","purple",4,0],["Miami","Atlanta","blue",5,0],
  ["Miami","NewOrleans","red",6,0],["Atlanta","Nashville","gray",1,0],
  ["Atlanta","NewOrleans","yellow",4,0],["Atlanta","NewOrleans","orange",4,1],
  ["Nashville","SaintLouis","gray",2,0],["Nashville","LittleRock","white",3,0],
  ["SaintLouis","Chicago","green",2,0],["SaintLouis","Chicago","white",2,1],
  ["SaintLouis","KansasCity","blue",2,0],["SaintLouis","KansasCity","purple",2,1],
  ["SaintLouis","LittleRock","gray",2,0],["Chicago","Omaha","blue",4,0],
  ["Chicago","Toronto","white",4,0],["Omaha","KansasCity","gray",1,0],
  ["Omaha","KansasCity","gray",1,1],["KansasCity","OklahomaCity","gray",2,0],
  ["KansasCity","OklahomaCity","gray",2,1],["OklahomaCity","Dallas","gray",2,0],
  ["OklahomaCity","Dallas","gray",2,1],["OklahomaCity","LittleRock","gray",2,0],
  ["Dallas","Houston","gray",1,0],["Dallas","Houston","gray",1,1],
  ["Dallas","LittleRock","gray",2,0],["Houston","NewOrleans","gray",2,0],
  ["LittleRock","NewOrleans","green",3,0],
];

// --- 30 DESTINATION TICKETS ---
const DESTINATION_TICKETS = [
  {city1:"LosAngeles",city2:"NewYork",points:21},{city1:"Duluth",city2:"Houston",points:8},
  {city1:"SaultSteMarie",city2:"Nashville",points:8},{city1:"NewYork",city2:"Atlanta",points:6},
  {city1:"Portland",city2:"Nashville",points:17},{city1:"Vancouver",city2:"Montreal",points:20},
  {city1:"Duluth",city2:"ElPaso",points:10},{city1:"Toronto",city2:"Miami",points:10},
  {city1:"Portland",city2:"Phoenix",points:11},{city1:"Dallas",city2:"NewYork",points:11},
  {city1:"Calgary",city2:"SaltLakeCity",points:7},{city1:"Calgary",city2:"Phoenix",points:13},
  {city1:"LosAngeles",city2:"Miami",points:20},{city1:"Winnipeg",city2:"LittleRock",points:11},
  {city1:"SanFrancisco",city2:"Atlanta",points:17},{city1:"KansasCity",city2:"Houston",points:5},
  {city1:"LosAngeles",city2:"Chicago",points:16},{city1:"Denver",city2:"Pittsburgh",points:11},
  {city1:"Chicago",city2:"SantaFe",points:9},{city1:"Vancouver",city2:"SantaFe",points:13},
  {city1:"Boston",city2:"Miami",points:12},{city1:"Chicago",city2:"NewOrleans",points:7},
  {city1:"Montreal",city2:"Atlanta",points:9},{city1:"Seattle",city2:"NewYork",points:22},
  {city1:"Denver",city2:"ElPaso",points:4},{city1:"Helena",city2:"LosAngeles",points:8},
  {city1:"Winnipeg",city2:"Houston",points:12},{city1:"Montreal",city2:"NewOrleans",points:13},
  {city1:"SaultSteMarie",city2:"OklahomaCity",points:9},{city1:"Seattle",city2:"LosAngeles",points:9},
];

// ============ HELPERS ============

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createTrainCardDeck() {
  const deck = [];
  ["red","orange","yellow","green","blue","purple","black","white"].forEach(c => {
    for (let i = 0; i < 12; i++) deck.push(c);
  });
  for (let i = 0; i < 14; i++) deck.push("locomotive");
  return shuffle(deck);
}

// Use indices to track identity and guarantee uniqueness
function createDestinationDeck() {
  return shuffle(DESTINATION_TICKETS.map((t, i) => ({ ...t, id: i })));
}

function routeKey(r) { return `${r[0]}-${r[1]}-${r[2]}-${r[4]}`; }

function countCards(hand, color) { return hand.filter(c => c === color).length; }

function areCitiesConnected(c1, c2, claimedKeys) {
  if (c1 === c2) return true;
  const adj = {};
  claimedKeys.forEach(key => {
    const r = ROUTES.find(r => routeKey(r) === key);
    if (!r) return;
    (adj[r[0]] = adj[r[0]] || []).push(r[1]);
    (adj[r[1]] = adj[r[1]] || []).push(r[0]);
  });
  const visited = new Set([c1]);
  const q = [c1];
  while (q.length) {
    const cur = q.shift();
    if (cur === c2) return true;
    for (const n of (adj[cur] || [])) {
      if (!visited.has(n)) { visited.add(n); q.push(n); }
    }
  }
  return false;
}

function longestPath(claimedKeys) {
  const adj = {};
  claimedKeys.forEach(key => {
    const r = ROUTES.find(r => routeKey(r) === key);
    if (!r) return;
    const e = { from: r[0], to: r[1], len: r[3], key };
    (adj[r[0]] = adj[r[0]] || []).push(e);
    (adj[r[1]] = adj[r[1]] || []).push({ ...e, from: r[1], to: r[0] });
  });
  let max = 0;
  function dfs(city, used, cur) {
    if (cur > max) max = cur;
    for (const e of (adj[city] || [])) {
      if (!used.has(e.key)) {
        used.add(e.key);
        dfs(e.to, used, cur + e.len);
        used.delete(e.key);
      }
    }
  }
  Object.keys(adj).forEach(c => dfs(c, new Set(), 0));
  return max;
}

function canClaimRoute(player, route, claimed) {
  const [,,color,length] = route;
  const key = routeKey(route);
  if (claimed[key] !== undefined) return false;
  if (player.trainsRemaining < length) return false;
  // Can't claim both sides of a double route
  const siblings = ROUTES.filter(r =>
    (r[0]===route[0]&&r[1]===route[1]) || (r[0]===route[1]&&r[1]===route[0])
  );
  if (siblings.some(r => claimed[routeKey(r)] === player.index)) return false;
  // Card check
  const locos = countCards(player.trainCards, "locomotive");
  if (color === "gray") {
    return ["red","orange","yellow","green","blue","purple","black","white"].some(
      c => countCards(player.trainCards, c) + locos >= length
    );
  }
  return countCards(player.trainCards, color) + locos >= length;
}

function removeCardsForRoute(hand, color, length) {
  const h = [...hand];
  let rem = length;
  const useColor = color === "gray"
    ? ["red","orange","yellow","green","blue","purple","black","white"]
        .reduce((best, c) => {
          const n = countCards(h, c);
          return n > countCards(h, best) ? c : best;
        }, "red")
    : color;
  for (let i = h.length - 1; i >= 0 && rem > 0; i--) {
    if (h[i] === useColor) { h.splice(i, 1); rem--; }
  }
  for (let i = h.length - 1; i >= 0 && rem > 0; i--) {
    if (h[i] === "locomotive") { h.splice(i, 1); rem--; }
  }
  return h;
}

// ============ SVG MAP HELPERS ============

function routeOffset(route, dist = 6) {
  const c1 = CITIES[route[0]], c2 = CITIES[route[1]];
  const dx = c2.x - c1.x, dy = c2.y - c1.y;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  const sign = route[4] === 0 ? -1 : 1;
  return { ox: (-dy / len) * dist * sign, oy: (dx / len) * dist * sign };
}

function getDisplayColor(color) {
  const map = {
    red:"#DC2626", orange:"#EA580C", yellow:"#FACC15", green:"#16A34A",
    blue:"#2563EB", purple:"#7C3AED", black:"#334155", white:"#CBD5E1", gray:"#9CA3AF"
  };
  return map[color] || "#9CA3AF";
}

function getStrokeColor(color) {
  const map = {
    red:"#7F1D1D", orange:"#7C2D12", yellow:"#713F12", green:"#14532D",
    blue:"#1E3A5F", purple:"#4C1D95", black:"#0F172A", white:"#64748B", gray:"#6B7280"
  };
  return map[color] || "#6B7280";
}

// ============ COMPONENTS ============

function TrainCard({ color, count, onClick, disabled }) {
  const isLoco = color === "locomotive";
  const bg = isLoco
    ? "linear-gradient(135deg, #DC2626, #EA580C, #FACC15, #16A34A, #2563EB, #7C3AED)"
    : CARD_COLORS[color];
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width: 52, height: 36, borderRadius: 6, position: "relative",
        background: bg,
        border: `2px solid ${isLoco ? "#92400E" : CARD_BORDER[color]}`,
        cursor: onClick && !disabled ? "pointer" : "default",
        opacity: disabled ? 0.4 : 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        transition: "transform 0.1s",
      }}
    >
      <span style={{
        fontSize: 9, fontWeight: "bold",
        color: CARD_TEXT_COLOR[color] || "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        letterSpacing: 0.5,
      }}>
        {CARD_COLOR_DISPLAY[color]}
      </span>
      {count !== undefined && (
        <div style={{
          position: "absolute", bottom: -5, right: -5,
          background: "#111827", color: "#fff", borderRadius: "50%",
          width: 18, height: 18, fontSize: 10, fontWeight: "bold",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1.5px solid #fff",
        }}>{count}</div>
      )}
    </div>
  );
}

function DestTicket({ ticket, completed, compact }) {
  return (
    <div style={{
      background: completed ? "#D1FAE5" : "#FEF3C7",
      border: `2px solid ${completed ? "#10B981" : "#D97706"}`,
      borderRadius: 7, padding: compact ? "3px 8px" : "5px 10px",
      fontSize: compact ? 11 : 12, display: "flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ fontWeight: "bold", color: completed ? "#065F46" : "#92400E" }}>
        {CITY_LABELS[ticket.city1]}
      </span>
      <span style={{ color: "#9CA3AF", fontSize: 10 }}>→</span>
      <span style={{ fontWeight: "bold", color: completed ? "#065F46" : "#92400E" }}>
        {CITY_LABELS[ticket.city2]}
      </span>
      <span style={{
        marginLeft: "auto", background: completed ? "#10B981" : "#D97706",
        color: "#fff", borderRadius: 10, padding: "1px 7px",
        fontWeight: "bold", fontSize: compact ? 10 : 11, whiteSpace: "nowrap",
      }}>
        {completed ? "+" : ""}{ticket.points}
      </span>
    </div>
  );
}

// ============ GAME MAP (the big SVG) ============

function GameMap({ claimed, onClaim, currentPlayer, players }) {
  const [hovered, setHovered] = useState(null);
  const animRef = useRef(0);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let id;
    const tick = () => {
      animRef.current = (animRef.current + 1) % 60;
      setPulse(Math.sin(animRef.current / 60 * Math.PI * 2) * 0.5 + 0.5);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const claimableKeys = new Set();
  if (currentPlayer !== null && players[currentPlayer]) {
    ROUTES.forEach(r => {
      if (canClaimRoute(players[currentPlayer], r, claimed)) {
        claimableKeys.add(routeKey(r));
      }
    });
  }

  return (
    <svg viewBox="0 0 980 570" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="claimGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Parchment background */}
      <rect width="980" height="570" fill="#F5E6C8" rx="4" />
      {/* Subtle country outline impression */}
      <rect x="40" y="25" width="920" height="530" fill="none" stroke="#E0D5B8" strokeWidth="1" rx="4" strokeDasharray="4,4" />

      {/* --- ROUTES --- */}
      {ROUTES.map((route, idx) => {
        const key = routeKey(route);
        const c1 = CITIES[route[0]], c2 = CITIES[route[1]];
        const isDouble = ROUTES.some((r, ri) => ri !== idx &&
          ((r[0]===route[0]&&r[1]===route[1]) || (r[0]===route[1]&&r[1]===route[0])));
        const off = isDouble ? routeOffset(route, 7) : { ox: 0, oy: 0 };
        const isClaimed = claimed[key] !== undefined;
        const claimable = claimableKeys.has(key);
        const isHov = hovered === key;

        const x1 = c1.x + off.ox, y1 = c1.y + off.oy;
        const x2 = c2.x + off.ox, y2 = c2.y + off.oy;
        const dx = x2 - x1, dy = y2 - y1;
        const dist = Math.sqrt(dx*dx+dy*dy) || 1;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        const carW = Math.min(22, (dist * 0.85) / route[3]);
        const carH = 9;
        const gap = dist / route[3];

        const playerColor = isClaimed ? PLAYER_COLORS[claimed[key]] : null;
        const routeColor = isClaimed ? playerColor : getDisplayColor(route[2]);
        const strokeColor = isClaimed ? playerColor : getStrokeColor(route[2]);

        // Glow opacity for claimable routes
        const glowOpacity = claimable ? (0.4 + pulse * 0.5) : 0;

        return (
          <g key={`r-${idx}`}
            onMouseEnter={() => claimable && setHovered(key)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => claimable && onClaim(route)}
            style={{ cursor: claimable ? "pointer" : "default" }}
          >
            {/* Glow line for claimable routes */}
            {claimable && (
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={PLAYER_COLORS[currentPlayer]}
                strokeWidth={carH + 10}
                strokeLinecap="round"
                opacity={glowOpacity}
                filter="url(#claimGlow)"
              />
            )}

            {/* Hover highlight */}
            {isHov && claimable && (
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={PLAYER_COLORS[currentPlayer]}
                strokeWidth={carH + 6}
                strokeLinecap="round"
                opacity={0.35}
              />
            )}

            {/* Background rail line */}
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isClaimed ? playerColor : "#C4B5A0"}
              strokeWidth={isClaimed ? 3 : 1.5}
              opacity={isClaimed ? 0.3 : 0.5}
              strokeDasharray={isClaimed ? "none" : "3,3"}
            />

            {/* Train car segments */}
            {Array.from({ length: route[3] }).map((_, ci) => {
              const t = (ci + 0.5) / route[3];
              const cx = x1 + dx * t;
              const cy = y1 + dy * t;
              return (
                <g key={ci} transform={`rotate(${angle}, ${cx}, ${cy})`}>
                  <rect
                    x={cx - carW/2} y={cy - carH/2}
                    width={carW} height={carH} rx={2.5}
                    fill={isClaimed ? playerColor : routeColor}
                    stroke={isClaimed ? "#fff" : strokeColor}
                    strokeWidth={isClaimed ? 1.5 : 1}
                    opacity={isClaimed ? 1 : (claimable ? (0.7 + pulse * 0.3) : 0.55)}
                  />
                  {/* Tiny color indicator dot for gray routes */}
                  {route[2] === "gray" && !isClaimed && (
                    <circle cx={cx} cy={cy} r={1.5} fill="#6B7280" opacity={0.6} />
                  )}
                </g>
              );
            })}

            {/* Length label on longer routes */}
            {route[3] >= 3 && !isClaimed && (
              <text
                x={x1 + dx * 0.5}
                y={y1 + dy * 0.5 + (angle > 90 || angle < -90 ? -carH : carH + 2)}
                textAnchor="middle"
                fontSize={7}
                fill="#78716C"
                fontWeight="bold"
                style={{ pointerEvents: "none" }}
              >
                {route[3]}
              </text>
            )}

            {/* Invisible fat hitbox */}
            {claimable && (
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="transparent" strokeWidth={20}
              >
                <title>{CITY_LABELS[route[0]]} → {CITY_LABELS[route[1]]} ({route[3]} {route[2]})</title>
              </line>
            )}
          </g>
        );
      })}

      {/* --- CITIES --- */}
      {Object.entries(CITIES).map(([name, pos]) => {
        const lbl = LABEL_OFFSETS[name] || { dx: 0, dy: -14 };
        return (
          <g key={name}>
            <circle cx={pos.x} cy={pos.y} r={7} fill="#2D1B0E" />
            <circle cx={pos.x} cy={pos.y} r={4.5} fill="#F5E6C8" />
            <circle cx={pos.x} cy={pos.y} r={2.5} fill="#2D1B0E" />
            <text
              x={pos.x + lbl.dx}
              y={pos.y + lbl.dy}
              textAnchor="middle"
              fontSize={8}
              fontWeight="bold"
              fill="#2D1B0E"
              style={{ pointerEvents: "none" }}
            >
              <tspan
                style={{
                  paintOrder: "stroke",
                  stroke: "#F5E6C8",
                  strokeWidth: 3,
                  strokeLinejoin: "round",
                }}
              >
                {CITY_LABELS[name]}
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============ UI PANELS ============

function Scoreboard({ players, current }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {players.map((p, i) => (
        <div key={i} style={{
          flex: 1, background: current === i ? PLAYER_BG[i] : "rgba(255,255,255,0.75)",
          borderRadius: 8, padding: "5px 10px",
          border: `3px solid ${PLAYER_COLORS[i]}`,
          boxShadow: current === i ? `0 0 10px ${PLAYER_COLORS[i]}50` : "none",
          transition: "all 0.2s",
        }}>
          <div style={{ fontWeight: "bold", fontSize: 13, color: PLAYER_COLORS[i], marginBottom: 1 }}>
            {current === i ? "▶ " : ""}{p.name}
          </div>
          <div style={{ fontSize: 11, color: "#4B5563", display: "flex", gap: 8 }}>
            <span>Pts: <b>{p.score}</b></span>
            <span>Trains: <b>{p.trainsRemaining}</b></span>
            <span>Cards: <b>{p.trainCards.length}</b></span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayerHand({ player }) {
  const grouped = {};
  player.trainCards.forEach(c => grouped[c] = (grouped[c]||0) + 1);
  const order = ["red","orange","yellow","green","blue","purple","black","white","locomotive"];
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {order.map(c => grouped[c] ? <TrainCard key={c} color={c} count={grouped[c]} /> : null)}
      {player.trainCards.length === 0 && <span style={{ fontSize: 11, color: "#9CA3AF" }}>No cards</span>}
    </div>
  );
}

function FaceUpCards({ cards, onDraw, canDraw, drawsLeft }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
      {cards.map((color, i) => {
        const isLocoSecond = color === "locomotive" && drawsLeft === 1;
        return (
          <TrainCard key={i} color={color}
            onClick={() => onDraw(i)}
            disabled={!canDraw || isLocoSecond}
          />
        );
      })}
      <div onClick={canDraw ? () => onDraw(-1) : undefined}
        style={{
          width: 52, height: 36, borderRadius: 6,
          background: "linear-gradient(135deg, #4B5563, #1F2937)",
          border: "2px solid #6B7280",
          cursor: canDraw ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, color: "#D1D5DB", fontWeight: "bold", letterSpacing: 0.5,
          opacity: canDraw ? 1 : 0.5,
        }}
      >DRAW</div>
    </div>
  );
}

// ============ MODALS ============

function DestinationModal({ tickets, minKeep, onConfirm, playerName, playerColor }) {
  const [sel, setSel] = useState(new Set(tickets.map((_,i) => i)));
  const toggle = i => {
    const n = new Set(sel);
    n.has(i) ? n.delete(i) : n.add(i);
    setSel(n);
  };
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000
    }}>
      <div style={{
        background:"#FFF7ED",borderRadius:16,padding:24,maxWidth:460,width:"92%",
        border:"3px solid #92400E",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"
      }}>
        <h3 style={{ margin:"0 0 2px", color:"#92400E", fontSize:17 }}>
          {playerName}'s Destination Tickets
        </h3>
        <p style={{ margin:"0 0 12px", fontSize:12, color:"#78716C" }}>
          Keep at least {minKeep}. Click to toggle.
        </p>
        <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:16 }}>
          {tickets.map((t,i) => (
            <div key={t.id !== undefined ? t.id : i} onClick={() => toggle(i)} style={{
              cursor:"pointer", opacity: sel.has(i) ? 1 : 0.35,
              transform: sel.has(i) ? "scale(1)" : "scale(0.97)",
              transition: "all 0.15s", border: sel.has(i) ? "2px solid #92400E" : "2px solid transparent",
              borderRadius: 10,
            }}>
              <DestTicket ticket={t} completed={false} />
            </div>
          ))}
        </div>
        <button onClick={() => sel.size >= minKeep && onConfirm([...sel].map(i => tickets[i]))}
          disabled={sel.size < minKeep}
          style={{
            width:"100%",padding:10,borderRadius:8,border:"none",
            background: sel.size >= minKeep ? "#92400E" : "#D1D5DB",
            color:"#fff",fontSize:14,fontWeight:"bold",
            cursor: sel.size >= minKeep ? "pointer" : "not-allowed",
          }}
        >Keep {sel.size} Ticket{sel.size !== 1 ? "s" : ""}</button>
      </div>
    </div>
  );
}

function RouteClaimModal({ route, player, onConfirm, onCancel }) {
  const [,,color,length] = route;
  const [selColor, setSelColor] = useState(color === "gray" ? null : color);
  const validColors = color === "gray"
    ? ["red","orange","yellow","green","blue","purple","black","white"].filter(
        c => countCards(player.trainCards, c) + countCards(player.trainCards, "locomotive") >= length)
    : [color];

  useEffect(() => {
    if (color === "gray" && validColors.length === 1) setSelColor(validColors[0]);
  }, []);

  const chosen = selColor || validColors[0];
  const colorCt = countCards(player.trainCards, chosen);
  const locosNeeded = Math.max(0, length - colorCt);

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000
    }}>
      <div style={{
        background:"#FFF7ED",borderRadius:16,padding:24,maxWidth:420,width:"92%",
        border:"3px solid #92400E"
      }}>
        <h3 style={{ margin:"0 0 6px",color:"#92400E" }}>Claim Route</h3>
        <p style={{ fontSize:13,color:"#4B5563",margin:"0 0 12px" }}>
          <b>{CITY_LABELS[route[0]]}</b> → <b>{CITY_LABELS[route[1]]}</b> ({length} trains, {ROUTE_POINTS[length]} pts)
        </p>
        {color === "gray" && validColors.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize:11,color:"#6B7280",margin:"0 0 6px" }}>Choose color:</p>
            <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
              {validColors.map(c => (
                <div key={c} onClick={() => setSelColor(c)} style={{
                  padding:"3px 10px",borderRadius:6,background:CARD_COLORS[c],
                  color:CARD_TEXT_COLOR[c],fontSize:11,fontWeight:"bold",cursor:"pointer",
                  border: selColor===c ? "2px solid #FCD34D" : "2px solid transparent",
                  boxShadow: selColor===c ? "0 0 6px #FCD34D" : "none",
                }}>{CARD_COLOR_DISPLAY[c]} ({countCards(player.trainCards,c)})</div>
              ))}
            </div>
          </div>
        )}
        <p style={{ fontSize:12,color:"#4B5563",margin:"0 0 16px" }}>
          Using: {Math.min(colorCt,length)} {CARD_COLOR_DISPLAY[chosen]}
          {locosNeeded > 0 && ` + ${locosNeeded} Wild${locosNeeded>1?"s":""}`}
        </p>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={onCancel} style={{
            flex:1,padding:10,borderRadius:8,border:"2px solid #9CA3AF",
            background:"transparent",cursor:"pointer",fontSize:13,fontWeight:"bold"
          }}>Cancel</button>
          <button onClick={() => onConfirm(chosen)} style={{
            flex:1,padding:10,borderRadius:8,border:"none",
            background:"#92400E",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:"bold"
          }}>Claim Route</button>
        </div>
      </div>
    </div>
  );
}

function GameOverScreen({ players, onPlayAgain }) {
  const sorted = [...players].sort((a,b) => b.finalScore - a.finalScore);
  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000
    }}>
      <div style={{
        background:"linear-gradient(135deg,#FFF7ED,#FEF3C7)",borderRadius:20,padding:32,
        maxWidth:540,width:"92%",border:"4px solid #92400E",textAlign:"center"
      }}>
        <div style={{ fontSize:40,marginBottom:4 }}>🏆</div>
        <h2 style={{ color:"#92400E",margin:"0 0 4px",fontSize:24 }}>Game Over!</h2>
        <p style={{ color:"#78716C",margin:"0 0 20px",fontSize:14 }}>
          <b style={{ color:PLAYER_COLORS[sorted[0].index] }}>{sorted[0].name}</b> wins!
        </p>
        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:20 }}>
          {sorted.map((p,rank) => (
            <div key={p.index} style={{
              background: rank===0 ? "#FEF3C7":"rgba(255,255,255,0.7)",
              border:`2px solid ${PLAYER_COLORS[p.index]}`,borderRadius:10,
              padding:"10px 14px",display:"flex",alignItems:"center",gap:10
            }}>
              <div style={{ fontWeight:"bold",fontSize:18,color:PLAYER_COLORS[p.index],width:28 }}>
                #{rank+1}
              </div>
              <div style={{ flex:1,textAlign:"left" }}>
                <div style={{ fontWeight:"bold",color:"#1F2937",fontSize:14 }}>{p.name}</div>
                <div style={{ fontSize:11,color:"#6B7280" }}>
                  Routes: {p.score} | Tickets: {p.ticketBonus > 0 ? "+" : ""}{p.ticketBonus} | Longest: {p.longestBonus > 0 ? "+10":"0"}
                </div>
              </div>
              <div style={{ fontWeight:"bold",fontSize:20,color:PLAYER_COLORS[p.index] }}>{p.finalScore}</div>
            </div>
          ))}
        </div>
        <button onClick={onPlayAgain} style={{
          padding:"12px 32px",borderRadius:10,border:"none",
          background:"#92400E",color:"#fff",fontSize:16,fontWeight:"bold",cursor:"pointer"
        }}>Play Again</button>
      </div>
    </div>
  );
}

function HomeScreen({ onStart }) {
  const [names, setNames] = useState(["","","",""]);
  const ok = names.every(n => n.trim().length > 0);
  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg,#1C1917,#292524,#44403C)",
      display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Georgia',serif"
    }}>
      <div style={{
        background:"linear-gradient(135deg,#FFF7ED,#FEF3C7)",
        borderRadius:24,padding:"40px 48px",maxWidth:480,width:"90%",
        border:"4px solid #92400E",boxShadow:"0 20px 60px rgba(0,0,0,0.5)",textAlign:"center"
      }}>
        <div style={{ fontSize:48,marginBottom:8 }}>🚂</div>
        <h1 style={{ color:"#92400E",margin:"0 0 4px",fontSize:32,letterSpacing:1 }}>
          Ticket to Ride
        </h1>
        <p style={{ color:"#A8A29E",margin:"0 0 28px",fontSize:14,fontStyle:"italic" }}>USA Edition</p>
        <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:24 }}>
          {names.map((name,i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{
                width:24,height:24,borderRadius:"50%",
                background:PLAYER_COLORS[i],border:"2px solid rgba(0,0,0,0.2)",flexShrink:0
              }} />
              <input type="text" placeholder={`Player ${i+1} (${PLAYER_COLOR_NAMES[i]})`}
                value={name} onChange={e => {
                  const n=[...names]; n[i]=e.target.value; setNames(n);
                }}
                style={{
                  flex:1,padding:"10px 14px",borderRadius:8,
                  border:"2px solid #D6D3D1",fontSize:14,background:"#fff",
                  outline:"none",fontFamily:"inherit"
                }}
              />
            </div>
          ))}
        </div>
        <button onClick={() => ok && onStart(names.map(n => n.trim()))} disabled={!ok}
          style={{
            width:"100%",padding:14,borderRadius:10,border:"none",
            background:ok ? "linear-gradient(135deg,#92400E,#B45309)":"#D1D5DB",
            color:"#fff",fontSize:18,fontWeight:"bold",
            cursor:ok?"pointer":"not-allowed",letterSpacing:1,
            boxShadow:ok?"0 4px 16px rgba(146,64,14,0.3)":"none"
          }}
        >🚂 All Aboard!</button>
      </div>
    </div>
  );
}

// ============ MAIN APP ============

export default function TicketToRide() {
  const [gs, setGs] = useState(null);
  const [destModal, setDestModal] = useState(null);
  const [routeModal, setRouteModal] = useState(null);
  const [msg, setMsg] = useState("");
  const [gameOver, setGameOver] = useState(null);

  const startGame = useCallback((names) => {
    let deck = createTrainCardDeck();
    let destDeck = createDestinationDeck();
    const players = names.map((name, i) => {
      const hand = deck.slice(0, 4);
      deck = deck.slice(4);
      return { name, index: i, trainCards: hand, destinationTickets: [], claimedRoutes: [], trainsRemaining: STARTING_TRAINS, score: 0 };
    });
    const faceUp = deck.slice(0, 5);
    deck = deck.slice(5);
    const state = {
      players, trainCardDeck: deck, faceUpCards: faceUp, destinationDeck: destDeck,
      currentPlayer: 0, turnAction: null, drawsLeft: 0, claimedRoutes: {},
      gamePhase: "setup", lastRoundTrigger: -1, turnsUntilEnd: -1,
    };
    setGs(state); setGameOver(null); setMsg("");
    const drawn = destDeck.slice(0, 3);
    const remaining = destDeck.slice(3);
    setDestModal({ tickets: drawn, minKeep: 2, playerIndex: 0, remainingDeck: remaining });
  }, []);

  // Setup destination selection - returns unkept tickets to bottom
  const handleSetupDestConfirm = useCallback((kept) => {
    if (!destModal || !gs) return;
    const { playerIndex, remainingDeck, tickets } = destModal;
    const st = { ...gs, players: [...gs.players] };
    st.players[playerIndex] = {
      ...st.players[playerIndex],
      destinationTickets: [...st.players[playerIndex].destinationTickets, ...kept],
    };
    // Return unkept tickets to bottom of deck
    const keptIds = new Set(kept.map(t => t.id));
    const unkept = tickets.filter(t => !keptIds.has(t.id));
    const updatedDeck = [...remainingDeck, ...unkept];
    st.destinationDeck = updatedDeck;

    const next = playerIndex + 1;
    if (next < 4) {
      const drawn = updatedDeck.slice(0, 3);
      const nextRem = updatedDeck.slice(3);
      setGs({ ...st, destinationDeck: nextRem });
      setDestModal({ tickets: drawn, minKeep: 2, playerIndex: next, remainingDeck: nextRem });
    } else {
      st.gamePhase = "playing";
      st.currentPlayer = 0;
      setGs(st);
      setDestModal(null);
      setMsg(`${st.players[0].name}'s turn`);
    }
  }, [destModal, gs]);

  const handleDrawCard = useCallback((faceUpIdx) => {
    if (!gs || gs.gamePhase === "gameOver") return;
    const st = { ...gs, players: [...gs.players] };
    const p = { ...st.players[st.currentPlayer] };
    st.players[st.currentPlayer] = p;

    const isFirst = st.turnAction === null;
    const draws = isFirst ? 2 : st.drawsLeft;
    let faceUp = [...st.faceUpCards], deck = [...st.trainCardDeck], card;

    if (faceUpIdx === -1) {
      if (!deck.length) { setMsg("No cards in deck!"); return; }
      card = deck.shift();
    } else {
      card = faceUp[faceUpIdx];
      if (card === "locomotive" && !isFirst && draws === 1) {
        setMsg("Can't take face-up wild as 2nd draw!"); return;
      }
      faceUp[faceUpIdx] = deck.length ? deck.shift() : null;
      faceUp = faceUp.filter(x => x !== null);
      // 3+ locos reset
      while (faceUp.filter(c => c === "locomotive").length >= 3 && deck.length >= 5) {
        deck = shuffle([...deck, ...faceUp]);
        faceUp = deck.slice(0, 5); deck = deck.slice(5);
      }
    }
    p.trainCards = [...p.trainCards, card];
    st.faceUpCards = faceUp; st.trainCardDeck = deck;

    const locoFaceUp = faceUpIdx >= 0 && card === "locomotive";
    const newDraws = draws - (locoFaceUp ? 2 : 1);
    if (newDraws <= 0) {
      st.turnAction = null; st.drawsLeft = 0; advanceTurn(st);
    } else {
      st.turnAction = "drawingCards"; st.drawsLeft = newDraws;
    }
    setGs(st);
  }, [gs]);

  const handleClaimRoute = useCallback((route) => {
    if (!gs || gs.turnAction === "drawingCards") return;
    setRouteModal(route);
  }, [gs]);

  const confirmClaim = useCallback((colorUsed) => {
    if (!gs || !routeModal) return;
    const route = routeModal;
    const st = { ...gs, players: [...gs.players], claimedRoutes: { ...gs.claimedRoutes } };
    const p = { ...st.players[st.currentPlayer] };
    st.players[st.currentPlayer] = p;
    const key = routeKey(route), len = route[3];
    p.trainCards = removeCardsForRoute(p.trainCards, colorUsed, len);
    p.trainsRemaining -= len;
    p.score += ROUTE_POINTS[len];
    p.claimedRoutes = [...p.claimedRoutes, key];
    st.claimedRoutes[key] = st.currentPlayer;
    if (p.trainsRemaining <= 2 && st.gamePhase === "playing") {
      st.gamePhase = "lastRound"; st.lastRoundTrigger = st.currentPlayer; st.turnsUntilEnd = 4;
      setMsg(`${p.name} has ${p.trainsRemaining} trains! Final round!`);
    }
    advanceTurn(st); setGs(st); setRouteModal(null);
  }, [gs, routeModal]);

  const handleDrawDest = useCallback(() => {
    if (!gs || gs.turnAction === "drawingCards") return;
    if (!gs.destinationDeck.length) { setMsg("No destination tickets left!"); return; }
    const ct = Math.min(3, gs.destinationDeck.length);
    const drawn = gs.destinationDeck.slice(0, ct);
    const rem = gs.destinationDeck.slice(ct);
    setDestModal({ tickets: drawn, minKeep: 1, playerIndex: gs.currentPlayer, remainingDeck: rem, isGameplay: true });
  }, [gs]);

  const handleGameplayDestConfirm = useCallback((kept) => {
    if (!destModal || !gs) return;
    const { playerIndex, remainingDeck, tickets } = destModal;
    const st = { ...gs, players: [...gs.players] };
    const p = { ...st.players[playerIndex] };
    p.destinationTickets = [...p.destinationTickets, ...kept];
    st.players[playerIndex] = p;
    const keptIds = new Set(kept.map(t => t.id));
    const unkept = tickets.filter(t => !keptIds.has(t.id));
    st.destinationDeck = [...remainingDeck, ...unkept];
    advanceTurn(st); setGs(st); setDestModal(null);
  }, [destModal, gs]);

  function advanceTurn(st) {
    if (st.gamePhase === "lastRound") {
      st.turnsUntilEnd--;
      if (st.turnsUntilEnd <= 0) { endGame(st); return; }
    }
    st.currentPlayer = (st.currentPlayer + 1) % 4;
    st.turnAction = null; st.drawsLeft = 0;
    setMsg(`${st.players[st.currentPlayer].name}'s turn`);
  }

  function endGame(st) {
    st.gamePhase = "gameOver";
    const fp = st.players.map(p => {
      let tb = 0;
      p.destinationTickets.forEach(t => {
        tb += areCitiesConnected(t.city1, t.city2, p.claimedRoutes) ? t.points : -t.points;
      });
      return { ...p, ticketBonus: tb, pathLength: longestPath(p.claimedRoutes), longestBonus: 0 };
    });
    const maxP = Math.max(...fp.map(p => p.pathLength));
    fp.forEach(p => { if (p.pathLength === maxP && maxP > 0) p.longestBonus = 10; });
    fp.forEach(p => { p.finalScore = p.score + p.ticketBonus + p.longestBonus; });
    setGameOver(fp);
  }

  if (!gs) return <HomeScreen onStart={startGame} />;

  const cur = gs.players[gs.currentPlayer];
  const drawing = gs.turnAction === "drawingCards";

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #1C1917, #292524)",
      fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#1F2937",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(90deg, #7C2D12, #92400E, #B45309)",
        padding: "5px 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", color: "#FFF7ED",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🚂</span>
          <span style={{ fontWeight: "bold", fontSize: 15, fontFamily: "'Georgia',serif" }}>
            Ticket to Ride
          </span>
        </div>
        {msg && (
          <div style={{
            fontSize: 13, background: "rgba(0,0,0,0.25)",
            padding: "3px 14px", borderRadius: 6, fontWeight: "bold",
          }}>{msg}</div>
        )}
        <div style={{ fontSize: 11, opacity: 0.85 }}>
          Deck: {gs.trainCardDeck.length} | Tickets: {gs.destinationDeck.length}
          {gs.gamePhase === "lastRound" && (
            <span style={{ marginLeft: 8, color: "#FCD34D", fontWeight: "bold" }}>⚠ FINAL ROUND</span>
          )}
        </div>
      </div>

      <div style={{ padding: "5px 10px" }}>
        <Scoreboard players={gs.players} current={gs.currentPlayer} />
      </div>

      {/* Main: Map + Panel */}
      <div style={{ flex: 1, display: "flex", padding: "0 10px 8px", gap: 8, minHeight: 0 }}>
        {/* Map */}
        <div style={{
          flex: 1, background: "#F5E6C8", borderRadius: 8,
          border: "3px solid #92400E", overflow: "hidden",
        }}>
          <GameMap
            claimed={gs.claimedRoutes}
            onClaim={handleClaimRoute}
            currentPlayer={gs.gamePhase !== "gameOver" && !drawing ? gs.currentPlayer : null}
            players={gs.players}
          />
        </div>

        {/* Side panel */}
        <div style={{ width: 270, display: "flex", flexDirection: "column", gap: 7 }}>
          {/* Hand */}
          <div style={{
            background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: 10,
            border: `2px solid ${PLAYER_COLORS[gs.currentPlayer]}`,
          }}>
            <div style={{
              fontSize: 12, fontWeight: "bold",
              color: PLAYER_COLORS[gs.currentPlayer], marginBottom: 5,
            }}>
              {cur.name}'s Hand {drawing && `(Draw ${gs.drawsLeft} more)`}
            </div>
            <PlayerHand player={cur} />
          </div>

          {/* Face-up */}
          <div style={{ background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: "bold", color: "#6B7280", marginBottom: 5 }}>
              Available Cards
            </div>
            <FaceUpCards cards={gs.faceUpCards} onDraw={handleDrawCard}
              canDraw={gs.gamePhase !== "gameOver" && gs.gamePhase !== "setup" &&
                (gs.turnAction === null || gs.turnAction === "drawingCards")}
              drawsLeft={drawing ? gs.drawsLeft : 2}
            />
          </div>

          {/* Destinations */}
          <div style={{
            background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: 10,
            flex: 1, overflowY: "auto",
          }}>
            <div style={{
              fontSize: 11, fontWeight: "bold", color: "#6B7280", marginBottom: 5,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>{cur.name}'s Destinations</span>
              <button onClick={handleDrawDest}
                disabled={gs.gamePhase === "gameOver" || gs.gamePhase === "setup" || drawing || !gs.destinationDeck.length}
                style={{
                  padding: "2px 8px", borderRadius: 4, border: "1px solid #D97706",
                  background: "#FEF3C7", color: "#92400E", fontSize: 10, fontWeight: "bold",
                  cursor: (gs.gamePhase !== "gameOver" && gs.gamePhase !== "setup" && !drawing) ? "pointer" : "not-allowed",
                  opacity: (gs.gamePhase !== "gameOver" && gs.gamePhase !== "setup" && !drawing) ? 1 : 0.5,
                }}
              >+ Draw</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {cur.destinationTickets.map((t, i) => (
                <DestTicket key={t.id !== undefined ? t.id : i} ticket={t}
                  completed={areCitiesConnected(t.city1, t.city2, cur.claimedRoutes)}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {destModal && (
        <DestinationModal tickets={destModal.tickets} minKeep={destModal.minKeep}
          onConfirm={destModal.isGameplay ? handleGameplayDestConfirm : handleSetupDestConfirm}
          playerName={gs.players[destModal.playerIndex].name}
          playerColor={PLAYER_COLORS[destModal.playerIndex]}
        />
      )}
      {routeModal && (
        <RouteClaimModal route={routeModal} player={cur}
          onConfirm={confirmClaim} onCancel={() => setRouteModal(null)}
        />
      )}
      {gameOver && <GameOverScreen players={gameOver} onPlayAgain={() => setGs(null)} />}
    </div>
  );
}