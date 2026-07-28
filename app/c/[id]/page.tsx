import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PasswordPrompt } from "./client";
import { Download, Folder, Grid } from "lucide-react";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

type Props = {
  params: Promise<{ id: string }>
}

export default async function CollectionPage({ params }: Props) {
  const { id } = await params;
  
  const collection = await prisma.folder.findUnique({
    where: { id },
    include: {
      uploads: {
        orderBy: { createdAt: "desc" }
      },
      user: {
        select: { name: true }
      }
    }
  });

  if (!collection) {
    notFound();
  }

  // Check Expiration
  if (collection.expiresAt && collection.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold text-destructive">This collection has expired.</h1>
      </div>
    );
  }

  // Check Privacy
  if (collection.visibility === "PRIVATE") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">This collection is private.</h1>
      </div>
    );
  }

  // Check Password
  if (collection.password) {
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie") || "";
    const authCookie = cookieHeader.split(';').find(c => c.trim().startsWith(`collection_auth_${id}=`));
    
    let isAuthorized = false;
    if (authCookie) {
      const passwordAttempt = authCookie.split('=')[1];
      if (passwordAttempt && typeof passwordAttempt === "string") {
        isAuthorized = await bcrypt.compare(passwordAttempt, collection.password);
      }
    }

    if (!isAuthorized) {
      return <PasswordPrompt collectionId={id} />;
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-lg hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs shadow-sm shadow-primary/20">I</div>
            ImageToURL
          </Link>
          <div className="flex items-center gap-4">
             {/* We will just use the zip download endpoint client side ideally, but here we can just put a mock button for now or a form */}
             <form action="/api/download/zip" method="POST" target="_blank" className="hidden" id="zip-form">
               <input type="hidden" name="collectionId" value={collection.id} />
             </form>
             <button 
                onClick={() => {
                   fetch('/api/download/zip', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ collectionId: collection.id })
                   }).then(async res => {
                     if(res.ok) {
                       const blob = await res.blob();
                       const url = window.URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = `${collection.name}.zip`;
                       document.body.appendChild(a);
                       a.click();
                       a.remove();
                     } else {
                       alert('Failed to download zip');
                     }
                   })
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 h-9 px-4 py-2"
             >
                <Download className="w-4 h-4 mr-2" />
                Download All (ZIP)
             </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="w-16 h-16 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-border/50">
            <Folder className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">{collection.name}</h1>
          {collection.description && <p className="text-muted-foreground text-lg mb-6">{collection.description}</p>}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>By {collection.user.name}</span>
            <span>•</span>
            <span>{collection.uploads.length} items</span>
          </div>
        </div>

        {collection.uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
             <Grid className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
             <h3 className="text-xl font-semibold mb-2">Empty Collection</h3>
             <p className="text-muted-foreground">This collection doesn't have any images yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-[250px]">
            {collection.uploads.map(upload => (
              <a 
                key={upload.id} 
                href={upload.url}
                target="_blank"
                rel="noreferrer"
                className="group relative bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col"
              >
                <div className="flex-1 bg-muted/30 relative overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                  <img src={upload.url} alt={upload.originalName} className="max-w-full max-h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <div className="p-3 border-t border-border/40 bg-background/90 backdrop-blur z-20">
                  <p className="font-medium text-sm truncate">{upload.originalName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{(upload.size / 1024).toFixed(1)} KB</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
