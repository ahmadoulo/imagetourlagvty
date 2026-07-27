export default function DashboardLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 space-y-12">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
        <div className="h-4 w-64 bg-muted/50 rounded-md animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-background border border-border/60 rounded-xl p-6 shadow-sm h-[104px] flex items-center gap-4">
            <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-6 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="h-[250px] w-full bg-muted/20 rounded-2xl border border-border/60 animate-pulse" />
      
      <div className="h-[400px] w-full bg-muted/20 rounded-2xl border border-border/60 animate-pulse" />
    </div>
  );
}
