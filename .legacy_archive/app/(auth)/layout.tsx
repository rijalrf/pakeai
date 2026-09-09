import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-4 text-zinc-900">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
