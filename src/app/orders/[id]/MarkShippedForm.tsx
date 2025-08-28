"use client";

import { useState } from "react";

export default function MarkShippedForm({ orderId }: { orderId: string }) {
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/orders/mark-shipped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          tracking_carrier: carrier || null,
          tracking_number: tracking || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setMsg("Order marked as shipped.");
      // soft refresh to show new status
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      setMsg(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label className="text-sm font-medium">Shipping Carrier</label>
        <input
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          placeholder="USPS, UPS, FedEx, etc"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Tracking Number</label>
        <input
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          placeholder="Enter tracking number"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
        />
      </div>

      <button
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-3 font-medium disabled:opacity-50"
      >
        {loading ? "Saving…" : "Confirm Shipment"}
      </button>

      {msg && <p className="text-center text-sm mt-2">{msg}</p>}
    </form>
  );
}
