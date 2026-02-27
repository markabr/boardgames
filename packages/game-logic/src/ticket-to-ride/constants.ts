import type {
  CityName,
  Route,
  DestinationTicket,
  TrainCardColor,
  CardColor,
  RouteColor,
} from './types.js';

// ============ GAME CONSTANTS ============

export const STARTING_TRAINS = 45;
export const INITIAL_HAND_SIZE = 4;
export const FACE_UP_COUNT = 5;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4; // 5 with expansion, but not supported yet
export const LAST_ROUND_TRAIN_THRESHOLD = 2;
export const LONGEST_PATH_BONUS = 10;
export const SETUP_MIN_KEEP = 2;
export const GAMEPLAY_MIN_KEEP = 1;
export const DESTINATION_DRAW_COUNT = 3;

export const ROUTE_POINTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 10,
  6: 15,
};

export const TRAIN_CARD_COLORS: TrainCardColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'black',
  'white',
];

export const CARDS_PER_COLOR = 12;
export const LOCOMOTIVE_COUNT = 14;

// ============ CITY DATA ============

export const CITIES: Record<CityName, { x: number; y: number }> = {
  Vancouver: { x: 130, y: 48 },
  Seattle: { x: 118, y: 100 },
  Portland: { x: 82, y: 160 },
  SanFrancisco: { x: 52, y: 320 },
  LosAngeles: { x: 105, y: 425 },
  LasVegas: { x: 170, y: 380 },
  Phoenix: { x: 230, y: 465 },
  SaltLakeCity: { x: 230, y: 230 },
  Helena: { x: 290, y: 105 },
  Calgary: { x: 225, y: 35 },
  Winnipeg: { x: 460, y: 48 },
  Duluth: { x: 560, y: 115 },
  SaultSteMarie: { x: 680, y: 82 },
  Montreal: { x: 850, y: 62 },
  Boston: { x: 920, y: 108 },
  NewYork: { x: 895, y: 180 },
  Pittsburgh: { x: 800, y: 200 },
  Washington: { x: 875, y: 245 },
  Raleigh: { x: 830, y: 325 },
  Charleston: { x: 830, y: 390 },
  Miami: { x: 860, y: 520 },
  Atlanta: { x: 745, y: 375 },
  Nashville: { x: 690, y: 310 },
  SaintLouis: { x: 610, y: 270 },
  Chicago: { x: 630, y: 175 },
  Omaha: { x: 500, y: 200 },
  KansasCity: { x: 530, y: 285 },
  OklahomaCity: { x: 500, y: 370 },
  Dallas: { x: 500, y: 440 },
  Houston: { x: 530, y: 500 },
  NewOrleans: { x: 630, y: 475 },
  LittleRock: { x: 590, y: 370 },
  ElPaso: { x: 310, y: 480 },
  SantaFe: { x: 330, y: 375 },
  Denver: { x: 360, y: 270 },
  Toronto: { x: 760, y: 120 },
};

export const CITY_LABELS: Record<CityName, string> = {
  Vancouver: 'Vancouver',
  Seattle: 'Seattle',
  Portland: 'Portland',
  SanFrancisco: 'San Francisco',
  LosAngeles: 'Los Angeles',
  LasVegas: 'Las Vegas',
  Phoenix: 'Phoenix',
  SaltLakeCity: 'Salt Lake City',
  Helena: 'Helena',
  Calgary: 'Calgary',
  Winnipeg: 'Winnipeg',
  Duluth: 'Duluth',
  SaultSteMarie: 'Sault Ste. Marie',
  Montreal: 'Montreal',
  Boston: 'Boston',
  NewYork: 'New York',
  Pittsburgh: 'Pittsburgh',
  Washington: 'Washington',
  Raleigh: 'Raleigh',
  Charleston: 'Charleston',
  Miami: 'Miami',
  Atlanta: 'Atlanta',
  Nashville: 'Nashville',
  SaintLouis: 'St. Louis',
  Chicago: 'Chicago',
  Omaha: 'Omaha',
  KansasCity: 'Kansas City',
  OklahomaCity: 'Oklahoma City',
  Dallas: 'Dallas',
  Houston: 'Houston',
  NewOrleans: 'New Orleans',
  LittleRock: 'Little Rock',
  ElPaso: 'El Paso',
  SantaFe: 'Santa Fe',
  Denver: 'Denver',
  Toronto: 'Toronto',
};

export const LABEL_OFFSETS: Record<CityName, { dx: number; dy: number }> = {
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

// ============ ROUTES ============

export const ROUTES: Route[] = [
  // Vancouver - Seattle (double)
  { city1: 'Vancouver', city2: 'Seattle', color: 'gray', length: 1, routeIndex: 0 },
  { city1: 'Vancouver', city2: 'Seattle', color: 'gray', length: 1, routeIndex: 1 },
  // Seattle - Portland (double)
  { city1: 'Seattle', city2: 'Portland', color: 'gray', length: 1, routeIndex: 0 },
  { city1: 'Seattle', city2: 'Portland', color: 'gray', length: 1, routeIndex: 1 },
  // Portland - San Francisco (double)
  { city1: 'Portland', city2: 'SanFrancisco', color: 'green', length: 5, routeIndex: 0 },
  { city1: 'Portland', city2: 'SanFrancisco', color: 'purple', length: 5, routeIndex: 1 },
  // San Francisco - Los Angeles (double)
  { city1: 'SanFrancisco', city2: 'LosAngeles', color: 'yellow', length: 3, routeIndex: 0 },
  { city1: 'SanFrancisco', city2: 'LosAngeles', color: 'purple', length: 3, routeIndex: 1 },
  // Los Angeles connections
  { city1: 'LosAngeles', city2: 'LasVegas', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'LosAngeles', city2: 'Phoenix', color: 'gray', length: 3, routeIndex: 0 },
  { city1: 'LosAngeles', city2: 'ElPaso', color: 'black', length: 6, routeIndex: 0 },
  // Las Vegas
  { city1: 'LasVegas', city2: 'SaltLakeCity', color: 'orange', length: 3, routeIndex: 0 },
  // Phoenix connections
  { city1: 'Phoenix', city2: 'ElPaso', color: 'gray', length: 3, routeIndex: 0 },
  { city1: 'Phoenix', city2: 'SantaFe', color: 'gray', length: 3, routeIndex: 0 },
  { city1: 'Phoenix', city2: 'Denver', color: 'white', length: 5, routeIndex: 0 },
  // El Paso connections
  { city1: 'ElPaso', city2: 'SantaFe', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'ElPaso', city2: 'Dallas', color: 'red', length: 4, routeIndex: 0 },
  { city1: 'ElPaso', city2: 'Houston', color: 'green', length: 6, routeIndex: 0 },
  { city1: 'ElPaso', city2: 'OklahomaCity', color: 'yellow', length: 5, routeIndex: 0 },
  // Santa Fe connections
  { city1: 'SantaFe', city2: 'Denver', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'SantaFe', city2: 'OklahomaCity', color: 'blue', length: 3, routeIndex: 0 },
  // Denver connections (double SLC, double KC)
  { city1: 'Denver', city2: 'SaltLakeCity', color: 'red', length: 3, routeIndex: 0 },
  { city1: 'Denver', city2: 'SaltLakeCity', color: 'yellow', length: 3, routeIndex: 1 },
  { city1: 'Denver', city2: 'Helena', color: 'green', length: 4, routeIndex: 0 },
  { city1: 'Denver', city2: 'Omaha', color: 'purple', length: 4, routeIndex: 0 },
  { city1: 'Denver', city2: 'KansasCity', color: 'black', length: 4, routeIndex: 0 },
  { city1: 'Denver', city2: 'KansasCity', color: 'orange', length: 4, routeIndex: 1 },
  { city1: 'Denver', city2: 'OklahomaCity', color: 'red', length: 4, routeIndex: 0 },
  // Salt Lake City connections (double SF)
  { city1: 'SaltLakeCity', city2: 'Helena', color: 'purple', length: 3, routeIndex: 0 },
  { city1: 'SaltLakeCity', city2: 'Portland', color: 'blue', length: 6, routeIndex: 0 },
  { city1: 'SaltLakeCity', city2: 'SanFrancisco', color: 'orange', length: 5, routeIndex: 0 },
  { city1: 'SaltLakeCity', city2: 'SanFrancisco', color: 'white', length: 5, routeIndex: 1 },
  // Helena connections
  { city1: 'Helena', city2: 'Calgary', color: 'gray', length: 4, routeIndex: 0 },
  { city1: 'Helena', city2: 'Winnipeg', color: 'blue', length: 4, routeIndex: 0 },
  { city1: 'Helena', city2: 'Duluth', color: 'orange', length: 6, routeIndex: 0 },
  { city1: 'Helena', city2: 'Omaha', color: 'red', length: 5, routeIndex: 0 },
  { city1: 'Helena', city2: 'Seattle', color: 'yellow', length: 6, routeIndex: 0 },
  // Calgary connections
  { city1: 'Calgary', city2: 'Vancouver', color: 'gray', length: 3, routeIndex: 0 },
  { city1: 'Calgary', city2: 'Winnipeg', color: 'white', length: 6, routeIndex: 0 },
  // Winnipeg connections
  { city1: 'Winnipeg', city2: 'Duluth', color: 'black', length: 4, routeIndex: 0 },
  { city1: 'Winnipeg', city2: 'SaultSteMarie', color: 'gray', length: 6, routeIndex: 0 },
  // Duluth connections (double Omaha)
  { city1: 'Duluth', city2: 'SaultSteMarie', color: 'gray', length: 3, routeIndex: 0 },
  { city1: 'Duluth', city2: 'Toronto', color: 'purple', length: 6, routeIndex: 0 },
  { city1: 'Duluth', city2: 'Chicago', color: 'red', length: 3, routeIndex: 0 },
  { city1: 'Duluth', city2: 'Omaha', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'Duluth', city2: 'Omaha', color: 'gray', length: 2, routeIndex: 1 },
  // Sault Ste. Marie connections
  { city1: 'SaultSteMarie', city2: 'Montreal', color: 'black', length: 5, routeIndex: 0 },
  { city1: 'SaultSteMarie', city2: 'Toronto', color: 'gray', length: 2, routeIndex: 0 },
  // Montreal connections (double Boston)
  { city1: 'Montreal', city2: 'Boston', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'Montreal', city2: 'Boston', color: 'gray', length: 2, routeIndex: 1 },
  { city1: 'Montreal', city2: 'NewYork', color: 'blue', length: 3, routeIndex: 0 },
  { city1: 'Montreal', city2: 'Toronto', color: 'gray', length: 3, routeIndex: 0 },
  // Boston - New York (double)
  { city1: 'Boston', city2: 'NewYork', color: 'yellow', length: 2, routeIndex: 0 },
  { city1: 'Boston', city2: 'NewYork', color: 'red', length: 2, routeIndex: 1 },
  // New York connections (double Pittsburgh, double Washington)
  { city1: 'NewYork', city2: 'Pittsburgh', color: 'white', length: 2, routeIndex: 0 },
  { city1: 'NewYork', city2: 'Pittsburgh', color: 'green', length: 2, routeIndex: 1 },
  { city1: 'NewYork', city2: 'Washington', color: 'orange', length: 2, routeIndex: 0 },
  { city1: 'NewYork', city2: 'Washington', color: 'black', length: 2, routeIndex: 1 },
  // Pittsburgh connections (double Chicago)
  { city1: 'Pittsburgh', city2: 'Toronto', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'Pittsburgh', city2: 'Chicago', color: 'orange', length: 3, routeIndex: 0 },
  { city1: 'Pittsburgh', city2: 'Chicago', color: 'black', length: 3, routeIndex: 1 },
  { city1: 'Pittsburgh', city2: 'SaintLouis', color: 'green', length: 5, routeIndex: 0 },
  { city1: 'Pittsburgh', city2: 'Nashville', color: 'yellow', length: 4, routeIndex: 0 },
  { city1: 'Pittsburgh', city2: 'Raleigh', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'Pittsburgh', city2: 'Washington', color: 'gray', length: 2, routeIndex: 0 },
  // Washington - Raleigh (double)
  { city1: 'Washington', city2: 'Raleigh', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'Washington', city2: 'Raleigh', color: 'gray', length: 2, routeIndex: 1 },
  // Raleigh connections (double Atlanta)
  { city1: 'Raleigh', city2: 'Charleston', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'Raleigh', city2: 'Atlanta', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'Raleigh', city2: 'Atlanta', color: 'gray', length: 2, routeIndex: 1 },
  { city1: 'Raleigh', city2: 'Nashville', color: 'black', length: 3, routeIndex: 0 },
  // Charleston connections
  { city1: 'Charleston', city2: 'Atlanta', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'Charleston', city2: 'Miami', color: 'purple', length: 4, routeIndex: 0 },
  // Miami connections
  { city1: 'Miami', city2: 'Atlanta', color: 'blue', length: 5, routeIndex: 0 },
  { city1: 'Miami', city2: 'NewOrleans', color: 'red', length: 6, routeIndex: 0 },
  // Atlanta connections (double New Orleans)
  { city1: 'Atlanta', city2: 'Nashville', color: 'gray', length: 1, routeIndex: 0 },
  { city1: 'Atlanta', city2: 'NewOrleans', color: 'yellow', length: 4, routeIndex: 0 },
  { city1: 'Atlanta', city2: 'NewOrleans', color: 'orange', length: 4, routeIndex: 1 },
  // Nashville connections
  { city1: 'Nashville', city2: 'SaintLouis', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'Nashville', city2: 'LittleRock', color: 'white', length: 3, routeIndex: 0 },
  // Saint Louis connections (double Chicago, double Kansas City)
  { city1: 'SaintLouis', city2: 'Chicago', color: 'green', length: 2, routeIndex: 0 },
  { city1: 'SaintLouis', city2: 'Chicago', color: 'white', length: 2, routeIndex: 1 },
  { city1: 'SaintLouis', city2: 'KansasCity', color: 'blue', length: 2, routeIndex: 0 },
  { city1: 'SaintLouis', city2: 'KansasCity', color: 'purple', length: 2, routeIndex: 1 },
  { city1: 'SaintLouis', city2: 'LittleRock', color: 'gray', length: 2, routeIndex: 0 },
  // Chicago connections
  { city1: 'Chicago', city2: 'Omaha', color: 'blue', length: 4, routeIndex: 0 },
  { city1: 'Chicago', city2: 'Toronto', color: 'white', length: 4, routeIndex: 0 },
  // Omaha - Kansas City (double)
  { city1: 'Omaha', city2: 'KansasCity', color: 'gray', length: 1, routeIndex: 0 },
  { city1: 'Omaha', city2: 'KansasCity', color: 'gray', length: 1, routeIndex: 1 },
  // Kansas City - Oklahoma City (double)
  { city1: 'KansasCity', city2: 'OklahomaCity', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'KansasCity', city2: 'OklahomaCity', color: 'gray', length: 2, routeIndex: 1 },
  // Oklahoma City - Dallas (double)
  { city1: 'OklahomaCity', city2: 'Dallas', color: 'gray', length: 2, routeIndex: 0 },
  { city1: 'OklahomaCity', city2: 'Dallas', color: 'gray', length: 2, routeIndex: 1 },
  // Oklahoma City - Little Rock
  { city1: 'OklahomaCity', city2: 'LittleRock', color: 'gray', length: 2, routeIndex: 0 },
  // Dallas - Houston (double)
  { city1: 'Dallas', city2: 'Houston', color: 'gray', length: 1, routeIndex: 0 },
  { city1: 'Dallas', city2: 'Houston', color: 'gray', length: 1, routeIndex: 1 },
  // Dallas - Little Rock
  { city1: 'Dallas', city2: 'LittleRock', color: 'gray', length: 2, routeIndex: 0 },
  // Houston - New Orleans
  { city1: 'Houston', city2: 'NewOrleans', color: 'gray', length: 2, routeIndex: 0 },
  // Little Rock - New Orleans
  { city1: 'LittleRock', city2: 'NewOrleans', color: 'green', length: 3, routeIndex: 0 },
];

// ============ DESTINATION TICKETS ============

export const DESTINATION_TICKETS: DestinationTicket[] = [
  { id: 0, city1: 'LosAngeles', city2: 'NewYork', points: 21 },
  { id: 1, city1: 'Duluth', city2: 'Houston', points: 8 },
  { id: 2, city1: 'SaultSteMarie', city2: 'Nashville', points: 8 },
  { id: 3, city1: 'NewYork', city2: 'Atlanta', points: 6 },
  { id: 4, city1: 'Portland', city2: 'Nashville', points: 17 },
  { id: 5, city1: 'Vancouver', city2: 'Montreal', points: 20 },
  { id: 6, city1: 'Duluth', city2: 'ElPaso', points: 10 },
  { id: 7, city1: 'Toronto', city2: 'Miami', points: 10 },
  { id: 8, city1: 'Portland', city2: 'Phoenix', points: 11 },
  { id: 9, city1: 'Dallas', city2: 'NewYork', points: 11 },
  { id: 10, city1: 'Calgary', city2: 'SaltLakeCity', points: 7 },
  { id: 11, city1: 'Calgary', city2: 'Phoenix', points: 13 },
  { id: 12, city1: 'LosAngeles', city2: 'Miami', points: 20 },
  { id: 13, city1: 'Winnipeg', city2: 'LittleRock', points: 11 },
  { id: 14, city1: 'SanFrancisco', city2: 'Atlanta', points: 17 },
  { id: 15, city1: 'KansasCity', city2: 'Houston', points: 5 },
  { id: 16, city1: 'LosAngeles', city2: 'Chicago', points: 16 },
  { id: 17, city1: 'Denver', city2: 'Pittsburgh', points: 11 },
  { id: 18, city1: 'Chicago', city2: 'SantaFe', points: 9 },
  { id: 19, city1: 'Vancouver', city2: 'SantaFe', points: 13 },
  { id: 20, city1: 'Boston', city2: 'Miami', points: 12 },
  { id: 21, city1: 'Chicago', city2: 'NewOrleans', points: 7 },
  { id: 22, city1: 'Montreal', city2: 'Atlanta', points: 9 },
  { id: 23, city1: 'Seattle', city2: 'NewYork', points: 22 },
  { id: 24, city1: 'Denver', city2: 'ElPaso', points: 4 },
  { id: 25, city1: 'Helena', city2: 'LosAngeles', points: 8 },
  { id: 26, city1: 'Winnipeg', city2: 'Houston', points: 12 },
  { id: 27, city1: 'Montreal', city2: 'NewOrleans', points: 13 },
  { id: 28, city1: 'SaultSteMarie', city2: 'OklahomaCity', points: 9 },
  { id: 29, city1: 'Seattle', city2: 'LosAngeles', points: 9 },
];

// ============ RENDERING CONSTANTS ============

export const PLAYER_COLORS = ['#DC2626', '#2563EB', '#16A34A', '#CA8A04'];
export const PLAYER_COLOR_NAMES = ['Red', 'Blue', 'Green', 'Yellow'];
export const PLAYER_BG = ['#FEE2E2', '#DBEAFE', '#DCFCE7', '#FEF9C3'];

export const CARD_COLORS: Record<CardColor, string> = {
  red: '#DC2626',
  orange: '#EA580C',
  yellow: '#FACC15',
  green: '#16A34A',
  blue: '#2563EB',
  purple: '#7C3AED',
  black: '#1E293B',
  white: '#F1F5F9',
  locomotive: '#F59E0B',
};

export const CARD_BORDER: Record<CardColor, string> = {
  red: '#991B1B',
  orange: '#9A3412',
  yellow: '#A16207',
  green: '#166534',
  blue: '#1E40AF',
  purple: '#5B21B6',
  black: '#0F172A',
  white: '#94A3B8',
  locomotive: '#B45309',
};

export const CARD_TEXT_COLOR: Record<CardColor, string> = {
  red: '#fff',
  orange: '#fff',
  yellow: '#422006',
  green: '#fff',
  blue: '#fff',
  purple: '#fff',
  black: '#fff',
  white: '#334155',
  locomotive: '#fff',
};

export const CARD_COLOR_DISPLAY: Record<CardColor, string> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  black: 'Black',
  white: 'White',
  locomotive: 'Wild',
};

export const ROUTE_DISPLAY_COLORS: Record<RouteColor, string> = {
  red: '#DC2626',
  orange: '#EA580C',
  yellow: '#FACC15',
  green: '#16A34A',
  blue: '#2563EB',
  purple: '#7C3AED',
  black: '#334155',
  white: '#CBD5E1',
  gray: '#9CA3AF',
};

export const ROUTE_STROKE_COLORS: Record<RouteColor, string> = {
  red: '#7F1D1D',
  orange: '#7C2D12',
  yellow: '#713F12',
  green: '#14532D',
  blue: '#1E3A5F',
  purple: '#4C1D95',
  black: '#0F172A',
  white: '#64748B',
  gray: '#6B7280',
};
