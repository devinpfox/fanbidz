"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "../../../types/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ProfileSettingsPage() {
    const supabase = useSupabaseClient<Database>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("consumer");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user, 'Error:', userError);
  
      if (!user) {
        router.push("/login");
        return;
      }
  
      setUserId(user.id); // <-- Add this line!
  
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
  
      console.log('Profile:', profile, 'Error:', profileError);
  
      if (profile) {
        setUsername(profile.username || "");
        setRole(profile.role || "consumer");
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setPhone(profile.phone || "");
      }
  
      setLoading(false);
    }
    fetchProfile();
  }, [router]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;

    // Upsert profile
    const { error } = await supabase.from("profiles").upsert([
      {
        id: userId,
        email,
        username,
        role,
        first_name: firstName,
        last_name: lastName,
        phone,
        rating: 0.0,        // Only used if new
        rating_count: 0,    // Only used if new
      },
    ]);

    if (error) {
      alert(error.message || "Could not save profile.");
      return;
    }
    alert("Profile saved!");
    router.push("/"); // Or anywhere you want
  };

  if (loading) return <div>Loading...</div>;

  return (
    <ProtectedRoute>
    <form onSubmit={handleSubmit} className="space-y-4 p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-pink-600">Profile Settings</h1>
      <input
        className="w-full border p-2"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <input
        className="w-full border p-2"
        placeholder="First Name"
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        required
      />
      <input
        className="w-full border p-2"
        placeholder="Last Name"
        value={lastName}
        onChange={e => setLastName(e.target.value)}
        required
      />
      <input
        className="w-full border p-2"
        placeholder="Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        required
      />
      <select
        className="w-full border p-2"
        value={role}
        onChange={e => setRole(e.target.value)}
        required
      >
        <option value="consumer">Consumer</option>
        <option value="creator">Creator</option>
      </select>
      <button className="w-full bg-pink-600 text-white p-2 rounded">
        Save Profile
      </button>
    </form>
    </ProtectedRoute>
  );
}
