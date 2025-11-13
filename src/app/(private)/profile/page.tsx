"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error(`Error: ${res.statusText}`);

        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p>Error loading profile: {error}</p>;
  if (!profile) return <p>No profile found.</p>;

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p><strong>Username:</strong> {profile.username}</p>
      <p><strong>Name:</strong> {profile.first_name} {profile.last_name}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Phone:</strong> {profile.phone}</p>
      <p><strong>Role:</strong> {profile.role}</p>
    </div>
  );
}
