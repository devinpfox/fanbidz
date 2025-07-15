import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { formatDistanceToNow } from "date-fns";
import LiveCountdown from "../components/LiveCountdown";

export default async function HomePage() {
  // 1. Create a Supabase client aware of the user's session
  const supabase = createServerComponentClient({ cookies });

  // 2. Check for an active session (user must be logged in)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  // 3. Fetch your listings
  const { data: listings, error } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      image,
      buy_now,
      last_bid,
      seconds_left,
      created_at,
      user_id,
      profiles!user_id (
        username,
        avatar
      )
    `)
    .eq("sold", false)
    .order("created_at", { ascending: false });

  if (error || !listings) {
    return <div className="p-6 text-red-500">Failed to load listings</div>;
  }

  // Like/comment logic as before
  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from("likes").select("listing_id"),
    supabase.from("comments").select("listing_id"),
  ]);
  const likeMap = new Map();
  const commentMap = new Map();
  (likes || []).forEach((like) => {
    if (!like.listing_id) return;
    likeMap.set(like.listing_id, (likeMap.get(like.listing_id) || 0) + 1);
  });
  (comments || []).forEach((comment) => {
    if (!comment.listing_id) return;
    commentMap.set(comment.listing_id, (commentMap.get(comment.listing_id) || 0) + 1);
  });

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-pink-600">
        <img className="logo" src="https://i.imgur.com/2xPI7fs.png" alt="Logo" />
      </h1>
      {listings.map((listing) => (
        <div key={listing.id} className="mb-10">
          {/* ... your existing UI ... */}
          <div className="relative w-full">
            <img
              src={listing.image ?? "https://via.placeholder.com/400x300"}
              alt="Product"
              className="w-full h-[340px] object-cover"
            />
            {listing.created_at && (
              <span className="absolute top-3 left-3 bg-white/90 text-xs px-3 py-1 rounded-full shadow font-medium">
                Posted {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
              </span>
            )}
            {listing.seconds_left != null && (
              <div className="absolute top-3 right-3">
                <LiveCountdown initialSeconds={listing.seconds_left} />
              </div>
            )}
          </div>
          <div className="bg-white px-4 pt-4 pb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <img
                  src={listing.profiles?.[0]?.avatar ?? "https://i.pravatar.cc/40"}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
                <p className="text-sm font-medium">@{listing.profiles?.[0]?.username}</p>
              </div>
              <p className="text-gray-500 text-sm">${listing.buy_now?.toFixed(2)}</p>
            </div>
            <p className="font-semibold text-base">{listing.title}</p>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>❤️ {likeMap.get(listing.id) ?? 0} Likes</span>
              <span>💬 {commentMap.get(listing.id) ?? 0} Comments</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">
                💰 Last bid: ${listing.last_bid?.toFixed(2) ?? "0.00"}
              </span>
              <button className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700">
                Place Bid →
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
