import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../types/supabase";
import FollowButton from "@/components/FollowButton";
import { notFound } from "next/navigation";

interface Props {
  params: { username: string };
}

// ✨ THE FIX: Declare the component function as 'async'
export default async function UserProfilePage({ params }: Props) {
  const supabase = createServerComponentClient<Database>({
    cookies
  });

  // 1. Get profile based on username from URL
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, avatar")
    .eq("username", params.username) // This line will now be safe
    .single();

  if (!profile || profileError) return notFound();

  // 2. Get logged-in user to show follow button if necessary
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id || null;

  // 3. Fetch listings by this user
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, image, buy_now, created_at, last_bid")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  // 4. Get follower/following counts (with correct types)
  const [followerRes, followingRes] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
  ]);

  const followerCount = followerRes?.count ?? 0;
  const followingCount = followingRes?.count ?? 0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* User Info Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar ?? "https://i.pravatar.cc/40"}
            alt="Avatar"
            className="w-14 h-14 rounded-full"
          />
          <div>
            <h1 className="text-xl font-semibold">@{profile.username}</h1>
            <p className="text-sm text-gray-500">
              {followerCount} Followers • {followingCount} Following
            </p>
          </div>
        </div>

        {/* Show follow button if viewing someone else's profile */}
        {currentUserId && currentUserId !== profile.id && (
          <FollowButton profileId={profile.id} />
        )}
      </div>

      {/* Listings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {listings?.length ? (
          listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded shadow overflow-hidden"
            >
              <img
                src={listing.image ?? "https://via.placeholder.com/400x300"}
                alt="Listing"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p className="font-semibold">{listing.title}</p>
                <p className="text-sm text-gray-600">
                  ${listing.buy_now?.toFixed(2)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">
            This user hasn’t posted any listings yet.
          </p>
        )}
      </div>
    </div>
  );
}