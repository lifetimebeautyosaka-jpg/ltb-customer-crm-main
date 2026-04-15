import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase環境変数が設定されていません" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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

    if (!session?.id) {
      return NextResponse.json(
        { ok: false, error: "Stripeセッションが見つかりません" },
        { status: 404 }
      );
    }

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
        duplicated: true,
        order_id: existingOrder.data.id,
      });
    }

    const orderInsert = await supabase
      .from("orders")
      .insert({
        stripe_session_id: session.id,
        customer_email: session.customer_details?.email ?? "",
        customer_name: session.customer_details?.name ?? "",
        total_amount: session.amount_total ?? 0,
        currency: session.currency ?? "jpy",
        payment_status: session.payment_status ?? "paid",
        order_status: "paid",
      })
      .select("id")
      .single();

    if (orderInsert.error) {
      throw new Error(orderInsert.error.message);
    }

    const orderId = orderInsert.data?.id;
    if (!orderId) {
      throw new Error("注文IDの取得に失敗しました");
    }

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
      duplicated: false,
      order_id: orderId,
    });
  } catch (error) {
    console.error("orders save api error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "注文保存中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}