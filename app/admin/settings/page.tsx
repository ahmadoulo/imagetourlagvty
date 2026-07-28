import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global application parameters.</p>
      </div>
      <div className="bg-background border rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
        <Settings className="w-12 h-12 mb-4 opacity-50" />
        <p>System Settings are under construction.</p>
      </div>
    </div>
  );
}
