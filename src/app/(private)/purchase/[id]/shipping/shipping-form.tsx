// app/purchase/[id]/shipping/shipping-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Utility component for the stylish input
function GlassInput({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  type = "text",
  fullWidth = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  fullWidth?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${fullWidth ? "w-full" : "flex-1"}`}>
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider px-1">
        {label} {required && <span className="text-pink-500">*</span>}
      </span>
      <input
        type={type}
        className="px-4 py-3 bg-white/50 border border-white/20 rounded-xl shadow-md outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all placeholder:text-gray-400 text-gray-900 font-medium"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}

type Shipping = {
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export default function ShippingForm({
  orderId,
  initial,
}: {
  orderId: string;
  initial: Shipping;
}) {
  const [form, setForm] = useState<Shipping>(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const router = useRouter();

  function up<K extends keyof Shipping>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`/api/orders/${orderId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.error ?? "Failed to save shipping");
      } else {
        setMsg("✅ Shipping address saved successfully!");
        // send them somewhere pleasant: a receipt or their purchases
        router.replace(`/`); // or router.replace(`/purchases`);
      }
    } catch {
      setMsg("Network error, try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Input Group 1: Name and Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassInput
          label="Full Name"
          placeholder="John Doe"
          value={form.name}
          onChange={(v) => up("name", v)}
          required
        />
        <GlassInput
          label="Phone Number"
          placeholder="(555) 555-5555"
          value={form.phone}
          onChange={(v) => up("phone", v)}
          required
          type="tel"
        />
      </div>

      {/* Input Group 2: Address Lines */}
      <div className="space-y-4">
        <GlassInput
          label="Address Line 1"
          placeholder="Street address, P.O. Box"
          value={form.address_line1}
          onChange={(v) => up("address_line1", v)}
          required
          fullWidth
        />
        <GlassInput
          label="Address Line 2"
          placeholder="Apartment, suite, unit (optional)"
          value={form.address_line2 ?? ""}
          onChange={(v) => up("address_line2", v)}
          fullWidth
        />
      </div>

      {/* Input Group 3: City, State, Postal Code */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassInput
          label="City"
          placeholder="New York"
          value={form.city}
          onChange={(v) => up("city", v)}
          required
        />
        <GlassInput
          label="State / Region"
          placeholder="NY"
          value={form.state}
          onChange={(v) => up("state", v)}
          required
        />
        <GlassInput
          label="Postal Code"
          placeholder="10001"
          value={form.postal_code}
          onChange={(v) => up("postal_code", v)}
          required
        />
      </div>

      {/* Input Group 4: Country */}
      <div>
        <GlassInput
          label="Country"
          placeholder="United States"
          value={form.country}
          onChange={(v) => up("country", v)}
          required
          fullWidth
        />
      </div>

      {/* Message Area */}
      {msg && (
        <div className={`p-3 rounded-xl backdrop-blur-sm ${msg.startsWith("✅") ? "bg-fuchsia-50/70 border border-fuchsia-200 text-fuchsia-900" : "bg-red-50/70 border border-red-200 text-red-600"}`}>
          <p className="text-sm font-medium">{msg}</p>
        </div>
      )}

      {/* Submit Button - Gradient/Elevated Style */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 text-white font-bold text-base shadow-xl shadow-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-transform duration-200 relative overflow-hidden group mt-4"
      >
        <span className="relative z-10">
          {loading ? "Saving Address…" : "Save Shipping Address"}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
    </form>
  );
}