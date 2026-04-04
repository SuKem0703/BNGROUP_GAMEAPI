export function normalizeRoleName(role?: string | null) {
  const value = role?.trim();
  return value ? value : 'Player';
}

export function getRoleDescription(role?: string | null) {
  switch (normalizeRoleName(role)) {
    case 'Admin':
      return 'Full administration access across accounts, moderation, and management tools.';
    case 'Contributor':
      return 'Support access for operational work and curated admin-side tasks.';
    default:
      return 'Standard adventurer access to gameplay features, dashboard data, and community forum tools.';
  }
}

export function getRoleTone(role?: string | null) {
  switch (normalizeRoleName(role)) {
    case 'Admin':
      return 'border-rose-400/30 bg-rose-500/10 text-rose-100';
    case 'Contributor':
      return 'border-sky-400/30 bg-sky-500/10 text-sky-100';
    default:
      return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  }
}
