import { ShieldCheck, ShieldEllipsis, ShieldUser } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { getRoleTone, normalizeRoleName } from '@/utils/roles';

interface RoleBadgeProps {
  role?: string | null;
  className?: string;
}

function RoleIcon({ role }: { role?: string | null }) {
  switch (normalizeRoleName(role)) {
    case 'Admin':
      return <ShieldCheck className="h-4 w-4" />;
    case 'Contributor':
      return <ShieldEllipsis className="h-4 w-4" />;
    default:
      return <ShieldUser className="h-4 w-4" />;
  }
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const normalizedRole = normalizeRoleName(role);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
        getRoleTone(normalizedRole),
        className,
      )}
    >
      <RoleIcon role={normalizedRole} />
      {normalizedRole}
    </span>
  );
}
