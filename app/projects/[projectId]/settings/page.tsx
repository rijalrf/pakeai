'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useProjectStore } from '@/lib/stores/project-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { KeyRound, Copy, Check, Plus, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TokenItem {
  id: string;
  name: string;
  token: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { getProject } = useProjectStore();
  const project = getProject(projectId);

  const [tokens, setTokens] = useState<TokenItem[]>([
    {
      id: 'tok-1',
      name: 'MacBook Pro Agent Token',
      token: 'pak_98a7bc6d5e4f3a210fedcba98765432101234567',
      prefix: 'pak_98a7bc',
      createdAt: new Date().toISOString(),
      lastUsedAt: 'Baru saja',
    },
  ]);

  const [newTokenName, setNewTokenName] = useState('');
  const [createdRawToken, setCreatedRawToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    const randomSuffix = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    const raw = `pak_${randomSuffix}`;
    const item: TokenItem = {
      id: `tok-${Date.now()}`,
      name: newTokenName.trim(),
      token: raw,
      prefix: raw.slice(0, 10),
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    setTokens([item, ...tokens]);
    setCreatedRawToken(raw);
    setNewTokenName('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = (id: string) => {
    setTokens(tokens.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">
          Pengaturan Project &amp; CLI Agent
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Kelola kredensial Personal Access Token (PAT) untuk menghubungkan CLI terminal `npx project-ai`.
        </p>
      </div>

      {/* PAT Management Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm font-semibold">
              Personal Access Tokens (PAT)
            </CardTitle>
          </div>
          <CardDescription>
            Token ini memberikan otorisasi aman bagi AI coding agent CLI untuk mengambil task dan mengirim status penyelesaian.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Create Token Form */}
          <form onSubmit={handleGenerateToken} className="flex gap-2">
            <Input
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="Beri label token, misal: Terminal Coding Agent"
              className="h-8 text-xs flex-1"
            />
            <Button type="submit" size="sm" className="gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" />
              Generate Token
            </Button>
          </form>

          {/* New Token Banner Popup */}
          {createdRawToken && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  Token Berhasil Dibuat (Salin Sekarang — Tidak Ditampilkan Lagi)
                </span>
                <Button
                  size="sm"
                  variant="emerald"
                  className="h-6 text-[11px] gap-1"
                  onClick={() => handleCopy(createdRawToken)}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Tersalin' : 'Salin Token'}
                </Button>
              </div>
              <code className="block rounded bg-zinc-950 px-2 py-1 font-mono text-[11px] text-emerald-300 break-all border border-emerald-500/20">
                {createdRawToken}
              </code>
            </div>
          )}

          {/* Token List Table */}
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-2.5 pl-3">Label Token</th>
                  <th className="p-2.5">Prefix Identifier</th>
                  <th className="p-2.5">Terakhir Digunakan</th>
                  <th className="p-2.5 text-right pr-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {tokens.map((tok) => (
                  <tr key={tok.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-2.5 pl-3 font-medium text-zinc-200">{tok.name}</td>
                    <td className="p-2.5 font-mono text-zinc-400">{tok.prefix}...</td>
                    <td className="p-2.5 text-zinc-500">{tok.lastUsedAt || 'Belum digunakan'}</td>
                    <td className="p-2.5 text-right pr-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(tok.id)}
                        className="h-6 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15"
                        title="Cabut akses token"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>

        <CardFooter className="bg-zinc-950/40 border-t border-zinc-800/60 p-4 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>Gunakan di terminal lokal Anda:</span>
          <code className="font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            npx project-ai login
          </code>
        </CardFooter>
      </Card>
    </div>
  );
}
