"use client";

import { useState, useTransition } from "react";
import { assignPlanToUser } from "../../actions";
import { Save, Loader2 } from "lucide-react";

export function AssignPlanForm({ 
  userId, 
  currentPlanId,
  plans 
}: { 
  userId: string;
  currentPlanId?: string;
  plans: { id: string, name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  const handleAssign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await assignPlanToUser(formData);
    });
  };

  return (
    <form onSubmit={handleAssign} className="flex flex-col gap-2 mt-4">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex gap-2">
        <select 
          name="planId" 
          defaultValue={currentPlanId || ""}
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="" disabled>Select a plan...</option>
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>{plan.name}</option>
          ))}
        </select>
        <button 
          type="submit" 
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 shadow-sm border border-border/50 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isPending ? "" : "Save"}
        </button>
      </div>
    </form>
  );
}
