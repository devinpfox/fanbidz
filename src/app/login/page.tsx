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

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) router.replace('/');
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();

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
    <div
      className="
        min-h-screen flex items-center justify-center 
        bg-gradient-to-br from-pink-50 via-white to-fuchsia-100
        relative overflow-hidden
      "
    >
      {/* Soft luxury glow behind card */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-pink-300/30 blur-[180px] rounded-full top-[-200px] right-[-150px]" />
        <div className="absolute w-[500px] h-[500px] bg-fuchsia-400/20 blur-[160px] rounded-full bottom-[-150px] left-[-150px]" />
      </div>

      <form
        onSubmit={handleLogin}
        autoComplete="off"
        className="
          relative w-full max-w-sm
          p-10
          rounded-3xl
          backdrop-blur-xl
          bg-white/40
          border border-white/20
          shadow-[0_8px_40px_rgba(0,0,0,0.12)]
          space-y-8
        "
      >
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <Image
            src="/fanbids-logo.svg"
            alt="Fanbids Logo"
            width={240}
            height={70}
            priority
            className="drop-shadow-sm"
          />
        </div>

        {/* Identifier Input */}
        <input
          className="
            w-full px-4 py-3 text-lg rounded-2xl 
            bg-white/60 backdrop-blur border border-white/30 
            shadow-inner 
            focus:outline-none focus:ring-2 
            focus:ring-pink-500/40
          "
          placeholder="Phone number, email, or username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />

        {/* Password */}
        <div className="relative">
          <input
            className="
              w-full px-4 py-3 pr-12 text-lg rounded-2xl 
              bg-white/60 backdrop-blur border border-white/30 
              shadow-inner 
              focus:outline-none focus:ring-2 
              focus:ring-pink-500/40
            "
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            className="
              absolute right-4 top-1/2 -translate-y-1/2 
              text-gray-500 hover:text-gray-700 transition
            "
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? (
              <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth={2} d="M17.94 17.94A10 10 0 0 1 12 20c-5.5 0-10-7-10-8s4.5-8 10-8a10 10 0 0 1 5.47 1.61M1 1l22 22" />
              </svg>
            ) : (
              <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                <ellipse cx={12} cy={12} rx={10} ry={8} stroke="currentColor" strokeWidth={2} />
                <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={2} />
              </svg>
            )}
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="
            w-full py-3 rounded-2xl text-lg font-semibold text-white
            bg-gradient-to-r from-fuchsia-600 to-pink-500
            shadow-lg shadow-pink-500/30
            hover:opacity-90 transition
          "
        >
          Sign In
        </button>

        {/* Sign Up */}
        <div className="text-center text-gray-700 text-base">
          Don’t have an account?{' '}
          <span
            className="text-fuchsia-600 font-semibold cursor-pointer hover:underline"
            onClick={() => router.push('/signup')}
          >
            Sign Up
          </span>
        </div>
      </form>
    </div>
  );
}
