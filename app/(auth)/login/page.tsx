'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock local authentication flow for instant development
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 600);
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 shadow-2xl">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-zinc-950 font-bold">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xs font-mono font-semibold tracking-wider text-zinc-300 uppercase">
            Project AI Planner
          </span>
        </div>
        <CardTitle className="text-lg font-semibold tracking-tight text-zinc-100">
          Masuk ke Workspace
        </CardTitle>
        <CardDescription>
          Kelola ide, PRD arsitektur, dan koordinasikan AI coding agent.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-300">Email</label>
            <Input
              type="email"
              placeholder="developer@studio.dev"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-zinc-300">Password</label>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Mengautentikasi...' : 'Masuk Sekarang'}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>

          <div className="flex items-center justify-between w-full text-[11px] text-zinc-500 pt-1">
            <span>Belum punya akun?</span>
            <Link href="/register" className="text-zinc-300 hover:text-white underline underline-offset-4">
              Daftar akun baru
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
