import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Radio, TicketPercent, Trash2 } from 'lucide-react';
import {
  createAdminGiftCode,
  deleteAdminGiftCode,
  getAdminGiftCodes,
  updateAdminGiftCodeState,
} from '@/api/admin';
import { AdminSectionNav } from '@/components/AdminSectionNav';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { useToast } from '@/hooks/useToast';
import type { AdminGiftCodeReward, CreateAdminGiftCodePayload } from '@/types/admin';
import { formatDateTime, formatNumber } from '@/utils/format';
import { getItemCategoryLabel, isEquipmentItem } from '@/utils/itemCatalog';
import { normalizeApiError } from '@/utils/normalize';

const EMPTY_REWARD = (): AdminGiftCodeReward => ({
  itemId: 101,
  quantity: 1,
  rarity: 1,
  qualityFactor: 1,
});

export function AdminGiftCodesPage() {
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUnlimitedQuantity, setIsUnlimitedQuantity] = useState(true);
  const [maxRedemptions, setMaxRedemptions] = useState('10');
  const [isUnlimitedDuration, setIsUnlimitedDuration] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [publishToForum, setPublishToForum] = useState(true);
  const [rewards, setRewards] = useState<AdminGiftCodeReward[]>([EMPTY_REWARD()]);
  const queryClient = useQueryClient();
  const toast = useToast();

  const giftCodesQuery = useQuery({
    queryKey: ['admin-giftcodes', search],
    queryFn: () => getAdminGiftCodes(search),
    refetchInterval: 5000,
  });

  const giftCodes = giftCodesQuery.data?.giftCodes ?? [];
  const summary = giftCodesQuery.data?.summary;

  const totalClaims = useMemo(
    () => giftCodes.reduce((total, giftCode) => total + giftCode.redeemedCount, 0),
    [giftCodes],
  );

  const resetForm = () => {
    setCode('');
    setTitle('');
    setDescription('');
    setIsUnlimitedQuantity(true);
    setMaxRedemptions('10');
    setIsUnlimitedDuration(true);
    setExpiresAt('');
    setPublishToForum(true);
    setRewards([EMPTY_REWARD()]);
  };

  const invalidateGiftCodes = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-giftcodes'] }),
      queryClient.invalidateQueries({ queryKey: ['giftcodes-live'] }),
      queryClient.invalidateQueries({ queryKey: ['forum-threads'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminGiftCodePayload) => createAdminGiftCode(payload),
    onSuccess: async () => {
      toast.success('Giftcode created.');
      resetForm();
      await invalidateGiftCodes();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ giftCodeId, isActive }: { giftCodeId: number; isActive: boolean }) =>
      updateAdminGiftCodeState(giftCodeId, isActive),
    onSuccess: async () => {
      toast.success('Giftcode state updated.');
      await invalidateGiftCodes();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (giftCodeId: number) => deleteAdminGiftCode(giftCodeId),
    onSuccess: async () => {
      toast.success('Giftcode deleted.');
      await invalidateGiftCodes();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const updateReward = (index: number, nextReward: AdminGiftCodeReward) => {
    setRewards((current) =>
      current.map((reward, rewardIndex) => (rewardIndex === index ? nextReward : reward)),
    );
  };

  if (giftCodesQuery.isLoading) {
    return <LoadingSpinner label="Loading giftcode tools..." />;
  }

  if (giftCodesQuery.isError) {
    return (
      <ErrorState
        message={normalizeApiError(giftCodesQuery.error).message}
        action={
          <button className="btn-secondary" onClick={() => giftCodesQuery.refetch()} type="button">
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
        title="GiftCode Management"
        description="Create time-limited or unlimited codes, publish them to the forum, and watch stock change in real time."
        actions={<AdminSectionNav />}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="GiftCodes"
          value={formatNumber(summary?.totalGiftCodes ?? 0)}
          helper="Codes matched by the current search filter."
          icon={TicketPercent}
        />
        <StatCard
          title="Active"
          value={formatNumber(summary?.activeGiftCodes ?? 0)}
          helper="Codes currently redeemable by players."
          icon={Radio}
          tone="green"
        />
        <StatCard
          title="Claims"
          value={formatNumber(totalClaims)}
          helper="Total successful redemptions across the visible list."
          icon={TicketPercent}
          tone="blue"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="heading-decor text-xs">Create</p>
              <h2 className="mt-2 font-heading text-2xl text-white">New giftcode</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
              Equipment rewards are forced to quantity 1
            </span>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();

              const sanitizedRewards = rewards
                .filter((reward) => Number.isFinite(reward.itemId) && reward.itemId > 0)
                .map((reward) => ({
                  ...reward,
                  quantity: isEquipmentItem(reward.itemId)
                    ? 1
                    : Math.max(1, Number(reward.quantity || 1)),
                }));

              if (!code.trim()) {
                toast.error('Giftcode is required.');
                return;
              }

              if (sanitizedRewards.length === 0) {
                toast.error('Add at least one reward.');
                return;
              }

              createMutation.mutate({
                code: code.trim(),
                title: title.trim(),
                description: description.trim(),
                isUnlimitedQuantity,
                maxRedemptions: isUnlimitedQuantity ? null : Number(maxRedemptions || 0),
                isUnlimitedDuration,
                expiresAt: isUnlimitedDuration ? null : expiresAt,
                publishToForum,
                rewards: sanitizedRewards,
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm uppercase tracking-[0.12em] text-slate-400">Code</span>
                <input
                  className="input-shell uppercase"
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="SPRING-2026"
                  value={code}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm uppercase tracking-[0.12em] text-slate-400">Title</span>
                <input
                  className="input-shell"
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Spring event pack"
                  value={title}
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm uppercase tracking-[0.12em] text-slate-400">Description</span>
              <textarea
                className="input-shell min-h-28"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Shown in admin tools, player giftcode page, and forum announcement."
                value={description}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <input
                  checked={isUnlimitedQuantity}
                  onChange={(event) => setIsUnlimitedQuantity(event.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm text-slate-200">Unlimited quantity</span>
              </label>
              <label className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <input
                  checked={isUnlimitedDuration}
                  onChange={(event) => setIsUnlimitedDuration(event.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm text-slate-200">Unlimited duration</span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm uppercase tracking-[0.12em] text-slate-400">Max redemptions</span>
                <input
                  className="input-shell"
                  disabled={isUnlimitedQuantity}
                  min="1"
                  onChange={(event) => setMaxRedemptions(event.target.value)}
                  type="number"
                  value={maxRedemptions}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm uppercase tracking-[0.12em] text-slate-400">Expires at</span>
                <input
                  className="input-shell"
                  disabled={isUnlimitedDuration}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  type="datetime-local"
                  value={expiresAt}
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <input
                checked={publishToForum}
                onChange={(event) => setPublishToForum(event.target.checked)}
                type="checkbox"
              />
              <span className="text-sm text-slate-200">Publish announcement to forum automatically</span>
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-[0.12em] text-slate-400">Rewards</p>
                <button
                  className="btn-secondary px-3 py-2 text-sm"
                  onClick={() => setRewards((current) => [...current, EMPTY_REWARD()])}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Add reward
                </button>
              </div>

              {rewards.map((reward, index) => {
                const equipment = isEquipmentItem(Number(reward.itemId || 0));
                const category = getItemCategoryLabel(Number(reward.itemId || 0));

                return (
                  <div
                    key={`reward-${index}`}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                      <label className="block space-y-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Item ID</span>
                        <input
                          className="input-shell"
                          min="1"
                          onChange={(event) =>
                            updateReward(index, {
                              ...reward,
                              itemId: Number(event.target.value),
                              quantity: isEquipmentItem(Number(event.target.value)) ? 1 : reward.quantity,
                            })
                          }
                          type="number"
                          value={reward.itemId}
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Quantity</span>
                        <input
                          className="input-shell"
                          disabled={equipment}
                          min="1"
                          onChange={(event) =>
                            updateReward(index, {
                              ...reward,
                              quantity: equipment ? 1 : Number(event.target.value),
                            })
                          }
                          type="number"
                          value={equipment ? 1 : reward.quantity}
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Rarity</span>
                        <input
                          className="input-shell"
                          min="1"
                          onChange={(event) =>
                            updateReward(index, { ...reward, rarity: Number(event.target.value) })
                          }
                          type="number"
                          value={reward.rarity ?? 1}
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-slate-500">Quality</span>
                        <input
                          className="input-shell"
                          min="0.1"
                          onChange={(event) =>
                            updateReward(index, { ...reward, qualityFactor: Number(event.target.value) })
                          }
                          step="0.1"
                          type="number"
                          value={reward.qualityFactor ?? 1}
                        />
                      </label>
                      <button
                        className="btn-secondary self-end px-3 py-3 text-rose-100 hover:border-rose-400/25 hover:bg-rose-500/10"
                        disabled={rewards.length === 1}
                        onClick={() =>
                          setRewards((current) => current.filter((_, rewardIndex) => rewardIndex !== index))
                        }
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Category: <span className="text-white">{category}</span>
                    </p>
                  </div>
                );
              })}
            </div>

            <button className="btn-primary w-full" disabled={createMutation.isPending} type="submit">
              {createMutation.isPending ? 'Creating giftcode...' : 'Create giftcode'}
            </button>
          </form>
        </article>

        <article className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="heading-decor text-xs">Live Inventory</p>
              <h2 className="mt-2 font-heading text-2xl text-white">Existing codes</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="input-shell w-full max-w-xs"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search code, title, description..."
                value={search}
              />
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                Auto refresh 5s
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {giftCodes.length === 0 ? (
              <EmptyState
                title="No giftcodes yet"
                description="Create the first code here and optionally publish it to the forum."
              />
            ) : (
              giftCodes.map((giftCode) => (
                <article
                  key={giftCode.id}
                  className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-2xl text-white">{giftCode.title}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                            giftCode.isActive
                              ? 'border border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
                              : 'border border-white/10 bg-white/5 text-slate-300'
                          }`}
                        >
                          {giftCode.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-accent-200/20 bg-accent-200/10 px-3 py-1 text-sm font-semibold text-accent-50">
                        <TicketPercent className="h-4 w-4" />
                        {giftCode.code}
                      </div>
                      {giftCode.description ? (
                        <p className="text-sm text-slate-300">{giftCode.description}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">Remaining</span>
                        <strong className="mt-1 block text-white">
                          {giftCode.remainingCount === null
                            ? 'Unlimited'
                            : formatNumber(giftCode.remainingCount)}
                        </strong>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">Expiry</span>
                        <strong className="mt-1 block text-white">
                          {giftCode.isUnlimitedDuration
                            ? 'No expiry'
                            : formatDateTime(giftCode.expiresAt)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {giftCode.rewards.map((reward) => (
                      <span
                        key={`${giftCode.id}-${reward.itemId}`}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200"
                      >
                        #{reward.itemId} {reward.category} x{reward.quantity}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-400">
                      Redeemed {formatNumber(giftCode.redeemedCount)}
                      {giftCode.forumThreadId ? (
                        <>
                          {' '}·{' '}
                          <Link
                            className="text-accent-200 hover:text-accent-50"
                            to={`/forum/${giftCode.forumThreadId}`}
                          >
                            Forum announcement
                          </Link>
                        </>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-secondary px-3 py-2 text-sm"
                        disabled={toggleMutation.isPending}
                        onClick={() =>
                          toggleMutation.mutate({
                            giftCodeId: giftCode.id,
                            isActive: !giftCode.isActive,
                          })
                        }
                        type="button"
                      >
                        {giftCode.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="btn-secondary px-3 py-2 text-sm text-rose-100 hover:border-rose-400/25 hover:bg-rose-500/10"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete giftcode ${giftCode.code}?`)) {
                            deleteMutation.mutate(giftCode.id);
                          }
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {giftCode.latestRedemptions.length > 0 ? (
                    <div className="mt-4 rounded-[20px] border border-white/8 bg-night-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Latest claims</p>
                      <div className="mt-3 grid gap-2">
                        {giftCode.latestRedemptions.map((redemption) => (
                          <div
                            key={`${giftCode.id}-${redemption.accountId}-${redemption.redeemedAt}`}
                            className="flex items-center justify-between gap-3 text-sm text-slate-300"
                          >
                            <span>{redemption.accountId}</span>
                            <span>{formatDateTime(redemption.redeemedAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
