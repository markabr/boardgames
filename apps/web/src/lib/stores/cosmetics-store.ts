import { create } from "zustand";

interface CosmeticsStore {
  ownedIds: string[];
  equippedTheme: string;
  equippedAvatar: string;
  equippedCardBack: string;
  equippedBoardSkin: string;
  coins: number;
  isPremium: boolean;

  setOwned: (ids: string[]) => void;
  addOwned: (id: string) => void;
  equip: (type: "theme" | "avatar" | "card_back" | "board_skin", id: string) => void;
  setCoins: (coins: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  setIsPremium: (isPremium: boolean) => void;
  reset: () => void;
}

const DEFAULTS = {
  ownedIds: ["theme-default", "avatar-train", "back-classic", "skin-parchment"],
  equippedTheme: "theme-default",
  equippedAvatar: "avatar-train",
  equippedCardBack: "back-classic",
  equippedBoardSkin: "skin-parchment",
  coins: 0,
  isPremium: false,
};

export const useCosmeticsStore = create<CosmeticsStore>((set, get) => ({
  ...DEFAULTS,

  setOwned: (ids) => set({ ownedIds: ids }),
  addOwned: (id) =>
    set((state) => ({
      ownedIds: state.ownedIds.includes(id)
        ? state.ownedIds
        : [...state.ownedIds, id],
    })),
  equip: (type, id) => {
    switch (type) {
      case "theme":
        set({ equippedTheme: id });
        break;
      case "avatar":
        set({ equippedAvatar: id });
        break;
      case "card_back":
        set({ equippedCardBack: id });
        break;
      case "board_skin":
        set({ equippedBoardSkin: id });
        break;
    }
  },
  setCoins: (coins) => set({ coins }),
  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
  spendCoins: (amount) => {
    const { coins } = get();
    if (coins < amount) return false;
    set({ coins: coins - amount });
    return true;
  },
  setIsPremium: (isPremium) => set({ isPremium }),
  reset: () => set(DEFAULTS),
}));
