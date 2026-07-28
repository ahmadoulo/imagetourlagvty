"use client";

import React, { useState, useEffect } from "react";
import { FolderInput, X, Folder, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: string[];
  onSuccess: () => void;
}

export function MoveToFolderModal({ isOpen, onClose, items, onSuccess }: MoveToFolderModalProps) {
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchFolders = async () => {
        setFetching(true);
        try {
          const res = await fetch("/api/folders");
          if (res.ok) {
            const data = await res.json();
            setFolders(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setFetching(false);
        }
      };
      fetchFolders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMove = async (folderId: string | null) => {
    setLoading(true);
    try {
      const res = await fetch("/api/images/bulk-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items, folderId }),
      });
      if (res.ok) {
        toast.success(folderId ? "Images moved to folder" : "Images removed from folder");
        onSuccess();
        onClose();
      } else {
        toast.error("Failed to move images");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-background border border-border/60 shadow-xl rounded-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
          <h2 className="font-semibold flex items-center gap-2">
            <FolderInput className="w-5 h-5 text-primary" /> Move {items.length} item(s)
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {fetching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleMove(null)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left border border-transparent hover:border-border/60"
              >
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                  <X className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">Remove from folder</div>
                  <div className="text-xs text-muted-foreground">Move back to all uploads</div>
                </div>
              </button>

              <div className="my-4 border-t border-border/40" />

              {folders.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No folders created yet.
                </div>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleMove(folder.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left border border-transparent hover:border-border/60"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm truncate max-w-[250px]">{folder.name}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
