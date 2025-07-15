"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Remove all profile info except email/password for signup step
  // const [username, setUsername] = useState("");
  // const [role, setRole] = useState("consumer");
  // const [firstName, setFirstName] = useState("");
  // const [lastName, setLastName] = useState("");
  // const [phone, setPhone] = useState("");

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Sign up with Supabase Auth (email & password only)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user) {
      alert(signUpError?.message || "Signup failed.");
      return;
    }

    // 2. Prompt user to confirm email and login after confirmation
    alert("Check your email to confirm your account!");
    router.push("/check-email"); // Or show message on this page
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4 p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-pink-600">Sign Up</h1>
      <input
        className="w-full border p-2"
        placeholder="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full border p-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button className="w-full bg-pink-600 text-white p-2 rounded">
        Sign Up
      </button>
    </form>
  );
}
