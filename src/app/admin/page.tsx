// app/admin/page.tsx
export const dynamic = "force-dynamic";

import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../types/supabase";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import RevenueChart from "@/components/RevenueChart";
import RangeSelect from "./RangeSelect";
import RefreshButton from "./RefreshButton"; // ⬅️ client sub-component

type TabDays = 7 | 30 | 90;

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
    .maybeSingle();

  const isAdmin = me?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Admin only</h1>
        <p className="text-gray-600 mt-2">You don’t have access to this page.</p>
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
  const [{ count: usersThis }, { data: ordersThis }, { count: listingsThis }] =
    await Promise.all([
      // requires profiles.created_at
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sinceISO),
      supabase
        .from("orders")
        .select("price, created_at, listing_id, seller_id")
        .gte("created_at", sinceISO),
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
  const [{ count: usersPrev }, { data: ordersPrev }, { count: listingsPrev }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevSinceISO)
        .lt("created_at", prevUntilISO),
      supabase
        .from("orders")
        .select("price, created_at, seller_id")
        .gte("created_at", prevSinceISO)
        .lt("created_at", prevUntilISO),
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
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}|${label}`;
    seriesMap.set(key, 0);
  }
  (ordersThis ?? []).forEach((o) => {
    const d = new Date(o.created_at!);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
    .not("listing_id", "is", null);

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

  // -------- UI --------
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <RangeSelect initialDays={days} />      {/* client component */}
          <RefreshButton />                       {/* client component (fixes onClick) */}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="New Users" value={(usersThis ?? 0).toLocaleString()} delta={usersDelta} />
        <StatCard label="Sales Volume" value={salesThis.toFixed(0)} delta={salesDelta} prefix="$" />
        <StatCard label="Active Creators" value={activeCreatorsThis.toLocaleString()} delta={creatorsDelta} />
        <StatCard label="Listings" value={(listingsThis ?? 0).toLocaleString()} delta={listingsDelta} />
      </div>

      {/* Revenue */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Revenue</h2>
        <RevenueChart points={series} />
      </div>

      {/* Top Performing Listings */}
      <div className="rounded-2xl border">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Top Performing Listings</h2>
          {/* no onClick here; handled by RefreshButton */}
        </div>
        <div className="divide-y">
          {top.map((t) => (
            <div key={t.listingId} className="px-4 py-3 flex items-center gap-3">
              <img
                src={t.image ?? "https://via.placeholder.com/80"}
                className="w-12 h-12 rounded-md object-cover"
                alt=""
              />
              <div className="flex-1">
                <div className="font-medium">{t.title}</div>
                <div className="text-sm text-gray-500">
                  {t.count} {t.count === 1 ? "sale" : "sales"} · ${t.revenue.toFixed(2)}
                </div>
              </div>
              <div className="text-sm text-gray-500">#{t.rank}</div>
            </div>
          ))}
          {!top.length && (
            <div className="p-4 text-sm text-gray-500">No sales in this period.</div>
          )}
        </div>
        <div className="px-4 py-3">
          <Link href="/search?sort=top" className="text-blue-600">
            Load more listings
          </Link>
        </div>
      </div>
    </div>
  );
}
