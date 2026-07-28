import { prisma } from "@/lib/prisma";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePlan } from "../../actions";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const plan = await prisma.plan.findUnique({
    where: { id }
  });

  if (!plan) {
    notFound();
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/plans" className="p-2 hover:bg-muted rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Plan</h1>
          <p className="text-muted-foreground mt-1">Modify an existing billing tier.</p>
        </div>
      </div>

      <div className="bg-background border rounded-xl shadow-sm p-6">
        <form action={updatePlan} className="space-y-6">
          <input type="hidden" name="id" value={plan.id} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Name</label>
              <input type="text" name="name" defaultValue={plan.name} required className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (Monthly USD)</label>
              <input type="number" name="price" defaultValue={plan.price} required min="0" step="0.01" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Storage Limit (MB)</label>
              <input type="number" name="maxStorageMB" defaultValue={plan.maxStorageMB} required min="0" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bandwidth Limit (MB/mo)</label>
              <input type="number" name="maxBandwidthMB" defaultValue={plan.maxBandwidthMB} required min="0" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max File Size (MB)</label>
              <input type="number" name="maxFileSizeMB" defaultValue={plan.maxFileSizeMB} required min="1" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" />
              Update Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
