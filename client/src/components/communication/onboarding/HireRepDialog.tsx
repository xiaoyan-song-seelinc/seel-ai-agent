import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import type { AgentIdentity, ActionPermission, PermissionLevel } from "@/lib/mock-data";

interface HireRepDialogProps {
  open: boolean;
  onClose: () => void;
  onHire: (identity: Partial<AgentIdentity>, permissions: ActionPermission[]) => void;
  permissions: ActionPermission[];
  existingIdentity?: AgentIdentity;
}

const PERSONALITIES: { value: AgentIdentity["tone"]; label: string; description: string }[] = [
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "professional", label: "Professional", description: "Formal and polished" },
  { value: "casual", label: "Casual", description: "Relaxed and conversational" },
];

const LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto-detect (match customer's language)" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

export function HireRepDialog({
  open,
  onClose,
  onHire,
  permissions,
  existingIdentity,
}: HireRepDialogProps) {
  const [name, setName] = useState(existingIdentity?.name ?? "Ava");
  const [tone, setTone] = useState<AgentIdentity["tone"]>(
    existingIdentity?.tone ?? "friendly",
  );
  const [customTone, setCustomTone] = useState("");
  const [language, setLanguage] = useState("auto");
  const [localPermissions, setLocalPermissions] = useState<ActionPermission[]>(permissions);

  const writeActions = localPermissions.filter((p) => p.type === "write");

  function togglePermission(id: string) {
    setLocalPermissions((prev) =>
      prev.map((p) => {
        if (p.id !== id || p.locked) return p;
        return {
          ...p,
          permission: p.permission === "autonomous" ? "disabled" : "autonomous",
        } as ActionPermission;
      }),
    );
  }

  function handleHire() {
    const identity: Partial<AgentIdentity> = {
      name: name.trim() || "Ava",
      tone,
    };
    onHire(identity, localPermissions);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-[15px] font-semibold">Hire Rep</DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">
            Set up your rep's identity and action permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6 px-6 py-4 overflow-y-auto max-h-[70vh]">
          {/* Left column — Identity */}
          <div className="flex-1 min-w-0 space-y-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Identity
            </p>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                placeholder="Ava"
                className="text-[12px] h-8"
              />
            </div>

            {/* Personality */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">Personality</Label>
              <div className="space-y-1.5">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setTone(p.value)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors",
                      tone === p.value
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-border hover:border-border/80 hover:bg-accent/30",
                    )}
                  >
                    <div
                      className={cn(
                        "w-3.5 h-3.5 rounded-full border-2 shrink-0",
                        tone === p.value
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-muted-foreground/40",
                      )}
                    />
                    <div>
                      <p className="text-[12px] font-medium text-foreground">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground">{p.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tone */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">Custom Tone Instructions (optional)</Label>
              <Textarea
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                placeholder="e.g. Always start with the customer's name. Avoid using jargon."
                className="text-[11px] min-h-[60px] resize-none"
                rows={3}
              />
            </div>

            {/* Reply Language */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">Reply Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="text-[12px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-[12px]">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vertical divider */}
          <div className="w-px bg-border shrink-0" />

          {/* Right column — Action Permissions */}
          <div className="flex-1 min-w-0 space-y-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Action Permissions
            </p>

            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Read-only lookups (order status, shipment, customer info, product, Seel
                protection) are always enabled.
              </p>
            </div>

            <div className="space-y-1.5">
              {writeActions.map((action) => {
                const isEnabled = action.permission === "autonomous";
                return (
                  <div
                    key={action.id}
                    className={cn(
                      "rounded-lg border px-3 py-2 transition-colors",
                      action.locked
                        ? "border-border/40 bg-muted/10"
                        : "border-border bg-white",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {action.locked && (
                          <Lock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-foreground truncate">
                            {action.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {action.description}
                          </p>
                        </div>
                      </div>

                      {action.locked ? (
                        <Badge
                          variant="outline"
                          className="text-[8px] bg-emerald-50 text-emerald-600 border-emerald-200 shrink-0"
                        >
                          Always on
                        </Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => togglePermission(action.id)}
                          className={cn(
                            "text-[9px] font-medium px-2 py-0.5 rounded-full border transition-colors shrink-0",
                            isEnabled
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50",
                          )}
                        >
                          {isEnabled ? "Autonomous" : "Disabled"}
                        </button>
                      )}
                    </div>

                    {/* Guardrail display */}
                    {isEnabled && action.guardrails && action.guardrails.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {action.guardrails.map((g) => (
                          <div
                            key={g.id}
                            className="flex items-center gap-1.5 text-[9px] text-muted-foreground"
                          >
                            <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                            <span>
                              {g.label}
                              {g.type === "number" && g.value !== undefined
                                ? `: ${g.value} ${g.unit ?? ""}`
                                : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/10">
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleHire}
          >
            Hire {name.trim() || "Ava"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
