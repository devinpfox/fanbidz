"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user) {
      alert(signUpError?.message || "Signup failed.");
      return;
    }

    alert("Check your email to confirm your account!");
    router.push("/check-email");
  };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center 
        bg-gradient-to-br from-pink-50 via-white to-fuchsia-100
        relative overflow-hidden
      "
    >
      {/* Luxury blurred glowing accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-pink-300/30 blur-[180px] rounded-full top-[-200px] right-[-150px]" />
        <div className="absolute w-[550px] h-[550px] bg-fuchsia-400/20 blur-[160px] rounded-full bottom-[-180px] left-[-180px]" />
      </div>

      <form
        onSubmit={handleSignup}
        autoComplete="off"
        className="
          relative w-full max-w-sm 
          p-10 
          rounded-3xl 
          backdrop-blur-xl 
          bg-white/40
          border border-white/20
          shadow-[0_8px_40px_rgba(0,0,0,0.12)]
          space-y-8
        "
      >
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <Image
            src="/fanbids-logo.svg"
            alt="Fanbids Logo"
            width={240}
            height={70}
            priority
            className="drop-shadow-sm"
          />
        </div>

        {/* Email */}
        <input
          className="
            w-full px-4 py-3 text-lg rounded-2xl 
            bg-white/60 backdrop-blur border border-white/30 
            shadow-inner 
            focus:outline-none focus:ring-2 
            focus:ring-pink-500/40
          "
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password */}
        <div className="relative">
          <input
            className="
              w-full px-4 py-3 pr-12 text-lg rounded-2xl 
              bg-white/60 backdrop-blur border border-white/30 
              shadow-inner 
              focus:outline-none focus:ring-2 
              focus:ring-pink-500/40
            "
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            className="
              absolute right-4 top-1/2 -translate-y-1/2 
              text-gray-500 hover:text-gray-700 transition
            "
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth={2}
                  d="M17.94 17.94A10 10 0 0 1 12 20c-5.5 0-10-7-10-8s4.5-8 10-8a10 10 0 0 1 5.47 1.61M1 1l22 22"
                />
              </svg>
            ) : (
              <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                <ellipse cx={12} cy={12} rx={10} ry={8} stroke="currentColor" strokeWidth={2} />
                <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={2} />
              </svg>
            )}
          </button>
        </div>

        {/* Sign Up Button */}
        <button
          className="
            w-full py-3 rounded-2xl text-lg font-semibold text-white
            bg-gradient-to-r from-fuchsia-600 to-pink-500
            shadow-lg shadow-pink-500/30
            hover:opacity-90 transition
          "
          type="submit"
        >
          Sign Up
        </button>

        {/* Already have account */}
        <div className="text-center text-gray-700 text-base">
          Already have an account?{" "}
          <span
            className="text-fuchsia-600 font-semibold cursor-pointer hover:underline"
            onClick={() => router.push("/login")}
          >
            Sign In
          </span>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <hr className="flex-1 border-white/40" />
          <span className="text-gray-600 text-base font-medium">OR</span>
          <hr className="flex-1 border-white/40" />
        </div>

        {/* Facebook Sign Up */}
        <button
          type="button"
          className="
            w-full flex items-center justify-center gap-3 py-3 rounded-2xl 
            bg-blue-600 hover:bg-blue-700 
            text-white text-lg font-medium
            shadow-md shadow-blue-500/30
          "
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 6.019 4.438 10.987 10.125 11.854v-8.385h-3.047v-3.469h3.047v-2.64c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.953.926-1.953 1.874v2.247h3.328l-.532 3.469h-2.796v8.385c5.688-.867 10.125-5.835 10.125-11.854z" />
          </svg>
          Sign Up with Facebook
        </button>
      </form>
    </div>
  );
}
