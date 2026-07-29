export default function DashboardLoading() {
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)] w-full overflow-hidden bg-background">
      {/* Sidebar Skeleton */}
      <div className="w-full lg:w-64 border-r border-border/40 bg-muted/10 shrink-0 flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-border/40 h-16 flex items-center">
          <div className="w-full h-8 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="w-full h-9 bg-muted rounded-md animate-pulse" />)}
          </div>
          <div className="pt-4 space-y-2">
            <div className="w-16 h-4 bg-muted/50 rounded-sm animate-pulse mb-3" />
            {[1, 2].map(i => <div key={i} className="w-full h-9 bg-muted rounded-md animate-pulse" />)}
          </div>
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="border-b border-border/40 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/10 h-[73px]">
          <div className="w-48 h-8 bg-muted rounded-md animate-pulse" />
          <div className="w-full sm:w-64 h-9 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 auto-rows-[200px] gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm flex flex-col h-full animate-pulse">
                <div className="flex-1 bg-muted/30 w-full" />
                <div className="p-3 border-t border-border/40 bg-background/90 h-[52px]">
                   <div className="h-3 w-3/4 bg-muted rounded mb-2" />
                   <div className="h-2 w-1/4 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
