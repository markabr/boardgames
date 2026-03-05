"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGuestName } from "@/lib/guest-auth";

export function Navbar() {
  const [initial, setInitial] = useState("?");

  useEffect(() => {
    setInitial(getGuestName().charAt(0).toUpperCase());
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Railbound
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/shop"
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Shop
          </Link>
          <Link
            href="/premium"
            className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Premium
          </Link>
          <Link
            href="/home"
            className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 hover:bg-gray-600 transition-colors"
          >
            {initial}
          </Link>
        </div>
      </div>
    </nav>
  );
}
