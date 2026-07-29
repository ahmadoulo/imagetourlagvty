import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/ui/CopyButton";
import { Download, ExternalLink, Calendar, HardDrive, FileType, Maximize } from "lucide-react";
import { headers } from "next/headers";
import { Metadata, ResolvingMetadata } from "next";
import { auth } from "@/lib/auth";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QRCodeSVG } from "qrcode.react";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
      title: "Not Found - Pixora",
    }
  }

  return {
    title: `${image.originalName} - Pixora`,
    description: `Uploaded to Pixora on ${image.createdAt.toLocaleDateString()}`,
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
  
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
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
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-5xl">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs shadow-sm">P</div>
            Pixora
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <a href={directUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 border border-border/50 shadow-sm">
                <ExternalLink className="w-4 h-4 mr-2 hidden sm:block" />
                Open
              </a>
              <a href={relativeUrl} download className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 h-9 px-4 py-2">
                <Download className="w-4 h-4 mr-2 hidden sm:block" />
                Download
              </a>
            </div>
            {session && (
              <div className="pl-4 border-l border-border/50">
                <UserMenu email={session.user.email} role={session.user.role as string} />
              </div>
            )}
            <div className={cn("pl-2", !session && "border-l border-border/50 ml-2")}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <SlideUp y={20}>
              <div className="bg-background rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col items-center justify-center p-8 min-h-[60vh] relative group">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <img 
                  src={image.url} 
                  alt={image.originalName} 
                  className="max-h-[70vh] w-auto max-w-full rounded-lg shadow-md relative z-10"
                />
              </div>
            </SlideUp>
          </div>

          <div className="space-y-6">
            <SlideUp y={20} delay={0.1}>
              <div className="bg-background border border-border/60 rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-lg mb-6 tracking-tight">Image Details</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <FileType className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Original Name</p>
                      <p className="font-medium truncate" title={image.originalName}>{image.originalName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <HardDrive className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium font-mono">{(image.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Uploaded</p>
                      <p className="font-medium">{image.createdAt.toLocaleDateString()} at {image.createdAt.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </SlideUp>

            <SlideUp y={20} delay={0.2}>
              <div className="bg-background border border-border/60 rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-lg mb-6 tracking-tight">Embed Codes</h2>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Direct Link</label>
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
            </SlideUp>
          </div>
        </div>
      </main>
    </div>
  );
}
