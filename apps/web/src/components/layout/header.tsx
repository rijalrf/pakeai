// Header global: logo kiri, judul halaman di tengah, kanan berisi toggle tema dan menu pengguna.
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signOut, useSession } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, LogOut, FolderGit2, User } from 'lucide-react';

function getPageHeaderInfo(pathname: string): { title: string; subtitle?: string } | null {
  if (pathname.includes('/board')) {
    return {
      title: 'Board Task',
      subtitle: 'Kelola tugas implementasi aplikasi',
    };
  }
  if (pathname.includes('/interview')) {
    return {
      title: 'Interview Kebutuhan Aplikasi',
      subtitle: 'Jawab pertanyaan untuk memperjelas kebutuhan aplikasi',
    };
  }
  if (pathname.includes('/techstack')) {
    return {
      title: 'Pilih Tech Stack',
      subtitle: 'Tentukan arsitektur dan teknologi untuk membangun aplikasi',
    };
  }
  if (pathname.includes('/brd')) {
    return {
      title: 'Business Requirements Document',
      subtitle: 'Dokumen spesifikasi kebutuhan bisnis aplikasi Anda',
    };
  }
  if (pathname.includes('/tree')) {
    return {
      title: 'Diagram Struktur Aplikasi',
      subtitle: 'Peta hierarki fitur, sub-fitur, dan langkah implementasi teknis',
    };
  }
  if (pathname.includes('/guide')) {
    return {
      title: 'Panduan Eksekusi AI Agent',
      subtitle: 'Langkah-langkah menjalankan eksekusi otomatis oleh AI agent coding',
    };
  }
  if (pathname.includes('/settings')) {
    return {
      title: 'Pengaturan Proyek',
      subtitle: 'Pengaturan konfigurasi dan token akses proyek',
    };
  }
  if (pathname.startsWith('/chat/')) {
    return {
      title: 'Brainstorming Ide',
      subtitle: 'Diskusi ide aplikasi untuk menyusun kebutuhan awal',
    };
  }
  if (pathname === '/projects' || pathname.startsWith('/projects?')) {
    return {
      title: 'Daftar Proyek',
      subtitle: 'Kelola semua proyek aplikasi yang sudah Anda buat',
    };
  }
  if (pathname === '/profile') {
    return {
      title: 'Profil & Token Akses',
      subtitle: 'Informasi akun dan manajemen Token Akses Agen (PAT)',
    };
  }

  return null;
}

export function Header() {
  const { data } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const pageInfo = getPageHeaderInfo(location.pathname);

  return (
    <header className="sticky top-0 border-b bg-background/95 backdrop-blur-xs z-50">
      <div className="px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Kiri: logo */}
        <div className="flex items-center min-w-[160px]">
          <Link to="/" className="font-semibold text-xl">
            <span className="text-green-600 dark:text-green-400">pake</span>.ai
          </Link>
        </div>

        {/* Tengah: title & subtitle halaman */}
        {pageInfo ? (
          <div className="flex-1 text-center min-w-0 px-2">
            <h1 className="text-base font-semibold text-foreground tracking-tight truncate leading-tight">
              {pageInfo.title}
            </h1>
            {pageInfo.subtitle && (
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                {pageInfo.subtitle}
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Kanan: toggle tema + menu pengguna */}
        <div className="flex items-center gap-2 min-w-[160px] justify-end">
          <ThemeToggle />
          {data?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-sm">
                <Avatar className="h-8 w-8">
                  {data.user.image && <AvatarImage src={data.user.image} alt={data.user.name ?? 'Pengguna'} />}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {data.user.name?.charAt(0).toUpperCase() || data.user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-2 text-sm">
                  <div className="font-medium">{data.user.name || 'Pengguna'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{data.user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/projects')}>
                  <FolderGit2 className="h-4 w-4 mr-2" />
                  Proyek Saya
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Profil & Token
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={async () => {
                    await signOut();
                    navigate('/login');
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
}
