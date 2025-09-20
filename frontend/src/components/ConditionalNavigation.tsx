'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { api, loadAuthTokenFromStorage } from '@/lib/api';

export default function ConditionalNavigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ userName: string; avatarUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Pages where navigation should NOT be shown
  const noNavPages = ['/', '/login', '/signup'];

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = isAuthenticated();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        try {
          // Load token from storage before making API call
          loadAuthTokenFromStorage();
          const { data } = await api.get('/users/me');
          setUser(data?.data ?? data ?? null);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // If token is invalid, clear it
          localStorage.removeItem('token');
          setIsLoggedIn(false);
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    setUser(null);
    window.location.href = '/';
  }

  // Don't show navigation on specific pages
  if (noNavPages.includes(pathname)) {
    return null;
  }

  // Don't show navigation if not logged in
  if (!isLoggedIn) {
    return null;
  }

  // Show loading state for authenticated pages
  if (loading) {
    return (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Kick it Lowkey</span>
            </div>
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  // Show full navigation for logged-in users
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <a href="/" className="text-xl font-bold text-black hover:opacity-80 transition">
              Kick it Lowkey
            </a>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="text-gray-700 hover:text-black transition font-medium">
              Dashboard
            </a>
            <a href="/posts/new" className="text-gray-700 hover:text-black transition font-medium">
              Create Post
            </a>
            <a href="/nearby" className="text-gray-700 hover:text-black transition font-medium">
              Nearby
            </a>
            
            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user?.avatarUrl && (
                <img src={user.avatarUrl} alt={user.userName} className="w-8 h-8 rounded-full" />
              )}
              <span className="text-sm font-medium text-gray-700">{user?.userName}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
