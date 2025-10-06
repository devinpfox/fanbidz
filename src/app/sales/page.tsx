

import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../types/supabase";
import RangeSelect from "./RangeSelect"; // 👈 client component just below

function parseDays(search: string | undefined) {
  const n = Number(search);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 365) : 30;
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams?: { days?: string };
}) {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as any,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const days = parseDays(searchParams?.days);
  const sinceISO = new Date(Date.now() - days * 86_400_000).toISOString();

  // ✅ Use FK-hinted embeds so TS knows which relation to join
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id, price, status, created_at,
      listings:listings!orders_listing_id_fkey ( title, images ),
      buyer:profiles!orders_buyer_id_fkey ( username )
    `
    )
    .eq("seller_id", user.id)
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-red-600">{error.message}</div>
    );
  }

  const paid = (orders ?? [])
    .filter((o) => o.status === "shipped") // MVP: shipped = paid
    .reduce((sum, o) => sum + Number(o.price), 0);

  const pending = (orders ?? [])
    .filter((o) => o.status !== "shipped")
    .reduce((sum, o) => sum + Number(o.price), 0);

  const total = paid + pending;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Sales &amp; Earnings</h1>
        <RangeSelect days={days} />
      </div>

      {/* Summary */}
      <div className="rounded-xl border p-4 mb-6">
        <p className="text-sm text-gray-600">Total Earnings</p>
        <p className="text-4xl font-bold">${total.toFixed(2)}</p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-sm text-green-700">Paid</p>
            <p className="text-xl font-semibold text-green-800">
              ${paid.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3">
            <p className="text-sm text-yellow-700">Pending</p>
            <p className="text-xl font-semibold text-yellow-800">
              ${pending.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Sold Items</h2>
      <div className="space-y-4">
        {(orders ?? []).map((o) => {
          const img =
            o.listings?.images?.[0] ?? "https://via.placeholder.com/300";
          const badge =
            o.status === "shipped" ? (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                Paid
              </span>
            ) : (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                Pending
              </span>
            );

          const createdAt = o.created_at
            ? new Date(o.created_at).toLocaleDateString()
            : "";

          return (
            <div
              key={o.id}
              className="flex items-center gap-4 rounded-xl border p-3"
            >
              <img
                src={img}
                alt=""
                className="w-20 h-20 object-cover rounded-md"
              />
              <div className="flex-1">
                <p className="font-medium">
                  {o.listings?.title ?? "Listing"}
                </p>
                <p className="text-sm text-gray-500">
                  @{o.buyer?.username ?? "buyer"} · {createdAt}
                </p>
              </div>
              {badge}
              <div className="text-right font-semibold w-20 text-nowrap">
                ${Number(o.price).toFixed(2)}
              </div>
            </div>
          );
        })}

        {!orders?.length && (
          <p className="text-sm text-gray-500">No sales in this period.</p>
        )}
      </div>
    </div>
  );
}
