// app/settings/ProfileSettingsForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "../../../types/supabase";

type Props = {
  userId: string;
  initial: {
    username: string;
    role: "consumer" | "creator" | string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
};

export default function ProfileSettingsForm({ userId, initial }: Props) {
  const supabase = useSupabaseClient<Database>();
  const router = useRouter();

  const [username, setUsername] = useState(initial.username);
  const [role, setRole] = useState(initial.role);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("profiles").upsert([
      {
        id: userId,
        email,
        username,
        role,
        first_name: firstName,
        last_name: lastName,
        phone,
      },
    ]);

    setSaving(false);

    if (error) {
      alert(error.message || "Could not save profile.");
      return;
    }
    alert("Profile saved!");
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-pink-600">Profile Settings</h2>

      <input className="w-full border p-2" placeholder="Username"
        value={username} onChange={(e) => setUsername(e.target.value)} required />

      <input className="w-full border p-2" placeholder="First Name"
        value={firstName} onChange={(e) => setFirstName(e.target.value)} required />

      <input className="w-full border p-2" placeholder="Last Name"
        value={lastName} onChange={(e) => setLastName(e.target.value)} required />

      <input className="w-full border p-2" placeholder="Phone Number"
        value={phone} onChange={(e) => setPhone(e.target.value)} required />

      <input className="w-full border p-2" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} />

      <select className="w-full border p-2" value={role} onChange={(e) => setRole(e.target.value)} required>
        <option value="consumer">Consumer</option>
        <option value="creator">Creator</option>
      </select>

      <button disabled={saving} className="w-full bg-pink-600 text-white p-2 rounded">
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
