"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

export function DownloadZipButton({ collectionId, collectionName }: { collectionId: string, collectionName: string }) {
  const handleDownload = async () => {
    try {
      const res = await fetch('/api/download/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId })
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${collectionName}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        toast.error('Failed to download zip');
      }
    } catch (e) {
      toast.error('An error occurred during download');
    }
  };

  return (
    <button 
      onClick={handleDownload}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 h-9 px-4 py-2"
    >
      <Download className="w-4 h-4 mr-2" />
      Download All (ZIP)
    </button>
  );
}
