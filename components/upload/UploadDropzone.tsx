"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { UploadCloud, FileImage, X, CheckCircle, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CopyButton } from "@/components/ui/CopyButton";
import { toast } from "sonner";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UploadProgress {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  url?: string;
  uploadId?: string;
  error?: string;
  preview?: string;
}

export function UploadDropzone({ onUploadComplete, folderId }: { onUploadComplete?: () => void, folderId?: string | null }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const processFiles = useCallback((files: File[]) => {
    const newUploads = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: "pending" as const,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    
    setUploads((prev) => [...prev, ...newUploads]);
    
    newUploads.forEach((upload) => {
      startUpload(upload);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [processFiles]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        processFiles(Array.from(e.clipboardData.files));
      }
    };
    
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFiles]);

  const startUpload = async (upload: UploadProgress) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === upload.id ? { ...u, status: "uploading", progress: 10 } : u))
    );

    const formData = new FormData();
    formData.append("file", upload.file);
    if (folderId) {
      formData.append("folderId", folderId);
    }

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploads((prev) =>
            prev.map((u) => (u.id === upload.id ? { ...u, progress } : u))
          );
        }
      });

      const response = await new Promise((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            toast.success("Image uploaded successfully");
            resolve(data);
          } else {
            const errorMsg = JSON.parse(xhr.responseText).error || "Upload failed";
            toast.error(errorMsg);
            reject(new Error(errorMsg));
          }
        });
        xhr.addEventListener("error", () => {
          toast.error("Network error during upload");
          reject(new Error("Network error"));
        });
        xhr.open("POST", "/api/upload");
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      const data = response as any;
      
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id
            ? { ...u, status: "success", progress: 100, url: data.upload.url, uploadId: data.upload.id }
            : u
        )
      );

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error: any) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id ? { ...u, status: "error", error: error.message } : u
        )
      );
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,image/heic"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className={cn(
          "w-16 h-16 rounded-full bg-background border flex items-center justify-center mb-6 shadow-sm transition-transform duration-300",
          isDragActive ? "scale-110 shadow-primary/20 border-primary/30" : "group-hover:scale-105"
        )}>
          <UploadCloud className={cn("w-8 h-8 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")} />
        </div>
        
        <h3 className="text-xl font-semibold mb-2 tracking-tight">
          {isDragActive ? "Drop images here" : "Click or drag images to upload"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Support for PNG, JPG, WEBP, and GIF up to 50MB.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          You can also paste images from your clipboard
        </p>
      </div>

      {uploads.length > 0 && (
        <div className="mt-8 space-y-3">
          <AnimatePresence>
            {uploads.map((upload) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm shadow-sm"
              >
                <div className="flex-shrink-0">
                  {upload.preview ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center shadow-sm border border-border/50">
                      <img src={upload.preview} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shadow-sm border border-border/50">
                      <FileImage className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium truncate max-w-[200px] md:max-w-xs">{upload.file.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {upload.status === "error" ? "Error" : `${upload.progress}%`}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-2">
                  {upload.status === "uploading" && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {upload.status === "success" && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  {upload.status === "success" && upload.uploadId && (
                    <a
                      href={`/image/${upload.uploadId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors text-xs font-medium"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {upload.status === "success" && upload.url && (
                  <div className="col-span-full w-full mt-3 flex items-center gap-2 pt-3 border-t">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Direct Link:</span>
                    <input 
                      readOnly 
                      value={new URL(upload.url, window.location.origin).toString()} 
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
                    />
                    <CopyButton text={new URL(upload.url, window.location.origin).toString()} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
