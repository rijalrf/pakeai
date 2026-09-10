// DropdownMenu komponen untuk user menu (shadcn-inspired)
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DropdownMenuProps {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, onOpenChange }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);

  const handleClickOutside = () => {
    setOpen(false);
    onOpenChange?.(false);
  };

  return (
    <div className="relative" onClick={handleClickOutside}>
      {children}
    </div>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children, ...props }: DropdownMenuTriggerProps) {
  return <button {...props}>{children}</button>;
}

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
}

export function DropdownMenuContent({
  className,
  align = 'end',
  style,
  ...props
}: DropdownMenuContentProps) {
  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 justify-start',
        align === 'end' ? 'right-0 top-full' : 'left-0 top-full',
        className
      )}
      style={{ ...style, top: '100%' }}
      {...props}
    />
  );
}

export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, onClick, disabled, children, ...props }, ref) => {
    return (
      <div
        role="menuitem"
        tabIndex={-1}
        className={cn(
          'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          onClick?.();
        }}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      role="separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      ref={ref}
      {...props}
    />
  )
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
