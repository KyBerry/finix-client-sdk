"use client";

import { ListIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { SidebarNav } from "@/components/site/sidebar-nav";
import { Button } from "@/components/ui/button";
import { SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <SheetTrigger isOpen={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon-sm" aria-label="Open navigation" className="lg:hidden">
        <ListIcon size={16} />
      </Button>
      <SheetContent side="left" className="w-72 overflow-y-auto p-4">
        <SheetTitle className="sr-only">Documentation navigation</SheetTitle>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </SheetTrigger>
  );
}
