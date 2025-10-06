"use client";
import { useEffect, useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { useListings } from "@/context/ListingContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProfileGuard from "@/components/ProfileGuard";

export default function AddListingPage() {
  const { addListing } = useListings();
  const router = useRouter();
  const { user, supabase } = useAuth();

  const [images, setImages] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
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

  const handleImages = (files: FileList) => {
    const newImages = Array.from(files).slice(0, 10 - images.length);
    newImages.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleImages(e.dataTransfer.files);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleImages(e.target.files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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

    const now = new Date();
    const multiplier =
      form.durationUnit === "minutes"
        ? 60
        : form.durationUnit === "hours"
        ? 3600
        : 86400;
    
    const durationSeconds = parseInt(form.durationValue) * multiplier;
    const endAt = new Date(now.getTime() + durationSeconds * 1000).toISOString();

    const listing = {
      user_id: user.id,
      title: form.title,
      description: form.description,
      images: images.length > 0 ? images : ["https://via.placeholder.com/500x400"],
      buy_now: parseFloat(form.buyNow.replace(/[^\d]/g, "")) || null,
      last_bid: parseFloat(form.startingBid.replace(/[^\d]/g, "")) || 0,
      end_at: endAt,
      seconds_left: durationSeconds,   // ✅ <-- Add this
      sold: false,
      date_posted: new Date().toISOString(),
      user_name: profile.username,
      user_avatar: profile.avatar || "https://i.pravatar.cc/40?img=9",
      user_category: form.category,
    };

    const { data, error } = await supabase
      .from("listings")
      .insert([listing])
      .select("id")
      .single();

      console.log("Inserted listing ID:", data?.id);     // 🔍 check the ID returned
console.log("Full data returned:", data);           // 🔍 see the full response


    if (error) return alert("Failed: " + error.message);
    if (data) router.push(`/post/${data.id}`);
  };

  return (
    <ProfileGuard requiredRole="creator">
      <div className="p-4 max-w-md mx-auto space-y-6">
        <h1 className="text-center text-lg font-semibold">Create Listing</h1>

        {/* Upload Images */}
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative w-full pt-[100%]">
              <img
                src={img}
                alt="Preview"
                className="absolute inset-0 object-cover w-full h-full rounded"
              />
              <button
                className="absolute top-1 right-1 bg-white rounded-full p-1"
                onClick={() => removeImage(i)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {images.length < 10 && (
            <div
              className="flex flex-col justify-center items-center border border-dashed rounded-lg text-gray-400 h-24 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload size={24} />
              <span className="text-sm">Add</span>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center">
          {images.length}/10 photos – First photo will be the cover
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder-gray-400"
            placeholder="Product Name"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm placeholder-gray-400"
            placeholder="Describe your item."
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            required
          />
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
            placeholder="$ Starting Bid"
            name="startingBid"
            value={form.startingBid}
            onChange={handleChange}
            inputMode="numeric"
            required
          />
<input
  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
  placeholder={'$ "Buy Now" Price (Optional)'}
  name="buyNow"
  value={form.buyNow}
  onChange={handleChange}
/>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm"
          >
            <option value="Fashion">Fashion</option>
            <option value="Electronics">Electronics</option>
            <option value="Collectibles">Collectibles</option>
          </select>
          <div className="flex gap-2">
            <input
              className="w-2/3 border border-gray-300 rounded-lg px-4 py-3 text-sm"
              placeholder="Sell Will End In"
              name="durationValue"
              type="number"
              value={form.durationValue}
              onChange={handleChange}
              min="1"
              required
            />
            <select
              name="durationUnit"
              value={form.durationUnit}
              onChange={handleChange}
              className="w-1/3 border border-gray-300 rounded-lg px-4 py-3 text-sm"
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold text-black"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="flex-1 bg-[rgb(255,78,207)] text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Publish Now
            </button>
          </div>
        </form>
      </div>
    </ProfileGuard>
  );
}
