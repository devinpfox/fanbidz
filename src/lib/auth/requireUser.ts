import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../../types/supabase';

export async function requireUser(nextPath: string = '/') {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Preserve where the user was headed
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return { supabase, user };
}
