'use client';
import { useEffect, useState } from 'react';
import { api, loadAuthTokenFromStorage } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import Link from 'next/link';

type User = {
  id: string;
  userName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  bio?: string;
};

type Post = {
  id: string;
  caption?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  media: Array<{ id: string; media_url: string; media_type: string }>;
  profile: User;
};

type NearbyUser = {
  id: string;
  userName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  distanceKm: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'nearby' | 'hangouts'>('feed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAuthTokenFromStorage();
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [userRes, postsRes, nearbyRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/posts'),
        api.get('/hangouts/nearby?radiusKm=5'),
      ]);
      
      setUser(userRes.data?.data ?? userRes.data ?? null);
      setPosts(postsRes.data?.data ?? postsRes.data ?? []);
      setNearbyUsers(nearbyRes.data?.data ?? nearbyRes.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadDashboardData} className="underline">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt={user.userName} className="w-16 h-16 rounded-full" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName || user?.userName}!</h1>
              <p className="text-gray-600 mt-1">
                {user?.postsCount || 0} posts • {user?.followersCount || 0} followers • {user?.followingCount || 0} following
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-8">
            {[
              { id: 'feed', label: 'Feed', icon: '📱' },
              { id: 'nearby', label: 'Nearby', icon: '📍' },
              { id: 'hangouts', label: 'Hangouts', icon: '🤝' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 transition-all duration-200 font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No posts yet. Be the first to share something!</p>
                <Link href="/posts/new" className="bg-black text-white px-6 py-2 rounded-lg hover:opacity-90 transition">
                  Create First Post
                </Link>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Post Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {post.profile.avatarUrl && (
                        <img src={post.profile.avatarUrl} alt={post.profile.userName} className="w-10 h-10 rounded-full" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{post.profile.userName}</p>
                        <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  {post.caption && (
                    <div className="p-4">
                      <p className="text-gray-800 leading-relaxed">{post.caption}</p>
                    </div>
                  )}

                  {/* Post Media */}
                  {post.media.length > 0 && (
                    <div className="bg-gray-50">
                      {post.media.map((media) => (
                        <div key={media.id} className="aspect-square bg-gray-200 flex items-center justify-center">
                          {media.media_type.startsWith('image') ? (
                            <img src={media.media_url} alt="Post media" className="w-full h-full object-cover" />
                          ) : (
                            <video src={media.media_url} controls className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-2 hover:opacity-70 transition text-gray-600 hover:text-red-500">
                        <span className="text-lg">❤️</span>
                        <span className="font-medium">{post.likes_count}</span>
                      </button>
                      <button className="flex items-center gap-2 hover:opacity-70 transition text-gray-600 hover:text-blue-500">
                        <span className="text-lg">💬</span>
                        <span className="font-medium">{post.comments_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'nearby' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">People nearby (within 5km)</h2>
              <p className="text-gray-600">Find people to hang out with in your area</p>
            </div>

            {nearbyUsers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="text-6xl mb-4">📍</div>
                <p className="text-gray-600 mb-4 text-lg">No one nearby right now</p>
                <p className="text-sm text-gray-500">Make sure your location is enabled and you're available for hangouts.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {nearbyUsers.map((user) => (
                  <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.userName} className="w-16 h-16 rounded-full" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{user.userName}</p>
                          <p className="text-gray-600">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.bio && <p className="text-sm text-gray-500 mt-1">{user.bio}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600 mb-2">{user.distanceKm.toFixed(1)} km away</p>
                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                          Send Hangout Request
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'hangouts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Hangout Requests</h2>
              <p className="text-gray-600">Manage your hangout requests and invitations</p>
            </div>

            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="text-6xl mb-4">🤝</div>
              <p className="text-gray-600 mb-4 text-lg">No hangout requests yet</p>
              <p className="text-sm text-gray-500">Send requests to people nearby to start hanging out!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}