"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "../../types/supabase"; // adjust if needed

export default function ProfileGuard({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) {
  const router = useRouter();
  const supabase = useSupabaseClient<Database>(); // <--- use the hook!
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/profile-settings");
        return;
      }

      if (!profile.username || !profile.first_name || !profile.last_name) {
        router.push("/profile-settings");
        return;
      }

      if (requiredRole && profile.role !== requiredRole) {
        router.push("/profile-settings");
        return;
      }

      setChecking(false);
    }
    checkProfile();
  }, [router, requiredRole, supabase]);

  if (checking) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12">
        <span className="text-[rgb(255,78,207)] font-semibold">Checking your profile...</span>
      </div>
    );
  }

  return <>{children}</>;
}
