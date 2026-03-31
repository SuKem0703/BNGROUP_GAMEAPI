import type { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="panel-soft flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="rounded-full border border-accent-200/20 bg-accent-200/10 p-4">
        <PackageOpen className="h-6 w-6 text-accent-200" />
      </div>
      <div className="space-y-2">
        <h3 className="font-heading text-xl text-white">{title}</h3>
        <p className="max-w-xl text-sm text-slate-300">{description}</p>
      </div>
      {action}
    </div>
  );
}
