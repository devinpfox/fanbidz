'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) router.replace('/'); // redirect to main feed
    };
    checkSession();
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = identifier.trim();
    const isEmail = /\S+@\S+\.\S+/.test(id);
    const isPhone = /^\+?[0-9\s\-().]{7,}$/.test(id);

    try {
      let emailToUse: string | null = null;

      if (isEmail) {
        emailToUse = id;
      } else if (isPhone) {
        const { error } = await supabase.auth.signInWithPassword({ phone: id, password });
        if (error) throw error;
      } else {
        // Username → email via RPC
        const { data: rpcEmail, error: rpcErr } = await supabase.rpc('get_email_by_username', {
          p_username: id.toLowerCase(),
        });
        if (rpcErr || !rpcEmail) throw new Error('Invalid credentials');
        emailToUse = rpcEmail as string;
      }

      if (emailToUse) {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });
        if (error) throw error;
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) throw new Error('Login failed');

      // Fetch profile info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();

      if (profileError) throw new Error('Profile fetch failed');

      // Redirect to setup if profile incomplete
      if (!profile?.username || !profile?.first_name || !profile?.last_name) {
        router.push('/profile-settings');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
      alert('Invalid login credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm p-8 bg-white rounded-xl shadow space-y-6"
        autoComplete="off"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/fanbids-logo.svg"
            alt="Fanbids Logo"
            width={200}
            height={60}
            priority
          />
        </div>

        {/* Username / Email / Phone input */}
        <input
          className="w-full border border-gray-300 rounded px-4 py-3 text-lg focus:outline-[rgb(255,78,207)]"
          placeholder="Phone number, email, or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />

        {/* Password input */}
        <div className="relative">
          <input
            className="w-full border border-gray-300 rounded px-4 py-3 text-lg pr-12 focus:outline-[rgb(255,78,207)]"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? (
              <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth={2}
                  d="M17.94 17.94A10.01 10.01 0 0 1 12 20c-5.523 0-10-7-10-8s4.477-8 10-8a9.97 9.97 0 0 1 5.47 1.61M1 1l22 22"
                />
              </svg>
            ) : (
              <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                <ellipse cx={12} cy={12} rx={10} ry={8} stroke="currentColor" strokeWidth={2} />
                <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={2} />
              </svg>
            )}
          </button>
        </div>

        {/* Sign In */}
        <button
          className="w-full bg-[rgb(255,78,207)] hover:bg-pink-600 text-white py-3 rounded text-lg font-semibold"
          type="submit"
        >
          Sign In
        </button>

        {/* Sign Up link */}
        <div className="text-center text-gray-500 text-base">
          Don’t have an account?{' '}
          <span
            className="text-[rgb(255,78,207)] font-medium cursor-pointer"
            onClick={() => router.push('/signup')}
          >
            Sign Up
          </span>
        </div>
      </form>
    </div>
  );
}
