import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CopyButton } from "@/components/ui/CopyButton";
import { Download, ExternalLink, Calendar, HardDrive, FileType, Maximize } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { Metadata, ResolvingMetadata } from "next";

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const image = await prisma.upload.findUnique({
    where: { id },
  });

  if (!image) {
    return {
      title: "Image Not Found",
    }
  }

  return {
    title: `${image.originalName} - ImageToURL`,
    description: `Uploaded to ImageToURL on ${image.createdAt.toLocaleDateString()}`,
    openGraph: {
      images: [image.url],
    },
    twitter: {
      card: "summary_large_image",
      images: [image.url],
    }
  }
}

export default async function ImagePage({ params }: Props) {
  const { id } = await params;
  
  const image = await prisma.upload.findUnique({
    where: { id },
  });

  if (!image) {
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  const relativeUrl = image.url;
  const directUrl = relativeUrl.startsWith('/') ? `${baseUrl}${relativeUrl}` : relativeUrl;
  
  const markdown = `![${image.originalName}](${directUrl})`;
  const html = `<img src="${directUrl}" alt="${image.originalName}" />`;
  const bbcode = `[img]${directUrl}[/img]`;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs">I</div>
            ImageToURL
          </Link>
          <div className="flex gap-2">
            <a href={directUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Original
            </a>
            <a href={relativeUrl} download className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background border rounded-xl overflow-hidden shadow-sm flex items-center justify-center min-h-[400px] p-4 relative group">
            {/* Checkerboard background for transparent images */}
            <div className="absolute inset-0 bg-[url('/checkerboard.svg')] opacity-20 pointer-events-none" />
            
            <img 
              src={directUrl} 
              alt={image.originalName}
              className="max-h-[70vh] object-contain relative z-0 rounded"
            />
            
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <a href={directUrl} target="_blank" className="p-2 bg-background/80 backdrop-blur rounded-md shadow flex items-center text-sm font-medium hover:bg-background">
                <Maximize className="w-4 h-4 mr-2" />
                Fullscreen
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Embeds */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-background border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Image Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground gap-3">
                <FileType className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground w-20">Format:</span>
                <span className="uppercase">{image.extension}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-3">
                <HardDrive className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground w-20">Size:</span>
                <span>{(image.size / 1024).toFixed(2)} KB</span>
              </div>
              {image.width && image.height && (
                <div className="flex items-center text-sm text-muted-foreground gap-3">
                  <Maximize className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground w-20">Resolution:</span>
                  <span>{image.width} × {image.height}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-muted-foreground gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground w-20">Uploaded:</span>
                <span>{image.createdAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Embeds Card */}
          <div className="bg-background border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Embed Links</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Direct URL</label>
                <div className="flex gap-2">
                  <input readOnly value={directUrl} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
                  <CopyButton text={directUrl} />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Markdown</label>
                <div className="flex gap-2">
                  <input readOnly value={markdown} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
                  <CopyButton text={markdown} />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">HTML</label>
                <div className="flex gap-2">
                  <input readOnly value={html} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
                  <CopyButton text={html} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">BBCode</label>
                <div className="flex gap-2">
                  <input readOnly value={bbcode} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
                  <CopyButton text={bbcode} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
