// app/purchases/page.tsx

import Link from "next/link";
import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";

type Tab = "current" | "won" | "history";

function tabOf(v?: string): Tab {
  return v === "won" || v === "history" ? v : "current";
}

export const revalidate = 60;

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as any,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const tab = tabOf(searchParams?.tab);

  // ---------- CURRENT BIDS (dedupe to latest per listing, compute winning/outbid) ----------
  let currentRows: Array<{
    listing_id: string;
    my_amount: number;
    top_amount: number;
    title: string | null;
    image: string | null;
    end_at: string | null;
  }> = [];

  if (tab === "current") {
    const { data: myBids } = (await supabase
      .from("bids")
      .select(
        `
        listing_id, amount, created_at,
        listings:listing_id ( title, images, end_at )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })) as any;

    const latestByListing = new Map<
      string,
      {
        my_amount: number;
        title: string | null;
        image: string | null;
        end_at: string | null;
      }
    >();

    for (const b of myBids ?? []) {
      if (!latestByListing.has(b.listing_id!)) {
        latestByListing.set(b.listing_id!, {
          my_amount: Number(b.amount ?? 0),
          title: b.listings?.title ?? null,
          image: b.listings?.images?.[0] ?? null,
          end_at: b.listings?.end_at ?? null,
        });
      }
    }

    const listingIds = Array.from(latestByListing.keys());
    const topByListing = new Map<string, number>();

    if (listingIds.length) {
      const { data: allForThese } = (await supabase
        .from("bids")
        .select("listing_id, amount")
        .in("listing_id", listingIds)) as any;

      for (const r of allForThese ?? []) {
        const id = r.listing_id!;
        const amt = Number(r.amount ?? 0);
        if (!topByListing.has(id) || amt > (topByListing.get(id) ?? 0)) {
          topByListing.set(id, amt);
        }
      }
    }

    currentRows = listingIds.map((id) => {
      const meta = latestByListing.get(id)!;
      return {
        listing_id: id,
        my_amount: meta.my_amount,
        top_amount: topByListing.get(id) ?? meta.my_amount,
        title: meta.title,
        image: meta.image,
        end_at: meta.end_at,
      };
    });
  }

  // ---------- WON ITEMS / HISTORY (your orders as buyer) ----------
  let orders: Array<{
    id: string;
    price: number;
    status: string;
    created_at: string;
    shipped_at: string | null;
    tracking_number: string | null;
    listings: { title: string | null; images: string[] | null } | null;
    seller: { username: string | null } | null;
  }> = [];

  if (tab !== "current") {
    const { data } = await supabase
      .from("orders")
      .select(`
        id, price, status, created_at, shipped_at, tracking_number, shipping,
        listings:listing_id ( title, images ),
        seller:profiles!orders_seller_id_fkey ( username )
      `)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    orders = (data ?? []) as typeof orders;

    if (tab === "history") {
      // Treat shipped as delivered history
      orders = orders.filter((o) => o.status === "shipped");
    }
  }

  // ---------- TABS (GLASS STYLE) ----------
  const Tabs = () => {
    const tabs: { key: Tab; label: string }[] = [
      { key: "current", label: "Current Bids" },
      { key: "won", label: "Won Items" },
      { key: "history", label: "History" },
    ];

    return (
      <div className="mt-1 mb-3 flex items-center gap-2">
        <div className="inline-flex rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 p-1 shadow-sm">
          {tabs.map((t) => {
            const isActive = tab === t.key;
            return (
              <Link
                key={t.key}
                href={`/purchases?tab=${t.key}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-md shadow-pink-500/30"
                    : "text-gray-500 hover:text-gray-900 hover:bg-white/80"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  // ---------- PAGE UI (MATCH PROFILE SETTINGS STYLE) ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20">
      <div className="max-w-2xl mx-auto min-h-screen">
        {/* Sticky glass header like ProfileSettingsPage */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
          <div className="flex items-center justify-between px-6 h-16">
            {/* Back button (server-safe: just link home or to main app) */}
            <Link
              href="/"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 hover:bg-white shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95"
              aria-label="Back"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>

            <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              Your Orders
            </h1>

            {/* Spacer to balance layout */}
            <div className="w-10" />
          </div>

          {/* Tabs row under header */}
          <div className="px-6 pb-3">
            <Tabs />
          </div>
        </div>

        {/* Main content area */}
        <div className="px-6 py-6 space-y-6">
          {/* CURRENT BIDS */}
          {tab === "current" && (
            <div className="space-y-4">
              {currentRows.map((r) => {
                const winning = r.my_amount >= r.top_amount;
                const endText = r.end_at ? timeLeftText(r.end_at) : "";
                const statusLabel = winning ? "Winning" : "Outbid";
                const statusClasses = winning
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200";

                return (
                  <Link
                    key={r.listing_id}
                    href={`/post/${r.listing_id}`}
                    className="block backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/20 overflow-hidden transition-transform duration-200 hover:shadow-2xl hover:shadow-pink-200/50 hover:-translate-y-0.5"
                  >
                    <div className="flex items-stretch gap-4 p-4">
                      {/* Image with gradient frame */}
                      <div className="shrink-0">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-300 via-pink-300 to-rose-300 rounded-2xl blur-lg opacity-40" />
                          <div className="relative p-0.5 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-2xl">
                            <img
                              src={
                                r.image ??
                                "https://via.placeholder.com/160?text=Listing"
                              }
                              alt={r.title ?? "Listing"}
                              className="w-20 h-20 rounded-2xl object-cover bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Text content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {r.title ?? "Listing"}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                          <div className="flex flex-col">
                            <span className="text-gray-500">Your bid</span>
                            <span className="font-semibold text-fuchsia-700">
                              ${r.my_amount.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex flex-col text-right">
                            <span className="text-gray-500">
                              Top bid {winning ? "(you)" : ""}
                            </span>
                            <span className="font-semibold text-gray-900">
                              ${r.top_amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status & time */}
                      <div className="shrink-0 flex flex-col items-end justify-between">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold border ${statusClasses}`}
                        >
                          {statusLabel}
                        </span>
                        {endText && (
                          <span className="mt-2 text-[11px] text-gray-500">
                            {endText === "Ended" ? "Auction Ended" : `Ends in ${endText}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}

              {!currentRows.length && (
                <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/20 p-5">
                  <p className="text-sm text-gray-600">
                    You haven’t placed any current bids yet. Once you start
                    bidding, your active auctions will show up here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* WON / HISTORY */}
          {tab !== "current" && (
            <div className="space-y-5">
              {orders.map((o) => {
                const img =
                  o.listings?.images?.[0] ??
                  "https://via.placeholder.com/160?text=Item";

                const isDelivered = o.status === "shipped";
                const statusText = isDelivered ? "Delivered" : "Processing";

                const statusBadge = (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold border ${
                      isDelivered
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {statusText}
                  </span>
                );

                return (
                  <div
                    key={o.id}
                    className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/20 overflow-hidden"
                  >
                    {/* Top row: image + title + seller + price + status */}
                    <div className="flex items-start gap-4 p-4 border-b border-gray-100/60">
                      {/* Image with subtle gradient frame */}
                      <div className="shrink-0">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-300 via-pink-300 to-rose-300 rounded-2xl blur-lg opacity-40" />
                          <div className="relative p-0.5 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-2xl">
                            <img
                              src={img}
                              alt={o.listings?.title ?? "Item"}
                              className="w-16 h-16 rounded-2xl object-cover bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Middle text block */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {o.listings?.title ?? "Listing"}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 text-[11px] text-gray-500 mt-1">
                          <span className="font-medium text-gray-600">
                            @{o.seller?.username ?? "seller"}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(o.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Right: status + amount */}
                      <div className="shrink-0 text-right">
                        {statusBadge}
                        <div className="mt-2 text-sm font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                          ${Number(o.price).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-2xl bg-white/80 border border-white/60 shadow-inner shadow-gray-100/40 p-3">
                        <span className="block text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                          Shipping Status
                        </span>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {isDelivered ? "Shipped" : "Processing"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/80 border border-white/60 shadow-inner shadow-gray-100/40 p-3">
                        <span className="block text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                          Tracking
                        </span>
                        <p className="mt-1 text-sm font-semibold text-gray-900 break-all">
                          {o.tracking_number ?? "Not available"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/80 border border-white/60 shadow-inner shadow-gray-100/40 p-3">
                        <span className="block text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
                          Total Paid
                        </span>
                        <p className="mt-1 text-sm font-bold text-fuchsia-700">
                          ${Number(o.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!orders.length && (
                <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/20 p-5">
                  <p className="text-sm text-gray-600">
                    {tab === "won"
                      ? "You haven’t won any items yet. Once you win an auction, your purchases will appear here."
                      : "No delivered items found in your history yet. Completed orders will show up here once they’re shipped."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// small helper (unchanged)
function timeLeftText(end_at: string) {
  const ms = new Date(end_at).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const hh = h % 24;
    return `${d}d ${hh}h`;
  }
  return `${h}h ${m}m`;
}
