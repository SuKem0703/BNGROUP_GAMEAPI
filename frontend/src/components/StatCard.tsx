import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/classNames';

interface StatCardProps {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: 'gold' | 'blue' | 'green' | 'rose';
}

const toneMap = {
  gold: 'border-accent-200/20 bg-accent-200/10 text-accent-50',
  blue: 'border-sky-400/20 bg-sky-400/10 text-sky-100',
  green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  rose: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
} as const;

export function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = 'gold',
}: StatCardProps) {
  return (
    <article className="panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.12em] text-slate-400">{title}</p>
          <p className="font-heading text-3xl text-white">{value}</p>
        </div>
        <div className={cn('rounded-2xl border p-3', toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-sm text-slate-400">{helper}</p>
    </article>
  );
}
