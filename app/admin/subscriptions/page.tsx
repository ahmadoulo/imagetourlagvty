import { prisma } from "@/lib/prisma";
import { CreditCard, Search, Calendar, User as UserIcon, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; page?: string }>;
}) {
  const { query, status, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const limit = 20;
  const skip = (currentPage - 1) * limit;

  const where: any = {};
  if (query) {
    where.user = {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ]
    };
  }
  if (status) {
    where.status = status;
  }

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { name: true, price: true, currency: true } }
      }
    }),
    prisma.subscription.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage user plans and billing.</p>
        </div>
        
        <form className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              name="query"
              defaultValue={query}
              placeholder="Search by user..."
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
            <option value="CANCELED">Canceled</option>
            <option value="PAST_DUE">Past Due</option>
          </select>
        </form>
      </div>

      <div className="bg-background border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-muted-foreground">User</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Plan</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Provider</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Period End</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {sub.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{sub.user.name}</div>
                      <div className="text-muted-foreground text-xs">{sub.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{sub.plan.name}</div>
                  <div className="text-muted-foreground text-xs">${sub.plan.price} {sub.plan.currency}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    sub.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' :
                    sub.status === 'CANCELED' ? 'bg-orange-500/10 text-orange-600' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {sub.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                    {sub.status === 'CANCELED' && <Clock className="w-3 h-3" />}
                    {sub.status === 'PAST_DUE' && <AlertCircle className="w-3 h-3" />}
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-foreground">{sub.provider || "Manual"}</div>
                  {sub.providerId && <div className="text-muted-foreground text-xs font-mono">{sub.providerId.substring(0, 10)}...</div>}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {sub.currentPeriodEnd ? sub.currentPeriodEnd.toLocaleDateString() : "Never"}
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <CreditCard className="w-10 h-10 mb-4 opacity-50" />
                    <p>No subscriptions found.</p>
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
            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total} subscriptions
          </div>
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <a href={`?page=${currentPage - 1}${query ? '&query='+query : ''}${status ? '&status='+status : ''}`} className="px-3 py-1 border rounded hover:bg-muted text-sm">Previous</a>
            )}
            {currentPage < totalPages && (
              <a href={`?page=${currentPage + 1}${query ? '&query='+query : ''}${status ? '&status='+status : ''}`} className="px-3 py-1 border rounded hover:bg-muted text-sm">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
