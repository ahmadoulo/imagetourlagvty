import { prisma } from "@/lib/prisma";
import { ShieldCheck, Plus, Check } from "lucide-react";
import Link from "next/link";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

export default async function RolesPage() {
  const customRoles = await prisma.role.findMany({
    orderBy: { createdAt: "desc" }
  });

  const builtinRoles = Object.keys(ROLE_PERMISSIONS);

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage Role-Based Access Control (RBAC) across the platform.</p>
        </div>
        <Link 
          href="/admin/roles/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Custom Role
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Built-in Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {builtinRoles.map(role => (
            <div key={role} className="bg-background border rounded-xl p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{role}</h3>
                  <p className="text-sm text-muted-foreground">System Defined</p>
                </div>
              </div>
              
              <div className="mt-4 border-t pt-4 flex-1">
                <p className="text-sm font-medium mb-2">Permissions:</p>
                <ul className="space-y-1">
                  {ROLE_PERMISSIONS[role].length === 0 ? (
                    <li className="text-sm text-muted-foreground">No administrative permissions</li>
                  ) : (
                    ROLE_PERMISSIONS[role].map(p => (
                      <li key={p} className="text-sm flex items-center gap-2 text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {p}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {customRoles.length > 0 && (
        <div className="space-y-4 pt-8">
          <h2 className="text-xl font-semibold">Custom Roles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRoles.map(role => {
              let perms = [];
              try { perms = JSON.parse(role.permissions); } catch {}
              return (
                <div key={role.id} className="bg-background border rounded-xl p-6 shadow-sm flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{role.name}</h3>
                      <p className="text-sm text-muted-foreground">Custom Role</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 border-t pt-4 flex-1">
                    <p className="text-sm font-medium mb-2">Permissions:</p>
                    <ul className="space-y-1">
                      {perms.length === 0 ? (
                        <li className="text-sm text-muted-foreground">No administrative permissions</li>
                      ) : (
                        perms.map((p: string) => (
                          <li key={p} className="text-sm flex items-center gap-2 text-muted-foreground">
                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                            {p}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t flex justify-end">
                    <Link href={`/admin/roles/${role.id}`} className="text-sm font-medium text-primary hover:underline">
                      Edit Role
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
