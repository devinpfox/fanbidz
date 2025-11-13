// app/(private)/sales/page.tsx
import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import RangeSelect from "./RangeSelect";
import { QueryData } from "@supabase/supabase-js";

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

  type OrdersWithDetails = {
    id: string;
    price: number;
    status: string;
    created_at: string | null;
    listings: {
      title: string | null;
      images: string[] | null;
    } | null;
    buyer: {
      username: string | null;
    } | null;
  };

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
    .order("created_at", { ascending: false })
    .returns<OrdersWithDetails[]>();

  if (error) {
    return (
      <div className="text-red-600 max-w-xl mx-auto p-6">
        {error.message}
      </div>
    );
  }

  const paid = (orders ?? [])
    .filter((o) => o.status === "shipped")
    .reduce((sum, o) => sum + Number(o.price), 0);

  const pending = (orders ?? [])
    .filter((o) => o.status !== "shipped")
    .reduce((sum, o) => sum + Number(o.price), 0);

  const total = paid + pending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-20">

      {/* Sticky Luxury Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6 max-w-4xl mx-auto">
          <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            Sales & Earnings
          </h1>
          <RangeSelect days={days} />
        </div>
      </div>

      {/* Page Container */}
      <div className="max-w-4xl mx-auto px-6 pt-10">

        {/* Summary Card */}
        <div
          className="
            backdrop-blur-xl bg-white/70 
            rounded-3xl border border-white/20 
            shadow-xl shadow-black/5 
            p-6 mb-10
          "
        >
          <p className="text-sm text-gray-600">Total Earnings</p>
          <p className="text-4xl font-bold text-gray-900 mt-1">
            ${total.toFixed(2)}
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="rounded-2xl backdrop-blur bg-green-500/10 p-4 border border-green-200/40 shadow">
              <p className="text-sm text-green-700">Paid</p>
              <p className="text-2xl font-semibold text-green-800">
                ${paid.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl backdrop-blur bg-yellow-500/10 p-4 border border-yellow-200/40 shadow">
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-2xl font-semibold text-yellow-800">
                ${pending.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sold Items
        </h2>

        <div className="space-y-5">
          {(orders ?? []).map((o) => {
            const img =
              o.listings?.images?.[0] ?? "https://via.placeholder.com/300";

            const badge =
              o.status === "shipped" ? (
                <span
                  className="
                    text-xs font-semibold px-3 py-1 rounded-full
                    bg-gradient-to-r from-green-500 to-green-600 
                    text-white shadow
                  "
                >
                  Paid
                </span>
              ) : (
                <span
                  className="
                    text-xs font-semibold px-3 py-1 rounded-full
                    bg-gradient-to-r from-yellow-400 to-yellow-500 
                    text-black shadow
                  "
                >
                  Pending
                </span>
              );

            const createdAt = o.created_at
              ? new Date(o.created_at).toLocaleDateString()
              : "";

            return (
              <div
                key={o.id}
                className="
                  flex items-center gap-4
                  backdrop-blur-xl bg-white/70
                  rounded-2xl border border-white/20
                  shadow-md shadow-black/5
                  p-4 transition-shadow duration-300 hover:shadow-xl hover:shadow-pink-500/20
                "
              >
                <img
                  src={img}
                  alt=""
                  className="w-20 h-20 object-cover rounded-xl"
                />

                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {o.listings?.title ?? "Listing"}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{o.buyer?.username ?? "buyer"} · {createdAt}
                  </p>
                </div>

                {badge}

                <div className="text-right font-semibold w-24 text-gray-900">
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
    </div>
  );
}