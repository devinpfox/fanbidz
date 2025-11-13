// app/purchase/[id]/shipping/page.tsx
export const dynamic = "force-dynamic";

import { cookies as nextCookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../../../types/supabase";
import { notFound } from "next/navigation";
import ShippingForm from "./shipping-form";

// New Client Component for back navigation
import { BackButton } from "./BackButton"; // ⬅️ You must create this file (see below)

// near the top of the file
type ShippingAddress = {
  name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};


export default async function BuyerShippingPage({ params }: { params: { id: string } }) {
  const cookieStore = await nextCookies();
  // Using 'as any' here to match the type assertion in the original component
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore as any });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  // Buyer can view only their own order
  const { data: order } = await supabase
    .from("orders")
    .select(`
      id, buyer_id, seller_id, price, status, created_at, shipping,
      listings:listing_id ( title, images )
    `)
    .eq("id", params.id)
    .maybeSingle<any>();

    if (!order || order.buyer_id !== user.id) return notFound();

  const img = order.listings?.images?.[0] ?? "https://via.placeholder.com/300";
  const title = order.listings?.title ?? "Item";

  const ship: ShippingAddress =
  order.shipping && typeof order.shipping === "object" && !Array.isArray(order.shipping)
    ? (order.shipping as ShippingAddress)
    : {};


  return (
    // 1. Gradient Background
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20">
      <div className="max-w-2xl mx-auto min-h-screen">

        {/* 2. Elegant Header with Glassmorphism */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
          <div className="flex items-center justify-start px-6 h-16">
            <BackButton /> {/* Uses the client component for interactivity */}
            <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent ml-4">
              Shipping Address
            </h1>
          </div>
        </div>

        <div className="px-6 py-8">
          
          {/* 3. Order Summary Card - Glass Card Design */}
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl shadow-black/5 border border-white/20 overflow-hidden p-5 mb-8 flex gap-4 items-center">
            
            {/* Product Image with Gradient Border */}
            <div className="p-0.5 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-lg shrink-0">
                <img 
                  src={img} 
                  className="w-16 h-16 rounded-lg object-cover bg-white/50" 
                  alt={title} 
                />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{title}</p>
              <p className="text-xs text-gray-500 mt-1">
                Order Date: {new Date(order.created_at!).toLocaleDateString()}
              </p>
            </div>
            
            {/* Price with Gradient Text */}
            <div className="font-bold text-lg bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent shrink-0">
              ${Number(order.price).toFixed(2)}
            </div>
          </div>

          {/* 4. Shipping Form (The client component that needs to be updated with the new input styles) */}
          <ShippingForm
              orderId={order.id}
              initial={{
                name:        ship.name        ?? "",
                phone:       ship.phone       ?? "",
                address_line1: ship.address_line1 ?? "",
                address_line2: ship.address_line2 ?? "",
                city:        ship.city        ?? "",
                state:       ship.state       ?? "",
                postal_code: ship.postal_code ?? "",
                country:     ship.country     ?? "",
              }}
          />
        </div>
      </div>
    </div>
  );
}