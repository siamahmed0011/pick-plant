"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { AdminSidebar } from "./admin-sidebar";
export function AdminMobileMenu() {
  const [open, setOpen] = useState(false);
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
      <Drawer open={open} title="Admin Menu" onClose={() => setOpen(false)}>
        <div className="-m-5 h-[calc(100vh-4rem)]">
          <AdminSidebar onNavigate={() => setOpen(false)} />
        </div>
      </Drawer>
    </>
  );
}
