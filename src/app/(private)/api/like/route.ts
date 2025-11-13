import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "../../../../../types/supabase";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database["public"]>({ cookies });
  
  // ✅ FIX: Replaced getSession() with the verified getUser()
  const { data: { user } } = await supabase.auth.getUser(); 
  
  const { listingId } = await req.json();

  // ✅ FIX: Checking user.id directly
  if (!user?.id) return NextResponse.error();

  await supabase.from("likes").insert({
    // ✅ FIX: Using the verified user.id
    user_id: user.id, 
    listing_id: listingId,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  // ✅ FIX: Replaced getSession() with the verified getUser()
  const { data: { user } } = await supabase.auth.getUser(); 
  
  const { listingId } = await req.json();

  // ✅ FIX: Checking user.id directly
  if (!user?.id) return NextResponse.error();

  await supabase.from("likes")
    .delete()
    // ✅ FIX: Using the verified user.id
    .eq("user_id", user.id) 
    .eq("listing_id", listingId);

  return NextResponse.json({ success: true });
}