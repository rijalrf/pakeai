import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signUp.email({ name, email, password });
    setLoading(false);
    if (res.error) {
      setErr(res.error.message ?? 'Registrasi gagal.');
      return;
    }
    navigate('/'); // Redirect to home page
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Buat akun pakeai</CardTitle>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-3">
            <Input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            {err && <p className="text-sm text-destructive">{err}</p>}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link to="/login" className="text-sm text-muted-foreground">Sudah punya akun?</Link>
            <Button type="submit" disabled={loading}>{loading ? 'Membuat...' : 'Daftar'}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
