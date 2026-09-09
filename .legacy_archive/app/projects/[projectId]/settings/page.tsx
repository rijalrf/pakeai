'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, Copy, Check, Plus, Trash2, ShieldCheck } from 'lucide-react';

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

  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [createdRawToken, setCreatedRawToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadTokens = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tokens`);
      if (res.ok) {
        const data = await res.json();
        setTokens(
          (data.tokens || [])
            .filter((t: any) => !t.isRevoked)
            .map((t: any) => ({
              id: t.id,
              name: t.name,
              token: '',
              prefix: t.prefix,
              createdAt: t.createdAt,
              lastUsedAt: t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString('id-ID') : null,
            }))
        );
      }
    } catch {}
  };

  useEffect(() => {
    if (projectId) {
      loadTokens();
    }
  }, [projectId]);

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        const created = data.token;
        setCreatedRawToken(created.rawToken);
        setNewTokenName('');
        await loadTokens();
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tokens?tokenId=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTokens(tokens.filter((t) => t.id !== id));
      }
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-base font-bold tracking-tight text-zinc-900">
          Token &amp; Akses CLI
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Kelola Personal Access Token (PAT) untuk autentikasi perintah terminal <code>npx project-ai</code>.
        </p>
      </div>

      <Card className="border-zinc-200 bg-white shadow-2xs">
        <CardHeader className="pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-indigo-600" />
            <CardTitle className="text-sm font-semibold text-zinc-900">
              Personal Access Tokens (PAT)
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-500">
            Token memberikan otorisasi kepada agent CLI untuk mengambil task dan mengirim laporan selesai.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Create Token Form */}
          <form onSubmit={handleGenerateToken} className="flex gap-2">
            <Input
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="Label token, contoh: Laptop Kantor / VSCode Terminal"
              className="h-8 text-xs flex-1"
            />
            <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-3.5 w-3.5" />
              Buat Token
            </Button>
          </form>

          {/* New Token Banner */}
          {createdRawToken && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center gap-1.5 text-emerald-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Token Berhasil Dibuat (Salin sekarang — tidak ditampilkan lagi)
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[11px] gap-1 bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                  onClick={() => handleCopy(createdRawToken)}
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Tersalin' : 'Salin'}
                </Button>
              </div>
              <code className="block rounded bg-white px-2 py-1 font-mono text-[11px] text-zinc-900 break-all border border-emerald-200">
                {createdRawToken}
              </code>
            </div>
          )}

          {/* Token List Table */}
          <div className="rounded-md border border-zinc-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-2.5 pl-3">Label</th>
                  <th className="p-2.5">Prefix</th>
                  <th className="p-2.5">Terakhir Digunakan</th>
                  <th className="p-2.5 text-right pr-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {tokens.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-zinc-400 font-mono">
                      Belum ada token aktif. Buat token baru di atas.
                    </td>
                  </tr>
                ) : (
                  tokens.map((tok) => (
                    <tr key={tok.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="p-2.5 pl-3 font-medium text-zinc-900">{tok.name}</td>
                      <td className="p-2.5 font-mono text-zinc-500">{tok.prefix}...</td>
                      <td className="p-2.5 text-zinc-500">{tok.lastUsedAt || 'Belum digunakan'}</td>
                      <td className="p-2.5 text-right pr-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(tok.id)}
                          className="h-6 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          title="Cabut token"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        <CardFooter className="bg-zinc-50 border-t border-zinc-100 p-3 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>Login di terminal lokal:</span>
          <code className="font-mono text-zinc-800 bg-white border border-zinc-200 px-2 py-0.5 rounded">
            npx project-ai login
          </code>
        </CardFooter>
      </Card>
    </div>
  );
}
