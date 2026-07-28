import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";
import { UserActions } from "./user-actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string; status?: string }>;
}) {
  const { query, page, status } = await searchParams;
  const currentPage = parseInt(page || "1");
  const limit = 20;
  const skip = (currentPage - 1) * limit;

  const where: any = {};
  
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }
  
  if (status) {
    where.status = status;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id || "";

  const [users, total, superAdminCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { uploads: true, folders: true } }
      }
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: "SUPER_ADMIN" } })
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage platform users, roles, and permissions.</p>
        </div>
        
        {/* Simple search form */}
        <form className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm"
            />
          </div>
          <select 
            name="status" 
            defaultValue={status || ""}
            onChange={(e) => e.target.form?.submit()}
            className="px-3 py-2 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>
          <a
            href="/api/admin/export/users"
            download
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Export CSV
          </a>
        </form>
      </div>

      <div className="bg-background border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-muted-foreground">User</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Role</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Uploads</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Joined</th>
              <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-destructive/10 text-destructive' :
                    user.role === 'PREMIUM' ? 'bg-primary/10 text-primary' :
                    'bg-secondary text-secondary-foreground'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' :
                    user.status === 'SUSPENDED' ? 'bg-orange-500/10 text-orange-600' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-foreground">{user._count.uploads}</div>
                  <div className="text-muted-foreground text-xs">{user._count.folders} folders</div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {user.createdAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <UserActions 
                    user={user} 
                    currentUserId={currentUserId} 
                    superAdminCount={superAdminCount} 
                  />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {skip + 1} to Math.min(skip + limit, total) of {total} users
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
