'use client';

import { useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../types/supabase";
import FollowButton from "@/components/FollowButton";

export default function SearchPage() {
  const supabase = createClientComponentClient<Database>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setHasSearched(true);
    setLoading(true);

    let builder = supabase
      .from("profiles")
      .select("id, username, avatar")
      .eq("role", "creator");

    if (query.trim() !== "") {
      builder = builder.ilike("username", `%${query}%`);
    }

    const { data, error } = await builder;

    if (!error) setResults(data || []);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6 text-center tracking-tight">Search Creators</h1>

      <div className="flex items-center gap-2 mb-8 bg-neutral-100 rounded-full px-4 py-2 shadow-inner">
        <input
          type="text"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500"
        />
        <button
          onClick={handleSearch}
          className="text-sm font-medium bg-black text-white px-4 py-1.5 rounded-full hover:opacity-90 transition"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 text-sm">Searching...</p>}

      {hasSearched && !loading && results.length === 0 && (
        <p className="text-center text-gray-400 text-sm">No creators found.</p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 bg-neutral-100 p-4 rounded-xl shadow-sm hover:bg-neutral-200 transition"
            >
              <Link href={`/${user.username}`}>
                <img
                  src={user.avatar ?? "https://i.pravatar.cc/100"}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
              </Link>
              <div className="flex-1">
                <Link href={`/${user.username}`} className="font-medium text-sm hover:underline">
                  @{user.username}
                </Link>
              </div>
              <FollowButton profileId={user.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
