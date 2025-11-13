// src/lib/supabase-server.ts
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerComponentClient<Database>({
    cookies: () => cookieStore as any, // ✅ Cast to satisfy Supabase helpers
  });
};
