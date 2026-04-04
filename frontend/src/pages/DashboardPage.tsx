import { useQuery } from '@tanstack/react-query';
import { Coins, Gem, Shield, Sparkles, Swords, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboard } from '@/api/dashboard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { RoleBadge } from '@/components/RoleBadge';
import { StatCard } from '@/components/StatCard';
import { DashboardSkeleton } from '@/dashboard/components/DashboardSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatNumber } from '@/utils/format';
import { normalizeApiError } from '@/utils/normalize';
import { getRoleDescription } from '@/utils/roles';

export function DashboardPage() {
  const user = useCurrentUser();
  const isAdmin = user?.role === 'Admin';
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: getDashboard,
  });

  if (dashboardQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        message={normalizeApiError(dashboardQuery.error).message}
        action={
          <button className="btn-secondary" onClick={() => dashboardQuery.refetch()} type="button">
            Try again
          </button>
        }
      />
    );
  }

  const stats = dashboardQuery.data;

  if (!stats) {
    return (
      <EmptyState
        title="No dashboard data yet"
        description="The account exists, but the server did not return any character information."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Player Dashboard"
        title={`Welcome back, ${user?.username ?? 'Adventurer'}`}
        description="Your character snapshot, account resources, and the fastest routes into the community features that matter today."
        actions={
          <>
            <Link className="btn-primary" to="/forum/create">
              Start a thread
            </Link>
            <Link className="btn-secondary" to="/forum">
              Browse forum
            </Link>
            <Link className="btn-secondary" to="/leaderboard">
              View leaderboard
            </Link>
            <Link className="btn-secondary" to="/giftcodes">
              Redeem giftcode
            </Link>
            {isAdmin ? (
              <Link className="btn-secondary" to="/admin">
                Open admin
              </Link>
            ) : null}
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Level"
          value={`LV. ${formatNumber(stats.lvl)}`}
          helper={`${formatNumber(stats.exp)} total EXP gathered.`}
          icon={Shield}
          tone="gold"
        />
        <StatCard
          title="Coin"
          value={formatNumber(stats.coin)}
          helper="Pocket currency available for your next run."
          icon={Coins}
          tone="green"
        />
        <StatCard
          title="Gem"
          value={formatNumber(stats.gem)}
          helper="Premium resource carried in your vault."
          icon={Gem}
          tone="blue"
        />
        <StatCard
          title="Potential"
          value={formatNumber(stats.potentialPoints)}
          helper="Unspent points ready for future progression."
          icon={Sparkles}
          tone="rose"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="panel flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="heading-decor text-xs">Character Sheet</p>
              <h2 className="mt-2 font-heading text-2xl text-white">Battle Roles</h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              Account ID: <span className="text-white">{user?.id ?? 'Unknown'}</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-5">
              <div className="flex items-center gap-3">
                <Swords className="h-5 w-5 text-rose-200" />
                <h3 className="font-heading text-xl text-white">Knight</h3>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200">
                <div><dt className="text-slate-400">STR</dt><dd>{formatNumber(stats.str)}</dd></div>
                <div><dt className="text-slate-400">DEX</dt><dd>{formatNumber(stats.dex)}</dd></div>
                <div><dt className="text-slate-400">HP</dt><dd>{formatNumber(stats.currentKnightHP)}</dd></div>
                <div><dt className="text-slate-400">MP</dt><dd>{formatNumber(stats.currentKnightMP)}</dd></div>
              </dl>
            </div>

            <div className="rounded-[28px] border border-sky-400/20 bg-sky-500/10 p-5">
              <div className="flex items-center gap-3">
                <WandSparkles className="h-5 w-5 text-sky-100" />
                <h3 className="font-heading text-xl text-white">Mage</h3>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200">
                <div><dt className="text-slate-400">INT</dt><dd>{formatNumber(stats.intStat)}</dd></div>
                <div><dt className="text-slate-400">CON</dt><dd>{formatNumber(stats.con)}</dd></div>
                <div><dt className="text-slate-400">HP</dt><dd>{formatNumber(stats.currentmageHP)}</dd></div>
                <div><dt className="text-slate-400">MP</dt><dd>{formatNumber(stats.currentMageMP)}</dd></div>
              </dl>
            </div>
          </div>

          <div className="rounded-[28px] border border-amber-400/15 bg-white/[0.03] p-5">
            <p className="text-sm uppercase tracking-[0.12em] text-slate-400">Current stamina</p>
            <div className="mt-3 h-4 overflow-hidden rounded-full bg-night-950">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-accent-400"
                style={{ width: `${Math.min(100, Math.max(12, stats.currentStamina / 2))}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-300">
              {formatNumber(stats.currentStamina)} stamina points available.
            </p>
          </div>
        </article>

        <div className="grid gap-4">
          <article className="panel p-6">
            <p className="heading-decor text-xs">Account Standing</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <RoleBadge role={user?.role} className="text-sm" />
              <span className="text-sm text-slate-400">Your account access level inside the portal.</span>
            </div>
            <p className="mt-4 text-base text-slate-300">
              {getRoleDescription(user?.role)}
            </p>
            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
              Current signed-in account: <span className="font-semibold text-white">{user?.username ?? 'Adventurer'}</span>
              {' '}with role <span className="font-semibold text-white">{user?.role ?? 'Player'}</span>.
            </div>
          </article>

          <article className="panel p-6">
            <p className="heading-decor text-xs">Quick Actions</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Keep momentum</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition hover:border-accent-200/25 hover:bg-white/8" to="/forum">
                <p className="font-heading text-lg text-white">Visit Forum</p>
                <p className="mt-1 text-sm text-slate-400">Read guild recruitment posts and player chatter.</p>
              </Link>
              <Link className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition hover:border-accent-200/25 hover:bg-white/8" to="/forum/create">
                <p className="font-heading text-lg text-white">Create Thread</p>
                <p className="mt-1 text-sm text-slate-400">Share an update, ask for a party, or post game news.</p>
              </Link>
              <Link className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition hover:border-accent-200/25 hover:bg-white/8" to="/giftcodes">
                <p className="font-heading text-lg text-white">Redeem GiftCode</p>
                <p className="mt-1 text-sm text-slate-400">Use newly published admin codes and watch remaining stock update in real time.</p>
              </Link>
              {isAdmin ? (
                <Link className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition hover:border-accent-200/25 hover:bg-white/8" to="/admin">
                  <p className="font-heading text-lg text-white">Admin Console</p>
                  <p className="mt-1 text-sm text-slate-400">Manage users, forum moderation, and live giftcodes from the role-admin workspace.</p>
                </Link>
              ) : null}
            </div>
          </article>

          <article className="panel p-6">
            <p className="heading-decor text-xs">Realm Notes</p>
            <h2 className="mt-2 font-heading text-2xl text-white">Stay ready for the next run</h2>
            <p className="mt-3 text-base text-slate-300">
              Keep an eye on your progression, save your resources for the right upgrade, and use the forum
              and giftcode center to stay ahead of the next event cycle.
            </p>
            <ul className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              <li className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">Spend coin with intention and keep gem reserves for rare opportunities.</li>
              <li className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">Check the forum often for new announcements, guild chatter, and reward drops.</li>
              <li className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">Redeem live codes early before limited giftcode pools run dry.</li>
              <li className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">Balance both Knight and Mage paths to stay flexible across encounters.</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
