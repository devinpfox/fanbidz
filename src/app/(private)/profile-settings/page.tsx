"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database, Tables, TablesUpdate } from "@/types/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import AccountTypePicker, { Role } from "../api/settings/AccountTypePicker";

const FALLBACK_AVATAR = "https://i.pravatar.cc/200";

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

export default function ProfileSettingsPage() {
  const supabase = createClientComponentClient<Database>() as any;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  type Profile = Tables<"profiles">;

  /* ---------- Load User Profile ---------- */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }
        
        setUserId(user.id);
        
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
  console.error("Error loading profile:", profileError.message);
  setError("Failed to load profile. Please try again.");
  setLoading(false);
  return;
}

if (profile) {
  const nameFromParts = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
  setFullName(profile.full_name || profile.display_name || nameFromParts || "");
  setUsername(profile.username || "");
  setBio(profile.bio || "");
  setWebsite(profile.website || "");
  setAvatarUrl(profile.avatar || null);
  setRole(profile.role === "creator" ? "creator" : "consumer");

  // Check if profile is complete (has required fields)
  const hasUsername = Boolean(profile.username?.trim());
  const hasName = Boolean(profile.first_name?.trim() || profile.full_name?.trim());
  setIsProfileComplete(hasUsername && hasName);
}

      } catch (err) {
        console.error("Unexpected error loading profile:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* ---------- Cleanup preview URLs on unmount ---------- */
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  /* ---------- Handle Avatar Upload ---------- */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    
    if (!userId || !file) return;
    
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Please select an image under 5MB.");
      return;
    }
    
    // Store previous avatar for rollback
    const previousAvatar = avatarUrl;
    
    // Revoke previous preview URL if it exists
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    
    try {
      setUploading(true);
      setError(null);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      previewUrlRef.current = previewUrl;
      setAvatarUrl(previewUrl);
      
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${userId}/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      
      // Type-safe update
      const { error: updateError } = await (supabase as any)
      .from("profiles")
      .update({ avatar: publicUrl })
      .eq("id", userId);
      
      if (updateError) throw updateError;
      
      // Clean up preview URL and set final URL
      URL.revokeObjectURL(previewUrl);
      previewUrlRef.current = null;
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError("Failed to upload avatar. Please try again.");
      // Revert to previous avatar on error
      setAvatarUrl(previousAvatar);
    } finally {
      setUploading(false);
      inputEl.value = "";
    }
  };

  /* ---------- Save Profile ---------- */
  const submitProfile = async () => {
    if (!userId) return;

    // Validate required fields
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      // Parse name properly
      const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
      const first_name = nameParts[0] || null;
      const last_name = nameParts.slice(1).join(" ") || null;
      
      // Build payload - construct it conditionally to avoid type issues
      type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

      const payload: ProfileUpdate = {};
      
      payload.username = username.trim();
      
      if (fullName.trim()) {
        payload.full_name = fullName.trim();
        payload.display_name = fullName.trim();
      } else {
        payload.full_name = null;
        payload.display_name = null;
      }
      
      payload.first_name = first_name;
      payload.last_name = last_name;
      payload.bio = bio.trim() || null;
      payload.website = website.trim() || null;
      payload.role = role ?? "consumer";
      payload.invite_code = inviteCode.trim() || null;
      
      const { error: updateError } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId);
      
      if (updateError) throw updateError;

      // Mark profile as complete
      setIsProfileComplete(true);

      // ✅ Refresh to update AuthContext with new profile data
      router.refresh();

      // Successfully saved - navigate after refresh completes
      router.push("/");
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading…</div>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitProfile();
          }}
          className="max-w-2xl mx-auto min-h-screen"
        >
          {/* Elegant Header with Glassmorphism */}
          <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
            <div className="flex items-center justify-between px-6 h-16">
              <button
                type="button"
                onClick={() => !isProfileComplete ? null : router.back()}
                disabled={!isProfileComplete}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 hover:bg-white shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
                aria-label="Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                {isProfileComplete ? "Edit Profile" : "Complete Your Profile"}
              </h1>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-transform duration-200"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          <div className="px-6 py-8">
            {/* Profile Setup Notice */}
            {!isProfileComplete && (
              <div className="mb-6 p-4 bg-gradient-to-r from-fuchsia-50 to-pink-50 border border-fuchsia-200 rounded-2xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-fuchsia-900 font-medium">
                  Welcome! Please complete your profile to get started. Username and full name are required.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Avatar Section - Elevated and Luxurious */}
            <div className="mb-8">
              <div className="relative w-fit mx-auto">
                {/* Gradient ring around avatar */}
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-400 via-pink-400 to-rose-400 rounded-full blur-lg opacity-40 animate-pulse"></div>

                <div className="relative">
                  {/* Avatar with gradient border */}
                  <div className="p-1 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-full">
                    <img
                      src={avatarUrl || FALLBACK_AVATAR}
                      alt="Avatar"
                      className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover bg-white ring-4 ring-white"
                      onError={(e) => (e.currentTarget.src = FALLBACK_AVATAR)}
                    />
                  </div>

                  {/* Upload button overlay */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-3 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-full text-white shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-transform duration-200"
                  >
                    {uploading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <CameraIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-center mt-4 text-sm text-gray-500 font-medium">
                {uploading ? "Uploading..." : "Tap to change photo"}
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploading}
              />
            </div>

            {/* Profile Fields - Glass Card Design */}
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 px-1">Personal Information</h2>
                <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/20 overflow-hidden">
                  <label className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50 hover:bg-white/50 transition-colors group">
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                      Full Name <span className="text-pink-500">*</span>
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-1/2 text-right bg-transparent outline-none placeholder:text-gray-300 text-gray-900 font-medium"
                      required
                    />
                  </label>

                  <label className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50 hover:bg-white/50 transition-colors group">
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                      Username <span className="text-pink-500">*</span>
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="@username"
                      className="w-1/2 text-right bg-transparent outline-none placeholder:text-gray-300 text-gray-900 font-medium"
                      required
                    />
                  </label>

                  {userId && (
                    <div className="border-b border-gray-100/50">
                      <AccountTypePicker
                        initialRole={role}
                        userId={userId}
                        onChange={(r) => setRole(r)}
                      />
                    </div>
                  )}

                  <label className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50 hover:bg-white/50 transition-colors group">
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Bio</span>
                    <input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself"
                      className="w-1/2 text-right bg-transparent outline-none placeholder:text-gray-300 text-gray-900 font-medium"
                    />
                  </label>

                  <label className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50 hover:bg-white/50 transition-colors group">
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Website</span>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="yoursite.com"
                      className="w-1/2 text-right bg-transparent outline-none placeholder:text-gray-300 text-gray-900 font-medium"
                    />
                  </label>

                  <label className="flex items-center justify-between px-6 py-4 hover:bg-white/50 transition-colors group">
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Invite Code</span>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Optional"
                      className="w-1/2 text-right bg-transparent outline-none placeholder:text-gray-300 text-gray-900 font-medium"
                    />
                  </label>
                </div>
              </div>

              {/* Premium CTA Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 text-white font-bold text-base shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-transform duration-200 relative overflow-hidden group"
              >
                <span className="relative z-10">{saving ? "Saving Changes..." : "Continue"}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              {/* Sign Out - Minimalist */}
              <SignOutButton />
            </div>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}

/* ---------- Sign Out Button ---------- */
function SignOutButton() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      setSigningOut(false);
    } else {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 p-3 rounded-lg disabled:opacity-50"
    >
      {signingOut ? "Signing out…" : "Sign Out"}
    </button>
  );
}