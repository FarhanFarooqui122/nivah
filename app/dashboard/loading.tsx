import { SkeletonCard, SkeletonTableRow } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <div className="h-9 w-40 bg-zinc-800/50 rounded-lg animate-pulse" />
        <div className="h-5 w-64 bg-zinc-800/50 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-zinc-800 rounded-2xl p-6">
            <div className="h-6 w-40 bg-zinc-800/50 rounded-lg animate-pulse mb-5" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonTableRow key={i} />
              ))}
            </div>
          </div>
        </div>
        <div className="border border-zinc-800 rounded-2xl p-6">
          <div className="h-6 w-40 bg-zinc-800/50 rounded-lg animate-pulse mb-5" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
