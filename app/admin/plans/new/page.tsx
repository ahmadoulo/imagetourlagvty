import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createPlan } from "../../actions";

export default function NewPlanPage() {
  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/plans" className="p-2 hover:bg-muted rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Plan</h1>
          <p className="text-muted-foreground mt-1">Add a new billing tier for users.</p>
        </div>
      </div>

      <div className="bg-background border rounded-xl shadow-sm p-6">
        <form action={createPlan} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Name</label>
              <input type="text" name="name" required placeholder="e.g. Pro Plan" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (Monthly USD)</label>
              <input type="number" name="price" required min="0" step="0.01" placeholder="15.00" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Storage Limit (MB)</label>
              <input type="number" name="maxStorageMB" required min="0" placeholder="1024 (0 for unlimited)" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bandwidth Limit (MB/mo)</label>
              <input type="number" name="maxBandwidthMB" required min="0" placeholder="10240 (0 for unlimited)" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max File Size (MB)</label>
              <input type="number" name="maxFileSizeMB" required min="1" placeholder="10" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
              <Save className="w-4 h-4" />
              Save Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
