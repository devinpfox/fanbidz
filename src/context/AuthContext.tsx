"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { User } from "@supabase/supabase-js";
import type { Database } from "../../types/supabase";

type Profile = {
  id: string;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  display_name: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
};
const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabaseClient<Database>();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: fetch session and profile
  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };
    getSessionAndProfile();

    // Listen for login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profileData }) => {
            setProfile(profileData);
            setLoading(false);
          });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Debug (remove after testing)
  useEffect(() => {
    console.log("AuthContext user:", user);
    console.log("AuthContext profile:", profile);
    console.log("AuthContext loading:", loading);
  }, [user, profile, loading]);

  return (
    <AuthContext.Provider value={{ user, profile, supabase, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);