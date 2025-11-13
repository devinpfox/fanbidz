// app/admin/page.tsx

import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import RevenueChart from "@/components/RevenueChart";
import RangeSelect from "./RangeSelect";
import RefreshButton from "./RefreshButton"; // client sub-component

type TabDays = 7 | 30 | 90;

// Explicit types for Supabase returns

// ordersThis type: "price, created_at, listing_id, seller_id"
type OrdersWindowRecord = {
  price: number | null;
  created_at: string | null;
  listing_id: string | null;
  seller_id: string | null;
};

// ordersPrev type: "price, created_at, seller_id"
type OrdersPrevRecord = {
  price: number | null;
  created_at: string | null;
  seller_id: string | null;
};

// ordersWithListing type: "listing_id, price, listings:listing_id ( title, images )"
type OrdersWithListingRecord = {
  listing_id: string | null;
  price: number | null;
  listings: {
    title: string | null;
    images: string[] | null;
  } | null;
};

// profiles type: "role"
type ProfileRole = {
  role: string | null;
};

function toDays(v?: string): TabDays {
  const n = Number(v);
  if (n === 30 || n === 90) return n as TabDays;
  return 7;
}

function pct(curr: number, prev: number) {
  if (!prev) return curr ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

export default async function AdminPage({
  searchParams,
}: {
  // Next 15: searchParams is async
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: rawDays } = await searchParams; // ✅ await first
  const days = toDays(rawDays);

  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as any,
  });

  // --- auth + gate ---
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<ProfileRole[]>() // MUST be array
    .maybeSingle();

  const isAdmin = me?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 flex items-center justify-center px-6">
        <div className="max-w-md w-full backdrop-blur-xl bg-white/70 border border-white/40 rounded-3xl shadow-xl shadow-black/10 px-8 py-10 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Admin Only
          </h1>
          <p className="text-gray-600 mb-6">
            You don’t have permission to access this dashboard.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:scale-[1.02] active:scale-[0.97] transition-transform shadow-lg shadow-black/20"
          >
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  // --- range math ---
  const now = Date.now();
  const since = new Date(now - days * 86_400_000);
  const prevSince = new Date(since.getTime() - days * 86_400_000);

  const sinceISO = since.toISOString();
  const prevSinceISO = prevSince.toISOString();
  const prevUntilISO = new Date(since.getTime()).toISOString();

  // -------- this window --------
  const [
    { count: usersThis },
    { data: ordersThis },
    { count: listingsThis },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceISO),

    supabase
      .from("orders")
      .select("price, created_at, listing_id, seller_id")
      .gte("created_at", sinceISO)
      .returns<OrdersWindowRecord[]>(),

    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sinceISO),
  ]);

  const activeCreatorsThis = new Set(
    (ordersThis ?? []).map((o) => o.seller_id).filter(Boolean)
  ).size;

  const salesThis = (ordersThis ?? []).reduce(
    (s, o) => s + Number(o.price ?? 0),
    0
  );

  // -------- previous equal window --------
  const [
    { count: usersPrev },
    { data: ordersPrev },
    { count: listingsPrev },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", prevSinceISO)
      .lt("created_at", prevUntilISO),

    supabase
      .from("orders")
      .select("price, created_at, seller_id")
      .gte("created_at", prevSinceISO)
      .lt("created_at", prevUntilISO)
      .returns<OrdersPrevRecord[]>(),

    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", prevSinceISO)
      .lt("created_at", prevUntilISO),
  ]);

  const activeCreatorsPrev = new Set(
    (ordersPrev ?? []).map((o) => o.seller_id).filter(Boolean)
  ).size;

  const salesPrev = (ordersPrev ?? []).reduce(
    (s, o) => s + Number(o.price ?? 0),
    0
  );

  // -------- revenue series (daily buckets) --------
  const seriesMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}|${label}`;
    seriesMap.set(key, 0);
  }

  (ordersThis ?? []).forEach((o) => {
    const d = new Date(o.created_at!);
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}|${label}`;
    if (seriesMap.has(key)) {
      seriesMap.set(key, (seriesMap.get(key) ?? 0) + Number(o.price ?? 0));
    }
  });

  const series = Array.from(seriesMap.entries()).map(([k, v]) => {
    const label = k.split("|")[1];
    return { date: label, total: v };
  });

  // -------- top listings in window --------
  const { data: ordersWithListing } = await supabase
    .from("orders")
    .select("listing_id, price, listings:listing_id ( title, images )")
    .gte("created_at", sinceISO)
    .not("listing_id", "is", null)
    .returns<OrdersWithListingRecord[]>();

  const agg = new Map<
    string,
    { title: string; image: string | null; count: number; revenue: number }
  >();

  for (const r of ordersWithListing ?? []) {
    const id = r.listing_id!;
    const title = r.listings?.title ?? "Listing";
    const image = r.listings?.images?.[0] ?? null;
    const prev = agg.get(id) ?? { title, image, count: 0, revenue: 0 };
    prev.count += 1;
    prev.revenue += Number(r.price ?? 0);
    agg.set(id, prev);
  }

  const top = Array.from(agg.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([listingId, v], idx) => ({ listingId, rank: idx + 1, ...v }));

  // -------- deltas --------
  const usersDelta = pct(usersThis ?? 0, usersPrev ?? 0);
  const salesDelta = pct(salesThis, salesPrev);
  const creatorsDelta = pct(activeCreatorsThis, activeCreatorsPrev);
  const listingsDelta = pct(listingsThis ?? 0, listingsPrev ?? 0);

  // -------- GLASS LUXURY UI --------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20">
      <div className="max-w-6xl mx-auto min-h-screen flex flex-col">
        {/* Sticky glass header */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/30 shadow-sm">
          <div className="flex items-center justify-between px-6 h-16">
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <RangeSelect initialDays={days} />
              <RefreshButton />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-10">
          {/* Quick Stats - Glass cards */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 px-1">
              Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/40 px-5 py-4">
                <StatCard
                  label="New Users"
                  value={(usersThis ?? 0).toLocaleString()}
                  delta={usersDelta}
                />
              </div>
              <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/40 px-5 py-4">
                <StatCard
                  label="Sales Volume"
                  value={salesThis.toFixed(0)}
                  delta={salesDelta}
                  prefix="$"
                />
              </div>
              <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/40 px-5 py-4">
                <StatCard
                  label="Active Creators"
                  value={activeCreatorsThis.toLocaleString()}
                  delta={creatorsDelta}
                />
              </div>
              <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/40 px-5 py-4">
                <StatCard
                  label="Listings"
                  value={(listingsThis ?? 0).toLocaleString()}
                  delta={listingsDelta}
                />
              </div>
            </div>
          </section>

          {/* Revenue Chart - Glass panel */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 px-1">
              Revenue
            </h2>
            <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/40 px-5 py-6">
              <RevenueChart points={series} />
            </div>
          </section>

          {/* Top Performing Listings - Glass list */}
          <section className="pb-10">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 px-1">
              Top Performing Listings
            </h2>
            <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/40 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/40">
                <p className="text-base font-semibold text-gray-800">
                  Best sellers this period
                </p>
              </div>

              <div className="divide-y divide-white/40">
                {top.map((t) => (
                  <div
                    key={t.listingId}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-white/60 transition-colors"
                  >
                    <div className="relative">
                      {/* subtle glow */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-fuchsia-400 via-pink-400 to-rose-400 blur-lg opacity-30" />
                      <img
                        src={t.image ?? "https://via.placeholder.com/80"}
                        className="relative w-14 h-14 rounded-2xl object-cover bg-white ring-2 ring-white"
                        alt=""
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {t.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t.count} {t.count === 1 ? "sale" : "sales"} · $
                        {t.revenue.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-400">
                      #{t.rank}
                    </div>
                  </div>
                ))}
                {!top.length && (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No sales in this period.
                  </div>
                )}
              </div>

              <div className="px-6 py-4 flex justify-end">
                <Link
                  href="/search?sort=top"
                  className="text-sm font-semibold text-fuchsia-600 hover:text-fuchsia-700 hover:underline"
                >
                  Load more listings →
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
