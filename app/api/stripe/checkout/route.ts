import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

type PlanType = "monthly_2" | "monthly_4" | "monthly_8";

const PRICE_ID_MAP: Record<PlanType, string | undefined> = {
  monthly_2: process.env.STRIPE_PRICE_MONTHLY_2,
  monthly_4: process.env.STRIPE_PRICE_MONTHLY_4,
  monthly_8: process.env.STRIPE_PRICE_MONTHLY_8,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plan = body?.plan as PlanType | undefined;
    const customerName = body?.customerName as string | undefined;
    const customerEmail = body?.customerEmail as string | undefined;

    if (!plan || !PRICE_ID_MAP[plan]) {
      return NextResponse.json(
        { error: "無効なプランです。" },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_ID_MAP[plan],
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscription/cancel`,
      customer_email: customerEmail || undefined,
      metadata: {
        plan,
        customerName: customerName || "",
        customerEmail: customerEmail || "",
      },
      subscription_data: {
        metadata: {
          plan,
          customerName: customerName || "",
          customerEmail: customerEmail || "",
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session create error:", error);
    return NextResponse.json(
      { error: "チェックアウトの作成に失敗しました。" },
      { status: 500 }
    );
  }
}
