import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../types/supabase";
import FollowButton from "@/components/FollowButton";
import ProfileOwnerButtons from "@/components/ProfileOwnerButtons";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 60;

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;

  const cookieStore = cookies();

  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // 1. Profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, avatar, bio, website, display_name, full_name, role")
    .eq("username", username)
    .single();

  if (!profile || profileErr) return notFound();

  const {
    id: profileId,
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
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id ?? null;
  const isMe = currentUserId === profileId;
  const isConsumerOwner = isMe && isConsumer;

  // 3. Parallel fetches
  const [listingsRes, ordersRes, followerRes, followingRes] = await Promise.all([
    supabase
      .from("listings")
      .select("id, title, images, buy_now, created_at, last_bid")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false }),

    isConsumerOwner
      ? supabase
          .from("orders")
          .select(`
            id, status, created_at, price,
            listings:listing_id ( title, images )
          `)
          .eq("buyer_id", profileId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),

    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profileId),

    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profileId),
  ]);

  const listings = (listingsRes.data ?? []) as any[];
  const orders = ((ordersRes as any)?.data ?? []) as any[];

  const followerCount = followerRes?.count ?? 0;
  const followingCount = followingRes?.count ?? 0;

  const websiteStr =
    typeof website === "string"
      ? website
      : website
      ? String(website)
      : "";

  const websiteHref = websiteStr
    ? websiteStr.toLowerCase().startsWith("http")
      ? websiteStr
      : `https://${websiteStr}`
    : null;

  return (
    // IMPORTANT: isolates this page onto a separate GPU layer
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20 pb-20"
      style={{ transform: "translateZ(0)" }}
    >
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow">
        <div className="flex items-center justify-center h-16">
          <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            Profile
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-10">

        {/* PROFILE HEADER */}
        <div
          className="
            flex flex-col sm:flex-row items-center sm:items-start
            gap-8 mb-10
            bg-white rounded-3xl
            border border-gray-100 shadow-xl shadow-black/5
            p-6 sm:p-8
          "
        >
          {/* AVATAR */}
          <div className="relative">
            <div className="p-[3px] rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500">
              <img
                src={avatar ?? "https://i.pravatar.cc/150"}
                alt="Avatar"
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover bg-white ring-4 ring-white"
              />
            </div>
          </div>

          {/* USER INFO */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              {!isMe && currentUserId && <FollowButton profileId={profileId} />}
            </div>

            <p className="text-sm text-gray-600 text-center sm:text-left">@{username}</p>

            {/* STATS */}
            <div className="flex justify-center sm:justify-start gap-8 mt-3 text-sm text-gray-700 font-medium">
              <span><strong>{listings.length}</strong> posts</span>
              <span><strong>{followerCount}</strong> followers</span>
              <span><strong>{followingCount}</strong> following</span>
            </div>

            {/* OWNER BUTTONS */}
            {isMe && <ProfileOwnerButtons username={username} />}

            {/* BIO */}
            <div className="mt-4 text-sm leading-snug text-center sm:text-left space-y-1">
              {bio ? (
                <p className="text-gray-800">{bio}</p>
              ) : (
                <p className="text-gray-400">No bio yet.</p>
              )}

              {websiteHref && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-500 underline break-all font-medium"
                >
                  {websiteStr}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* HIGHLIGHTS — removed backdrop-blur
        <div className="flex gap-6 justify-center sm:justify-start mb-12">
          {[{ label: "Undies" }, { label: "Shoes" }, { label: "New" }].map((h, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="
                  w-16 h-16 rounded-full
                  bg-white
                  border border-gray-100 shadow-md shadow-black/5
                "
              />
              <span className="text-xs mt-1 text-gray-700">{h.label}</span>
            </div>
          ))}
        </div> */}

        {/* LISTINGS / ORDERS — removed backdrop-blur from cards */}
        {isConsumerOwner ? (
          <>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Your Orders</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {orders.length ? (
                orders.map((o) => {
                  const img =
                    o.listings?.images?.[0] ??
                    "https://via.placeholder.com/400";
                  const shipped = o.status === "shipped";

                  return (
                    <Link
                      key={o.id}
                      href={`/purchase/${o.id}`}
                      className="
                        relative overflow-hidden rounded-3xl
                        bg-white
                        border border-gray-100
                        shadow-lg shadow-black/5
                        hover:shadow-2xl hover:shadow-pink-500/20
                        transition-shadow duration-300
                      "
                    >
                      <img
                        src={img}
                        alt={o.listings?.title ?? "Order"}
                        className="w-full aspect-square object-cover transition-transform duration-300 hover:scale-105"
                        style={{ willChange: "transform" }}
                      />

                      <span
                        className={`
                          absolute left-2 top-2 text-[10px] px-2 py-1 rounded-md 
                          ${shipped 
                            ? "bg-green-600/90 text-white" 
                            : "bg-yellow-400/90 text-black"}
                        `}
                      >
                        {shipped ? "Shipped" : "To Ship"}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <p className="text-sm text-gray-600 mt-6 col-span-full">
                  You don’t have any orders yet.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {listings.length ? (
              listings.map((l) => (
                <Link
                  key={l.id}
                  href={`/post/${l.id}`}
                  className="
                    rounded-3xl overflow-hidden
                    bg-white
                    border border-gray-100
                    shadow-lg shadow-black/5
                    hover:shadow-2xl hover:shadow-pink-500/20
                    transition-shadow duration-300
                  "
                >
                  <img
                    src={l.images?.[0] ?? "https://via.placeholder.com/400"}
                    alt={l.title ?? "Listing"}
                    className="
                      w-full aspect-square object-cover
                      transition-transform duration-300 hover:scale-105
                    "
                    style={{ willChange: "transform" }}
                  />
                </Link>
              ))
            ) : (
              <p className="text-sm text-center text-gray-600 mt-6 col-span-full">
                This user hasn’t posted any listings yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
