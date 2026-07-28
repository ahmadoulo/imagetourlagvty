"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PasswordPrompt({ collectionId }: { collectionId: string }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/${collectionId}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      
      if (res.ok) {
        // In a real app, store token in localStorage/cookies. For this demo we just reload.
        // We'll pass password as query param or use cookies if we had more time.
        // Easiest hack: set a cookie.
        document.cookie = `collection_auth_${collectionId}=${encodeURIComponent(password)}; path=/; max-age=3600`;
        window.location.reload();
      } else {
        toast.error("Incorrect password");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background border border-border/60 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Protected Collection</h1>
        <p className="text-muted-foreground mb-8">This collection requires a password to view.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 text-center"
          />
          <button 
            type="submit" 
            disabled={loading || !password}
            className="w-full inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Unlocking..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
