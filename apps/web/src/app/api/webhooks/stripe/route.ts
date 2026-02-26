import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const COIN_MAP: Record<string, number> = {
  "coins-100": 100,
  "coins-600": 600,
  "coins-1500": 1500,
};

const SUBSCRIPTION_MONTHLY_COINS = 500;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, packageId } = session.metadata || {};
      if (!userId || !packageId) break;

      if (COIN_MAP[packageId]) {
        // Credit coins
        const { error } = await getSupabase().rpc("add_coins", {
          p_user_id: userId,
          p_amount: COIN_MAP[packageId],
        });
        if (error) console.error("Failed to credit coins:", error);

        // Record transaction
        await getSupabase().from("transactions").insert({
          user_id: userId,
          type: "coin_purchase",
          amount_usd: (session.amount_total || 0) / 100,
          coins_amount: COIN_MAP[packageId],
          stripe_session_id: session.id,
        });
      } else if (packageId.startsWith("premium-")) {
        // Activate subscription
        const { error } = await getSupabase()
          .from("profiles")
          .update({ is_premium: true, stripe_customer_id: session.customer })
          .eq("id", userId);
        if (error) console.error("Failed to activate premium:", error);

        // Credit initial monthly coins
        await getSupabase().rpc("add_coins", {
          p_user_id: userId,
          p_amount: SUBSCRIPTION_MONTHLY_COINS,
        });

        await getSupabase().from("transactions").insert({
          user_id: userId,
          type: "subscription",
          amount_usd: (session.amount_total || 0) / 100,
          coins_amount: SUBSCRIPTION_MONTHLY_COINS,
          stripe_session_id: session.id,
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      // Check if this invoice is tied to a subscription
      const subInfo = (invoice as any).subscription;
      if (!subInfo) break;

      // Recurring subscription payment - credit monthly coins
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer as any)?.id;

      const { data: profile } = await getSupabase()
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await getSupabase().rpc("add_coins", {
          p_user_id: profile.id,
          p_amount: SUBSCRIPTION_MONTHLY_COINS,
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : (subscription.customer as any)?.id;

      const { error } = await getSupabase()
        .from("profiles")
        .update({ is_premium: false })
        .eq("stripe_customer_id", customerId);
      if (error) console.error("Failed to deactivate premium:", error);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
