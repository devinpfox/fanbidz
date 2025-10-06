

import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../types/supabase";
import Link from "next/link";

export default async function OrdersPage() {
  const cookieStore = await nextCookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore as any,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Only orders where I'm the seller
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
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-red-600">{error.message}</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">All Orders</h1>

      <div className="space-y-4">
        {(orders ?? []).map((o) => {
          const img =
            o.listings?.images?.[0] ?? "https://via.placeholder.com/300";
          const createdAt = o.created_at
            ? new Date(o.created_at).toLocaleDateString()
            : "";
          const label =
            (o.status ?? "to_ship") === "shipped"
              ? { text: "Shipped", cls: "bg-green-100 text-green-700" }
              : { text: "Awaiting Shipment", cls: "bg-yellow-100 text-yellow-700" };

        return (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="flex items-center gap-4 rounded-xl border p-3 hover:bg-gray-50"
          >
            <img
              src={img}
              alt=""
              className="w-20 h-20 object-cover rounded-md"
            />

            <div className="flex-1">
              <p className="font-medium">{o.listings?.title ?? "Listing"}</p>
              <p className="text-sm text-gray-500">
                @{o.buyer?.username ?? "buyer"} · {createdAt}
              </p>
              <span
                className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${label.cls}`}
              >
                {label.text}
              </span>
            </div>

            <div className="text-right font-semibold">
              ${Number(o.price).toFixed(2)}
            </div>
          </Link>
        )})}

        {!orders?.length && (
          <p className="text-sm text-gray-500">You have no orders yet.</p>
        )}
      </div>
    </div>
  );
}
