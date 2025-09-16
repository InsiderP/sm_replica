'use client';
import { useState } from 'react';
import { api, setAuthToken } from '@/lib/api';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const token = data?.data?.access_token || data?.access_token || data?.token;
      if (!token) throw new Error('No token in response');
      setAuthToken(token);
      window.location.href = '/nearby';
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center bg-gradient-to-br from-[#0ea5e9]/10 via-transparent to-[#22d3ee]/10">
      <div className="w-full max-w-md mx-auto p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur shadow-lg">
        <h1 className="text-3xl font-extrabold mb-2 text-center">Welcome back</h1>
        <p className="text-center mb-6 opacity-80">Login to continue</p>
        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm opacity-80">Email</span>
            <input
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm opacity-80">Password</span>
            <input
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button
            className="bg-black text-white dark:bg-white dark:text-black rounded px-4 py-2 disabled:opacity-60 hover:opacity-90 transition"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        </form>
        <p className="mt-3 opacity-80 text-center text-sm">
          Or <Link className="underline" href="/">go home</Link>
        </p>
      </div>
    </div>
  );
}


