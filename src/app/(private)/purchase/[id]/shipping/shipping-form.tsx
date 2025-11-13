// app/purchase/[id]/shipping/shipping-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        setMsg("✅ Saved!");
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
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input className="border rounded-md px-3 py-2" placeholder="Full name"
               value={form.name} onChange={(e)=>up("name", e.target.value)} required />
        <input className="border rounded-md px-3 py-2" placeholder="Phone"
               value={form.phone} onChange={(e)=>up("phone", e.target.value)} required />
      </div>

      <input className="border rounded-md px-3 py-2 w-full" placeholder="Address line 1"
             value={form.address_line1} onChange={(e)=>up("address_line1", e.target.value)} required />
      <input className="border rounded-md px-3 py-2 w-full" placeholder="Address line 2 (optional)"
             value={form.address_line2 ?? ""} onChange={(e)=>up("address_line2", e.target.value)} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className="border rounded-md px-3 py-2" placeholder="City"
               value={form.city} onChange={(e)=>up("city", e.target.value)} required />
        <input className="border rounded-md px-3 py-2" placeholder="State / Region"
               value={form.state} onChange={(e)=>up("state", e.target.value)} required />
        <input className="border rounded-md px-3 py-2" placeholder="Postal code"
               value={form.postal_code} onChange={(e)=>up("postal_code", e.target.value)} required />
      </div>

      <input className="border rounded-md px-3 py-2 w-full" placeholder="Country"
             value={form.country} onChange={(e)=>up("country", e.target.value)} required />

      {msg && <p className="text-sm text-gray-600">{msg}</p>}

      <button disabled={loading}
              className="w-full mt-2 bg-black text-white rounded-md py-2 font-semibold disabled:opacity-50">
        {loading ? "Saving…" : "Save Shipping"}
      </button>
    </form>
  );
}
