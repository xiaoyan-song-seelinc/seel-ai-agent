import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SidebarSlotProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function SidebarSlot({ open, title, onClose, children }: SidebarSlotProps) {
  return (
    <div
      className={cn(
        "w-80 border-l border-border bg-white flex flex-col shrink-0 h-full",
        "transition-all duration-200 overflow-hidden",
        open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 w-0 border-l-0",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <span className="text-[12px] font-semibold text-foreground">{title}</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
