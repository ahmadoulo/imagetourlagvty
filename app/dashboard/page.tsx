import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { UserMenu } from "@/components/UserMenu";
import { DeleteButton } from "@/components/dashboard/DeleteButton";
import { SlideUp, StaggerContainer, StaggerItem } from "@/components/motion";

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
            <UserMenu email={session.user.email} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-12 space-y-12">
        <SlideUp y={20}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your images and track usage.</p>
            </div>
          </div>
        </SlideUp>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <div className="bg-background border border-border/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-primary/5 text-primary rounded-lg border border-primary/10">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Uploads</p>
                  <h3 className="text-2xl font-bold mt-1">{uploads.length}</h3>
                </div>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="bg-background border border-border/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-500/5 text-blue-500 rounded-lg border border-blue-500/10">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Storage Used</p>
                  <h3 className="text-2xl font-bold mt-1">{(totalSize / 1024 / 1024).toFixed(2)} MB</h3>
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Upload Section */}
        <SlideUp y={20} delay={0.2}>
          <div className="bg-background border border-border/60 rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-border/40 bg-muted/10">
              <h2 className="font-semibold text-lg">Upload Images</h2>
            </div>
            <div className="p-6">
              <UploadDropzone />
            </div>
          </div>
        </SlideUp>

        {/* Recent Uploads */}
        <SlideUp y={20} delay={0.3}>
          <div className="bg-background border border-border/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/40 flex items-center justify-between bg-muted/10">
              <h2 className="font-semibold text-lg">Your Images</h2>
            </div>
            
            {uploads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 shadow-sm border border-border/50">
                  <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No images uploaded yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Get started by uploading your first image using the dropzone above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {uploads.map((upload) => (
                  <div key={upload.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                      <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/50 shadow-sm relative group-hover:shadow-md transition-shadow">
                        <img src={upload.url} alt={upload.originalName} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/image/${upload.id}`} className="font-medium truncate block hover:text-primary transition-colors text-sm">
                          {upload.originalName}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                          <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded">{(upload.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{upload.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteButton id={upload.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SlideUp>
      </main>
    </div>
  );
}
