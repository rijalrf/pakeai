import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'emerald' | 'amber' | 'indigo' | 'rose';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-zinc-800 text-zinc-200 border-zinc-700/60',
    secondary: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    outline: 'bg-transparent text-zinc-300 border-zinc-700',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium tracking-tight border select-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
