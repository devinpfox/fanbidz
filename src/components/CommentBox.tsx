"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CommentBox({ listingId }: { listingId: string }) {
  const [text, setText] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text) return;

    await fetch("/api/comment", {
      method: "POST",
      body: JSON.stringify({ listingId, text }),
    });

    setText("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <input
        className="w-full p-2 border rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
      />
    </form>
  );
}
