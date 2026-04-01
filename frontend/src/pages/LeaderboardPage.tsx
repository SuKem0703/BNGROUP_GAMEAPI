import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '@/api/leaderboard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import type { LeaderboardEntry } from '@/api/leaderboard';
import { normalizeApiError } from '@/utils/normalize';

function formatScore(value: number) {
  return value.toLocaleString();
}

export function LeaderboardPage() {
  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    staleTime: 1000 * 60, // 1 minute cache to reduce repeated API load
    refetchOnWindowFocus: false,
  });

  if (leaderboardQuery.isLoading) {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-xl font-semibold text-white">Loading leaderboard...</h2>
        <div className="h-48 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (leaderboardQuery.isError) {
    return (
      <ErrorState
        message={normalizeApiError(leaderboardQuery.error).message}
        action={
          <button className="btn-secondary" onClick={() => leaderboardQuery.refetch()} type="button">
            Retry
          </button>
        }
      />
    );
  }

  const leaderboard = leaderboardQuery.data as LeaderboardEntry[];

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <EmptyState
        title="No leaderboard data"
        description="No players have reached the leaderboard thresholds yet. Come back after a few raids."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Global Rankings"
        title="Leaderboard"
        description="Top players sorted by level, then experience. Reflects high-score progression in the game API."
      />

      <div className="panel overflow-hidden rounded-2xl border border-white/10 bg-night-950 p-0">
        <div className="grid grid-cols-5 gap-2 border-b border-white/10 bg-white/5 px-6 py-3 text-xs uppercase tracking-widest text-slate-300 sm:grid-cols-[minmax(80px,80px)_1.5fr_1fr_1fr_1fr]">
          <span className="font-semibold">Rank</span>
          <span className="font-semibold">Username</span>
          <span className="font-semibold text-right">Level</span>
          <span className="font-semibold text-right">EXP</span>
          <span className="font-semibold text-right">Coin</span>
        </div>

        <div className="divide-y divide-white/5">
          {leaderboard.map((entry) => (
            <div
              key={`${entry.username}-${entry.rank}`}
              className="grid grid-cols-5 gap-2 px-6 py-4 text-sm text-slate-200 sm:grid-cols-[minmax(80px,80px)_1.5fr_1fr_1fr_1fr]"
            >
              <span className="font-semibold text-accent-200">#{entry.rank}</span>
              <span>{entry.username}</span>
              <span className="text-right text-white">{formatScore(entry.level)}</span>
              <span className="text-right">{formatScore(entry.exp)}</span>
              <span className="text-right">{formatScore(entry.coin)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
