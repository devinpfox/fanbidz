"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function LoginPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let emailToUse = identifier;
  
    // Handle username login
    if (!identifier.includes("@")) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", identifier)
        .single();
  
      if (profileError || !profile) {
        alert("No user found with that username.");
        return;
      }
  
      const { data: userData } = await supabase
        .from("users_extended")
        .select("email")
        .eq("id", profile.id)
        .single();
  
      if (!userData?.email) {
        alert("Could not find user email.");
        return;
      }
  
      emailToUse = userData.email;
    }
  
    // Sign in
    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });
  
    if (error) {
      alert("Login failed: " + error.message);
      return;
    }
  
    // Fetch session and user
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Session data:", sessionData);
if (!sessionData?.session) {
  alert("No active session found, cannot fetch profile.");
  return;
}
    const user = sessionData?.session?.user;
  
    console.log("Current user:", user);
    if (!user) {
      alert("No authenticated user.");
      return;
    }
  
    // Fetch profile with error check
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
  
    if (profileError) {
      console.error("Profile fetch error:", profileError);
      alert("Failed to fetch profile info.");
      return;
    }
  
    // Redirect if profile incomplete
    if (!profile || !profile.username || !profile.first_name || !profile.last_name) {
      router.push("/profile-settings");
      return;
    }
  
    // Redirect if profile complete
    router.push("/");
  };
  

  return (
    <form onSubmit={handleLogin} className="space-y-4 p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-pink-600">Login</h1>
      <input
        className="w-full border p-2"
        placeholder="Username or Email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <input
        className="w-full border p-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className="w-full bg-pink-600 text-white p-2 rounded">
        Log In
      </button>
    </form>
  );
}
