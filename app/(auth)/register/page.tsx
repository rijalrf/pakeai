'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push('/onboarding');
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
          Buat Akun Developer
        </CardTitle>
        <CardDescription>
          Mulai merancang software architecture dan otomatisasi AI coding task.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-300">Nama Lengkap</label>
            <Input
              type="text"
              placeholder="Rijal Developer"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
            <label className="text-[11px] font-medium text-zinc-300">Password</label>
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
            {isLoading ? 'Membuat Akun...' : 'Lanjut ke Onboarding'}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>

          <div className="flex items-center justify-between w-full text-[11px] text-zinc-500 pt-1">
            <span>Sudah memiliki akun?</span>
            <Link href="/login" className="text-zinc-300 hover:text-white underline underline-offset-4">
              Masuk
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
