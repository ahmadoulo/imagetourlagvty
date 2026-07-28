
import { prisma } from "@/lib/prisma";
import { PackageOpen, Plus, Check } from "lucide-react";
import Link from "next/link";

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { subscriptions: true } }
    }
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Plans</h1>
          <p className="text-muted-foreground mt-1">Manage subscription tiers, limits, and pricing.</p>
        </div>
        <Link
          href="/admin/plans/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className={`flex flex-col border rounded-xl overflow-hidden bg-background shadow-sm ${plan.isRecommended ? "border-primary" : "border-border"}`}>
            {plan.isRecommended && (
              <div className="bg-primary text-primary-foreground text-center py-1 text-xs font-bold uppercase tracking-wider">
                Recommended
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="text-sm text-muted-foreground mt-1">{plan.description}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${plan.isActive ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                  {plan.isActive ? "Active" : "Inactive"}
                </div>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.billingCycle.toLowerCase()}</span>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{plan.maxStorageMB === 0 ? "Unlimited" : plan.maxStorageMB / 1024 + " GB"} Storage</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{plan.maxBandwidthMB === 0 ? "Unlimited" : plan.maxBandwidthMB / 1024 + " GB"} Bandwidth/mo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{plan.maxFileSizeMB === 0 ? "Unlimited" : plan.maxFileSizeMB + " MB"} Max File Size</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{plan.maxUploadsPerMonth === 0 ? "Unlimited" : plan.maxUploadsPerMonth} Uploads/mo</span>
                </div>
              </div>

              <div className="pt-6 border-t mt-auto flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <strong>{plan._count.subscriptions}</strong> active subs
                </div>
                <Link
                  href={`/admin/plans/${plan.id}/edit`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Edit Plan
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

