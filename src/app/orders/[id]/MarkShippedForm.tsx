"use client";

import { useState } from "react";

// EasyPost-supported carriers
const CARRIERS = [
  { label: "Auto-detect", value: "" },
  { label: "USPS", value: "USPS" },
  { label: "UPS", value: "UPS" },
  { label: "FedEx", value: "FedEx" },
  // You can add more if needed:
  // { label: "DHL Express", value: "DHLExpress" },
  // { label: "OnTrac", value: "OnTrac" },
];

export default function MarkShippedForm({ orderId }: { orderId: string }) {
  const [carrier, setCarrier] = useState(CARRIERS[0].value); // default to auto
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const trimmedTracking = tracking.trim().replace(/\s/g, "");

    try {
      if (!trimmedTracking) throw new Error("Please enter a tracking number.");

      const res = await fetch("/api/orders/mark-shipped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          tracking_carrier: carrier || null,
          tracking_number: trimmedTracking,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to mark as shipped.");

      setMsg("✅ Order marked as shipped!");
      setTimeout(() => window.location.reload(), 800); // soft refresh
    } catch (err: any) {
      setMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {/* Carrier dropdown */}
      <div>
        <label className="text-sm font-medium">Shipping Carrier</label>
        <select
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
        >
          {CARRIERS.map((c) => (
            <option key={c.value || "auto"} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Choose a carrier to improve tracking accuracy, or use "Auto-detect".
        </p>
      </div>

      {/* Tracking number input */}
      <div>
        <label className="text-sm font-medium">Tracking Number</label>
        <input
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
          placeholder="Enter tracking number"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
        />
      </div>

      {/* Submit button */}
      <button
        disabled={loading}
        className="w-full bg-[rgb(255,78,207)] hover:opacity-90 text-white rounded-md py-3 font-medium disabled:opacity-50"
      >
        {loading ? "Saving…" : "Confirm Shipment"}
      </button>

      {/* Message */}
      {msg && (
        <p className="text-center text-sm mt-2 text-gray-700">{msg}</p>
      )}
    </form>
  );
}
