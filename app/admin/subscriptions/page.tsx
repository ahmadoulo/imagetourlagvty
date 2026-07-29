import { prisma } from "@/lib/prisma";
import { CreditCard, Search, Calendar, User as UserIcon, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { SubscriptionsFilter } from "./SubscriptionsFilter";
import { ChangePlanDialog } from "./ChangePlanDialog";

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
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  // Fetch all plans to pass to the dropdown
  const allPlans = await prisma.plan.findMany({ orderBy: { order: "asc" } });
  const freePlan = allPlans.find(p => p.price === 0);

  // We query Users instead of Subscriptions so we don't miss users who haven't uploaded yet (lazy sub)
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { plan: true },
          take: 1
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage platform users, their plans, and billing.</p>
        </div>
        
        <SubscriptionsFilter defaultQuery={query} defaultStatus={status} />
      </div>

      <div className="bg-background border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-muted-foreground">User</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Active Plan</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Period End</th>
              <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => {
              const activeSub = user.subscriptions[0];
              const plan = activeSub?.plan || freePlan;
              
              return (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-muted-foreground text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{plan?.name || "Free"}</div>
                    <div className="text-muted-foreground text-xs">${plan?.price || 0} {plan?.currency || "USD"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      activeSub ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {activeSub ? 'ACTIVE' : 'DEFAULT'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {activeSub?.currentPeriodEnd ? activeSub.currentPeriodEnd.toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChangePlanDialog 
                      userId={user.id} 
                      userName={user.name} 
                      currentPlanId={plan?.id} 
                      plans={allPlans} 
                    />
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <UserIcon className="w-10 h-10 mb-4 opacity-50" />
                    <p>No users found.</p>
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
            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total} users
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
