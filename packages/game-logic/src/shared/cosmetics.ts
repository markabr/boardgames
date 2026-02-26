export type CosmeticType = 'theme' | 'avatar' | 'card_back' | 'board_skin';

export interface CosmeticItem {
  id: string;
  type: CosmeticType;
  name: string;
  description: string;
  price: number; // in coins, 0 = free / default
  premiumOnly: boolean;
  previewColor?: string; // hex color for themes
}

// ============ THEMES ============

export const THEMES: CosmeticItem[] = [
  { id: 'theme-default', type: 'theme', name: 'Classic', description: 'The default look', price: 0, premiumOnly: false, previewColor: '#92400E' },
  { id: 'theme-midnight', type: 'theme', name: 'Midnight', description: 'Deep blue tones', price: 100, premiumOnly: false, previewColor: '#1E40AF' },
  { id: 'theme-forest', type: 'theme', name: 'Forest', description: 'Natural greens', price: 100, premiumOnly: false, previewColor: '#166534' },
  { id: 'theme-sunset', type: 'theme', name: 'Sunset', description: 'Warm orange and pink', price: 150, premiumOnly: false, previewColor: '#C2410C' },
  { id: 'theme-royal', type: 'theme', name: 'Royal', description: 'Purple and gold', price: 200, premiumOnly: false, previewColor: '#7C3AED' },
  { id: 'theme-obsidian', type: 'theme', name: 'Obsidian', description: 'Sleek dark mode', price: 250, premiumOnly: true, previewColor: '#18181B' },
];

// ============ AVATARS ============

export const AVATARS: CosmeticItem[] = [
  { id: 'avatar-train', type: 'avatar', name: 'Train', description: 'Classic locomotive', price: 0, premiumOnly: false },
  { id: 'avatar-dice', type: 'avatar', name: 'Dice', description: 'Lucky roller', price: 50, premiumOnly: false },
  { id: 'avatar-crown', type: 'avatar', name: 'Crown', description: 'Board game royalty', price: 100, premiumOnly: false },
  { id: 'avatar-star', type: 'avatar', name: 'Star', description: 'Rising star', price: 100, premiumOnly: false },
  { id: 'avatar-robot', type: 'avatar', name: 'Robot', description: 'Mechanical mind', price: 150, premiumOnly: false },
  { id: 'avatar-dragon', type: 'avatar', name: 'Dragon', description: 'Fire breather', price: 200, premiumOnly: true },
];

// ============ CARD BACKS ============

export const CARD_BACKS: CosmeticItem[] = [
  { id: 'back-classic', type: 'card_back', name: 'Classic', description: 'Traditional design', price: 0, premiumOnly: false },
  { id: 'back-geometric', type: 'card_back', name: 'Geometric', description: 'Modern patterns', price: 75, premiumOnly: false },
  { id: 'back-vintage', type: 'card_back', name: 'Vintage', description: 'Aged parchment look', price: 100, premiumOnly: false },
  { id: 'back-neon', type: 'card_back', name: 'Neon', description: 'Glow in the dark', price: 150, premiumOnly: true },
];

// ============ BOARD SKINS ============

export const BOARD_SKINS: CosmeticItem[] = [
  { id: 'skin-parchment', type: 'board_skin', name: 'Parchment', description: 'Classic map look', price: 0, premiumOnly: false },
  { id: 'skin-blueprint', type: 'board_skin', name: 'Blueprint', description: 'Technical drawing style', price: 150, premiumOnly: false },
  { id: 'skin-satellite', type: 'board_skin', name: 'Satellite', description: 'View from space', price: 200, premiumOnly: true },
];

/** All cosmetics in a flat list */
export const ALL_COSMETICS: CosmeticItem[] = [
  ...THEMES,
  ...AVATARS,
  ...CARD_BACKS,
  ...BOARD_SKINS,
];

export function getCosmeticById(id: string): CosmeticItem | undefined {
  return ALL_COSMETICS.find((c) => c.id === id);
}

// ============ COIN PACKAGES ============

export interface CoinPackage {
  id: string;
  coins: number;
  priceUsd: number;
  popular?: boolean;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'coins-100', coins: 100, priceUsd: 0.99 },
  { id: 'coins-600', coins: 600, priceUsd: 4.99, popular: true },
  { id: 'coins-1500', coins: 1500, priceUsd: 9.99 },
];

// ============ SUBSCRIPTION ============

export interface SubscriptionPlan {
  id: string;
  name: string;
  interval: 'month' | 'year';
  priceUsd: number;
  coinsPerMonth: number;
  benefits: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'premium-monthly',
    name: 'Railbound Premium',
    interval: 'month',
    priceUsd: 5.99,
    coinsPerMonth: 500,
    benefits: [
      '500 coins every month',
      'Exclusive cosmetics',
      'Priority matchmaking',
      'No ads',
    ],
  },
  {
    id: 'premium-yearly',
    name: 'Railbound Premium (Annual)',
    interval: 'year',
    priceUsd: 49.99,
    coinsPerMonth: 500,
    benefits: [
      '500 coins every month',
      'Exclusive cosmetics',
      'Priority matchmaking',
      'No ads',
      'Save 30% vs monthly',
    ],
  },
];
