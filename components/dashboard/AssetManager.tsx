"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Search, Grid, List, ArrowDownAZ, ArrowUpAZ, Trash2, FolderInput, Star, Pin, X, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { ShareModal } from "./ShareModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

export function AssetManager() {
  const [images, setImages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // State
  const [filter, setFilter] = useState("all");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Pagination / Infinite Scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Sharing
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareType, setShareType] = useState<"images" | "folder">("images");

  const fetchImages = useCallback(async (reset = false) => {
    if (reset) {
      setPage(1);
      setLoading(true);
    }
    
    const currentPage = reset ? 1 : page;
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "30",
      filter,
      query: search,
      sortBy,
      sortOrder,
    });
    
    if (folderId) {
      params.append("folderId", folderId);
    }

    try {
      const res = await fetch(`/api/images?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        if (reset) {
          setImages(data.images);
        } else {
          setImages(prev => [...prev, ...data.images]);
        }
        setTotal(data.total);
        setHasMore(data.page < data.totalPages);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  }, [page, filter, search, sortBy, sortOrder, folderId]);

  useEffect(() => {
    fetchImages(true);
    setSelectedIds(new Set()); // Reset selection on filter change
  }, [filter, folderId, sortBy, sortOrder]); // search is handled by a separate submit

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchImages(true);
  };

  // Infinite scroll handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
    if (bottom && hasMore && !loading) {
      setPage(p => p + 1);
      setTimeout(() => fetchImages(), 0); // Load next page
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map(img => img.id)));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        if (document.activeElement?.tagName !== "INPUT") {
          e.preventDefault();
          selectAll();
        }
      } else if (e.key === "Escape") {
        setSelectedIds(new Set());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images, selectedIds]);

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} images?`)) return;
    
    try {
      const res = await fetch("/api/images/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      
      if (res.ok) {
        toast.success("Images deleted successfully");
        setSelectedIds(new Set());
        fetchImages(true);
      }
    } catch (e) {
      toast.error("Failed to delete images");
    }
  };

  const handleBulkFavorite = async () => {
    // Optimistic UI could be added here
    try {
      await Promise.all(Array.from(selectedIds).map(id => 
        fetch(`/api/images/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFavorite: true })
        })
      ));
      toast.success("Added to favorites");
      setSelectedIds(new Set());
      fetchImages(true);
    } catch (e) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)] w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar 
        currentFilter={filter} 
        onFilterChange={setFilter} 
        currentFolder={folderId} 
        onFolderChange={setFolderId} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Toolbar */}
        <div className="border-b border-border/40 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/10">
          <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
            <h2 className="text-xl font-bold tracking-tight hidden md:block">
              {folderId ? "Folder" : filter === "favorites" ? "Favorites" : filter === "pinned" ? "Pinned" : "All Uploads"}
            </h2>
            <form onSubmit={handleSearch} className="relative max-w-md w-full flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name (Press Enter)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm transition-all"
              />
            </form>
            
            {folderId && (
              <button 
                onClick={() => {
                  setShareType("folder");
                  setIsShareModalOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 shadow-sm border border-border/50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Collection
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Sort Toggle */}
            <button 
              onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
              className="p-2 border border-border/60 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Toggle Sort Order"
            >
              {sortOrder === "desc" ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpAZ className="w-4 h-4" />}
            </button>
            
            {/* View Toggle */}
            <div className="flex items-center p-1 border border-border/60 rounded-lg bg-background">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Bulk Action Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur-xl border border-border/60 shadow-xl rounded-full px-6 py-3 flex items-center gap-6"
            >
              <div className="text-sm font-medium">
                <span className="text-primary font-bold">{selectedIds.size}</span> selected
              </div>
              <div className="h-4 w-px bg-border/60" />
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setShareType("images");
                    setIsShareModalOpen(true);
                  }} 
                  className="p-2 hover:bg-muted rounded-full transition-colors group" 
                  title="Share"
                >
                  <Share2 className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </button>
                <button onClick={handleBulkFavorite} className="p-2 hover:bg-muted rounded-full transition-colors group" title="Favorite">
                  <Star className="w-4 h-4 text-muted-foreground group-hover:text-yellow-500" />
                </button>
                <button onClick={handleBulkDelete} className="p-2 hover:bg-muted rounded-full transition-colors group" title="Delete">
                  <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
                </button>
              </div>
              <div className="h-4 w-px bg-border/60" />
              <button onClick={() => setSelectedIds(new Set())} className="p-1.5 hover:bg-muted rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Zone (Visible if no search and on first page) */}
        {!search && filter === "all" && !folderId && images.length < 5 && page === 1 && (
          <div className="p-6 pb-0 max-w-4xl mx-auto w-full">
            <UploadDropzone />
          </div>
        )}

        {/* Content Area */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          onScroll={handleScroll}
        >
          {loading && images.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-muted-foreground font-medium">Loading assets...</p>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border/50">
                <Grid className="w-10 h-10 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-xl font-bold mb-2">No assets found</h3>
              <p className="text-muted-foreground text-sm">
                Upload some images or try changing your filters and search query.
              </p>
            </div>
          ) : (
            <div className={cn(
              "gap-4",
              viewMode === "grid" 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 auto-rows-[200px]" 
                : "flex flex-col max-w-4xl mx-auto"
            )}>
              {images.map((img) => (
                <div 
                  key={img.id}
                  onClick={(e) => {
                    // Prevent navigation if clicking checkbox area
                    if ((e.target as HTMLElement).closest('.select-zone')) return;
                    // Otherwise could link to details page
                  }}
                  className={cn(
                    "group relative bg-background border rounded-xl overflow-hidden transition-all duration-200 shadow-sm",
                    viewMode === "grid" ? "flex flex-col h-full" : "flex flex-row h-24 items-center p-3 gap-4",
                    selectedIds.has(img.id) ? "border-primary ring-1 ring-primary shadow-primary/10" : "border-border/60 hover:border-primary/50 hover:shadow-md"
                  )}
                >
                  {/* Select Checkbox Zone */}
                  <div 
                    onClick={() => toggleSelection(img.id)}
                    className={cn(
                      "select-zone absolute top-2 left-2 z-20 w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all",
                      selectedIds.has(img.id) 
                        ? "bg-primary border-primary opacity-100" 
                        : "bg-background/80 border-muted-foreground/50 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                    )}
                  >
                    {selectedIds.has(img.id) && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 right-2 z-20 flex gap-1">
                    {img.isPinned && <span className="bg-primary text-primary-foreground p-1 rounded-md shadow-sm"><Pin className="w-3 h-3" /></span>}
                    {img.isFavorite && <span className="bg-yellow-500 text-white p-1 rounded-md shadow-sm"><Star className="w-3 h-3 fill-current" /></span>}
                  </div>

                  {/* Thumbnail */}
                  <div className={cn(
                    "relative overflow-hidden bg-muted/30 flex items-center justify-center",
                    viewMode === "grid" ? "flex-1 w-full" : "w-16 h-16 rounded-lg flex-shrink-0"
                  )}>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                    <img 
                      src={img.url} 
                      alt={img.originalName}
                      loading="lazy"
                      className="max-w-full max-h-full object-contain relative z-10 p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className={cn(
                    "bg-background/90 backdrop-blur z-20 flex flex-col justify-center",
                    viewMode === "grid" ? "p-3 border-t border-border/40" : "flex-1 min-w-0"
                  )}>
                    <Link href={`/image/${img.id}`} className="font-medium text-sm truncate hover:text-primary transition-colors block" title={img.originalName}>
                      {img.originalName}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono bg-muted px-1 rounded">{(img.size / 1024).toFixed(0)} KB</span>
                      <span>•</span>
                      <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && page > 1 && (
                <div className="col-span-full py-4 flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        items={Array.from(selectedIds)} 
        type={shareType}
        folderId={folderId}
      />
    </div>
  );
}
