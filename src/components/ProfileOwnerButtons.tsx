// components/ProfileOwnerButtons.tsx
"use client";
import { useState } from "react";
import Link from "next/link";

export default function ProfileOwnerButtons({ username }: { username: string | null }) {
  if (!username) return null; // nothing to render if username missing

  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/${username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${username} on OnlyBidz`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  return (
    <div className="mt-4 flex items-center gap-3 justify-center sm:justify-start">
      <Link href="/profile-settings" className="px-4 py-2 rounded-md border font-medium text-sm hover:bg-gray-50">
        Edit profile
      </Link>
      <button onClick={share} className="px-4 py-2 rounded-md border font-medium text-sm hover:bg-gray-50" type="button">
        {copied ? "Link copied!" : "Share profile"}
      </button>
    </div>
  );
}
