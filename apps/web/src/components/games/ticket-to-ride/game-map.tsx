"use client";

import { useState, useEffect, useRef, useMemo, memo } from "react";
import type {
  Route,
  PlayerView,
  CityName,
} from "@railbound/game-logic/ticket-to-ride";
import {
  ROUTES,
  CITIES,
  CITY_LABELS,
  LABEL_OFFSETS,
  PLAYER_COLORS,
  routeKey,
  countCards,
  canClaimRouteByIndex,
} from "@railbound/game-logic/ticket-to-ride";
import { routeOffset, getDisplayColor, getStrokeColor } from "./map-utils";

interface GameMapProps {
  gameState: PlayerView;
  onClaimRoute: (route: Route) => void;
}

function GameMapInner({ gameState, onClaimRoute }: GameMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const animRef = useRef(0);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let id: number;
    const tick = () => {
      animRef.current = (animRef.current + 1) % 60;
      setPulse(Math.sin((animRef.current / 60) * Math.PI * 2) * 0.5 + 0.5);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const myPlayerIndex = gameState.players.findIndex(
    (p) => p.id === gameState.myPlayerId
  );
  const isMyTurn = gameState.currentPlayerIndex === myPlayerIndex;
  const drawing = gameState.turnAction === "drawingCards";

  const claimableKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!isMyTurn || drawing || gameState.phase === "gameOver" || gameState.phase === "setup") {
      return keys;
    }
    const me = gameState.players[myPlayerIndex];
    // Build a temporary PlayerState-like object for canClaimRouteByIndex
    const fakePlayer = {
      id: me.id,
      name: me.name,
      score: me.score,
      trainsRemaining: me.trainsRemaining,
      trainCards: gameState.myTrainCards,
      destinationTickets: gameState.myDestinationTickets,
      claimedRoutes: me.claimedRoutes,
    };
    for (const route of ROUTES) {
      if (
        canClaimRouteByIndex(
          fakePlayer,
          myPlayerIndex,
          route,
          gameState.claimedRoutes,
          gameState.players.length
        )
      ) {
        keys.add(routeKey(route));
      }
    }
    return keys;
  }, [
    isMyTurn,
    drawing,
    gameState.phase,
    gameState.myTrainCards,
    gameState.myDestinationTickets,
    gameState.claimedRoutes,
    gameState.players,
    myPlayerIndex,
  ]);

  return (
    <svg
      viewBox="0 0 980 570"
      className="w-full h-full block"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="claimGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Parchment background */}
      <rect width="980" height="570" fill="#F5E6C8" rx="4" />
      {/* Subtle country outline */}
      <rect
        x="40"
        y="25"
        width="920"
        height="530"
        fill="none"
        stroke="#E0D5B8"
        strokeWidth="1"
        rx="4"
        strokeDasharray="4,4"
      />

      {/* Routes */}
      {ROUTES.map((route, idx) => {
        const key = routeKey(route);
        const c1 = CITIES[route.city1];
        const c2 = CITIES[route.city2];
        const isDouble = ROUTES.some(
          (r, ri) =>
            ri !== idx &&
            ((r.city1 === route.city1 && r.city2 === route.city2) ||
              (r.city1 === route.city2 && r.city2 === route.city1))
        );
        const off = isDouble
          ? routeOffset(route, 7)
          : { ox: 0, oy: 0 };
        const isClaimed = gameState.claimedRoutes[key] !== undefined;
        const claimable = claimableKeys.has(key);
        const isHov = hovered === key;

        const x1 = c1.x + off.ox;
        const y1 = c1.y + off.oy;
        const x2 = c2.x + off.ox;
        const y2 = c2.y + off.oy;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        const carW = Math.min(22, (dist * 0.85) / route.length);
        const carH = 9;

        const playerColor = isClaimed
          ? PLAYER_COLORS[gameState.claimedRoutes[key]]
          : null;
        const routeColor = isClaimed
          ? playerColor!
          : getDisplayColor(route.color);
        const strokeColor = isClaimed
          ? playerColor!
          : getStrokeColor(route.color);

        const glowOpacity = claimable ? 0.4 + pulse * 0.5 : 0;

        return (
          <g
            key={`r-${idx}`}
            onMouseEnter={() => claimable && setHovered(key)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => claimable && onClaimRoute(route)}
            style={{ cursor: claimable ? "pointer" : "default" }}
          >
            {/* Glow line for claimable routes */}
            {claimable && (
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={PLAYER_COLORS[gameState.currentPlayerIndex]}
                strokeWidth={carH + 10}
                strokeLinecap="round"
                opacity={glowOpacity}
                filter="url(#claimGlow)"
              />
            )}

            {/* Hover highlight */}
            {isHov && claimable && (
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={PLAYER_COLORS[gameState.currentPlayerIndex]}
                strokeWidth={carH + 6}
                strokeLinecap="round"
                opacity={0.35}
              />
            )}

            {/* Background rail line */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isClaimed ? playerColor! : "#C4B5A0"}
              strokeWidth={isClaimed ? 3 : 1.5}
              opacity={isClaimed ? 0.3 : 0.5}
              strokeDasharray={isClaimed ? "none" : "3,3"}
            />

            {/* Train car segments */}
            {Array.from({ length: route.length }).map((_, ci) => {
              const t = (ci + 0.5) / route.length;
              const cx = x1 + dx * t;
              const cy = y1 + dy * t;
              return (
                <g
                  key={ci}
                  transform={`rotate(${angle}, ${cx}, ${cy})`}
                >
                  <rect
                    x={cx - carW / 2}
                    y={cy - carH / 2}
                    width={carW}
                    height={carH}
                    rx={2.5}
                    fill={isClaimed ? playerColor! : routeColor}
                    stroke={isClaimed ? "#fff" : strokeColor}
                    strokeWidth={isClaimed ? 1.5 : 1}
                    opacity={
                      isClaimed
                        ? 1
                        : claimable
                          ? 0.7 + pulse * 0.3
                          : 0.55
                    }
                  />
                  {/* Gray route indicator dot */}
                  {route.color === "gray" && !isClaimed && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={1.5}
                      fill="#6B7280"
                      opacity={0.6}
                    />
                  )}
                </g>
              );
            })}

            {/* Length label on longer routes */}
            {route.length >= 3 && !isClaimed && (
              <text
                x={x1 + dx * 0.5}
                y={
                  y1 +
                  dy * 0.5 +
                  (angle > 90 || angle < -90 ? -carH : carH + 2)
                }
                textAnchor="middle"
                fontSize={7}
                fill="#78716C"
                fontWeight="bold"
                style={{ pointerEvents: "none" }}
              >
                {route.length}
              </text>
            )}

            {/* Invisible fat hitbox */}
            {claimable && (
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={20}
              >
                <title>
                  {CITY_LABELS[route.city1]} {"\u2192"}{" "}
                  {CITY_LABELS[route.city2]} ({route.length} {route.color})
                </title>
              </line>
            )}
          </g>
        );
      })}

      {/* Cities */}
      {Object.entries(CITIES).map(([name, pos]) => {
        const cityName = name as CityName;
        const lbl = LABEL_OFFSETS[cityName];
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
                {CITY_LABELS[cityName]}
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export const GameMap = memo(GameMapInner);
