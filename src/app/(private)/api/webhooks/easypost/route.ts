import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../../../../types/supabase";

// Admin client (server only; do NOT expose this key to the browser)
const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // has RLS bypass
  { auth: { persistSession: false } }
);

// Optional: verify EasyPost signature if you enable it
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);
    const tracker = payload?.result?.tracker;
    if (!tracker?.id) return NextResponse.json({ ok: true });

    const latestStatus = tracker.status ?? null;
    const estDelivery  = tracker.est_delivery_date ?? null;
    const lastEvent    = tracker.tracking_details?.[tracker.tracking_details.length - 1] ?? null;

    const { error } = await admin
      .from("orders")
      .update({
        tracking_status: latestStatus,
        tracking_estimated: estDelivery ? new Date(estDelivery).toISOString() : null,
        tracking_last_event: lastEvent || null,
      })
      .eq("tracker_id", tracker.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "bad payload" }, { status: 400 });
  }
}
