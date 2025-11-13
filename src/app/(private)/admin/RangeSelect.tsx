"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function RangeSelect({ initialDays }: { initialDays: number }) {
  const router = useRouter();
  const sp = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    const params = new URLSearchParams(sp?.toString() || "");
    params.set("days", val);
    router.replace(`/admin?${params.toString()}`);
  }

  return (
    <select
      name="days"
      defaultValue={String(initialDays)}
      onChange={onChange}
      className="h-10 rounded-lg border px-3"
    >
      <option value="7">Last 7 days</option>
      <option value="30">Last 30 days</option>
      <option value="90">Last 90 days</option>
    </select>
  );
}
