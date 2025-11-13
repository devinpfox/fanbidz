"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";

export default function ProfileGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const router = useRouter();
  const supabase = useSupabaseClient<Database["public"]>();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // required fields missing → push
      if (!profile ||
          !profile.username ||
          !profile.first_name ||
          !profile.last_name ||
          (requiredRole && profile.role !== requiredRole)
      ) {
        return router.push("/profile-settings");
      }

      setChecking(false);
    }

    checkProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, requiredRole]);

  if (checking) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">

        {/* Floating sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-sparkle absolute top-1/3 left-1/4 w-3 h-3 bg-pink-300/50 rounded-full blur-sm"></div>
          <div className="animate-sparkle2 absolute top-2/3 right-1/4 w-2 h-2 bg-pink-400/60 rounded-full blur-sm"></div>
          <div className="animate-sparkle3 absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-fuchsia-300/60 rounded-full blur-[2px]"></div>
        </div>

        {/* The cute blob character */}
        <div className="relative flex flex-col items-center">
          <div
            className="relative w-28 h-28 rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-500 shadow-xl shadow-pink-500/40 
            animate-blobBounce flex items-center justify-center"
          >
            {/* Face */}
            <div className="flex items-center gap-2">
              {/* eyes blink */}
              <div className="w-3 h-3 bg-white rounded-full animate-blink" />
              <div className="w-3 h-3 bg-white rounded-full animate-blink delay-150" />
            </div>

            {/* tiny mouth */}
            <div className="absolute bottom-8 w-4 h-1 rounded-full bg-white/90" />
          </div>

          {/* text */}
          <p className="mt-6 text-pink-600 font-medium text-lg animate-pulse">
            Checking your profile…
          </p>
        </div>

        {/* Animations */}
        <style jsx>{`
          @keyframes blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
          }
          .animate-blink {
            animation: blink 3s infinite;
          }

          @keyframes blobBounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-10px) scale(1.03); }
          }
          .animate-blobBounce {
            animation: blobBounce 2.2s infinite ease-in-out;
          }

          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0.8) translateY(0); }
            50% { opacity: 1; transform: scale(1.1) translateY(-8px); }
          }
          .animate-sparkle { animation: sparkle 3s infinite 0.2s; }
          .animate-sparkle2 { animation: sparkle 3.4s infinite 0.5s; }
          .animate-sparkle3 { animation: sparkle 2.8s infinite 0.9s; }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
