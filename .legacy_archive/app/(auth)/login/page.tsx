'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk. Periksa email dan password.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-zinc-200 bg-white shadow-2xs">
      <CardHeader className="space-y-1.5 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-500 uppercase">
            Project AI Planner
          </span>
        </div>
        <CardTitle className="text-base font-bold tracking-tight text-zinc-900">
          Masuk ke Akun
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Kelola ide, spesifikasi PRD, dan koordinasikan AI coding agent.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3 pt-4">
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-700">Email</label>
            <Input
              type="email"
              placeholder="developer@studio.dev"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700">Password</label>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-4 border-t border-zinc-100">
          <Button
            type="submit"
            className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Mengautentikasi...' : 'Masuk'}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>

          <div className="flex items-center justify-between w-full text-[11px] text-zinc-500 pt-1">
            <span>Belum punya akun?</span>
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Daftar akun baru
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
