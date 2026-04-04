import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins, Gem, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import {
  getAdminDashboard,
  getAdminUserDetail,
  updateAdminUserCurrency,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '@/api/admin';
import { AdminSectionNav } from '@/components/AdminSectionNav';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { RoleBadge } from '@/components/RoleBadge';
import { StatCard } from '@/components/StatCard';
import { useToast } from '@/hooks/useToast';
import { formatDateTime, formatNumber } from '@/utils/format';
import { normalizeApiError } from '@/utils/normalize';

const STATUS_OPTIONS = [
  { value: 0, label: 'Active' },
  { value: 1, label: 'Warned' },
  { value: 2, label: 'Banned' },
  { value: 3, label: 'Unbanned' },
];

const ROLE_OPTIONS = ['Player', 'Contributor', 'Admin'];

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState('0');
  const [roleDraft, setRoleDraft] = useState('Player');
  const [coinDraft, setCoinDraft] = useState('0');
  const [gemDraft, setGemDraft] = useState('0');
  const queryClient = useQueryClient();
  const toast = useToast();

  const dashboardQuery = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => getAdminDashboard(search),
  });

  const users = dashboardQuery.data?.users ?? [];
  const summary = dashboardQuery.data?.summary;

  useEffect(() => {
    if (users.length === 0) {
      setSelectedUserId(null);
      return;
    }

    if (!selectedUserId || !users.some((user) => user.accountId === selectedUserId)) {
      setSelectedUserId(users[0].accountId);
    }
  }, [selectedUserId, users]);

  const detailQuery = useQuery({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: () => getAdminUserDetail(selectedUserId!),
    enabled: Boolean(selectedUserId),
  });

  useEffect(() => {
    const detail = detailQuery.data;
    if (!detail) {
      return;
    }

    setStatusDraft(String(detail.account.status));
    setRoleDraft(detail.account.role);
    setCoinDraft(String(detail.currency?.coin ?? 0));
    setGemDraft(String(detail.currency?.gem ?? 0));
  }, [detailQuery.data]);

  const selectedUser = useMemo(
    () => users.find((user) => user.accountId === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  const invalidateUsers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] }),
    ]);
  };

  const statusMutation = useMutation({
    mutationFn: () => updateAdminUserStatus(selectedUserId!, Number(statusDraft)),
    onSuccess: async () => {
      toast.success('User status updated.');
      await invalidateUsers();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const roleMutation = useMutation({
    mutationFn: () => updateAdminUserRole(selectedUserId!, roleDraft),
    onSuccess: async () => {
      toast.success('User role updated.');
      await invalidateUsers();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const currencyMutation = useMutation({
    mutationFn: () =>
      updateAdminUserCurrency(selectedUserId!, Number(coinDraft || 0), Number(gemDraft || 0)),
    onSuccess: async () => {
      toast.success('Wallet updated.');
      await invalidateUsers();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  if (dashboardQuery.isLoading) {
    return <LoadingSpinner label="Loading admin users..." />;
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        message={normalizeApiError(dashboardQuery.error).message}
        action={
          <button className="btn-secondary" onClick={() => dashboardQuery.refetch()} type="button">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Console"
        title="User Management"
        description="Role-admin tools for account status, role assignment, and economy balancing."
        actions={<AdminSectionNav />}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Users"
          value={formatNumber(summary?.totalUsers ?? 0)}
          helper="Accounts currently matched by the search filter."
          icon={Users}
        />
        <StatCard
          title="Active"
          value={formatNumber(summary?.activeUsers ?? 0)}
          helper="Accounts currently in the normal active state."
          icon={ShieldCheck}
          tone="green"
        />
        <StatCard
          title="Warned"
          value={formatNumber(summary?.warnedUsers ?? 0)}
          helper="Accounts flagged but not fully banned."
          icon={ShieldAlert}
          tone="blue"
        />
        <StatCard
          title="Banned"
          value={formatNumber(summary?.bannedUsers ?? 0)}
          helper="Accounts currently blocked from normal play."
          icon={ShieldAlert}
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="heading-decor text-xs">Roster</p>
              <h2 className="mt-2 font-heading text-2xl text-white">Players</h2>
            </div>
            <input
              className="input-shell w-full max-w-xs"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search username, email, role..."
              value={search}
            />
          </div>

          <div className="mt-5 space-y-3">
            {users.length === 0 ? (
              <EmptyState
                title="No matching users"
                description="Try a different search or create a few accounts first."
              />
            ) : (
              users.map((user) => (
                <button
                  key={user.accountId}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    user.accountId === selectedUserId
                      ? 'border-accent-200/30 bg-accent-200/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-accent-200/20 hover:bg-white/8'
                  }`}
                  onClick={() => setSelectedUserId(user.accountId)}
                  type="button"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-heading text-lg text-white">{user.username}</p>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                    <RoleBadge role={user.role} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
                    <span>LV {formatNumber(user.level)}</span>
                    <span>Coin {formatNumber(user.coin)}</span>
                    <span>Gem {formatNumber(user.gem)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="panel p-6">
          {!selectedUserId ? (
            <EmptyState
              title="Pick a player"
              description="Select any user from the list to review role, balance, and activity."
            />
          ) : detailQuery.isLoading ? (
            <LoadingSpinner label="Loading user detail..." />
          ) : detailQuery.isError ? (
            <ErrorState
              message={normalizeApiError(detailQuery.error).message}
              action={
                <button className="btn-secondary" onClick={() => detailQuery.refetch()} type="button">
                  Retry
                </button>
              }
            />
          ) : detailQuery.data ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="heading-decor text-xs">Account Detail</p>
                  <h2 className="mt-2 font-heading text-3xl text-white">
                    {detailQuery.data.account.username}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {detailQuery.data.account.email} · Created{' '}
                    {formatDateTime(detailQuery.data.account.createdAt)}
                  </p>
                </div>
                <RoleBadge role={detailQuery.data.account.role} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <form
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    statusMutation.mutate();
                  }}
                >
                  <p className="text-sm uppercase tracking-[0.12em] text-slate-400">Status</p>
                  <select
                    className="input-shell mt-3"
                    onChange={(event) => setStatusDraft(event.target.value)}
                    value={statusDraft}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button className="btn-secondary mt-3 w-full" disabled={statusMutation.isPending} type="submit">
                    Save status
                  </button>
                </form>

                <form
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    roleMutation.mutate();
                  }}
                >
                  <p className="text-sm uppercase tracking-[0.12em] text-slate-400">Role</p>
                  <select
                    className="input-shell mt-3"
                    onChange={(event) => setRoleDraft(event.target.value)}
                    value={roleDraft}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <button className="btn-secondary mt-3 w-full" disabled={roleMutation.isPending} type="submit">
                    Save role
                  </button>
                </form>

                <form
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    currencyMutation.mutate();
                  }}
                >
                  <p className="text-sm uppercase tracking-[0.12em] text-slate-400">Wallet</p>
                  <div className="mt-3 grid gap-3">
                    <input
                      className="input-shell"
                      min="0"
                      onChange={(event) => setCoinDraft(event.target.value)}
                      placeholder="Coin"
                      type="number"
                      value={coinDraft}
                    />
                    <input
                      className="input-shell"
                      min="0"
                      onChange={(event) => setGemDraft(event.target.value)}
                      placeholder="Gem"
                      type="number"
                      value={gemDraft}
                    />
                  </div>
                  <button className="btn-secondary mt-3 w-full" disabled={currencyMutation.isPending} type="submit">
                    Save wallet
                  </button>
                </form>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <Coins className="h-5 w-5 text-emerald-200" />
                  <p className="mt-3 text-sm text-slate-400">Coin</p>
                  <p className="mt-1 font-heading text-2xl text-white">
                    {formatNumber(detailQuery.data.currency?.coin ?? 0)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <Gem className="h-5 w-5 text-sky-100" />
                  <p className="mt-3 text-sm text-slate-400">Gem</p>
                  <p className="mt-1 font-heading text-2xl text-white">
                    {formatNumber(detailQuery.data.currency?.gem ?? 0)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">Forum activity</p>
                  <p className="mt-1 font-heading text-2xl text-white">
                    {formatNumber(detailQuery.data.activity.threadCount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Threads · {formatNumber(detailQuery.data.activity.postCount)} replies
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-slate-400">Giftcode claims</p>
                  <p className="mt-1 font-heading text-2xl text-white">
                    {formatNumber(detailQuery.data.activity.giftCodeRedemptionCount)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Inventory {formatNumber(detailQuery.data.activity.inventoryCount)} · Storage{' '}
                    {formatNumber(detailQuery.data.activity.storageCount)}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm uppercase tracking-[0.12em] text-slate-400">Save Snapshot</p>
                <p className="mt-2 text-sm text-slate-300">
                  Last updated:{' '}
                  <span className="text-white">
                    {formatDateTime(detailQuery.data.saveData.lastUpdated, 'No save uploaded')}
                  </span>
                </p>
                <pre className="mt-4 max-h-64 overflow-auto rounded-2xl border border-white/8 bg-night-950/80 p-4 text-xs text-slate-300">
                  {detailQuery.data.saveData.raw || 'No raw save data available.'}
                </pre>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No detail available"
              description={`We could not load the selected user ${selectedUser?.username ?? ''}.`}
            />
          )}
        </article>
      </section>
    </div>
  );
}
