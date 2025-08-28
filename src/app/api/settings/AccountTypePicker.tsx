"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";

export type Role = "creator" | "consumer";  // ⬅️ use your backend values

export default function AccountTypePicker({
  initialRole,
  userId,
  onChange,                     // optional: let parent track role state too
}: {
    initialRole: Role | null;
    userId: string;
    onChange?: (r: Role) => void;
}) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(initialRole);
  useEffect(() => { setRole(initialRole); }, [initialRole]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(next: Role) {
    setSaving(true);
    setMsg("");
    setRole(next);
    onChange?.(next);           // keep parent in sync

    const { error } = await supabase.from("profiles").update({ role: next }).eq("id", userId);
    if (error) setMsg(error.message || "Failed to save");
    else { setMsg("Saved"); router.refresh(); }
    setSaving(false);
  }

  const Option = (value: Role, label: string, desc: string) => {
    const active = role === value;
    return (
      <button
        type="button"
        onClick={() => save(value)}
        disabled={saving}
        className={`w-full text-left rounded-xl border p-3 transition
          ${active ? "border-black ring-2 ring-black/10" : "border-gray-200 hover:border-gray-300"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{label}</div>
            <div className="text-sm text-gray-500">{desc}</div>
          </div>
          <span className={`ml-3 inline-flex h-5 w-5 items-center justify-center rounded-full border
            ${active ? "bg-black text-white border-black" : "bg-white text-transparent border-gray-300"}`}>✓</span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Account type</label>
      <div className="grid gap-2 sm:grid-cols-2">
        {Option("creator",  "Creator",  "List items, manage sales & shipments")}
        {Option("consumer", "Consumer", "Bid & buy items, track your orders")}
      </div>
      {msg && <p className="text-xs text-gray-500">{msg}</p>}
    </div>
  );
}
