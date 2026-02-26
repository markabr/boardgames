import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
}

const PRICE_MAP: Record<string, { amount: number; name: string; mode: "payment" | "subscription" }> = {
  // Coin packages
  "coins-100": { amount: 99, name: "100 Coins", mode: "payment" },
  "coins-600": { amount: 499, name: "600 Coins", mode: "payment" },
  "coins-1500": { amount: 999, name: "1500 Coins", mode: "payment" },
  // Subscriptions
  "premium-monthly": { amount: 599, name: "Railbound Premium (Monthly)", mode: "subscription" },
  "premium-yearly": { amount: 4999, name: "Railbound Premium (Annual)", mode: "subscription" },
};

export async function POST(req: NextRequest) {
  try {
    const { packageId, userId } = await req.json();

    const priceInfo = PRICE_MAP[packageId];
    if (!priceInfo) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: priceInfo.mode,
      success_url: `${appUrl}/shop?success=true`,
      cancel_url: `${appUrl}/shop?canceled=true`,
      metadata: { userId, packageId },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: priceInfo.name },
            unit_amount: priceInfo.amount,
            ...(priceInfo.mode === "subscription"
              ? {
                  recurring: {
                    interval: packageId.includes("yearly") ? "year" : "month",
                  },
                }
              : {}),
          },
          quantity: 1,
        },
      ],
    };

    const session = await getStripe().checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
