import { prisma } from "@/lib/prisma";
import { Search, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { deleteImage } from "../actions";

export default async function AdminImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string }>;
}) {
  const { query, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const limit = 20;
  const skip = (currentPage - 1) * limit;

  const where = query
    ? {
        OR: [
          { originalName: { contains: query, mode: "insensitive" as any } },
          { user: { email: { contains: query, mode: "insensitive" as any } } },
        ],
      }
    : {};

  const [images, total] = await Promise.all([
    prisma.upload.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { name: true, email: true } }
      }
    }),
    prisma.upload.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Image Management</h1>
          <p className="text-muted-foreground mt-1">Browse, moderate, and manage all uploaded assets.</p>
        </div>
        
        <form className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search filename or user email..."
            className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm"
          />
        </form>
      </div>

      <div className="bg-background border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-muted-foreground w-16">Preview</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">File Info</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Uploader</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Stats</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Uploaded</th>
              <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {images.map((img) => (
              <tr key={img.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="w-12 h-12 bg-muted rounded overflow-hidden flex items-center justify-center relative">
                    <img src={img.url} alt={img.originalName} className="object-cover w-full h-full" loading="lazy" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground max-w-[200px] truncate" title={img.originalName}>{img.originalName}</div>
                  <div className="text-muted-foreground text-xs uppercase">{img.extension} • {(img.size / 1024).toFixed(1)} KB</div>
                </td>
                <td className="px-6 py-4">
                  {img.user ? (
                    <>
                      <div className="font-medium text-foreground">{img.user.name}</div>
                      <div className="text-muted-foreground text-xs">{img.user.email}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">Anonymous</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-foreground">{img.downloads} DLs</div>
                  <div className="text-muted-foreground text-xs">{img.visibility}</div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {img.createdAt.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <a href={img.url} target="_blank" rel="noreferrer" className="inline-flex p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground" title="Open Original">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <form action={deleteImage}>
                    <input type="hidden" name="imageId" value={img.id} />
                    <button type="submit" className="p-2 hover:bg-destructive/10 rounded-md transition-colors text-muted-foreground hover:text-destructive" title="Delete Image">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {images.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No images found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {skip + 1} to {Math.min(skip + limit, total)} of {total} images
          </div>
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <a href={`?page=${currentPage - 1}${query ? '&query='+query : ''}`} className="px-3 py-1 border rounded hover:bg-muted text-sm">Previous</a>
            )}
            {currentPage < totalPages && (
              <a href={`?page=${currentPage + 1}${query ? '&query='+query : ''}`} className="px-3 py-1 border rounded hover:bg-muted text-sm">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
