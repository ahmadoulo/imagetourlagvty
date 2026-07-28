"use client";

import { ShieldAlert, ShieldCheck, Trash2, Ban } from "lucide-react";
import { useTransition } from "react";
import { deleteUser, changeUserRole } from "../actions";

export function UserActions({
  user,
  currentUserId,
  superAdminCount,
}: {
  user: { id: string; role: string; name: string };
  currentUserId: string;
  superAdminCount: number;
}) {
  const [isPending, startTransition] = useTransition();

  const isCurrentUser = user.id === currentUserId;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isOnlySuperAdmin = isSuperAdmin && superAdminCount <= 1;

  const handleDelete = () => {
    if (isCurrentUser) {
      alert("You cannot delete your own account.");
      return;
    }
    if (isOnlySuperAdmin) {
      alert("You cannot delete the only remaining Super Admin.");
      return;
    }
    if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      startTransition(async () => {
        const formData = new FormData();
        formData.append("userId", user.id);
        await deleteUser(formData);
      });
    }
  };

  const handleChangeRole = () => {
    if (isCurrentUser && isSuperAdmin) {
      if (isOnlySuperAdmin) {
        alert("You are the only remaining Super Admin. You cannot demote yourself.");
        return;
      }
      if (!confirm("WARNING: You are about to remove your own Super Admin privileges. Are you absolutely sure?")) {
        return;
      }
    }
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("currentRole", user.role);
      await changeUserRole(formData);
    });
  };

  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={handleChangeRole}
        disabled={isPending || (isCurrentUser && isOnlySuperAdmin)}
        className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        title={isSuperAdmin ? "Revoke Super Admin" : user.role === "ADMIN" ? "Revoke Admin" : "Make Admin"}
      >
        {isSuperAdmin || user.role === "ADMIN" ? (
          <ShieldCheck className="w-4 h-4 text-primary" />
        ) : (
          <ShieldAlert className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={handleDelete}
        disabled={isPending || isCurrentUser || isOnlySuperAdmin}
        className="p-2 hover:bg-destructive/10 rounded-md transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete User"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
