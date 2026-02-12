'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password updated successfully!');
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
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
        onSubmit={handleReset}
        autoComplete="off"
        className="
          relative w-full max-w-sm
          p-10
          rounded-3xl
          backdrop-blur-xl
          bg-white/40
          border border-white/20
          shadow-[0_8px_40px_rgba(0,0,0,0.12)]
          space-y-6
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

        <h2 className="text-center text-xl font-semibold text-gray-800">
          Reset Your Password
        </h2>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-100 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="p-3 rounded-xl bg-green-100 text-green-700 text-sm text-center">
            {message}
          </div>
        )}

        {/* New Password */}
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
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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

        {/* Confirm Password */}
        <input
          className="
            w-full px-4 py-3 text-lg rounded-2xl
            bg-white/60 backdrop-blur border border-white/30
            shadow-inner
            focus:outline-none focus:ring-2
            focus:ring-pink-500/40
          "
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full py-3 rounded-2xl text-lg font-semibold text-white
            bg-gradient-to-r from-fuchsia-600 to-pink-500
            shadow-lg shadow-pink-500/30
            hover:opacity-90 transition
            disabled:opacity-50
          "
        >
          {loading ? 'Updating...' : 'Reset Password'}
        </button>

        {/* Back to Login */}
        <div className="text-center text-gray-700 text-base">
          <span
            className="text-fuchsia-600 font-semibold cursor-pointer hover:underline"
            onClick={() => router.push('/login')}
          >
            Back to Sign In
          </span>
        </div>
      </form>
    </div>
  );
}
