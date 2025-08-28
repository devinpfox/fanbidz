"use client";

export default function RangeSelect({ days }: { days: number }) {
  return (
    <select
      name="days"
      defaultValue={String(days)}
      className="border rounded-md text-sm px-2 py-1"
      onChange={(e) => {
        const u = new URL(window.location.href);
        u.searchParams.set("days", e.target.value);
        window.location.href = u.toString();
      }}
    >
      <option value="7">Last 7 days</option>
      <option value="30">Last 30 days</option>
      <option value="90">Last 90 days</option>
    </select>
  );
}
