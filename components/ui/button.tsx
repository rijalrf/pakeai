import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'emerald' | 'amber' | 'indigo';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      default: 'bg-zinc-100 text-zinc-900 hover:bg-white active:bg-zinc-200 shadow-sm',
      secondary: 'bg-zinc-800/80 text-zinc-200 hover:bg-zinc-800 border border-zinc-700/50',
      outline: 'border border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-700',
      ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
      destructive: 'bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25',
      emerald: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25',
      amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25',
      indigo: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25',
    };

    const sizes = {
      default: 'h-8 px-3 py-1.5',
      sm: 'h-7 rounded px-2.5 text-[11px]',
      lg: 'h-10 rounded-md px-5 text-sm',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
