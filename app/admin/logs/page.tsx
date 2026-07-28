import { FileText, Search } from "lucide-react";

export default function AdminLogsPage() {
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Review system and administrative actions.</p>
      </div>

      <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-9 h-9 w-full rounded-md border border-input bg-background text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled
            />
          </div>
        </div>
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
          <FileText className="w-12 h-12 mb-4 opacity-50" />
          <h2 className="text-lg font-medium text-foreground mb-2">Audit Logs Coming Soon</h2>
          <p className="max-w-md mx-auto">
            The AuditLog database schema is planned for a future update. Once deployed, all administrative and system events will be tracked here.
          </p>
        </div>
      </div>
    </div>
  );
}
