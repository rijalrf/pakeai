import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn.email({ email, password });
    setLoading(false);
    if (res.error) {
      setErr(res.error.message ?? 'Login gagal.');
      return;
    }
    navigate('/'); // Redirect to home (not dashboard)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Masuk ke pakeai</CardTitle>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-3">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {err && <p className="text-sm text-destructive">{err}</p>}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link to="/register" className="text-sm text-muted-foreground">Belum punya akun?</Link>
            <Button type="submit" disabled={loading}>{loading ? 'Memproses...' : 'Masuk'}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
