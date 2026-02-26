"use client";

import { Navbar } from "@/components/platform/navbar";
import { SUBSCRIPTION_PLANS } from "@railbound/game-logic/shared";

export default function PremiumPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700 pt-4 px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-orange-50 font-serif mb-2">
              Railbound Premium
            </h1>
            <p className="text-gray-400">
              Unlock the full experience with exclusive content and rewards
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-6 ${
                  plan.interval === "year"
                    ? "border-yellow-500 bg-yellow-900/10"
                    : "border-gray-600 bg-gray-800/30"
                }`}
              >
                {plan.interval === "year" && (
                  <div className="text-[10px] text-yellow-400 font-bold mb-2 uppercase tracking-wider">
                    Best Value
                  </div>
                )}
                <div className="text-xl font-bold text-gray-100 mb-1">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-orange-50">
                    ${plan.priceUsd.toFixed(2)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    /{plan.interval}
                  </span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-green-400 text-xs">&#x2713;</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-xl bg-amber-800 text-white font-bold hover:bg-amber-700 transition-colors cursor-pointer">
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
