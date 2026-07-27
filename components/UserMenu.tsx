"use client";

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { authClient } from "@/lib/auth-client";
import { LogOut, LayoutDashboard, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
            router.refresh();
          }
        }
      });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium hidden sm:inline-block truncate max-w-[150px]">{email}</span>
        </button>
      </DropdownMenu.Trigger>
      
      <DropdownMenu.Portal>
        <DropdownMenu.Content 
          className="min-w-[200px] bg-popover text-popover-foreground rounded-md shadow-md border p-1 z-50 animate-in fade-in-80 zoom-in-95"
          align="end"
          sideOffset={5}
        >
          <div className="px-2 py-2 text-sm font-medium border-b mb-1 truncate text-muted-foreground">
            {email}
          </div>
          
          <DropdownMenu.Item asChild className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground">
            <Link href="/dashboard" className="flex items-center w-full">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenu.Item>
          
          <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-muted" />
          
          <DropdownMenu.Item 
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors focus:bg-destructive/10 focus:text-destructive text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
