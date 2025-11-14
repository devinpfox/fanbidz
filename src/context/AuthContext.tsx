"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/supabase";

type Profile = Tables<"profiles">;

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  supabase: SupabaseClient<Database, any>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
  initialSession = null,
  initialProfile = null,
}: {
  children: React.ReactNode;
  initialSession?: Session | null;
  initialProfile?: Profile | null;
}) {
  const supabase = useSupabaseClient<Database>();
  const [user, setUser] = useState(initialSession?.user ?? null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(true);

  // Extract loadProfile so we can reuse it
  const loadProfile = async (uid: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();
    setProfile(profileData);
    return profileData;
  };

  // Add refreshProfile method
  const refreshProfile = async () => {
    if (!user?.id) return;
    await loadProfile(user.id);
  };

  useEffect(() => {
    // If we have both initialSession and initialProfile, we're fully loaded
    if (initialSession?.user && initialProfile) {
      setLoading(false);
      return;
    }

    // If we have initialSession but no initialProfile, load profile then set loading false
    if (initialSession?.user && !initialProfile) {
      loadProfile(initialSession.user.id).finally(() => setLoading(false));
    }
    // If we have no initialSession, get session and profile, then set loading false
    else if (!initialSession) {
      const getSessionAndProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      };
      getSessionAndProfile();
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSession, initialProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, supabase, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
