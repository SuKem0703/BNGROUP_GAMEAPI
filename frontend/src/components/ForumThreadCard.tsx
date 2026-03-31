import { Link } from 'react-router-dom';
import { Eye, MessageSquare, MoveRight } from 'lucide-react';
import type { ForumThreadSummary } from '@/types/forum';
import { formatDateTime } from '@/utils/format';

interface ForumThreadCardProps {
  thread: ForumThreadSummary;
}

export function ForumThreadCard({ thread }: ForumThreadCardProps) {
  return (
    <article className="panel flex flex-col gap-4 p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.12em] text-slate-400">
          <span>By {thread.authorName}</span>
          <span>{formatDateTime(thread.createdAt)}</span>
        </div>
        <h3 className="font-heading text-2xl text-white">{thread.title}</h3>
        <p className="line-clamp-3 text-base text-slate-300">{thread.preview}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent-200" />
            {thread.postCount} replies
          </span>
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4 text-accent-200" />
            {thread.viewCount} views
          </span>
        </div>

        <Link className="btn-secondary px-4 py-2 text-sm" to={`/forum/${thread.id}`}>
          View Thread
          <MoveRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
