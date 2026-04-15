import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase未設定" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const sessionId = body?.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionIdなし" },
        { status: 400 }
      );
    }

    const existing = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existing.data?.id) {
      return NextResponse.json({ success: true });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });

    const orderInsert = await supabase
      .from("orders")
      .insert({
        stripe_session_id: session.id,
        customer_email: session.customer_details?.email || "",
        total_amount: session.amount_total || 0,
        currency: session.currency || "jpy",
        payment_status: session.payment_status,
      })
      .select("id")
      .single();

    const orderId = orderInsert.data.id;

    const items = session.line_items?.data || [];

    const itemsPayload = items.map((item) => ({
      order_id: orderId,
      product_name: item.description,
      unit_amount: item.price?.unit_amount || 0,
      quantity: item.quantity || 1,
      subtotal:
        (item.price?.unit_amount || 0) * (item.quantity || 1),
    }));

    await supabase.from("order_items").insert(itemsPayload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error?.message || "保存失敗" },
      { status: 500 }
    );
  }
}
