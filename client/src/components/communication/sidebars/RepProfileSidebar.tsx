import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { useLocation } from "wouter";
import type { AgentIdentity, ActionPermission, AgentMode } from "@/lib/mock-data";

interface RepProfileSidebarProps {
  identity: AgentIdentity;
  permissions: ActionPermission[];
  agentMode: AgentMode;
  onEditSettings?: () => void;
}

const MODE_BADGE: Record<AgentMode, { label: string; className: string }> = {
  production: {
    label: "Production",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  training: {
    label: "Training",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  off: {
    label: "Off",
    className: "bg-muted/30 text-muted-foreground border-border/40",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function RepProfileSidebar({
  identity,
  permissions,
  agentMode,
  onEditSettings,
}: RepProfileSidebarProps) {
  const [, navigate] = useLocation();
  const [actionsOpen, setActionsOpen] = useState(false);

  const initials = getInitials(identity.name);
  const modeBadge = MODE_BADGE[agentMode] ?? MODE_BADGE.training;

  const writePermissions = permissions.filter((p) => p.type === "write");

  // Group by category
  const grouped = writePermissions.reduce<Record<string, ActionPermission[]>>(
    (acc, p) => {
      const cat = p.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    },
    {},
  );

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-[16px] font-bold shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-foreground">{identity.name}</p>
          <Badge
            variant="outline"
            className={cn("text-[8px] mt-0.5", modeBadge.className)}
          >
            {modeBadge.label}
          </Badge>
        </div>
      </div>

      {/* Edit settings link */}
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-[10px] w-full justify-start gap-1.5"
        onClick={() => onEditSettings ? onEditSettings() : navigate("/communication")}
      >
        <Pencil className="w-3 h-3" />
        Edit settings
      </Button>

      {/* Identity section */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Identity
        </p>
        <div className="space-y-1.5 rounded-lg border border-border/50 px-3 py-2.5 bg-white">
          {[
            ["Name", identity.name],
            ["Tone", identity.tone.charAt(0).toUpperCase() + identity.tone.slice(1)],
            ["Disclose AI", identity.transparentAboutAI ? "Yes" : "No"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <span className="text-[11px] font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance section */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Performance
        </p>
        <div className="space-y-1.5 rounded-lg border border-border/50 px-3 py-2.5 bg-white">
          {[
            ["Tickets", "156 total / 38 today"],
            ["Resolution", "78.5%"],
            ["CSAT", "4.6/5"],
            ["Avg Response", "42s"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <span className="text-[11px] font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate("/performance")}
          className="mt-1.5 text-[10px] text-indigo-600 hover:underline"
        >
          View full dashboard →
        </button>
      </div>

      {/* Permissions section */}
      <div>
        <button
          onClick={() => setActionsOpen(!actionsOpen)}
          className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors w-full"
        >
          {actionsOpen ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          Permissions ({writePermissions.length})
        </button>
        {actionsOpen && (
          <div className="space-y-3">
            <p className="text-[9px] text-muted-foreground">
              Read-only lookups are always enabled.
            </p>
            {Object.entries(grouped).map(([cat, actions]) => (
              <div key={cat}>
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {cat}
                </p>
                <div className="space-y-1">
                  {actions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between py-0.5">
                      <span className="text-[10.5px] text-foreground">{action.name}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[8px]",
                          action.permission === "autonomous"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-muted/30 text-muted-foreground border-border/40",
                        )}
                      >
                        {action.permission === "autonomous" ? "Autonomous" : "Disabled"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
