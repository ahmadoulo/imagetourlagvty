"use client";

import { ShieldAlert, ShieldCheck, Trash2, Ban, Play, PauseCircle, MailCheck, KeyRound } from "lucide-react";
import { useTransition } from "react";
import { deleteUser, changeUserRole, changeUserStatus, verifyUserEmail, resetUserPassword } from "../actions";

export function UserActions({
  user,
  currentUserId,
  superAdminCount,
}: {
  user: { id: string; role: string; name: string; status: "ACTIVE" | "SUSPENDED" | "BANNED"; emailVerified: boolean };
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

  const handleChangeStatus = (newStatus: "ACTIVE" | "SUSPENDED" | "BANNED") => {
    if (isCurrentUser && newStatus !== "ACTIVE") {
      alert("You cannot ban or suspend your own account.");
      return;
    }
    if (isOnlySuperAdmin && newStatus !== "ACTIVE") {
      alert("You cannot ban or suspend the only remaining Super Admin.");
      return;
    }
    
    let actionName = newStatus === "ACTIVE" ? "Activate" : newStatus === "SUSPENDED" ? "Suspend" : "Ban";
    if (confirm(`Are you sure you want to ${actionName.toLowerCase()} ${user.name}?`)) {
      startTransition(async () => {
        const formData = new FormData();
        formData.append("userId", user.id);
        formData.append("status", newStatus);
        await changeUserStatus(formData);
      });
    }
  };

  const handleVerifyEmail = () => {
    if (confirm(`Mark ${user.name}'s email as verified?`)) {
      startTransition(async () => {
        const formData = new FormData();
        formData.append("userId", user.id);
        await verifyUserEmail(formData);
      });
    }
  };

  const handleResetPassword = () => {
    if (confirm(`Are you sure you want to force reset the password for ${user.name}?`)) {
      startTransition(async () => {
        const formData = new FormData();
        formData.append("userId", user.id);
        const res = await resetUserPassword(formData);
        if (res && res.success) {
          alert(`Password successfully reset! The new temporary password is: \n\n${res.newPassword}\n\nPlease copy and send this to the user securely.`);
        }
      });
    }
  };

  return (
    <div className="flex justify-end gap-2">
      {!user.emailVerified && (
        <button
          onClick={handleVerifyEmail}
          disabled={isPending}
          className="p-2 hover:bg-blue-500/10 rounded-md transition-colors text-muted-foreground hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Verify Email Manually"
        >
          <MailCheck className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={handleResetPassword}
        disabled={isPending}
        className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        title="Force Reset Password"
      >
        <KeyRound className="w-4 h-4" />
      </button>

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

      {user.status === "ACTIVE" ? (
        <>
          <button
            onClick={() => handleChangeStatus("SUSPENDED")}
            disabled={isPending || isCurrentUser || isOnlySuperAdmin}
            className="p-2 hover:bg-orange-500/10 rounded-md transition-colors text-muted-foreground hover:text-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Suspend User"
          >
            <PauseCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleChangeStatus("BANNED")}
            disabled={isPending || isCurrentUser || isOnlySuperAdmin}
            className="p-2 hover:bg-destructive/10 rounded-md transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
            title="Ban User"
          >
            <Ban className="w-4 h-4" />
          </button>
        </>
      ) : (
        <button
          onClick={() => handleChangeStatus("ACTIVE")}
          disabled={isPending}
          className="p-2 hover:bg-green-500/10 rounded-md transition-colors text-muted-foreground hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Activate User"
        >
          <Play className="w-4 h-4" />
        </button>
      )}

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
