// app/settings/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import WalletBadge from "@/components/WalletBadge";
import AddCoinsButton from "@/components/AddCoinsButton";
import ProfileSettingsForm from "./ProfileSettingsForm";

export default async function SettingsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load profile (so the form doesn’t flicker)
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role, first_name, last_name, phone, email")
    .eq("id", user.id)
    .single();

  // Load wallet balance for badge
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-6 p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="flex items-center gap-4">
        <WalletBadge initial={Number(wallet?.balance ?? 0)} />
        <AddCoinsButton />
      </div>

      <ProfileSettingsForm
        userId={user.id}
        initial={{
          username: profile?.username ?? "",
          role: profile?.role ?? "consumer",
          firstName: profile?.first_name ?? "",
          lastName: profile?.last_name ?? "",
          phone: profile?.phone ?? "",
          email: profile?.email ?? "",
        }}
      />
    </div>
  );
}
