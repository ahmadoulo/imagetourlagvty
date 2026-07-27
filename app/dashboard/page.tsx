import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { HardDrive, Image as ImageIcon, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UploadDropzone } from "@/components/upload/UploadDropzone";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  const uploads = await prisma.upload.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const totalSize = uploads.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs">I</div>
            ImageToURL
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{session.user.email}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your images and account settings.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Uploads</p>
                <h3 className="text-2xl font-bold">{uploads.length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-background border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <h3 className="text-2xl font-bold">{(totalSize / 1024 / 1024).toFixed(2)} MB</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-background border rounded-xl shadow-sm overflow-hidden p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">Upload New Image</h2>
          <UploadDropzone />
        </div>

        {/* Recent Uploads */}
        <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-lg">Your Images</h2>
          </div>
          
          {uploads.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No images uploaded yet.</p>
              <Link href="/" className="text-primary hover:underline mt-2 inline-block">Upload your first image</Link>
            </div>
          ) : (
            <div className="divide-y">
              {uploads.map((upload) => (
                <div key={upload.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      <img src={upload.url} alt={upload.originalName} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/image/${upload.id}`} className="font-medium truncate block hover:underline">
                        {upload.originalName}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{(upload.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{upload.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Delete image">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
