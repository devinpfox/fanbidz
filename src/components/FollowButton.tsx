'use client';

import { useState, useEffect, memo } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '../../types/supabase';

type FollowButtonProps = {
  profileId: string;
};

const FollowButton = memo(function FollowButton({ profileId }: FollowButtonProps) {
  const { user, supabase } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', profileId)
        .maybeSingle<{ id: string }>();

      setIsFollowing(!!data);
      setLoading(false);
    };

    checkFollowStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, user?.id]);

  const handleClick = async () => {
    if (!user?.id) return;
    setLoading(true);

    if (isFollowing) {
      // unfollow
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId);
      setIsFollowing(false);
    } else {
      // follow
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: profileId,
      });
      setIsFollowing(true);
    }

    setLoading(false);
  };

  return (
    <button
      className={`px-4 py-2 rounded ${
        isFollowing ? 'bg-gray-300 text-black' : 'bg-black text-white'
      }`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
});

export default FollowButton;
