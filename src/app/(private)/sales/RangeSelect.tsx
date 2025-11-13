"use client";

export default function RangeSelect({ days }: { days: number }) {
  return (
    <select
      name="days"
      defaultValue={String(days)}
      className="
        px-3 py-1.5 text-sm rounded-xl
        backdrop-blur-md bg-white/60
        border border-white/30 shadow-sm
        focus:outline-none
        hover:bg-white/80
        transition-all
      "
      onChange={(e) => {
        const u = new URL(window.location.href);
        u.searchParams.set("days", e.target.value);
        window.location.href = u.toString();
      }}
    >
      <option value="7">Last 7 days</option>
      <option value="30">Last 30 days</option>
      <option value="90">Last 90 days</option>
      <option value="365">Last 365 days</option>
    </select>
  );
}
