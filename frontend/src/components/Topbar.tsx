import { LogOut, ScrollText, ShieldHalf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HeaderNav } from '@/components/HeaderNav';
import { useAuthStore } from '@/store/auth-store';

export function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoggedIn = useAuthStore((state) => Boolean(state.token));
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-night-950/70 backdrop-blur-xl">
      <div className="page-container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:gap-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-accent-200/20 bg-accent-200/10 p-3">
              <ShieldHalf className="h-5 w-5 text-accent-200" />
            </div>
            <div>
              <p className="font-heading text-lg text-white">Chronicles Portal</p>
              <p className="text-sm text-slate-400">Knight and Mage control room</p>
            </div>
          </div>
          <HeaderNav />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!hasHydrated ? null : isLoggedIn ? (
            <>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                Signed in as{' '}
                <span className="font-semibold text-white">{user?.username ?? 'Adventurer'}</span>
              </div>
              <button
                className="btn-secondary px-4 py-2 text-sm"
                onClick={() => navigate('/forum/create')}
                type="button"
              >
                <ScrollText className="h-4 w-4" />
                Create Thread
              </button>
              <button
                className="btn-secondary px-4 py-2 text-sm text-rose-100 hover:border-rose-400/25 hover:bg-rose-500/10"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary px-4 py-2 text-sm" onClick={() => navigate('/login')} type="button">
                Login
              </button>
              <button className="btn-primary px-4 py-2 text-sm" onClick={() => navigate('/register')} type="button">
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
