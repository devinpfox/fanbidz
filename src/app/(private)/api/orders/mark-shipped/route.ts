import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// ✅ IMPORT TablesUpdate to fix the type errors on .update()
import type { Database, Tables, TablesUpdate} from "../../../../../../types/supabase";

type OrderUpdate = Database['public']['Tables']['orders']['Update'];

function normalizeCarrier(input?: string | null) {
  if (!input) return null; // allow EasyPost auto-detect
  const k = input.trim().toLowerCase();
  if (["usps","united states postal service"].includes(k)) return "USPS";
  if (["ups","united parcel service"].includes(k))         return "UPS";
  if (["fedex","fed ex"].includes(k))                      return "FedEx";
  return null; // ignore unknowns -> auto-detect
}

const asUpdate = <T extends object>(v: T) =>
  v as unknown as Record<string, unknown>;

export async function POST(req: NextRequest) {
  try {
    const { order_id, tracking_carrier, tracking_number } = await req.json();
    if (!order_id || !tracking_number) {
      return NextResponse.json({ error: "order_id and tracking_number required" }, { status: 400 });
    }

    const supabase = createRouteHandlerClient<Database["public"]>({ cookies });

    
    // ✅ SECURITY FIX: Use getUser() for verified authentication
    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = user.id; // Use the verified user ID

    // Ensure the caller is the SELLER of this order
    const { data: order } = await supabase
    .from("orders")
    .select("id, seller_id")
    .eq("id", order_id)
    .single<{ id: string; seller_id: string }>();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.seller_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const carrier = normalizeCarrier(tracking_carrier);

    // Create tracker in EasyPost
    const epRes = await fetch("https://api.easypost.com/v2/trackers", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.EASYPOST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tracker: {
          tracking_code: String(tracking_number).trim(),
          ...(carrier ? { carrier } : {}) // omit for auto-detect
        }
      }),
    });

    const tracker = await epRes.json();
    if (!epRes.ok) {
      return NextResponse.json({ error: tracker?.error || "EasyPost error" }, { status: 400 });
    }

    const latestStatus = tracker?.status ?? null;
    const estDelivery  = tracker?.est_delivery_date ?? null;
    const lastEvent    = tracker?.tracking_details?.[tracker.tracking_details.length - 1] ?? null;

    // 🎯 TYPESCRIPT FIX: Create payload object and explicitly cast it
    const updatePayload: OrderUpdate = {
      tracking_carrier: carrier ?? tracker?.carrier ?? null,
      tracking_number,
      tracker_id: tracker?.id || null,
      tracking_status: latestStatus,
      tracking_estimated: estDelivery ? new Date(estDelivery).toISOString() : null,
      tracking_last_event: lastEvent || null,
      shipped_at: new Date().toISOString(),
      status: "shipped",
    };

    const { error: upErr } = await supabase
    .from("orders")
    .update(asUpdate(updatePayload))
    .eq("id", order_id);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, tracker_id: tracker?.id, status: latestStatus, est_delivery: estDelivery });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}