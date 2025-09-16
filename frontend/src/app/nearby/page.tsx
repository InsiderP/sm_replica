'use client';
import { useEffect, useState } from 'react';
import { api, loadAuthTokenFromStorage } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

type NearbyUser = {
  id: string;
  userName: string;
  avatarUrl?: string;
  distanceKm: number;
};

export default function NearbyPage() {
  const [permission, setPermission] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [radius, setRadius] = useState(5);
  const [loading, setLoading] = useState(false);
  const [nearby, setNearby] = useState<NearbyUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAuthTokenFromStorage();
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  async function getLocation() {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported');
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermission('granted');
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        setPermission('denied');
        setError(err.message);
      },
      { enableHighAccuracy: true }
    );
  }

  async function sendLocationAndFetch() {
    if (!coords) return;
    setLoading(true);
    setError(null);
    try {
      await api.patch('/users/me/location', {
        latitude: coords.lat,
        longitude: coords.lon,
        is_available: true,
      });
      const { data } = await api.get(`/users/nearby`, { params: { radiusKm: radius } });
      setNearby(data?.data ?? data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Nearby</h1>
      <div className="flex items-center gap-3 mb-3">
        <span className="opacity-80">Radius (km)</span>
        <input
          className="border border-black/20 dark:border-white/20 rounded px-3 py-2 w-24"
          type="number"
          min={1}
          max={50}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
        <button className="bg-black text-white dark:bg-white dark:text-black rounded px-4 py-2 disabled:opacity-60" onClick={sendLocationAndFetch} disabled={loading || !coords}>
          {loading ? 'Loading...' : 'Update & Fetch'}
        </button>
      </div>
      {coords && (
        <p className="text-sm opacity-80">
          Your location: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
        </p>
      )}
      {error && <p className="text-red-600">{error}</p>}
      <ul className="grid gap-3 mt-3">
        {nearby.map((u) => (
          <li key={u.id} className="border border-black/10 dark:border-white/15 rounded p-3">
            <div className="flex items-center gap-3">
              {u.avatarUrl && (
                <img className="rounded-full" src={u.avatarUrl} alt={u.userName} width={40} height={40} />
              )}
              <div>
                <div className="font-semibold">{u.userName}</div>
                <div className="opacity-70 text-sm">{u.distanceKm.toFixed(2)} km away</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


