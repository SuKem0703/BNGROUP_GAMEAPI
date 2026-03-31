import { LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/classNames';

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  className,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div className={cn('inline-flex items-center gap-2 text-sm text-slate-300', className)}>
      <LoaderCircle className="h-4 w-4 animate-spin text-accent-200" />
      <span>{label}</span>
    </div>
  );
}
