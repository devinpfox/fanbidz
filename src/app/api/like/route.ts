import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "../../../../types/supabase";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const { listingId } = await req.json();

  if (!session?.user.id) return NextResponse.error();

  await supabase.from("likes").insert({
    user_id: session.user.id,
    listing_id: listingId,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const { listingId } = await req.json();

  if (!session?.user.id) return NextResponse.error();

  await supabase.from("likes")
    .delete()
    .eq("user_id", session.user.id)
    .eq("listing_id", listingId);

  return NextResponse.json({ success: true });
}
