'use client';
import { useEffect } from 'react';
import { isAuthenticated } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <section
      className="min-h-screen w-full relative flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1600&auto=format&fit=crop')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center text-white">
        <h1 className="text-5xl font-extrabold mb-4 drop-shadow">Kick it Lowkey</h1>
        <p className="text-lg opacity-95 mb-6 drop-shadow">
          Meet people nearby for coffee, parties, and spontaneous meetups.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            className="inline-block bg-white text-black hover:bg-neutral-200 rounded px-6 py-3 font-semibold"
            href="/login"
          >
            Login
          </a>
          <a
            className="inline-block bg-transparent border-2 border-white text-white hover:bg-white hover:text-black rounded px-6 py-3 font-semibold transition"
            href="/signup"
          >
            Signup
          </a>
        </div>
      </div>
    </section>
  );
}
