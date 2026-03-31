import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, RefreshCcw } from 'lucide-react';
import { getForumThreads } from '@/api/forum';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ForumThreadCard } from '@/components/ForumThreadCard';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { useAuthStore } from '@/store/auth-store';
import { formatDateTime } from '@/utils/format';
import { normalizeApiError } from '@/utils/normalize';

export function ForumListPage() {
  const token = useAuthStore((state) => state.token);
  const forumQuery = useQuery({
    queryKey: ['forum-threads'],
    queryFn: getForumThreads,
  });
  const threads = forumQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forum"
        title="Tavern Threads"
        description="A modern take on the original forum index: recent topics, author info, and quick access to thread creation."
        actions={
          token ? (
            <Link className="btn-primary" to="/forum/create">
              <Plus className="h-4 w-4" />
              Create Thread
            </Link>
          ) : (
            <Link className="btn-secondary" to="/login">
              Sign in to create
            </Link>
          )
        }
      />

      {forumQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-[28px]" />
          ))}
        </div>
      ) : forumQuery.isError ? (
        <ErrorState
          message={normalizeApiError(forumQuery.error).message}
          action={
            <button className="btn-secondary" onClick={() => forumQuery.refetch()} type="button">
              <RefreshCcw className="h-4 w-4" />
              Reload threads
            </button>
          }
        />
      ) : threads.length === 0 ? (
        <EmptyState
          title="The tavern is quiet"
          description="No threads are available yet. Create the first post to start the conversation."
          action={
            token ? (
              <Link className="btn-primary" to="/forum/create">
                <Plus className="h-4 w-4" />
                Create Thread
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[30px] border border-white/10 bg-night-900/70 lg:block">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-accent-200/10 text-left text-sm uppercase tracking-[0.14em] text-slate-300">
                  <th className="px-6 py-4">Topic</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-center">Replies</th>
                  <th className="px-6 py-4 text-center">Views</th>
                </tr>
              </thead>
              <tbody>
                {threads.map((thread) => (
                  <tr key={thread.id} className="border-t border-white/6 text-sm text-slate-300 hover:bg-white/[0.03]">
                    <td className="px-6 py-4">
                      <Link className="block space-y-1" to={`/forum/${thread.id}`}>
                        <span className="font-heading text-xl text-white">{thread.title}</span>
                        <span className="block max-w-xl truncate text-slate-400">{thread.preview}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">{thread.authorName}</td>
                    <td className="px-6 py-4">{formatDateTime(thread.createdAt)}</td>
                    <td className="px-6 py-4 text-center">{thread.postCount}</td>
                    <td className="px-6 py-4 text-center">{thread.viewCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {threads.map((thread) => (
              <ForumThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
