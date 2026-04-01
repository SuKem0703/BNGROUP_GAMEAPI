import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/classNames';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/forum', label: 'Forum' },
];

export function HeaderNav() {
  return (
    <nav className="flex flex-wrap items-center gap-2">
      {navItems.map((item) => (
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
