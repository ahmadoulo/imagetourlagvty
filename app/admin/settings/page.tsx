import { Settings, Save, AlertCircle } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { updateSetting } from "../actions";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  const siteTitle = settings["SITE_TITLE"] || "ImageToUrl";
  const allowGuestUploads = settings["ALLOW_GUEST_UPLOADS"] !== false; // default true
  const maxGuestUploadSizeMB = settings["MAX_GUEST_UPLOAD_SIZE_MB"] || "5";

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global application parameters and feature flags.</p>
      </div>

      <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <h2 className="text-xl font-semibold">General Configuration</h2>
        </div>
        <div className="p-6 space-y-6">
          <form action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="SITE_TITLE" />
            <input type="hidden" name="type" value="string" />
            <input type="hidden" name="description" value="Global Site Title" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="font-medium text-foreground block mb-1">Site Title</label>
                <div className="text-sm text-muted-foreground">The name of your SaaS displayed in the navbar and emails.</div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  name="value" 
                  defaultValue={siteTitle} 
                  className="px-3 py-2 bg-background border rounded-md w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  <Save className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
          
          <hr />

          <form action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="ALLOW_GUEST_UPLOADS" />
            <input type="hidden" name="type" value="boolean" />
            <input type="hidden" name="description" value="Allow guests to upload files" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="font-medium text-foreground block mb-1">Allow Guest Uploads</label>
                <div className="text-sm text-muted-foreground">If disabled, only authenticated users can upload files.</div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  name="value" 
                  defaultValue={allowGuestUploads ? "true" : "false"} 
                  className="px-3 py-2 bg-background border rounded-md w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
                <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  <Save className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>

          <hr />

          <form action={updateSetting} className="space-y-4">
            <input type="hidden" name="key" value="MAX_GUEST_UPLOAD_SIZE_MB" />
            <input type="hidden" name="type" value="number" />
            <input type="hidden" name="description" value="Max upload size for guests (MB)" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="font-medium text-foreground block mb-1">Guest Upload Limit (MB)</label>
                <div className="text-sm text-muted-foreground">Maximum file size for non-authenticated users.</div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  name="value" 
                  defaultValue={maxGuestUploadSizeMB} 
                  min="1"
                  className="px-3 py-2 bg-background border rounded-md w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  <Save className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 text-orange-600 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold mb-1">More Settings</h3>
          <p className="text-sm">Additional settings like SMTP (Email), Storage Providers, and OAuth integrations are configured via environment variables (.env) for security reasons.</p>
        </div>
      </div>
    </div>
  );
}
