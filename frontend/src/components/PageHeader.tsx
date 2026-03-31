import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[32px] border border-white/8 bg-white/[0.03] px-6 py-6 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {eyebrow ? <p className="heading-decor text-xs">{eyebrow}</p> : null}
        <h1 className="font-heading text-3xl text-white sm:text-4xl">{title}</h1>
        <p className="max-w-2xl text-base text-slate-300">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
