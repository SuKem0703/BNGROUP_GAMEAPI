import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/classNames';

const adminNavItems = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/forum', label: 'Forum' },
  { to: '/admin/giftcodes', label: 'GiftCodes' },
  { to: '/admin/shop-items', label: 'Shop Items' },
  { to: '/admin/shoplogs', label: 'Shop Logs' },
];

export function AdminSectionNav() {
  return (
    <div className="flex flex-wrap gap-2">
      {adminNavItems.map((item) => (
        <NavLink
          key={item.to}
          className={({ isActive }) =>
            cn(
              'rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-accent-200/25 hover:bg-white/8 hover:text-white',
              isActive && 'border-accent-200/30 bg-accent-200/10 text-accent-50',
            )
          }
          to={item.to}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
