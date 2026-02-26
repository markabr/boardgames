"use client";

import { useCosmeticsStore } from "@/lib/stores/cosmetics-store";
import {
  ALL_COSMETICS,
  COIN_PACKAGES,
} from "@railbound/game-logic/shared";
import type { CosmeticType, CosmeticItem } from "@railbound/game-logic/shared";
import { Navbar } from "@/components/platform/navbar";
import { showToast } from "@/components/platform/toast";

const TYPE_LABELS: Record<CosmeticType, string> = {
  theme: "Themes",
  avatar: "Avatars",
  card_back: "Card Backs",
  board_skin: "Board Skins",
};

const SECTIONS: CosmeticType[] = ["theme", "avatar", "card_back", "board_skin"];

function CosmeticCard({ item }: { item: CosmeticItem }) {
  const { ownedIds, addOwned, equip, spendCoins, isPremium, coins } =
    useCosmeticsStore();
  const owned = ownedIds.includes(item.id);
  const equipped =
    useCosmeticsStore((s) => {
      switch (item.type) {
        case "theme":
          return s.equippedTheme === item.id;
        case "avatar":
          return s.equippedAvatar === item.id;
        case "card_back":
          return s.equippedCardBack === item.id;
        case "board_skin":
          return s.equippedBoardSkin === item.id;
      }
    });

  const handleClick = () => {
    if (owned) {
      equip(item.type, item.id);
      showToast(`Equipped ${item.name}`, "success");
      return;
    }

    if (item.premiumOnly && !isPremium) {
      showToast("Premium required", "error");
      return;
    }

    if (item.price > 0) {
      if (!spendCoins(item.price)) {
        showToast("Not enough coins", "error");
        return;
      }
    }

    addOwned(item.id);
    equip(item.type, item.id);
    showToast(`Purchased and equipped ${item.name}!`, "success");
  };

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-lg ${
        equipped
          ? "border-amber-500 bg-amber-900/20 shadow-amber-500/20"
          : owned
            ? "border-gray-600 bg-gray-800/50 hover:border-gray-500"
            : "border-gray-700 bg-gray-800/30 hover:border-gray-500"
      }`}
      onClick={handleClick}
    >
      {/* Preview swatch for themes */}
      {item.type === "theme" && item.previewColor && (
        <div
          className="w-full h-12 rounded-lg mb-3"
          style={{ background: item.previewColor }}
        />
      )}
      <div className="font-bold text-sm text-gray-100">{item.name}</div>
      <div className="text-xs text-gray-400 mb-2">{item.description}</div>
      <div className="flex items-center justify-between">
        {equipped ? (
          <span className="text-xs text-amber-400 font-bold">Equipped</span>
        ) : owned ? (
          <span className="text-xs text-gray-500">Owned</span>
        ) : item.price === 0 ? (
          <span className="text-xs text-green-400">Free</span>
        ) : (
          <span className="text-xs text-yellow-400 font-bold">
            {item.price} coins
          </span>
        )}
        {item.premiumOnly && !isPremium && !owned && (
          <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded">
            Premium
          </span>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { coins } = useCosmeticsStore();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700 pt-4 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-orange-50 font-serif">
              Shop
            </h1>
            <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg px-3 py-1.5 text-yellow-300 text-sm font-bold">
              {coins} coins
            </div>
          </div>

          {/* Coin packages */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-200 mb-3">
              Buy Coins
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {COIN_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-xl border-2 p-4 text-center cursor-pointer hover:shadow-lg transition-all ${
                    pkg.popular
                      ? "border-yellow-500 bg-yellow-900/20"
                      : "border-gray-700 bg-gray-800/30 hover:border-gray-500"
                  }`}
                >
                  {pkg.popular && (
                    <div className="text-[10px] text-yellow-400 font-bold mb-1">
                      BEST VALUE
                    </div>
                  )}
                  <div className="text-2xl font-bold text-yellow-300">
                    {pkg.coins}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">coins</div>
                  <div className="text-sm font-bold text-gray-200">
                    ${pkg.priceUsd.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cosmetics by category */}
          {SECTIONS.map((type) => {
            const items = ALL_COSMETICS.filter((c) => c.type === type);
            return (
              <div key={type} className="mb-6">
                <h2 className="text-lg font-bold text-gray-200 mb-3">
                  {TYPE_LABELS[type]}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((item) => (
                    <CosmeticCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
