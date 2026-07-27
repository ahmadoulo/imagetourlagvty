"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Link as LinkIcon, Lock, Globe, EyeOff, Calendar, DownloadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: string[];
  type: "images" | "folder";
  folderId?: string | null;
}

export function ShareModal({ isOpen, onClose, items, type, folderId }: ShareModalProps) {
  const [visibility, setVisibility] = useState<"PUBLIC" | "UNLISTED" | "PRIVATE">("PUBLIC");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [loading, setLoading] = useState(false);

  // If sharing a folder, we fetch its current settings (skipped for simplicity in this demo, assumes default)
  
  const handleSave = async () => {
    setLoading(true);
    try {
      if (type === "folder" && folderId) {
        await fetch(`/api/folders/${folderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visibility,
            password: password || null,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
          })
        });
      } else {
        // Bulk update images
        await Promise.all(items.map(id => 
          fetch(`/api/images/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visibility,
              password: password || null,
              expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
              maxDownloads: maxDownloads ? parseInt(maxDownloads) : null
            })
          })
        ));
      }
      toast.success("Sharing settings updated!");
      onClose();
    } catch (e) {
      toast.error("Failed to update sharing settings");
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = type === "folder" && folderId 
    ? `${window.location.origin}/c/${folderId}` 
    : items.length === 1 
      ? `${window.location.origin}/image/${items[0]}` 
      : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-background border border-border/60 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h2 className="font-semibold text-lg">Share {type === "folder" ? "Collection" : "Images"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {shareUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Share Link</label>
              <div className="flex gap-2">
                <input readOnly value={shareUrl} className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-sm shadow-sm" />
                <button 
                  onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied!"); }}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Visibility</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "PUBLIC", icon: Globe, label: "Public" },
                { id: "UNLISTED", icon: LinkIcon, label: "Unlisted" },
                { id: "PRIVATE", icon: EyeOff, label: "Private" },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVisibility(v.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                    visibility === v.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted text-muted-foreground"
                  )}
                >
                  <v.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" /> Password Protection
              </label>
              <input 
                type="password" 
                placeholder="Leave blank for no password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" /> Expiration Date
              </label>
              <input 
                type="datetime-local" 
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {type === "images" && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-muted-foreground" /> Max Downloads
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 1 for One-Time Download" 
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(e.target.value)}
                  min="1"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border/40 bg-muted/20 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
