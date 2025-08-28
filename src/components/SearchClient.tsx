'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../types/supabase";
import FollowButton from "./FollowButton";

export default function SearchClient() {
  const supabase = createClientComponentClient<Database>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);

    let builder = supabase
      .from("profiles")
      .select("id, username, avatar")
      .eq("user_type", "creator");

    if (query.trim() !== "") {
      builder = builder.ilike("username", `%${query}%`);
    }

    const { data, error } = await builder;

    if (!error) setResults(data || []);
    setLoading(false);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Search Creators</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-black text-white rounded-md"
        >
          Search
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : results.length === 0 ? (
        <p className="text-gray-500">No creators found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map((user) => (
            <div key={user.id} className="flex items-center gap-4 p-4 border rounded">
              <Link href={`/${user.username}`}>
                <img
                  src={user.avatar ?? "https://i.pravatar.cc/100"}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
              </Link>
              <div className="flex-1">
                <Link href={`/${user.username}`} className="font-semibold hover:underline">
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
