import { createServerSupabaseClient } from "@/lib/supabase-server";
import SupabaseProvider from "@/app/supabase-provider";
import { AuthProvider } from "@/context/AuthContext";
import { ListingProvider } from "@/context/ListingContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppNav from "@/components/AppNav";
import WalletWidget from "@/components/WalletWidget";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  // Get session on the server
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Load profile (server-side, fast)
  const profile = session
    ? (
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
      ).data
    : null;

  return (
    <SupabaseProvider session={session}>
      {/* AuthProvider MUST wrap everything that needs supabase user */}
      <AuthProvider initialSession={session} initialProfile={profile}>

        {/* ListingProvider must wrap any page using useListings() */}
        <ListingProvider>
          <ProtectedRoute>
            <main className="flex-1">{children}</main>
            <AppNav />
            <WalletWidget />
          </ProtectedRoute>
        </ListingProvider>

      </AuthProvider>
    </SupabaseProvider>
  );
}
