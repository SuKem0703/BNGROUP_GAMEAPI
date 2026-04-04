import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, MessageSquareText, ScrollText, Trash2 } from 'lucide-react';
import {
  deleteAdminForumPost,
  deleteAdminForumThread,
  getAdminForumDashboard,
  getAdminForumThreadDetail,
} from '@/api/admin';
import { AdminSectionNav } from '@/components/AdminSectionNav';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { useToast } from '@/hooks/useToast';
import { formatDateTime, formatNumber } from '@/utils/format';
import { normalizeApiError } from '@/utils/normalize';

export function AdminForumPage() {
  const [search, setSearch] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const forumQuery = useQuery({
    queryKey: ['admin-forum', search],
    queryFn: () => getAdminForumDashboard(search),
  });

  const threads = forumQuery.data?.threads ?? [];
  const summary = forumQuery.data?.summary;

  useEffect(() => {
    if (threads.length === 0) {
      setSelectedThreadId(null);
      return;
    }

    if (!selectedThreadId || !threads.some((thread) => thread.id === selectedThreadId)) {
      setSelectedThreadId(threads[0].id);
    }
  }, [selectedThreadId, threads]);

  const detailQuery = useQuery({
    queryKey: ['admin-forum-thread', selectedThreadId],
    queryFn: () => getAdminForumThreadDetail(selectedThreadId!),
    enabled: Boolean(selectedThreadId),
  });

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedThreadId, threads],
  );

  const invalidateForum = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-forum'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-forum-thread', selectedThreadId] }),
    ]);
  };

  const deleteThreadMutation = useMutation({
    mutationFn: () => deleteAdminForumThread(selectedThreadId!),
    onSuccess: async () => {
      toast.success('Thread deleted.');
      setSelectedThreadId(null);
      await invalidateForum();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => deleteAdminForumPost(postId),
    onSuccess: async () => {
      toast.success('Reply deleted.');
      await invalidateForum();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  if (forumQuery.isLoading) {
    return <LoadingSpinner label="Loading forum moderation..." />;
  }

  if (forumQuery.isError) {
    return (
      <ErrorState
        message={normalizeApiError(forumQuery.error).message}
        action={
          <button className="btn-secondary" onClick={() => forumQuery.refetch()} type="button">
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
        title="Forum Moderation"
        description="Review threads, inspect replies, and remove disruptive content from the community feed."
        actions={<AdminSectionNav />}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Threads"
          value={formatNumber(summary?.totalThreads ?? 0)}
          helper="Threads matched by the current moderation filter."
          icon={ScrollText}
        />
        <StatCard
          title="Replies"
          value={formatNumber(summary?.totalReplies ?? 0)}
          helper="Total reply count inside the visible threads."
          icon={MessageSquareText}
          tone="blue"
        />
        <StatCard
          title="Selected"
          value={selectedThread ? `#${selectedThread.id}` : 'None'}
          helper="Current thread loaded on the moderation detail pane."
          icon={Eye}
          tone="green"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="heading-decor text-xs">Thread List</p>
              <h2 className="mt-2 font-heading text-2xl text-white">Forum posts</h2>
            </div>
            <input
              className="input-shell w-full max-w-xs"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, content, author..."
              value={search}
            />
          </div>

          <div className="mt-5 space-y-3">
            {threads.length === 0 ? (
              <EmptyState
                title="No threads found"
                description="The current search does not match any forum content."
              />
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    thread.id === selectedThreadId
                      ? 'border-accent-200/30 bg-accent-200/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-accent-200/20 hover:bg-white/8'
                  }`}
                  onClick={() => setSelectedThreadId(thread.id)}
                  type="button"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-lg text-white">{thread.title}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        by {thread.authorName} · {formatDateTime(thread.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      {formatNumber(thread.postCount)} replies
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-300">{thread.preview}</p>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="panel p-6">
          {!selectedThreadId ? (
            <EmptyState
              title="Select a thread"
              description="Choose a thread from the list to inspect content and replies."
            />
          ) : detailQuery.isLoading ? (
            <LoadingSpinner label="Loading thread detail..." />
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
                  <p className="heading-decor text-xs">Thread Detail</p>
                  <h2 className="mt-2 font-heading text-3xl text-white">{detailQuery.data.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    by {detailQuery.data.authorName} · {formatDateTime(detailQuery.data.createdAt)} ·{' '}
                    {formatNumber(detailQuery.data.viewCount)} views
                  </p>
                </div>
                <button
                  className="btn-secondary text-rose-100 hover:border-rose-400/25 hover:bg-rose-500/10"
                  disabled={deleteThreadMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete thread "${detailQuery.data.title}"?`)) {
                      deleteThreadMutation.mutate();
                    }
                  }}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete thread
                </button>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-slate-300">
                {detailQuery.data.content}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading text-2xl text-white">Replies</h3>
                  <span className="text-sm text-slate-400">
                    {formatNumber(detailQuery.data.posts.length)} total
                  </span>
                </div>

                {detailQuery.data.posts.length === 0 ? (
                  <EmptyState
                    title="No replies yet"
                    description="This thread currently has no replies to moderate."
                  />
                ) : (
                  detailQuery.data.posts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{post.authorName}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(post.createdAt)}</p>
                        </div>
                        <button
                          className="btn-secondary px-3 py-2 text-xs text-rose-100 hover:border-rose-400/25 hover:bg-rose-500/10"
                          disabled={deletePostMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete reply #${post.id}?`)) {
                              deletePostMutation.mutate(post.id);
                            }
                          }}
                          type="button"
                        >
                          Delete reply
                        </button>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{post.content}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No thread detail"
              description={`We could not load thread #${selectedThreadId}.`}
            />
          )}
        </article>
      </section>
    </div>
  );
}
