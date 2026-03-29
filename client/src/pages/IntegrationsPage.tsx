/* ── IntegrationsPage ───────────────────────────────────────
   Single Zendesk card with "Setup Integration" → dual-purpose dialog.
   Option A: Sidebar App (Get Token)
   Option B: AI Support Access (OAuth + Agent Seat + Routing)
   ──────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2, ExternalLink, Copy, Link2,
  AlertTriangle, HelpCircle, ArrowRight, ArrowLeft,
  Shield, Bot, Eye, Loader2, XCircle,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────

type SetupPurpose = "sidebar" | "ai_support" | null;
type OAuthState = "idle" | "authorizing" | "success" | "error";

// ── Sidebar Token Flow ─────────────────────────────────────

function SidebarTokenFlow({ onBack }: { onBack: () => void }) {
  const [tokenCopied, setTokenCopied] = useState(false);
  const mockToken = "seel_zd_tk_a8f3c2e1b9d74f6e8a1c3b5d7e9f0a2b";

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </button>

      <div>
        <h3 className="text-[13px] font-semibold text-foreground">Seel Sidebar App</h3>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          View protection coverage and return details directly in your Zendesk tickets.
        </p>
      </div>

      {/* Token display */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Your integration token</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-[11px] bg-white border border-border rounded px-2.5 py-1.5 font-mono text-foreground truncate">
            {mockToken}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(mockToken);
              setTokenCopied(true);
              toast.success("Token copied");
              setTimeout(() => setTokenCopied(false), 2000);
            }}
            className="h-7 text-[10px] px-2.5 shrink-0"
          >
            {tokenCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-[11px] text-muted-foreground leading-relaxed space-y-1.5">
        <p>1. Copy the token above</p>
        <p>2. In Zendesk, go to <strong>Admin Center → Apps → Seel</strong></p>
        <p>3. Paste the token in the configuration field</p>
      </div>

      <a
        href="https://kover2618.zendesk.com/hc/en-us/articles/40003268225819"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
      >
        <HelpCircle className="w-3 h-3" /> View full setup guide
      </a>
    </div>
  );
}

// ── AI Support OAuth Flow ──────────────────────────────────

function AISupportFlow({ onBack }: { onBack: () => void }) {
  const [oauthState, setOauthState] = useState<OAuthState>("idle");
  const [oauthDone, setOauthDone] = useState(false);
  const [agentSeatDone, setAgentSeatDone] = useState(false);
  const [agentVerifying, setAgentVerifying] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [routingDone, setRoutingDone] = useState(false);

  const allDone = oauthDone && agentSeatDone && routingDone;

  const handleOAuth = () => {
    setOauthState("authorizing");
    // Simulate OAuth popup flow
    const popup = window.open(
      "about:blank",
      "zendesk_oauth",
      "width=500,height=600,left=200,top=100"
    );
    if (popup) {
      popup.document.write(`
        <html>
          <head><title>Zendesk Authorization</title></head>
          <body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8f9fa;">
            <div style="text-align:center;max-width:360px;padding:24px;">
              <div style="width:48px;height:48px;background:#03363D;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                <span style="color:white;font-weight:bold;font-size:18px;">Z</span>
              </div>
              <h2 style="margin:0 0 8px;font-size:16px;color:#1a1a1a;">Authorize Seel AI Support</h2>
              <p style="color:#666;font-size:13px;line-height:1.5;margin:0 0 20px;">
                Seel is requesting permission to read and respond to tickets in your Zendesk account.
              </p>
              <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:left;margin-bottom:20px;">
                <p style="font-size:11px;color:#888;margin:0 0 8px;">Permissions requested:</p>
                <p style="font-size:12px;color:#333;margin:0 0 4px;">✓ Read tickets and users</p>
                <p style="font-size:12px;color:#333;margin:0 0 4px;">✓ Write ticket comments</p>
                <p style="font-size:12px;color:#333;margin:0;">✓ Assign tickets</p>
              </div>
              <button onclick="window.close()" style="background:#03363D;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;width:100%;">
                Allow Access
              </button>
              <p style="font-size:11px;color:#999;margin-top:12px;">
                coastalliving.zendesk.com
              </p>
            </div>
          </body>
        </html>
      `);
    }

    // Simulate success after 3 seconds
    setTimeout(() => {
      setOauthState("success");
      setOauthDone(true);
      toast.success("Zendesk authorized — connected to coastalliving.zendesk.com");
    }, 3000);
  };

  const handleVerifyAgent = () => {
    setAgentVerifying(true);
    // Simulate API check
    setTimeout(() => {
      setAgentVerifying(false);
      setAgentSeatDone(true);
      setAgentName("Seel AI Rep");
      toast.success("Agent seat verified — found \"Seel AI Rep\"");
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </button>

      <div>
        <h3 className="text-[13px] font-semibold text-foreground">AI Support Access</h3>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Let your AI Rep read, respond to, and manage tickets in Zendesk.
        </p>
      </div>

      {/* Progress indicator */}
      {!allDone && (
        <div className="flex items-center gap-1.5">
          {[oauthDone, agentSeatDone, routingDone].map((done, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                done ? "bg-emerald-400" : "bg-muted"
              )}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">
            {[oauthDone, agentSeatDone, routingDone].filter(Boolean).length}/3
          </span>
        </div>
      )}

      {/* Step 1: OAuth */}
      <div className={cn(
        "rounded-lg border p-3 transition-all",
        oauthDone ? "border-emerald-200 bg-emerald-50/40" : "border-border bg-white"
      )}>
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-semibold",
            oauthDone ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
          )}>
            {oauthDone ? <CheckCircle2 className="w-3 h-3" /> : "1"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-[12px] font-medium", oauthDone && "text-emerald-800")}>
              Authorize Zendesk API access
            </p>
            {oauthDone ? (
              <p className="text-[10.5px] text-emerald-700 mt-0.5">
                Connected to <strong>coastalliving.zendesk.com</strong> — your AI Rep can now read and respond to tickets.
              </p>
            ) : (
              <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">
                Opens a Zendesk authorization window. You'll grant read/write access to tickets.
              </p>
            )}
            {!oauthDone && (
              <Button
                size="sm"
                onClick={handleOAuth}
                disabled={oauthState === "authorizing"}
                className="mt-2 h-7 text-[11px] px-3"
              >
                {oauthState === "authorizing" ? (
                  <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Waiting for authorization...</>
                ) : (
                  <><Link2 className="w-3 h-3 mr-1.5" /> Connect Zendesk</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Agent Seat */}
      <div className={cn(
        "rounded-lg border p-3 transition-all",
        agentSeatDone ? "border-emerald-200 bg-emerald-50/40" :
        !oauthDone ? "border-border/50 bg-muted/10 opacity-50 pointer-events-none" : "border-border bg-white"
      )}>
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-semibold",
            agentSeatDone ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
          )}>
            {agentSeatDone ? <CheckCircle2 className="w-3 h-3" /> : "2"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-[12px] font-medium", agentSeatDone && "text-emerald-800")}>
              Create an Agent seat
            </p>
            {agentSeatDone ? (
              <p className="text-[10.5px] text-emerald-700 mt-0.5">
                Found agent <strong>"{agentName}"</strong> — tickets assigned to this agent will be handled by AI. Next: configure routing.
              </p>
            ) : (
              <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">
                Add a new Agent in Zendesk (e.g., "Seel AI Rep") so the AI can receive tickets.
              </p>
            )}
            {oauthDone && !agentSeatDone && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open("https://coastalliving.zendesk.com/admin/people/team/members", "_blank")}
                  className="h-7 text-[11px] px-3"
                >
                  <ExternalLink className="w-3 h-3 mr-1.5" /> Open Zendesk Admin
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleVerifyAgent}
                  disabled={agentVerifying}
                  className="h-7 text-[11px] px-3"
                >
                  {agentVerifying ? (
                    <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Checking...</>
                  ) : (
                    "I've done this — verify"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 3: Routing */}
      <div className={cn(
        "rounded-lg border p-3 transition-all",
        routingDone ? "border-emerald-200 bg-emerald-50/40" :
        !agentSeatDone ? "border-border/50 bg-muted/10 opacity-50 pointer-events-none" : "border-border bg-white"
      )}>
        <div className="flex items-start gap-2.5">
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-semibold",
            routingDone ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
          )}>
            {routingDone ? <CheckCircle2 className="w-3 h-3" /> : "3"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-[12px] font-medium", routingDone && "text-emerald-800")}>
              Configure ticket routing
            </p>
            {routingDone ? (
              <p className="text-[10.5px] text-emerald-700 mt-0.5">
                Routing configured — your AI Rep will start receiving tickets based on your rules. Head back to <strong>AI Support → Communication</strong> to continue setup.
              </p>
            ) : (
              <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">
                Create a Trigger in Zendesk to assign specific tickets to your AI Rep.
              </p>
            )}
            {agentSeatDone && !routingDone && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open("https://coastalliving.zendesk.com/admin/objects-rules/rules/triggers", "_blank")}
                    className="h-7 text-[11px] px-3"
                  >
                    <ExternalLink className="w-3 h-3 mr-1.5" /> Open Triggers
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRoutingDone(true);
                      toast.success("Routing confirmed");
                    }}
                    className="h-7 text-[11px] px-3"
                  >
                    I've done this
                  </Button>
                </div>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); toast.info("Setup guide would open here"); }}
                  className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="w-3 h-3" /> View setup guide
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All done */}
      {allDone && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-emerald-800 font-medium">Zendesk is fully configured for AI Support</p>
            <p className="text-[10.5px] text-emerald-700 mt-0.5">
              Go to <strong>AI Support → Communication</strong> to set up your Playbook and hire your Rep.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Zendesk Card ────────────────────────────────────────────

function ZendeskCard() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [purpose, setPurpose] = useState<SetupPurpose>(null);
  const [sidebarActive] = useState(true); // mock: existing sidebar is connected

  return (
    <>
      <div className="border border-border rounded-xl bg-white overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-10 h-10 rounded-lg bg-[#03363D] flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-bold tracking-tight">Z</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-foreground">Zendesk integration</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
              Connect Zendesk for sidebar visibility or AI-powered ticket handling.
            </p>
          </div>
          <a
            href="https://kover2618.zendesk.com/hc/en-us/articles/40003268225819"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-primary hover:underline shrink-0"
          >
            Learn more
          </a>
        </div>

        {/* Status badges */}
        <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
          {sidebarActive && (
            <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Sidebar App active
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-amber-50 text-amber-700 border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> AI Support setup needed
          </Badge>
        </div>

        {/* Setup button */}
        <div className="px-5 pb-4">
          <Button
            onClick={() => { setDialogOpen(true); setPurpose(null); }}
            className="h-8 text-[12px] px-4"
          >
            Setup Integration
          </Button>
        </div>
      </div>

      {/* ── Setup Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setPurpose(null); } }}>
        <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          {purpose === null ? (
            /* ── Purpose selection ── */
            <>
              <DialogHeader>
                <DialogTitle className="text-[15px]">Setup Zendesk Integration</DialogTitle>
                <DialogDescription className="text-[12px]">
                  What would you like to set up?
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3 space-y-2.5">
                <button
                  onClick={() => setPurpose("sidebar")}
                  className="w-full flex items-start gap-3 p-3.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/3 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Eye className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground group-hover:text-primary transition-colors">
                      Sidebar App — View protection details
                    </p>
                    <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">
                      See Seel protection coverage and return details directly in your Zendesk tickets.
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                </button>

                <button
                  onClick={() => setPurpose("ai_support")}
                  className="w-full flex items-start gap-3 p-3.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/3 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground group-hover:text-primary transition-colors">
                      AI Support — Use AI Reps for ticket handling
                    </p>
                    <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">
                      Let your AI Rep read, respond to, and manage customer tickets in Zendesk.
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                </button>
              </div>
            </>
          ) : purpose === "sidebar" ? (
            <SidebarTokenFlow onBack={() => setPurpose(null)} />
          ) : (
            <AISupportFlow onBack={() => setPurpose(null)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main Integrations Page ──────────────────────────────────

export default function IntegrationsPage() {
  return (
    <div className="p-6 max-w-[720px]">
      <h1 className="text-[20px] font-bold text-foreground mb-1">Integrations</h1>
      <p className="text-[13px] text-muted-foreground mb-6">Connect your tools to Seel.</p>

      <div className="space-y-4">
        <ZendeskCard />

        {/* Placeholder for future integrations */}
        <div className="border border-dashed border-border/60 rounded-xl px-5 py-6 text-center">
          <p className="text-[12px] text-muted-foreground/50">More integrations coming soon</p>
          <p className="text-[10.5px] text-muted-foreground/40 mt-0.5">Freshdesk, Gorgias, Intercom, and more</p>
        </div>
      </div>
    </div>
  );
}
