"use client";
import { useState } from "react";
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm p-8 bg-white rounded-xl shadow space-y-6"
        autoComplete="off"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <span className="text-5xl font-extrabold select-none">
            <span
              className="bg-gradient-to-r from-pink-600 to-purple-500 text-transparent bg-clip-text"
              style={{ fontFamily: "sans-serif" }}
            >
              Only
            </span>
            <span className="text-gray-800">Bidz</span>
          </span>
        </div>

        {/* Inputs */}
        <input
          className="w-full border border-gray-300 rounded px-4 py-3 text-lg focus:outline-pink-600"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <input
            className="w-full border border-gray-300 rounded px-4 py-3 text-lg pr-12 focus:outline-pink-600"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        {/* Sign Up Button */}
        <button
          className="w-full bg-pink-600 text-white py-3 rounded text-lg font-semibold"
          type="submit"
        >
          Sign Up
        </button>

        {/* Already have account */}
        <div className="text-center text-gray-400 text-base">
          Already have an account?{" "}
          <span
            className="text-black font-medium cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Sign in
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
          className="w-full flex items-center justify-center gap-3 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium"
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
