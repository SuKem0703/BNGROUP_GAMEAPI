import type { ReactNode } from 'react';
import { OctagonAlert } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export function ErrorState({
  title = 'We could not complete this request',
  message,
  action,
}: ErrorStateProps) {
  return (
    <div className="panel-soft flex flex-col items-center gap-4 px-6 py-12 text-center">
      <div className="rounded-full border border-rose-400/20 bg-rose-500/10 p-4">
        <OctagonAlert className="h-6 w-6 text-rose-300" />
      </div>
      <div className="space-y-2">
        <h3 className="font-heading text-xl text-white">{title}</h3>
        <p className="max-w-xl text-sm text-slate-300">{message}</p>
      </div>
      {action}
    </div>
  );
}
