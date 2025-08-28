"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();
  const sp = useSearchParams();
  const qs = sp.toString();

  return (
    <button
      type="button"
      className="text-sm text-blue-600"
      onClick={() => router.replace(qs ? `/admin?${qs}` : "/admin")}
    >
      Refresh
    </button>
  );
}
