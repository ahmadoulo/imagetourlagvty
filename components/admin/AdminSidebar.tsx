"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Image as ImageIcon, 
  HardDrive, 
  LineChart, 
  CreditCard,
  Settings,
  Activity,
  Shield,
  Bell
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Images", href: "/admin/images", icon: ImageIcon },
  { name: "Storage", href: "/admin/storage", icon: HardDrive },
  { name: "Analytics", href: "/admin/analytics", icon: LineChart },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "System Health", href: "/admin/health", icon: Activity },
  { name: "Audit Logs", href: "/admin/logs", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-background border-r flex flex-col h-[calc(100vh-56px)] overflow-y-auto">
      <div className="p-4 py-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Administration</h2>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
