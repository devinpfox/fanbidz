"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Image from "next/image";

export default function LoginPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false); 

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  const id = identifier.trim();
  const isEmail = /\S+@\S+\.\S+/.test(id);
  const isPhone = /^\+?[0-9\s\-().]{7,}$/.test(id); // crude check; tweak per your locale

  let emailToUse: string | null = null;

  try {
    // 1) Resolve email if needed
    if (isEmail) {
      emailToUse = id;
    } else if (isPhone) {
      // Phone sign-in (if enabled in your project) — uses `phone` instead of email
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: id,
        password,
      });
      if (error) throw error;
    } else {
      // Username path via RPC (secure)
      // Username path via RPC (secure)
const { data: rpcEmail, error: rpcErr } = await supabase
.rpc("get_email_by_username", { p_username: id.toLowerCase() });

console.log("RPC result:", { rpcEmail, rpcErr });

if (rpcErr || !rpcEmail) {
alert("Invalid credentials");
return;
}
emailToUse = rpcEmail as string;

    }

    // 2) Email sign-in (if we haven't already done phone)
    if (emailToUse) {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });
      if (error) {
        // keep generic
        alert("Invalid credentials");
        return;
      }
    }

    // 3) Confirm session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      alert("Login failed. Please try again.");
      return;
    }

    const user = sessionData.session.user;
    if (!user) {
      alert("Login failed. Please try again.");
      return;
    }

    // 4) Fetch profile (server has a session cookie now)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id) // or .eq("user_id", user.id) if that's your schema
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      alert("Failed to fetch profile info.");
      return;
    }

    // 5) Redirect based on completeness
    if (!profile?.username || !profile?.first_name || !profile?.last_name) {
      router.push("/profile-settings");
      return;
    }

    router.push("/");
  } catch (err: any) {
    console.error(err);
    alert("Something went wrong. Please try again.");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm p-8 bg-white rounded-xl shadow space-y-6"
        autoComplete="off"
      >
      {/* Logo */}
<div className="flex justify-center">
  <Image
    src="/fanbids-logo.svg"   // place file at /public/fanbids-logo.png
    alt="Fanbids Logo"
    width={200}
    height={60}
    priority
  />
</div>
        {/* Inputs */}
        <input
          className="w-full border border-gray-300 rounded px-4 py-3 text-lg focus:outline-[rgb(255,78,207)]"
          placeholder="Phone number, email or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
          required
        />
        <div className="relative">
          <input
            className="w-full border border-gray-300 rounded px-4 py-3 text-lg pr-12 focus:outline-[rgb(255,78,207)]"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth={2} d="M17.94 17.94A10.01 10.01 0 0 1 12 20c-5.523 0-10-7-10-8s4.477-8 10-8a9.97 9.97 0 0 1 5.47 1.61M1 1l22 22" />
              </svg>
            ) : (
              <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                <ellipse cx={12} cy={12} rx={10} ry={8} stroke="currentColor" strokeWidth={2} />
                <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={2} />
              </svg>
            )}
          </button>
        </div>
  
        {/* Sign Up button */}
        <button
          className="w-full bg-blue-400 text-white py-3 rounded text-lg font-semibold"
          type="submit"
        >
          Sign In
        </button>
  
        {/* Already have an account */}
        <div className="text-center text-gray-400 text-base">
          Don't have an account yet?{" "}
          <span
            className="text-black font-medium cursor-pointer"
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </span>
        </div>
  
        {/* Divider */}
        <div className="flex items-center gap-4">
          <hr className="flex-1 border-gray-300" />
          <span className="text-gray-500 text-base font-medium">OR</span>
          <hr className="flex-1 border-gray-300" />
        </div>
  
        {/* Facebook Sign Up */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 rounded bg-[rgb(255,78,207)] hover:bg-blue-700 text-white text-lg font-medium"
        >
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="white"
            className="mr-2"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 6.019 4.438 10.987 10.125 11.854v-8.385h-3.047v-3.469h3.047v-2.64c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.953.926-1.953 1.874v2.247h3.328l-.532 3.469h-2.796v8.385c5.688-.867 10.125-5.835 10.125-11.854z"/>
          </svg>
          Sign Up with Facebook
        </button>
      </form>
    </div>
  );

}