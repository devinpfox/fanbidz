import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../types/supabase";
import FollowButton from "@/components/FollowButton";
import ProfileOwnerButtons from "@/components/ProfileOwnerButtons";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 60;

export default async function Page({
  params,
}: { params: { username: string } }) {
  const supabase = createServerComponentClient<Database>({ cookies });


  // 1. Profile lookup
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, avatar, bio, website, display_name, full_name, role")
    .eq("username", params.username)
    .single();

  if (!profile || error) return notFound();

  const {
    id: profileId,
    username,
    avatar,
    bio,
    website,
    display_name,
    full_name,
    role,
  } = profile;

  const displayName = display_name ?? full_name ?? `@${username}`;
  const isConsumer = role === "consumer";

  // 2. Current user
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id ?? null;
  const isMe = currentUserId === profileId;
  const isConsumerOwner = isMe && isConsumer;

  // 3. Listings
  let listings: {
    id: string;
    title: string | null;
    images: string[] | null;
    buy_now: number | null;
    created_at: string | null;
    last_bid: number | null;
  }[] = [];

  if (!isConsumerOwner) {
    const listingsRes = await supabase
      .from("listings")
      .select("id, title, images, buy_now, created_at, last_bid")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false });

    listings = listingsRes.data ?? [];
  }

  // 4. Orders (if consumer + self)
  let orders:
    | Array<{
        id: string;
        status: string;
        created_at: string | null;
        price: number;
        listings: { title: string | null; images: string[] | null } | null;
      }>
    | null = null;

  if (isConsumerOwner) {
    const ordersRes = await supabase
      .from("orders")
      .select(`
        id, status, created_at, price,
        listings:listing_id ( title, images )
      `)
      .eq("buyer_id", profileId)
      .order("created_at", { ascending: false });
    orders = ordersRes.data ?? [];
  }

  // 5. Follow counts
  const [followerRes, followingRes] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
  ]);
  const followerCount = followerRes?.count ?? 0;
  const followingCount = followingRes?.count ?? 0;

  const websiteHref = website?.startsWith("http") ? website : website ? `https://${website}` : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8">
        <img
          src={avatar ?? "https://i.pravatar.cc/150"}
          alt="Avatar"
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border"
        />
        <div className="flex-1 w-full">
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            {!isMe && currentUserId && <FollowButton profileId={profileId} />}
          </div>
          <p className="text-sm text-gray-600 text-center sm:text-left">@{username}</p>

          <div className="flex justify-center sm:justify-start gap-8 mt-2 text-sm text-gray-600">
            <span><strong>{listings?.length || 0}</strong> posts</span>
            <span><strong>{followerCount}</strong> followers</span>
            <span><strong>{followingCount}</strong> following</span>
          </div>

          {isMe && <ProfileOwnerButtons username={username} />}

          <div className="mt-4 text-sm leading-snug text-center sm:text-left space-y-1">
            {bio ? <p>{bio}</p> : <p className="text-gray-400">No bio yet.</p>}
            {websiteHref && (
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[rgb(255,78,207)] underline break-all"
              >
                {website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Highlights (optional placeholder) */}
      <div className="flex gap-6 justify-center sm:justify-start mb-10">
        {[{ label: "Undies" }, { label: "Shoes" }, { label: "New" }].map((h, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-300" />
            <span className="text-xs mt-1">{h.label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      {isConsumerOwner ? (
        <>
          <h2 className="text-lg font-semibold mb-3">Your Orders</h2>
          <div className="grid grid-cols-3 gap-[2px]">
            {(orders ?? []).map((o) => {
              const img = o.listings?.images?.[0] ?? "https://via.placeholder.com/400";
              const shipped = o.status === "shipped";
              return (
                <Link
                  key={o.id}
                  href={`/purchase/${o.id}`}
                  className="relative block bg-black group"
                >
                  <img
                    src={img}
                    alt={o.listings?.title ?? "Order"}
                    className="w-full aspect-square object-cover opacity-95 group-hover:opacity-100 transition"
                  />
                  <span
                    className={`absolute left-1.5 top-1.5 text-[10px] px-1.5 py-0.5 rounded-md
                    ${shipped ? "bg-green-600 text-white" : "bg-yellow-500 text-black"}`}
                  >
                    {shipped ? "Shipped" : "To Ship"}
                  </span>
                </Link>
              );
            })}
          </div>
          {!orders?.length && (
            <p className="text-sm text-gray-500 mt-4">You don’t have any orders yet.</p>
          )}
        </>
      ) : (
        <div className="grid grid-cols-3 gap-[2px]">
          {listings?.length ? (
            listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/post/${listing.id}`}
                className="bg-black block hover:opacity-90 transition"
              >
                <img
                  src={listing.images?.[0] ?? "https://via.placeholder.com/400"}
                  alt={listing.title ?? "Listing image"}
                  className="w-full aspect-square object-cover"
                />
              </Link>
            ))
          ) : (
            <p className="col-span-3 text-center text-gray-500 text-sm mt-6">
              This user hasn’t posted any listings yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
