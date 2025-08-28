// app/purchases/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../types/supabase";

type Tab = "current" | "won" | "history";

function tabOf(v?: string): Tab {
  return v === "won" || v === "history" ? v : "current";
}

export default async function PurchasesPage({
  searchParams,
}: { searchParams?: { tab?: string } }) {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore as any });

  const { data: { user } } = await supabase.auth.getUser();
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
    // All my bids newest first with listing info
    const { data: myBids } = await supabase
      .from("bids")
      .select(`
        listing_id, amount, created_at,
        listings:listing_id ( title, images, end_at )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });


    // Keep the latest bid per listing
    const latestByListing = new Map<string, {
      my_amount: number;
      title: string | null;
      image: string | null;
      end_at: string | null;
    }>();

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
    let topByListing = new Map<string, number>();
    if (listingIds.length) {
      // Pull all bids for just these listings and compute the max client-side
      const { data: allForThese } = await supabase
        .from("bids")
        .select("listing_id, amount")
        .in("listing_id", listingIds);

      for (const r of allForThese ?? []) {
        const id = r.listing_id!;
        const amt = Number(r.amount ?? 0);
        if (!topByListing.has(id) || amt > (topByListing.get(id) ?? 0)) {
          topByListing.set(id, amt);
        }
      }
    }

    currentRows = listingIds.map(id => {
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
      orders = orders.filter(o => o.status === "shipped"); // treat shipped as delivered history
    }
  }

  // ---------- UI ----------
  const Tabs = () => (
    <div className="mb-5 flex items-center gap-6 border-b">
      {[
        { key: "current", label: "Current Bids" },
        { key: "won", label: "Won Items" },
        { key: "history", label: "History" },
      ].map(t => (
        <Link
          key={t.key}
          href={`/purchases?tab=${t.key}`}
          className={`py-3 -mb-px border-b-2 ${tab === t.key ? "border-black font-semibold" : "border-transparent text-gray-500"}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-2">Orders</h1>
      <Tabs />

      {tab === "current" && (
        <div className="space-y-4">
          {currentRows.map(r => {
            const winning = r.my_amount >= r.top_amount;
            const badge = winning
              ? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Winning</span>
              : <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full">Outbid</span>;
            const endText = r.end_at ? timeLeftText(r.end_at) : "";

            return (
              <Link
                key={r.listing_id}
                href={`/post/${r.listing_id}`}
                className="flex items-center gap-4 rounded-xl border p-3 hover:bg-gray-50"
              >
                <img src={r.image ?? "https://via.placeholder.com/120"} alt=""
                     className="w-20 h-20 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="font-medium">{r.title ?? "Listing"}</p>
                  <p className="text-sm text-gray-500">
                    Your bid: ${r.my_amount.toFixed(2)} {endText && <span>· {endText}</span>}
                  </p>
                </div>
                {badge}
              </Link>
            );
          })}
          {!currentRows.length && (
            <p className="text-sm text-gray-500">You haven’t bid on anything yet.</p>
          )}
        </div>
      )}

      {tab !== "current" && (
        <div className="space-y-4">
          {orders.map(o => {
            const img = o.listings?.images?.[0] ?? "https://via.placeholder.com/120";
            const statusBadge =
              o.status === "shipped"
                ? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Paid</span>
                : <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Unpaid</span>;

            return (
              <div key={o.id} className="rounded-xl border p-3">
                <div className="flex items-center gap-4">
                  <img src={img} className="w-16 h-16 rounded-md object-cover" alt="" />
                  <div className="flex-1">
                    <p className="font-medium">{o.listings?.title ?? "Listing"}</p>
                    <div className="flex gap-2 items-center text-sm text-gray-500">
                      <span>Seller:</span>
                      <span className="font-medium">@{o.seller?.username ?? "seller"}</span>
                      <span>• {new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {statusBadge}
                    <div className="font-semibold mt-1">${Number(o.price).toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <span className="text-gray-500">Shipping Status:</span><br />
                    {o.status === "shipped" ? "Shipped" : "Not shipped"}
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <span className="text-gray-500">Tracking:</span><br />
                    {o.tracking_number ?? "—"}
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <span className="text-gray-500">Total:</span><br />
                    ${Number(o.price).toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
          {!orders.length && (
            <p className="text-sm text-gray-500">
              {tab === "won" ? "You haven’t purchased anything yet." : "No delivered items yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// small helper
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
