import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, Radio, RefreshCcw, TicketPercent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLiveGiftCodes, redeemGiftCode } from '@/api/giftcodes';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/utils/format';
import { normalizeApiError } from '@/utils/normalize';

export function GiftCodePage() {
  const [code, setCode] = useState('');
  const [apiError, setApiError] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  const liveGiftCodesQuery = useQuery({
    queryKey: ['giftcodes-live'],
    queryFn: getLiveGiftCodes,
    refetchInterval: 5000,
  });

  const redeemMutation = useMutation({
    mutationFn: redeemGiftCode,
    onSuccess: async (result) => {
      toast.success(result.message);
      setCode('');
      setApiError('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['giftcodes-live'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
    onError: (error) => {
      setApiError(normalizeApiError(error).message);
    },
  });

  const giftCodes = liveGiftCodesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="GiftCode Center"
        title="Redeem Live GiftCodes"
        description="Enter a code from the forum announcement, then watch stock and expiry update in near real time."
        actions={
          <button className="btn-secondary" onClick={() => liveGiftCodesQuery.refetch()} type="button">
            <RefreshCcw className="h-4 w-4" />
            Refresh now
          </button>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="panel-soft p-6">
          <div className="space-y-3">
            <p className="heading-decor text-xs">Redeem</p>
            <h2 className="font-heading text-2xl text-white">Enter your code</h2>
            <p className="text-sm text-slate-300">
              Equipment rewards always resolve to quantity <span className="font-semibold text-white">1</span>.
              Seed, crop, and material rewards can stack.
            </p>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setApiError('');

              if (!code.trim()) {
                setApiError('Giftcode is required.');
                return;
              }

              redeemMutation.mutate(code.trim());
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">
                GiftCode
              </span>
              <input
                className="input-shell uppercase"
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="EXAMPLE-CODE-2026"
                value={code}
              />
            </label>

            {apiError ? (
              <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {apiError}
              </p>
            ) : null}

            <button className="btn-primary w-full" disabled={redeemMutation.isPending} type="submit">
              {redeemMutation.isPending ? (
                <LoadingSpinner label="Redeeming..." />
              ) : (
                <>
                  <Gift className="h-4 w-4" />
                  Redeem GiftCode
                </>
              )}
            </button>
          </form>
        </article>

        <article className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="heading-decor text-xs">Live Feed</p>
              <h2 className="mt-2 font-heading text-2xl text-white">Active codes</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              <Radio className="h-4 w-4 text-emerald-300" />
              Auto refresh every 5s
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {liveGiftCodesQuery.isLoading ? (
              <LoadingSpinner label="Loading active giftcodes..." />
            ) : liveGiftCodesQuery.isError ? (
              <ErrorState
                message={normalizeApiError(liveGiftCodesQuery.error).message}
                action={
                  <button className="btn-secondary" onClick={() => liveGiftCodesQuery.refetch()} type="button">
                    Retry
                  </button>
                }
              />
            ) : giftCodes.length === 0 ? (
              <EmptyState
                title="No active giftcodes"
                description="There are no redeemable giftcodes right now. Watch the forum for the next admin announcement."
              />
            ) : (
              giftCodes.map((giftCode) => (
                <article key={giftCode.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-2xl text-white">{giftCode.title}</h3>
                        {giftCode.hasRedeemed ? (
                          <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-100">
                            Redeemed
                          </span>
                        ) : null}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-accent-200/20 bg-accent-200/10 px-3 py-1 text-sm font-semibold tracking-[0.12em] text-accent-50">
                        <TicketPercent className="h-4 w-4" />
                        {giftCode.code}
                      </div>
                      {giftCode.description ? (
                        <p className="text-sm text-slate-300">{giftCode.description}</p>
                      ) : null}
                    </div>

                    <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:min-w-72">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">Expiry</span>
                        <strong className="mt-1 block text-white">
                          {giftCode.isUnlimitedDuration ? 'No expiry' : formatDateTime(giftCode.expiresAt)}
                        </strong>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <span className="block text-xs uppercase tracking-[0.12em] text-slate-500">Remaining</span>
                        <strong className="mt-1 block text-white">
                          {giftCode.remainingCount === null ? 'Unlimited' : giftCode.remainingCount}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {giftCode.rewards.map((reward) => (
                      <span
                        key={`${giftCode.id}-${reward.itemId}`}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-200"
                      >
                        #{reward.itemId} {reward.category} x{reward.quantity}
                      </span>
                    ))}
                  </div>

                  {giftCode.forumThreadId ? (
                    <div className="mt-4">
                      <Link className="text-sm font-semibold text-accent-200 hover:text-accent-50" to={`/forum/${giftCode.forumThreadId}`}>
                        View forum announcement
                      </Link>
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
