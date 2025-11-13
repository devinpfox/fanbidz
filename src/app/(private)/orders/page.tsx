// app/(private)/orders/page.tsx

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import Link from "next/link";

type DB = Database["public"];

type OrderWithRelations = DB["Tables"]["orders"]["Row"] & {
  listings: {
    title: string | null;
    images: string[] | null;
  } | null;
  buyer: {
    username: string | null;
  } | null;
};

export default async function OrdersPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<DB>({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Single query — no duplicate code
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      price,
      status,
      created_at,
      listings:listings!orders_listing_id_fkey(
        title,
        images
      ),
      buyer:profiles!orders_buyer_id_fkey(
        username
      )
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OrderWithRelations[]>(); // Type-safe return

  // Handle error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">
        {error.message}
      </div>
    );
  }

  // Handle empty state
  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-20">
        <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6 max-w-4xl mx-auto">
            <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              All Orders
            </h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 pt-10">
          <p className="text-sm text-gray-500">You have no orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-20">
      {/* Sticky Luxury Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6 max-w-4xl mx-auto">
          <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            All Orders
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-10">
        <div className="space-y-5">
          {orders.map((o) => {
            const img = o.listings?.images?.[0] ?? "https://via.placeholder.com/300";
            const createdAt = o.created_at
              ? new Date(o.created_at).toLocaleDateString()
              : "";
            const shipped = (o.status ?? "to_ship") === "shipped";

            const badge = shipped ? (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow">
                Shipped
              </span>
            ) : (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow">
                Awaiting Shipment
              </span>
            );

            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center gap-4 backdrop-blur-xl bg-white/70 rounded-2xl border border-white/20 shadow-md shadow-black/5 p-4 transition-all hover:shadow-xl hover:shadow-pink-500/20"
              >
                {/* Image */}
                <img src={img} alt={o.listings?.title ?? "Listing"} className="w-20 h-20 object-cover rounded-xl" />

                {/* Info */}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{o.listings?.title ?? "Listing"}</p>
                  <p className="text-sm text-gray-500">
                    @{o.buyer?.username ?? "buyer"} · {createdAt}
                  </p>
                  <div className="mt-1">{badge}</div>
                </div>

                {/* Price */}
                <div className="text-right font-semibold text-gray-900 w-24">
                  ${Number(o.price).toFixed(2)}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}