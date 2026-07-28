import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { createRole } from "../../actions";

const AVAILABLE_PERMISSIONS = [
  "manage:users",
  "manage:roles",
  "manage:plans",
  "manage:billing",
  "manage:storage",
  "manage:uploads",
  "manage:api",
  "manage:analytics",
  "manage:settings",
  "manage:audit",
  "manage:organizations"
];

export default function CreateRolePage() {
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/roles" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Custom Role</h1>
          <p className="text-muted-foreground">Define a new role with specific granular permissions.</p>
        </div>
      </div>

      <div className="bg-background border rounded-xl shadow-sm p-6">
        <form action={createRole} className="space-y-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Role Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. MARKETING_TEAM"
              />
              <p className="text-xs text-muted-foreground mt-1">Must be uppercase without spaces (e.g. DATA_ANALYST)</p>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <input
                id="description"
                name="description"
                type="text"
                className="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Can view analytics and manage marketing uploads"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_PERMISSIONS.map(permission => (
                <label key={permission} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={permission}
                    className="w-4 h-4 text-primary focus:ring-primary/50 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
