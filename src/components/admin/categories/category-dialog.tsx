"use client";

import { useCallback, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { AdminCategory } from "@/types/admin-category";
import { CategoryForm } from "./category-form";

export function CategoryDialog({ category }: { category?: AdminCategory }) {
  const [open, setOpen] = useState(false);
  const closeDialog = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button
        variant={category ? "ghost" : "primary"}
        size={category ? "sm" : "md"}
        onClick={() => setOpen(true)}
        aria-label={category ? `Edit ${category.name}` : undefined}
      >
        {category ? <Pencil size={16} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
        {category ? "Edit" : "Create category"}
      </Button>
      <Modal
        open={open}
        title={category ? `Edit ${category.name}` : "Create category"}
        onClose={closeDialog}
      >
        <CategoryForm category={category} onSuccess={closeDialog} />
      </Modal>
    </>
  );
}
