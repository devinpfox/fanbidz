"use client";

import { useEffect, useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { useListings } from "@/context/ListingContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProfileGuard from "@/components/ProfileGuard";
import imageCompression from "browser-image-compression";   // ✅ NEW

export default function AddListingPage() {
  const { addListing } = useListings();
  const router = useRouter();
  const { user, supabase } = useAuth();

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startingBid: "",
    buyNow: "",
    durationValue: "",
    durationUnit: "minutes",
    category: "Fashion",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<any>(null);

  /* ---------------- Fetch Profile ---------------- */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading profile…
      </div>
    );

  /* ---------------- Helper: Compress Image ---------------- */
  async function compressImage(file: File) {
    try {
      const options = {
        maxSizeMB: 0.25,          // ~250 KB
        maxWidthOrHeight: 1400,   // good for feed + detail pages
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);
      return new File([compressed], file.name, { type: file.type });
    } catch (e) {
      console.error("Compression failed, uploading original:", e);
      return file; // fallback
    }
  }

  /* ---------------- Image Handlers ---------------- */
  const handleImages = (selected: FileList) => {
    const newFiles = Array.from(selected).slice(0, 10 - files.length);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...newFiles]);
    setPreviewImages((prev) => [...prev, ...newPreviews]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleImages(e.dataTransfer.files);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleImages(e.target.files);
  };

  const removeImage = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviewImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  /* ---------------- Input Formatters ---------------- */
  const formatCurrency = (value: string) => {
    const numeric = value.replace(/[^\d]/g, "");
    return numeric ? new Intl.NumberFormat().format(Number(numeric)) : "";
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const newValue =
      name === "startingBid" || name === "buyNow"
        ? formatCurrency(value)
        : value;
    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const now = new Date();
    const multiplier =
      form.durationUnit === "minutes"
        ? 60
        : form.durationUnit === "hours"
        ? 3600
        : 86400;

    const durationSeconds = Number(form.durationValue) * multiplier;
    const endAt = new Date(now.getTime() + durationSeconds * 1000).toISOString();

    /* ---- 1. Upload Images (COMPRESSED) ---- */
    const uploadedUrls: string[] = [];

    for (const [i, file] of files.entries()) {
      const compressed = await compressImage(file);    // ✅ NEW

      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}_${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, compressed);                  // ✅ upload compressed

      if (uploadError) {
        alert("Image upload failed.");
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(urlData.publicUrl);
    }

    /* ---- 2. Build Listing Payload ---- */
    const listing = {
      user_id: user.id,
      title: form.title,
      description: form.description,
      images:
        uploadedUrls.length > 0
          ? uploadedUrls
          : ["https://via.placeholder.com/500x400"],
      buy_now: parseFloat(form.buyNow.replace(/[^\d]/g, "")) || null,
      last_bid: parseFloat(form.startingBid.replace(/[^\d]/g, "")) || 0,
      end_at: endAt,
      seconds_left: durationSeconds,
      sold: false,
      date_posted: new Date().toISOString(),
      user_name: profile.username,
      user_avatar: profile.avatar || "https://i.pravatar.cc/40?img=9",
      user_category: form.category,
    };

    /* ---- 3. Insert Listing ---- */
    const { data, error } = await supabase
      .from("listings")
      .insert([listing])
      .select("id")
      .single();

    setLoading(false);

    if (error) {
      alert("Failed to publish: " + error.message);
      return;
    }

    if (data) router.push(`/post/${data.id}`);
  };

  /* ---------------- UI ---------------- */
  return (
    <ProfileGuard requiredRole="creator">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-20">

        {/* Header */}
        <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20">
          <div className="h-16 max-w-md mx-auto flex items-center px-6">
            <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Create Listing
            </h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 pt-6 space-y-8">

          {/* ---------- Image Grid ---------- */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 p-4 shadow-md">

            <div className="grid grid-cols-3 gap-3">
              {previewImages.map((img, i) => (
                <div key={i} className="relative w-full pt-[100%] group">
                  <img
                    src={img}
                    alt=""
                    className="absolute inset-0 object-cover rounded-xl shadow"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-white/90 backdrop-blur p-1 rounded-full shadow"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {previewImages.length < 10 && (
                <div
                  className={`
                    flex flex-col justify-center items-center
                    border border-dashed border-pink-300/50 rounded-xl
                    text-gray-500 h-24 cursor-pointer shadow-inner
                    ${dragOver ? "bg-pink-50/40" : "bg-white/40"}
                  `}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <Upload size={22} className="text-pink-500" />
                  <span className="text-xs">Add</span>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    multiple
                  />
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
              {previewImages.length}/10 photos — First photo is your cover
            </p>
          </div>

          {/* ---------- Listing Form ---------- */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/20 p-5 shadow-md space-y-4"
          >
            <input
              className="w-full rounded-xl border border-gray-300/50 px-4 py-3 text-sm"
              placeholder="Product Name"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />

            <textarea
              className="w-full rounded-xl border border-gray-300/50 px-4 py-3 text-sm"
              placeholder="Describe your item"
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              required
            />

            <input
              className="w-full rounded-xl border border-gray-300/50 px-4 py-3 text-sm"
              placeholder="Starting Bid"
              name="startingBid"
              value={form.startingBid}
              onChange={handleChange}
              required
            />

            <input
              className="w-full rounded-xl border border-gray-300/50 px-4 py-3 text-sm"
              placeholder="Buy Now (optional)"
              name="buyNow"
              value={form.buyNow}
              onChange={handleChange}
            />

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300/50 px-4 py-3 text-sm"
            >
              <option value="Fashion">Fashion</option>
              <option value="Electronics">Electronics</option>
              <option value="Collectibles">Collectibles</option>
            </select>

            <div className="flex gap-3">
              <input
                className="flex-1 rounded-xl border border-gray-300/50 px-4 py-3 text-sm"
                placeholder="Auction Duration"
                name="durationValue"
                type="number"
                min="1"
                value={form.durationValue}
                onChange={handleChange}
                required
              />

              <select
                name="durationUnit"
                value={form.durationUnit}
                onChange={handleChange}
                className="w-1/3 rounded-xl border border-gray-300/50 px-4 py-3 text-sm"
              >
                <option value="minutes">Min</option>
                <option value="hours">Hrs</option>
                <option value="days">Days</option>
              </select>
            </div>

            <div className="flex gap-4 pt-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold text-gray-700 shadow-sm"
              >
                Save Draft
              </button>

              <button
                type="submit"
                disabled={loading}
                className="
                  flex-1 py-3 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-fuchsia-600 to-pink-600
                  shadow hover:opacity-90 disabled:opacity-40
                "
              >
                {loading ? "Publishing…" : "Publish Now"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProfileGuard>
  );
}
