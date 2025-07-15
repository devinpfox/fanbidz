"use client";
import { useEffect, useState, useRef } from "react";
import { Upload } from "lucide-react";
import { useListings } from "@/context/ListingContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProfileGuard from "@/components/ProfileGuard"; // 👈

export default function AddListingPage() {
  const { addListing } = useListings();
  const router = useRouter();
  const { user, supabase } = useAuth();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startingBid: "",
    buyNow: "",
    durationValue: "",
    durationUnit: "minutes",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // Only fetch profile to get username/avatar for the listing (NOT to check role)
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("username,avatar")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
    fetchProfile();
  }, [user, supabase]);

  if (!profile) return <p className="p-6">Loading profile…</p>;

  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  const formatCurrency = (value: string) => {
    const numeric = value.replace(/[^\d]/g, "");
    return numeric ? new Intl.NumberFormat().format(Number(numeric)) : "";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newValue =
      name === "startingBid" || name === "buyNow"
        ? formatCurrency(value)
        : value;
    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const secondsLeft =
      parseInt(form.durationValue) *
      (form.durationUnit === "minutes"
        ? 60
        : form.durationUnit === "hours"
        ? 3600
        : 86400);

    const listing = {
      user_id: user.id,
      title: form.title,
      description: form.description,
      image: imagePreview || "https://via.placeholder.com/500x400",
      buy_now: parseFloat(form.buyNow.replace(/[^\d]/g, "")) || null,
      last_bid: parseFloat(form.startingBid.replace(/[^\d]/g, "")) || 0,
      seconds_left: secondsLeft,
      sold: false,
      date_posted: new Date().toISOString(),
      user_name: profile.username,
      user_avatar: profile.avatar || "https://i.pravatar.cc/40?img=9",
      user_category: "Custom",
    };

    const { error: insertError } = await supabase
      .from("listings")
      .insert([listing]);

    if (insertError) {
      alert("Failed to post listing: " + insertError.message);
      return;
    }

    router.push(`/${profile.username}`);
  };

  // Main render
  return (
    <ProfileGuard requiredRole="creator">
      <div className="p-4 max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-pink-600 mb-4">Upload a Listing</h1>
  
        {/* Image Upload */}
        <div
          className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-48 cursor-pointer mb-4 transition
            ${dragOver ? "border-pink-600 bg-pink-50" : "border-gray-300 bg-white"}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          role="button"
          aria-label="Upload image"
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Preview"
              className="h-full object-contain rounded"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <Upload size={36} />
              <span className="mt-2 text-sm">Click or drag image here to upload</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
        </div>
  
        {/* Listing Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full border rounded p-2"
            placeholder="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
          <textarea
            className="w-full border rounded p-2"
            placeholder="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            required
          />
          <div className="flex gap-2">
            <input
              className="w-1/2 border rounded p-2"
              placeholder="Starting Bid"
              name="startingBid"
              inputMode="numeric"
              value={form.startingBid}
              onChange={handleChange}
              required
            />
            <input
              className="w-1/2 border rounded p-2"
              placeholder="Buy Now (optional)"
              name="buyNow"
              inputMode="numeric"
              value={form.buyNow}
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-2 items-center">
            <input
              className="w-2/3 border rounded p-2"
              placeholder="Auction Duration"
              name="durationValue"
              type="number"
              min="1"
              value={form.durationValue}
              onChange={handleChange}
              required
            />
            <select
              className="w-1/3 border rounded p-2"
              name="durationUnit"
              value={form.durationUnit}
              onChange={handleChange}
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
  
          <button
            type="submit"
            className="w-full bg-pink-600 text-white py-2 rounded font-bold hover:bg-pink-700 transition"
          >
            Upload Listing
          </button>
        </form>
      </div>
    </ProfileGuard>
  );
}
