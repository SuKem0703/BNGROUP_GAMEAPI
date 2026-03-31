import { Skeleton } from '@/components/Skeleton';

export function ForumDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-32 rounded-full" />
      <Skeleton className="h-48 rounded-[28px]" />
      <Skeleton className="h-32 rounded-[28px]" />
      <Skeleton className="h-32 rounded-[28px]" />
    </div>
  );
}
