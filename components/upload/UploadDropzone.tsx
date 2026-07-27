"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { UploadCloud, FileImage, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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

export function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
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
    
    // Start uploading each file
    newUploads.forEach((upload) => {
      startUpload(upload);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [processFiles]);

  // Handle global paste event
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

    try {
      // We use XMLHttpRequest here to get real progress updates
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
    } catch (error: any) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id ? { ...u, status: "error", error: error.message } : u
        )
      );
    }
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-64 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ease-in-out",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
          "bg-background text-foreground shadow-sm"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInput}
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,image/heic"
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-lg tracking-tight">
              Click to upload or drag and drop
            </h3>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, WEBP, GIF, SVG up to 50MB
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              You can also paste images from your clipboard
            </p>
          </div>
        </div>
      </div>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {uploads.map((upload) => (
              <motion.div
                key={upload.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-wrap items-center gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <div className="flex-shrink-0">
                  {upload.preview ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center">
                      <img src={upload.preview} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <FileImage className="w-12 h-12 text-muted-foreground p-2" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {upload.status === "uploading" && (
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {upload.status === "pending" && "Waiting..."}
                      {upload.status === "uploading" && `${upload.progress}%`}
                      {upload.status === "success" && "Completed"}
                      {upload.status === "error" && (
                        <span className="text-destructive">{upload.error}</span>
                      )}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
