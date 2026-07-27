"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Folder, Star, Clock, Pin, Plus, MoreVertical, Trash, Edit2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

interface SidebarProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  currentFolder: string | null;
  onFolderChange: (folderId: string | null) => void;
}

export function Sidebar({ currentFilter, onFilterChange, currentFolder, onFolderChange }: SidebarProps) {
  const [folders, setFolders] = useState<any[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const pathname = usePathname();

  const fetchFolders = async () => {
    try {
      const res = await fetch("/api/folders");
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });
      if (res.ok) {
        toast.success("Folder created");
        setNewFolderName("");
        setIsCreatingFolder(false);
        fetchFolders();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create folder");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const navItems = [
    { id: "all", label: "Recent Uploads", icon: Clock },
    { id: "favorites", label: "Favorites", icon: Star },
    { id: "pinned", label: "Pinned", icon: Pin },
  ];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 lg:border-r border-border/40 h-full overflow-y-auto pb-20">
      <div className="p-4 space-y-8">
        
        {/* Navigation */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Library</h3>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentFilter === item.id && currentFolder === null && pathname !== "/dashboard/analytics";
            return (
              <button
                key={item.id}
                onClick={() => {
                  onFilterChange(item.id);
                  onFolderChange(null);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-70")} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Folders */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</h3>
            <button 
              onClick={() => setIsCreatingFolder(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolder} className="px-3 mb-2">
              <input
                autoFocus
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={() => setIsCreatingFolder(false)}
                className="w-full h-8 px-2 text-sm bg-background border border-border/60 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </form>
          )}

          {folders.map((folder) => {
            const isActive = currentFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => {
                  onFolderChange(folder.id);
                  onFilterChange("all");
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Folder className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary fill-primary/20" : "opacity-70 group-hover:opacity-100")} />
                <span className="truncate">{folder.name}</span>
              </button>
            );
          })}
          
          {folders.length === 0 && !isCreatingFolder && (
            <p className="px-3 text-xs text-muted-foreground italic">No folders yet</p>
          )}
        </div>
        
      </div>
    </aside>
  );
}
