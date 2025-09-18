'use client';
import { useEffect, useState } from 'react';
import { api, loadAuthTokenFromStorage } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

export default function ProfileSetupPage() {
  const [me, setMe] = useState<{ id: string; userName: string; avatarUrl?: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        setError(e?.response?.data?.message || e.message || 'Failed to load user');
      }
    })();
  }, []);

  useEffect(() => {
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }, [file]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !file) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const { data } = await api.patch(`/users/${me.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Avatar updated');
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Profile setup</h1>
      <p className="opacity-80 mb-4">Upload a circular avatar to complete your profile.</p>
      <form onSubmit={onUpload} className="grid gap-4">
        <div className="flex items-center gap-4">
          <div className="w-28 h-28 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="avatar" className="w-full h-full object-cover" />
            ) : me?.avatarUrl ? (
              <img src={me.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm opacity-60">No avatar</span>
            )}
          </div>
          <input
            className="flex-1 border border-black/20 dark:border-white/20 rounded px-3 py-2"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <button className="bg-black text-white dark:bg-white dark:text-black rounded px-4 py-2 disabled:opacity-60" type="submit" disabled={loading || !file}>
          {loading ? 'Uploading...' : 'Save avatar'}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
      </form>
    </div>
  );
}


