import type { ReactNode } from 'react';

interface AuthCardProps {
  badge: string;
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthCard({ badge, title, subtitle, footer, children }: AuthCardProps) {
  return (
    <section className="panel-soft relative w-full max-w-xl overflow-hidden px-6 py-8 sm:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-200/10 via-transparent to-sky-400/10" />
      <div className="relative space-y-6">
        <div className="space-y-3">
          <span className="heading-decor text-xs">{badge}</span>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl text-white sm:text-4xl">{title}</h1>
            <p className="max-w-lg text-base text-slate-300">{subtitle}</p>
          </div>
        </div>
        <div className="space-y-5">{children}</div>
        {footer ? <div className="pt-2 text-center text-sm text-slate-400">{footer}</div> : null}
      </div>
    </section>
  );
}
