import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'emerald' | 'amber' | 'indigo';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      default: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:bg-indigo-800',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200',
      outline: 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-xs',
      ghost: 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100',
      destructive: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
      emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100',
      amber: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
      indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100',
    };

    const sizes = {
      default: 'h-8 px-3 py-1.5',
      sm: 'h-7 rounded px-2 text-[11px]',
      lg: 'h-9 rounded-md px-4 text-sm',
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
