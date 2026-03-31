import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,170,83,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_26%)]" />
      <div className="relative z-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="hidden rounded-[36px] border border-white/10 bg-white/[0.04] p-10 shadow-panel lg:block">
          <div className="space-y-6">
            <p className="heading-decor text-xs">Fantasy Game Portal</p>
            <div className="space-y-4">
              <h2 className="font-heading text-5xl leading-tight text-white">
                Enter the world of guilds, quests, and legends.
              </h2>
              <p className="max-w-xl text-lg text-slate-300">
                A modern portal for account access, character overview, and forum tavern chatter,
                rebuilt from the original Razor flow with a cleaner production-ready shell.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="panel rounded-[28px] p-5">
                <p className="heading-decor text-[11px]">Guild Access</p>
                <h3 className="mt-3 font-heading text-2xl text-white">Secure Session</h3>
                <p className="mt-2 text-sm text-slate-300">
                  JWT-backed sign in, protected dashboard access, and persistent player identity.
                </p>
              </div>
              <div className="panel rounded-[28px] p-5">
                <p className="heading-decor text-[11px]">Tavern Forum</p>
                <h3 className="mt-3 font-heading text-2xl text-white">Community Threads</h3>
                <p className="mt-2 text-sm text-slate-300">
                  Browse recent topics, read battle plans, and publish new tavern announcements.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Outlet />
      </div>
    </div>
  );
}
