"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function ClientProfileContent({
  profile,
  currentListings,
  pastListings,
  isOwner,
}: {
  profile: any;
  currentListings: any[];
  pastListings: any[];
  isOwner: boolean;
}) {
  const { supabase } = useAuth();
  const [tab, setTab] = useState<"current" | "past">("current");
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [avatar, setAvatar] = useState(profile.avatar || "https://i.pravatar.cc/100");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, bio, website, avatar })
      .eq("id", profile.id);

    if (error) {
      alert("Failed to save changes.");
    } else {
      alert("Profile updated.");
      setEditing(false);
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data, error } = await supabase.storage
      .from("avatars") // ✅ ensure this bucket exists and is public
      .upload(`public/${profile.id}-${file.name}`, file, {
        upsert: true,
      });

    if (error) {
      alert("Failed to upload avatar");
      return;
    }

    const url = supabase.storage
      .from("avatars")
      .getPublicUrl(`public/${profile.id}-${file.name}`).data.publicUrl;

    setAvatar(url);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Header */}
      <div className="p-4 max-w-4xl mx-auto border-b">
        <div className="flex items-center gap-4">
          <label className="relative group cursor-pointer">
            <img
              src={avatar}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover border"
            />
            {isOwner && editing && (
              <>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <div className="absolute inset-0 bg-black bg-opacity-40 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">
                  Change
                </div>
              </>
            )}
          </label>

          <div className="flex-1">
            <div className="flex gap-6 text-sm text-gray-600 font-medium">
              <span>{profile.postCount} Post</span>
              <span>{profile.followersCount} Followers</span>
              <span>{profile.followingCount} Following</span>
            </div>

            {editing ? (
              <input
                className="text-lg font-semibold mt-1 w-full border rounded px-2 py-1"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            ) : (
              <h2 className="text-lg font-semibold mt-1">{profile.full_name}</h2>
            )}

            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              ★ {profile.rating?.toFixed(1) ?? "0.0"}
              <span className="text-gray-500 text-sm">({profile.ratingCount ?? 0})</span>
            </div>

            {editing ? (
              <input
                className="text-sm mt-1 w-full border rounded px-2 py-1"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Website"
              />
            ) : (
              profile.website && (
                <a
                  href={profile.website}
                  className="text-blue-500 underline text-sm block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {profile.website}
                </a>
              )
            )}

            {editing ? (
              <textarea
                className="text-sm mt-1 w-full border rounded px-2 py-1"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Your bio"
                rows={2}
              />
            ) : (
              <p className="text-sm text-gray-500 mt-1">{profile.bio ?? "No bio yet."}</p>
            )}

            {isOwner && (
              <div className="mt-2 flex gap-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="bg-[rgb(255,78,207)] text-white px-4 py-1 rounded hover:bg-pink-700"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="border border-gray-400 px-4 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="border border-gray-400 px-4 py-1 rounded"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mt-4 border-b">
        <button
          onClick={() => setTab("current")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "current" ? "border-b-2 border-black text-black" : "text-gray-400"
          }`}
        >
          Current Listings
        </button>
        <button
          onClick={() => setTab("past")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "past" ? "border-b-2 border-black text-black" : "text-gray-400"
          }`}
        >
          Past Listings
        </button>
      </div>

      {/* Listings */}
      <div className="grid grid-cols-2 gap-4 p-4 max-w-4xl mx-auto">
        {(tab === "current" ? currentListings : pastListings).map((item) => (
          <a key={item.id} href={`/listing/${item.id}`} className="block border rounded overflow-hidden">
            <div className="aspect-[4/3] bg-gray-100">
              <img
                src={item.image ?? "https://via.placeholder.com/400x300"}
                alt={item.title ?? "Listing image"}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex justify-between items-center px-2 py-1 text-sm">
              <span className="font-medium truncate">{item.title}</span>
              <span className="text-gray-600">${item.buy_now?.toFixed(2)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
