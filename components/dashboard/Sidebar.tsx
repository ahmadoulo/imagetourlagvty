"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Folder, Star, Clock, Pin, Plus, MoreVertical, Trash, Edit2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

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
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const pathname = usePathname();
  const router = useRouter();

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

  const handleRenameFolder = async (e: React.FormEvent, folderId: string) => {
    e.preventDefault();
    if (!editFolderName.trim()) return;
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editFolderName }),
      });
      if (res.ok) {
        toast.success("Folder renamed");
        setEditingFolderId(null);
        fetchFolders();
      } else {
        toast.error("Failed to rename folder");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this folder and its contents?")) return;
    try {
      const res = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Folder deleted");
        if (currentFolder === folderId) {
          onFolderChange(null);
          onFilterChange("all");
        }
        fetchFolders();
      } else {
        toast.error("Failed to delete folder");
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
          <Link href="/dashboard/analytics" className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === "/dashboard/analytics" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
            <BarChart3 className={cn("w-4 h-4", pathname === "/dashboard/analytics" ? "text-primary" : "opacity-70")} />
            Analytics
          </Link>
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
            const isEditing = editingFolderId === folder.id;

            if (isEditing) {
              return (
                <form 
                  key={folder.id} 
                  onSubmit={(e) => handleRenameFolder(e, folder.id)} 
                  className="px-3 py-1 flex items-center gap-2"
                >
                  <input
                    autoFocus
                    type="text"
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    onBlur={() => setEditingFolderId(null)}
                    className="w-full h-8 px-2 text-sm bg-background border border-primary rounded-md focus:outline-none"
                  />
                </form>
              );
            }

            return (
              <div key={folder.id} className="relative group w-full flex items-center">
                <button
                  onClick={() => {
                    if (pathname === "/dashboard/analytics") {
                      router.push("/dashboard");
                    } else {
                      onFolderChange(folder.id);
                      onFilterChange("all");
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Folder className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary fill-primary/20" : "opacity-70 group-hover:opacity-100")} />
                  <span className="truncate pr-10 text-left w-full">{folder.name}</span>
                </button>
                <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md p-0.5 shadow-sm">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFolderId(folder.id);
                      setEditFolderName(folder.name);
                    }} 
                    className="p-1 hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteFolder(e, folder.id)} 
                    className="p-1 hover:text-destructive transition-colors"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
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
