
"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function UsersFilter({ defaultQuery, defaultStatus }: { defaultQuery?: string, defaultStatus?: string }) {
  const router = useRouter();

  return (
    <form className="flex items-center gap-2 w-full md:w-auto" onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const query = formData.get("query") as string;
      const status = formData.get("status") as string;
      
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (status) params.set("status", status);
      
      router.push(`?${params.toString()}`);
    }}>
      <div className="relative w-full md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          name="query"
          defaultValue={defaultQuery}
          placeholder="Search users..."
          className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm"
        />
      </div>
      <select 
        name="status" 
        defaultValue={defaultStatus || ""}
        onChange={(e) => e.target.form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))}
        className="px-3 py-2 bg-background border border-border/60 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm"
      >
        <option value="">All Statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="SUSPENDED">Suspended</option>
        <option value="BANNED">Banned</option>
      </select>
      <a
        href="/api/admin/export/users"
        download
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
      >
        Export CSV
      </a>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
}

