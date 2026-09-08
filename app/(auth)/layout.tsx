import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-4 bg-dot-grid">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
