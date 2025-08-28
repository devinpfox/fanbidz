"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SignOutButton() {
  const { supabase } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      router.replace("/login"); // Redirect to login page after logout
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
    >
      Sign Out
    </button>
  );
}
