'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../../types/supabase';

type FollowButtonProps = {
  profileId: string;
};

export default function FollowButton({ profileId }: FollowButtonProps) {
  const supabase = useSupabaseClient<Database>();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFollowStatus = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId) return;

      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', profileId)
        .maybeSingle();

      setIsFollowing(!!data);
      setLoading(false);
    };

    checkFollowStatus();
  }, [profileId, supabase]);

  const handleClick = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;
    if (!currentUserId) return;

    if (isFollowing) {
      // unfollow
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profileId);
      setIsFollowing(false);
    } else {
      // follow
      await supabase.from('follows').insert({
        follower_id: currentUserId,
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
}
