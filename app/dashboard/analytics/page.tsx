"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { 
  DownloadCloud, Eye, HardDrive, FileSpreadsheet, FileText, Download,
  MapPin, Globe, Monitor, ExternalLink, Loader2
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Link from "next/link";
import { formatBytes } from "@/lib/utils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8dd1e1'];

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => {
    fetchData();
  }, [range]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Date", "Views", "Downloads", "Bandwidth (Bytes)"],
      ...data.chartData.map((d: any) => [d.date, d.views, d.downloads, d.bandwidth])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${range}days.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("CSV Exported!");
  };

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    const wsActivity = XLSX.utils.json_to_sheet(data.chartData);
    const wsTopImages = XLSX.utils.json_to_sheet(data.topImages);
    XLSX.utils.book_append_sheet(wb, wsActivity, "Daily Activity");
    XLSX.utils.book_append_sheet(wb, wsTopImages, "Top Images");
    XLSX.writeFile(wb, `analytics_${range}days.xlsx`);
    toast.success("Excel Exported!");
  };

  const exportPDF = async () => {
    const element = document.getElementById("analytics-dashboard-content");
    if (!element) return;
    try {
      toast.loading("Generating PDF...", { id: "pdf" });
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`analytics_${range}days.pdf`);
      toast.success("PDF Exported!", { id: "pdf" });
    } catch (e) {
      toast.error("Failed to generate PDF", { id: "pdf" });
    }
  };

  if (loading && !data) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" id="analytics-dashboard">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Monitor your image performance and traffic</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
            <button onClick={exportCSV} className="p-2 hover:bg-background rounded-md transition-colors group relative" title="Export CSV">
              <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            </button>
            <button onClick={exportExcel} className="p-2 hover:bg-background rounded-md transition-colors group relative" title="Export Excel">
              <FileSpreadsheet className="w-4 h-4 text-muted-foreground group-hover:text-green-500" />
            </button>
            <button onClick={exportPDF} className="p-2 hover:bg-background rounded-md transition-colors group relative" title="Export PDF">
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
            </button>
          </div>
        </div>
      </div>

      {data && (
        <div id="analytics-dashboard-content" className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <h3 className="text-3xl font-bold">{data.totals.views.toLocaleString()}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                  <DownloadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                  <h3 className="text-3xl font-bold">{data.totals.downloads.toLocaleString()}</h3>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bandwidth Used</p>
                  <h3 className="text-3xl font-bold">{formatBytes(data.totals.bandwidth)}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-6 tracking-tight">Daily Activity</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "4px" }}
                  />
                  <Line type="monotone" dataKey="views" stroke="#0088FE" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="Views" />
                  <Line type="monotone" dataKey="downloads" stroke="#00C49F" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="Downloads" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Countries */}
            <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-muted-foreground" /> Top Countries</h3>
              {data.topCountries.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.topCountries} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} fill="#8884d8" label>
                        {data.topCountries.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-muted-foreground text-sm py-8 text-center">No location data yet.</p>}
            </div>

            {/* Top Browsers */}
            <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Monitor className="w-5 h-5 text-muted-foreground" /> Browsers</h3>
              {data.topBrowsers.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topBrowsers} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px" }} />
                      <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                        {data.topBrowsers.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-muted-foreground text-sm py-8 text-center">No browser data yet.</p>}
            </div>

            {/* Top Referrers */}
            <div className="bg-background rounded-xl border border-border/60 p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><ExternalLink className="w-5 h-5 text-muted-foreground" /> Top Referrers</h3>
              {data.topReferrers.length > 0 ? (
                <ul className="space-y-3">
                  {data.topReferrers.map((ref: any, idx: number) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[200px]">{ref.name}</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded-md font-mono">{ref.value}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground text-sm py-8 text-center">No referrer data yet.</p>}
            </div>
          </div>

          {/* Top Images Table */}
          <div className="bg-background rounded-xl border border-border/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/60">
              <h3 className="font-semibold text-lg tracking-tight">Most Popular Images</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 font-medium">Image Name</th>
                    <th className="px-6 py-4 font-medium">Views</th>
                    <th className="px-6 py-4 font-medium">Downloads</th>
                    <th className="px-6 py-4 font-medium text-right">Total Interactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.topImages.length > 0 ? data.topImages.map((img: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium">{img.name}</td>
                      <td className="px-6 py-4">{img.views.toLocaleString()}</td>
                      <td className="px-6 py-4">{img.downloads.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-semibold">{(img.views + img.downloads).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No image interaction data yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
