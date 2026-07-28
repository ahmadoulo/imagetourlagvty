import { prisma } from "@/lib/prisma";
import { Shield, Search, Filter } from "lucide-react";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const { query, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const limit = 50;
  const skip = (currentPage - 1) * limit;

  const where: any = {};
  if (query) {
    where.OR = [
      { action: { contains: query, mode: "insensitive" } },
      { user: { email: { contains: query, mode: "insensitive" } } }
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { email: true, name: true } }
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track administrative actions and system events.</p>
        </div>
        
        <form className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="Search logs..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </button>
        </form>
      </div>

      <div className="bg-background border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-muted-foreground">Timestamp</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Admin User</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Action</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Target</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                  {log.createdAt.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {log.user ? (
                    <div>
                      <div className="font-medium">{log.user.name}</div>
                      <div className="text-xs text-muted-foreground">{log.user.email}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">System</span>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-foreground">
                  {log.action}
                </td>
                <td className="px-6 py-4">
                  <div className="text-muted-foreground text-xs">{log.targetType || "N/A"}</div>
                  {log.targetId && <div className="font-mono text-xs">{log.targetId}</div>}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                  {log.ipAddress || "Unknown"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Shield className="w-10 h-10 mb-4 opacity-50" />
                    <p>No audit logs found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total} logs
          </div>
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <a href={`?page=${currentPage - 1}${query ? '&query='+query : ''}`} className="px-3 py-1 border rounded hover:bg-muted text-sm">Previous</a>
            )}
            {currentPage < totalPages && (
              <a href={`?page=${currentPage + 1}${query ? '&query='+query : ''}`} className="px-3 py-1 border rounded hover:bg-muted text-sm">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
