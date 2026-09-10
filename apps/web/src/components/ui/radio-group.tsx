// RadioGroup komponen (shadcn-inspired)
import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onValueChange?: (value: string) => void; value?: string }
>(
  ({ className, onValueChange, value, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('grid gap-3', className)}
        {...props}
      />
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { value: string; id: string }
>(
  ({ className, ...props }, ref) => {
    // Find parent RadioGroup context would be ideal, but simplified here
    return (
      <input
        type="radio"
        ref={ref}
        className={cn(
          'aspect-square h-4 w-4 rounded-full border border-primary text-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
