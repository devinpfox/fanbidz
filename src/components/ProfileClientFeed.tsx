'use client';

import { useUserHydration } from '@/hooks/useUserHydration';
import PostCard from '@/components/PostCard';

export default function ProfileClientFeed({
  listings,
  currentUserId,
}: {
  listings: any[];
  currentUserId: string | null;
}) {
  const { likedSet, savedSet, walletBalance } = useUserHydration();

  if (!listings.length) {
    return (
      <p className="col-span-3 text-center text-gray-500 text-sm mt-6">
        This user hasn’t posted any listings yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {listings.map((listing) => {
        const hasLiked = likedSet.has(listing.id);
        const initialSaved = savedSet.has(listing.id);

        return (
          <PostCard
            key={listing.id}
            images={listing.images}
            cover={listing.images?.[0] ?? ''}
            listingId={listing.id}
            title={listing.title}
            datePosted={listing.created_at}
            category="User Listing"
            endAt={listing.end_at}
            sold={listing.sold}
            profile={listing.profiles}
            currentUserId={currentUserId}
            likeCount={0} // or preload likes separately
            commentCount={0}
            hasLiked={hasLiked}
            initialSaved={initialSaved}
            highestBid={listing.last_bid}
            buyNow={listing.buy_now}
            walletBalance={walletBalance ?? undefined}
            showDots={false}
            showHeaderFollow={false}
          />
        );
      })}
    </div>
  );
}
