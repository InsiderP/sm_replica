'use client';
import { FormEvent, useEffect, useState } from 'react';
import { api, loadAuthTokenFromStorage } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

export default function NewPostPage() {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [tagged, setTagged] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAuthTokenFromStorage();
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('caption', caption);
      if (tagged.trim()) {
        // Backend expects array; send multiple values
        tagged.split(',').map((t) => t.trim()).filter(Boolean).forEach((u) => form.append('tagged_usernames', u));
      }
      if (files) {
        Array.from(files).forEach((f) => form.append('files', f));
      }
      const { data } = await api.post('/posts', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Post created');
      setCaption('');
      setFiles(null);
      setTagged('');
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Post</h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm opacity-80">Caption</span>
          <textarea className="border border-black/20 dark:border-white/20 rounded px-3 py-2" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm opacity-80">Tagged usernames (comma separated)</span>
          <input className="border border-black/20 dark:border-white/20 rounded px-3 py-2" value={tagged} onChange={(e) => setTagged(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm opacity-80">Media (images/videos)</span>
          <input className="border border-black/20 dark:border-white/20 rounded px-3 py-2" type="file" multiple onChange={(e) => setFiles(e.target.files)} />
        </label>
        <button className="bg-black text-white dark:bg-white dark:text-black rounded px-4 py-2 disabled:opacity-60" type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Post'}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
      </form>
    </div>
  );
}


