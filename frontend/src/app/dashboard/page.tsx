'use client';
import { useEffect, useState } from 'react';
import { api, loadAuthTokenFromStorage } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

type Me = {
  id: string;
  userName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
};

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAuthTokenFromStorage();
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    (async () => {
      try {
        const { data } = await api.get('/users/me');
        setMe(data?.data ?? data ?? null);
      } catch (e: any) {
        setError(e?.response?.data?.message || e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      {me && (
        <div className="flex items-center gap-4 mb-6">
          {me.avatarUrl && (
            <img className="rounded-full" src={me.avatarUrl} alt={me.userName} width={64} height={64} />
          )}
          <div>
            <div className="text-xl font-bold">{me.userName}</div>
            <div className="opacity-80 text-sm">
              {me.firstName} {me.lastName}
            </div>
            <div className="opacity-80 text-sm">
              {me.postsCount ?? 0} posts · {me.followersCount ?? 0} followers · {me.followingCount ?? 0} following
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <a className="underline" href="/posts/new">Create Post</a>
        <a className="underline" href="/nearby">Nearby</a>
      </div>
    </div>
  );
}


