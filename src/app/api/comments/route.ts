import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { searchParams } = new URL(req.url);
  const listing_id = searchParams.get("listing_id");
  if (!listing_id) return NextResponse.json({ error: "listing_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("comments")
    .select("id, user_id, content, created_at")
    .eq("listing_id", listing_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data });
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listing_id, content } = await req.json();
  if (!listing_id || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { error } = await supabase.from("comments")
    .insert({ listing_id, user_id: user.id, content });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
