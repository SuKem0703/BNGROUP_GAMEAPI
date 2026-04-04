import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/classNames';
import { useAuthStore } from '@/store/auth-store';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/shop', label: 'Shop' },
  { to: '/giftcodes', label: 'GiftCodes' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/forum', label: 'Forum' },
];

export function HeaderNav() {
  const role = useAuthStore((state) => state.user?.role);
  const items = role === 'Admin' ? [...navItems, { to: '/admin', label: 'Admin' }] : navItems;

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          className={({ isActive }) =>
            cn(
              'rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white',
              isActive && 'bg-white/10 text-white ring-1 ring-accent-200/20',
            )
          }
          to={item.to}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
