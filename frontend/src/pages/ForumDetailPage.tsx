import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LogIn, MessageSquare, Send, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { createForumReply, getForumThread } from '@/api/forum';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ForumDetailSkeleton } from '@/forum/components/ForumDetailSkeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/auth-store';
import { formatDateTime, formatShortDateTime } from '@/utils/format';
import { normalizeApiError } from '@/utils/normalize';

export function ForumDetailPage() {
  const { id = '' } = useParams();
  const [replyContent, setReplyContent] = useState('');
  const [replyError, setReplyError] = useState('');
  const token = useAuthStore((state) => state.token);
  const currentUser = useCurrentUser();
  const toast = useToast();
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    queryKey: ['forum-thread', id],
    queryFn: () => getForumThread(id),
    enabled: Boolean(id),
  });

  const threadId = useMemo(() => Number(id), [id]);
  const replyMutation = useMutation({
    mutationFn: () =>
      createForumReply({
        threadId,
        content: replyContent.trim(),
      }),
    onSuccess: async (result) => {
      toast.success(result.message);
      setReplyContent('');
      setReplyError('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['forum-thread', id] }),
        queryClient.invalidateQueries({ queryKey: ['forum-threads'] }),
      ]);
    },
    onError: (error) => {
      setReplyError(normalizeApiError(error).message);
    },
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

      <section className="panel-soft p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="heading-decor text-xs">Reply Composer</p>
            <h2 className="font-heading text-2xl text-white">Join the conversation</h2>
            <p className="max-w-2xl text-sm text-slate-300">
              Keep it clear, constructive, and useful for other players following this thread.
            </p>
          </div>
          {token ? (
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              Posting as <span className="font-semibold text-white">{currentUser?.username ?? 'Adventurer'}</span>
            </div>
          ) : (
            <Link className="btn-secondary w-fit" to="/login">
              <LogIn className="h-4 w-4" />
              Sign in to reply
            </Link>
          )}
        </div>

        {token ? (
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setReplyError('');

              if (!Number.isFinite(threadId) || threadId <= 0) {
                setReplyError('This thread could not be identified.');
                return;
              }

              if (!replyContent.trim()) {
                setReplyError('Reply content is required.');
                return;
              }

              replyMutation.mutate();
            }}
          >
            <textarea
              className="input-shell min-h-36 resize-y"
              onChange={(event) => setReplyContent(event.target.value)}
              placeholder="Write your reply here. Share advice, ask a follow-up, or react to the thread."
              value={replyContent}
            />

            {replyError ? (
              <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {replyError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                <Sparkles className="h-4 w-4 text-accent-200" />
                Replies appear directly inside the thread after posting.
              </div>
              <button className="btn-primary" disabled={replyMutation.isPending} type="submit">
                <Send className="h-4 w-4" />
                {replyMutation.isPending ? 'Posting reply...' : 'Post Reply'}
              </button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-accent-200/20 bg-accent-200/10 p-3">
            <MessageSquare className="h-5 w-5 text-accent-200" />
          </div>
          <div>
            <h2 className="font-heading text-2xl text-white">Replies</h2>
            <p className="text-sm text-slate-400">Follow-up discussion from players responding to this topic.</p>
          </div>
        </div>

        {thread.posts.length === 0 ? (
          <EmptyState
            title="No replies yet"
            description="No one has replied yet. Be the first to keep this discussion moving."
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
                  {token ? (
                    <button
                      className="btn-secondary w-fit px-3 py-2 text-xs"
                      onClick={() => {
                        const quotePrefix = `> ${reply.authorName} wrote on ${formatDateTime(reply.createdAt)}\n> ${reply.content
                          .split('\n')
                          .join('\n> ')}\n\n`;
                        setReplyContent((current) => {
                          const next = current.trim();
                          return next ? `${next}\n\n${quotePrefix}` : quotePrefix;
                        });
                        setReplyError('');
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                      type="button"
                    >
                      Reply
                    </button>
                  ) : null}
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
