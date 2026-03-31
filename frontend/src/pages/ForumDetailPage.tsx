import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getForumThread } from '@/api/forum';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ForumDetailSkeleton } from '@/forum/components/ForumDetailSkeleton';
import { formatDateTime, formatShortDateTime } from '@/utils/format';
import { normalizeApiError } from '@/utils/normalize';

export function ForumDetailPage() {
  const { id = '' } = useParams();
  const detailQuery = useQuery({
    queryKey: ['forum-thread', id],
    queryFn: () => getForumThread(id),
    enabled: Boolean(id),
  });

  if (detailQuery.isLoading) {
    return <ForumDetailSkeleton />;
  }

  if (detailQuery.isError) {
    return (
      <ErrorState
        message={normalizeApiError(detailQuery.error).message}
        action={
          <Link className="btn-secondary" to="/forum">
            Back to forum
          </Link>
        }
      />
    );
  }

  const thread = detailQuery.data;

  if (!thread) {
    return (
      <EmptyState
        title="Thread not found"
        description="The requested forum topic could not be loaded."
        action={
          <Link className="btn-secondary" to="/forum">
            Back to forum
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link className="btn-secondary w-fit px-4 py-2 text-sm" to="/forum">
        <ArrowLeft className="h-4 w-4" />
        Back to forum
      </Link>

      <article className="panel overflow-hidden">
        <div className="border-b border-white/8 bg-white/[0.03] px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="heading-decor text-xs">Thread Detail</p>
              <h1 className="font-heading text-3xl text-white sm:text-4xl">{thread.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                <span>Author: {thread.authorName}</span>
                <span>Created: {formatDateTime(thread.createdAt)}</span>
                <span>Replies: {thread.postCount}</span>
                <span>Views: {thread.viewCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8">
          <div className="rounded-[28px] border border-white/8 bg-night-900/70 p-6 whitespace-pre-wrap text-lg leading-8 text-slate-200">
            {thread.content}
          </div>
        </div>
      </article>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-accent-200/20 bg-accent-200/10 p-3">
            <MessageSquare className="h-5 w-5 text-accent-200" />
          </div>
          <div>
            <h2 className="font-heading text-2xl text-white">Replies</h2>
            <p className="text-sm text-slate-400">
              Rendered from the thread details payload returned by the backend.
            </p>
          </div>
        </div>

        {thread.posts.length === 0 ? (
          <EmptyState
            title="No replies yet"
            description="This thread has no replies in the current payload. Once the backend returns them, they will appear here."
          />
        ) : (
          <div className="space-y-4">
            {thread.posts.map((reply) => (
              <article key={reply.id} className="panel p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-heading text-xl text-white">{reply.authorName}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                      {formatShortDateTime(reply.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-200">{reply.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
