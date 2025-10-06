import { useUserHydration } from '../hooks/useUserHydration';
import PostCard from './PostCard';

type Profile = {
  username: string | null;
  avatar: string | null;
};

type Listing = {
    id: string;
    title: string | null;
    images: string[] | null;
    buy_now: number | null;
    last_bid: number | null;
    seconds_left: number | null;
    created_at: string;
    end_at: string | null; // ✅ correct field name
    user_id: string;
    profiles: Profile | Profile[] | null;
  };

type Props = {
  listings: Listing[];
  likeCountMap: Record<string, number>;
  commentCountMap: Record<string, number>;
};

export default function HomeClientFeed({ listings, likeCountMap, commentCountMap }: Props) {
  const { walletBalance, likedSet, savedSet, userId } = useUserHydration();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {listings.map((listing) => {
        const profile = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles;
        const endAt =
          listing.seconds_left != null
            ? new Date(Date.now() + listing.seconds_left * 1000).toISOString()
            : null;

        return (
          <PostCard
            key={listing.id}
            cover={listing.images?.[0] ?? 'https://via.placeholder.com/800'}
            listingId={listing.id}
            title={listing.title}
            datePosted={listing.created_at}
            category="Sports Shoes"
            endAt={endAt}
            sold={false}
            profile={profile}
            currentUserId={userId}
            likeCount={likeCountMap[listing.id] ?? 0}
            commentCount={commentCountMap[listing.id] ?? 0}
            hasLiked={likedSet.has(listing.id)}
            initialSaved={savedSet.has(listing.id)}
            highestBid={listing.last_bid}
            buyNow={listing.buy_now}
            walletBalance={walletBalance ?? undefined}
            showDots
            showHeaderFollow
          />
        );
      })}
    </div>
  );
}
