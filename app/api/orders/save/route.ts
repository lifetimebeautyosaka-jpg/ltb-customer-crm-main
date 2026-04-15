import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase environment variables are not set.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = body?.session_id as string | undefined;

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "session_id がありません" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details"],
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Stripeセッションが見つかりません" },
        { status: 404 }
      );
    }

    // すでに保存済みなら二重登録しない
    const existingOrder = await supabase
      .from("orders")
      .select("id, stripe_session_id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existingOrder.error) {
      throw new Error(existingOrder.error.message);
    }

    if (existingOrder.data) {
      return NextResponse.json({
        ok: true,
        message: "既に保存済みです",
        order_id: existingOrder.data.id,
        duplicated: true,
      });
    }

    const customerEmail = session.customer_details?.email ?? "";
    const customerName = session.customer_details?.name ?? "";
    const totalAmount = session.amount_total ?? 0;
    const currency = session.currency ?? "jpy";
    const paymentStatus = session.payment_status ?? "paid";

    const orderInsert = await supabase
      .from("orders")
      .insert({
        stripe_session_id: session.id,
        customer_email: customerEmail,
        customer_name: customerName,
        total_amount: totalAmount,
        currency,
        payment_status: paymentStatus,
        order_status: "paid",
      })
      .select("id")
      .single();

    if (orderInsert.error) {
      throw new Error(orderInsert.error.message);
    }

    if (!orderInsert.data) {
      throw new Error("注文データの保存結果が取得できませんでした");
    }

    const orderId = orderInsert.data.id;

    const items = session.line_items?.data ?? [];

    if (items.length > 0) {
      const orderItems = items.map((item) => {
        const unitAmount = item.price?.unit_amount ?? 0;
        const quantity = item.quantity ?? 1;

        return {
          order_id: orderId,
          product_name: item.description || "商品名未設定",
          unit_amount: unitAmount,
          quantity,
          subtotal: unitAmount * quantity,
        };
      });

      const orderItemsInsert = await supabase
        .from("order_items")
        .insert(orderItems);

      if (orderItemsInsert.error) {
        throw new Error(orderItemsInsert.error.message);
      }
    }

    return NextResponse.json({
      ok: true,
      order_id: orderId,
      duplicated: false,
    });
  } catch (error) {
    console.error("orders save api error:", error);

    const message =
      error instanceof Error ? error.message : "注文保存中にエラーが発生しました";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}