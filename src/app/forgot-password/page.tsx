'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the password reset link!');
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
        onSubmit={handleSubmit}
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
          Forgot Password?
        </h2>

        <p className="text-center text-gray-600 text-sm">
          Enter your email and we'll send you a link to reset your password.
        </p>

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

        {/* Email Input */}
        <input
          className="
            w-full px-4 py-3 text-lg rounded-2xl
            bg-white/60 backdrop-blur border border-white/30
            shadow-inner
            focus:outline-none focus:ring-2
            focus:ring-pink-500/40
          "
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
          {loading ? 'Sending...' : 'Send Reset Link'}
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
