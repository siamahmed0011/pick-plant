"use client";
import { useCallback, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { AdminSidebar } from "./admin-sidebar";
export function AdminMobileMenu() {
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open admin menu"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </Button>
      <Drawer open={open} title="Admin navigation" onClose={closeMenu}>
        <div className="-mx-5 -mb-5 h-[calc(100vh-5.75rem)]">
          <AdminSidebar onNavigate={closeMenu} />
        </div>
      </Drawer>
    </>
  );
}
