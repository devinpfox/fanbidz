"use client";

import { useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import FollowButton from "@/components/FollowButton";

export default function SearchPage() {
  const supabase = createClientComponentClient<Database>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-20">

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-center h-16">
          <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            Search Creators
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Search Bar - Glassmorphism */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl shadow-black/5 border border-white/30 px-5 py-4 flex items-center gap-3 mb-8 transition-all">
          <input
            type="text"
            placeholder="Search by username…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
          />

          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-semibold shadow-lg shadow-pink-500/25 hover:scale-105 active:scale-95 transition-all"
          >
            Search
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <p className="text-center text-gray-500 text-sm animate-pulse">
            Searching…
          </p>
        )}

        {/* Empty State */}
        {hasSearched && !loading && results.length === 0 && (
          <p className="text-center text-gray-500 text-sm">
            No creators found.
          </p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {results.map((user) => (
              <div
                key={user.id}
                className="group relative backdrop-blur-xl bg-white/70 rounded-3xl border border-white/20 shadow-lg shadow-black/5 p-5 flex items-center gap-4 hover:bg-white/80 hover:shadow-xl transition-all"
              >
                {/* Avatar with gradient ring */}
                <Link href={`/${user.username}`}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-400 via-pink-400 to-rose-400 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-all"></div>

                    <div className="relative p-[2px] bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-full">
                      <img
                        src={user.avatar ?? "https://i.pravatar.cc/100"}
                        alt="Avatar"
                        className="w-14 h-14 rounded-full object-cover bg-white ring-2 ring-white"
                      />
                    </div>
                  </div>
                </Link>

                <div className="flex-1 flex flex-col">
                  <Link
                    href={`/${user.username}`}
                    className="font-semibold text-sm text-gray-800 hover:underline"
                  >
                    @{user.username}
                  </Link>
                </div>

                <FollowButton profileId={user.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
