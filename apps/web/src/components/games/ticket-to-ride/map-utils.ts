import type { Route, RouteColor } from "@railbound/game-logic/ticket-to-ride";
import {
  CITIES,
  ROUTE_DISPLAY_COLORS,
  ROUTE_STROKE_COLORS,
} from "@railbound/game-logic/ticket-to-ride";

export function routeOffset(route: Route, dist = 6) {
  const c1 = CITIES[route.city1];
  const c2 = CITIES[route.city2];
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const sign = route.routeIndex === 0 ? -1 : 1;
  return {
    ox: (-dy / len) * dist * sign,
    oy: (dx / len) * dist * sign,
  };
}

export function getDisplayColor(color: RouteColor): string {
  return ROUTE_DISPLAY_COLORS[color] || "#9CA3AF";
}

export function getStrokeColor(color: RouteColor): string {
  return ROUTE_STROKE_COLORS[color] || "#6B7280";
}
