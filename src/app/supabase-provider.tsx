"use client";

import { useState } from "react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import type { Session } from "@supabase/supabase-js";

export default function SupabaseProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  // lazy init avoids re-creating client on every render
  const [supabaseClient] = useState(() =>
    createClientComponentClient<Database>()
  );

  return (
    <SessionContextProvider
      // ✅ cast to the exact type that SessionContextProvider expects
      supabaseClient={supabaseClient as any}
      initialSession={session}
    >
      {children}
    </SessionContextProvider>
  );
}
