"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Plan = {
  id: string;
  name: string;
  price: number;
};

export function ChangePlanDialog({
  userId,
  userName,
  currentPlanId,
  plans,
}: {
  userId: string;
  userName: string;
  currentPlanId: string | undefined;
  plans: Plan[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId || "");
  const router = useRouter();

  const handleUpdate = async () => {
    if (!selectedPlanId) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId: selectedPlanId }),
      });

      if (!res.ok) {
        throw new Error("Failed to update plan");
      }

      toast.success(`Plan for ${userName} updated successfully.`);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("An error occurred while updating the plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-primary hover:underline text-sm font-medium"
      >
        Change Plan
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-xl shadow-lg w-full max-w-md overflow-hidden text-left">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-lg">Change Plan for {userName}</h3>
              <p className="text-sm text-muted-foreground mt-1">Select a new subscription tier for this user.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Plan</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  <option value="" disabled>Select a plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 bg-muted/30 border-t flex justify-end gap-2">
              <button 
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-md hover:bg-muted text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={loading || selectedPlanId === currentPlanId}
                onClick={handleUpdate}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
