// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Database } from "./types/supabase";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Session exists, allow access
  // Profile completion checks are now handled at action-level (e.g., when buying)

  return res;
}

export const config = {
  matcher: [
    // Run on everything EXCEPT:
    //  - next.js internals and assets
    //  - favicon
    //  - login page
    "/((?!_next/static|_next/image|favicon.ico|login).*)",
  ],
};
