import { prisma } from "@/lib/prisma";
import { Receipt, Search, Download } from "lucide-react";
import Link from "next/link";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      subscription: { include: { plan: { select: { name: true } } } }
    },
    take: 50
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">View billing history and payment records.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search invoices..."
              className="pl-9 pr-4 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-64"
            />
          </div>
          <button className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Invoice ID</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4 font-mono text-xs">{invoice.id.substring(0, 12)}...</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{invoice.user.name}</div>
                      <div className="text-xs text-muted-foreground">{invoice.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {invoice.subscription?.plan?.name || "Manual / Custom"}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {invoice.amount.toLocaleString(undefined, { style: "currency", currency: invoice.currency.toUpperCase() })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        invoice.status === "PAID" ? "bg-green-500/10 text-green-600" :
                        invoice.status === "PENDING" ? "bg-orange-500/10 text-orange-600" :
                        "bg-red-500/10 text-red-600"
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {invoice.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {invoice.invoiceUrl ? (
                        <a href={invoice.invoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Download className="w-4 h-4" /> Receipt
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
