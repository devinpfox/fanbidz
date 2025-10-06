"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "../../../types/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import AccountTypePicker, { Role } from "../api/settings/AccountTypePicker";

// little inline camera icon—no extra deps
function CameraIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Reusable sign-out button
function SignOutButton() {
  const supabase = useSupabaseClient<Database>();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error.message);
    else router.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 p-3 rounded-lg"
    >
      Sign Out
    </button>
  );
}

export default function ProfileSettingsPage() {
  const supabase = useSupabaseClient<Database>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  // profile fields (match the screen)
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [inviteCode, setInviteCode] = useState(""); // optional, not persisted unless you want
  const [role, setRole] = useState<Role | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
  
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  
      if (p) {
        const nameFromParts = [p.first_name, p.last_name].filter(Boolean).join(" ");
        setFullName(p.full_name || p.display_name || nameFromParts || "");
        setUsername(p.username || "");
        setBio(p.bio || "");
        setWebsite(p.website || "");
        setAvatarUrl(p.avatar || null);
  
        // normalize & set once
        const dbRole: Role = p.role === "creator" ? "creator" : "consumer";
        setRole(dbRole);
      } else {
        setRole("consumer");
      }
      setLoading(false);
    })();
  }, [router, supabase]);
  

  // Avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget; // capture before awaits
    try {
      if (!userId) return;
      const file = inputEl.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Please choose an image file.");
        return;
      }
      const MAX_MB = 5;
      if (file.size > MAX_MB * 1024 * 1024) {
        alert(`Please select an image under ${MAX_MB}MB.`);
        return;
      }

      setUploading(true);

      // instant preview
      const preview = URL.createObjectURL(file);
      setAvatarUrl(preview);

      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${userId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });
      if (upErr) {
        console.error(upErr);
        alert("Failed to upload avatar.");
        return;
      }

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar: publicUrl })
        .eq("id", userId);
      if (updErr) {
        console.error(updErr);
        alert("Avatar uploaded, but failed to save profile.");
        return;
      }

      setAvatarUrl(publicUrl);
    } finally {
      setUploading(false);
      if (inputEl) inputEl.value = ""; // allow re-uploading same file
    }
  };

  const submitProfile = async () => {
    if (!userId) return;

    setSaving(true);

    // Split full name into first/last (best-effort)
    const tokens = fullName.trim().split(/\s+/);
    const first_name = tokens.slice(0, 1).join(" ");
    const last_name = tokens.slice(1).join(" ");

    const { error } = await supabase.from("profiles").upsert([{
      id: userId,
      username,
      full_name: fullName || null,
      display_name: fullName || null,
      first_name: first_name || null,
      last_name: last_name || null,
      bio: bio || null,
      website: website || null,
      role: role ?? "consumer",    // fallback if not chosen yet
    }]);

    setSaving(false);

    if (error) {
      alert(error.message || "Could not save profile.");
      return;
    }

    router.push("/");
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <ProtectedRoute>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitProfile();
        }}
        className="max-w-md mx-auto min-h-screen bg-white"
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-lg -ml-1"
              aria-label="Back"
            >
              ←
            </button>
            <h1 className="text-base font-semibold">Edit Profile</h1>
            <button
              type="submit"
              disabled={saving}
              className="text-[rgb(255,78,207)] font-semibold disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="pt-6 pb-2 flex flex-col items-center">
          <img
            src={avatarUrl || "https://i.pravatar.cc/200"}
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover border"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-3 inline-flex items-center gap-2 text-gray-600"
          >
            <span>Change Photo</span>
            <CameraIcon />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            disabled={uploading}
          />
          {uploading && (
            <p className="text-xs text-gray-500 mt-2">Uploading…</p>
          )}
        </div>

        {/* Card: Personal Details */}
        <div className="px-4 mt-4">
          <h2 className="text-lg font-semibold mb-3">Personals Details</h2>

          <div className="rounded-2xl border overflow-hidden">
            {/* Name */}
            <label className="flex items-center justify-between h-14 px-4 border-b bg-white">
              <span className="text-gray-600">Name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-1/2 text-right bg-transparent outline-none placeholder:text-gray-300"
              />
            </label>

            {/* Username */}
            <label className="flex items-center justify-between h-14 px-4 border-b bg-white">
              <span className="text-gray-600">User Name</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-1/2 text-right bg-transparent outline-none placeholder:text-gray-300"
                required
              />
            </label>

            <AccountTypePicker
  initialRole={role}          // Role | null
  userId={userId!}
  onChange={(r) => setRole(r)} // keep local state in sync
/>

            {/* Bio */}
            <label className="flex items-center justify-between h-14 px-4 border-b bg-white">
              <span className="text-gray-600">Bio</span>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Creator"
                className="w-1/2 text-right bg-transparent outline-none placeholder:text-gray-300"
              />
            </label>

            {/* Links */}
            <label className="flex items-center justify-between h-14 px-4 border-b bg-white">
              <span className="text-gray-600">Links</span>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="creator.com"
                className="w-1/2 text-right bg-transparent outline-none placeholder:text-gray-300"
              />
            </label>

            {/* Invite Code (optional, local only) */}
            <label className="flex items-center justify-between h-14 px-4 bg-white">
              <span className="text-gray-600">Invite Code</span>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Optional"
                className="w-1/2 text-right bg-transparent outline-none placeholder:text-gray-300"
              />
            </label>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="px-4 py-6">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl bg-[rgb(255,78,207)] text-white font-semibold disabled:opacity-50"
          >
            Continue
          </button>
        </div>

        {/* Sign out */}
        <div className="px-4 pb-10">
          <SignOutButton />
        </div>
      </form>
    </ProtectedRoute>
  );
}
