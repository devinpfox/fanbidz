
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Must use the response from createMiddlewareClient!
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  // Get the session, but do NOT try to read cookies directly
  await supabase.auth.getSession();
  return res;
}

export const config = {
  matcher: [
    // Run on everything EXCEPT:
    //  - next.js internals and assets
    //  - favicon
    //  - login page
    '/((?!_next/static|_next/image|favicon.ico|login).*)',
  ],
};