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
              <input type="text" name="name" required className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Pro Plan" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (Monthly USD)</label>
              <input type="number" name="price" required min="0" step="0.01" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. 9.99" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Storage Limit (MB) <span className="text-muted-foreground text-xs">(0 = Unlimited)</span></label>
              <input type="number" name="maxStorageMB" defaultValue={1024} required min="0" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bandwidth Limit (MB/mo) <span className="text-muted-foreground text-xs">(0 = Unlimited)</span></label>
              <input type="number" name="maxBandwidthMB" defaultValue={10240} required min="0" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max File Size (MB)</label>
              <input type="number" name="maxFileSizeMB" defaultValue={10} required min="1" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Uploads / Day <span className="text-muted-foreground text-xs">(0 = Unlimited)</span></label>
              <input type="number" name="maxUploadsPerDay" defaultValue={0} required min="0" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Uploads / Month <span className="text-muted-foreground text-xs">(0 = Unlimited)</span></label>
              <input type="number" name="maxUploadsPerMonth" defaultValue={0} required min="0" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Folders <span className="text-muted-foreground text-xs">(0 = Unlimited)</span></label>
              <input type="number" name="maxFolders" defaultValue={0} required min="0" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Max API Keys <span className="text-muted-foreground text-xs">(0 = Unlimited)</span></label>
              <input type="number" name="maxApiKeys" defaultValue={0} required min="0" className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isActive" value="true" defaultChecked={true} className="w-4 h-4 text-primary focus:ring-primary/50 rounded border-gray-300" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Plan is Active</span>
                <span className="text-xs text-muted-foreground">Inactive plans cannot be purchased.</span>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isRecommended" value="true" defaultChecked={false} className="w-4 h-4 text-primary focus:ring-primary/50 rounded border-gray-300" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Recommended Plan</span>
                <span className="text-xs text-muted-foreground">Highlights this plan on the pricing page.</span>
              </div>
            </label>
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
