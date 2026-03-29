/* ── IntegrationsPage ───────────────────────────────────────
   Simulates the Seel Merchant Dashboard Integrations page.
   Shows existing Zendesk sidebar integration + new AI Support setup.
   ──────────────────────────────────────────────────────── */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, ExternalLink, Copy, ChevronDown, ChevronUp,
  Link2, AlertTriangle, HelpCircle, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

// ── Zendesk Card ────────────────────────────────────────

function ZendeskCard() {
  const [sidebarConnected] = useState(true); // existing sidebar app
  const [aiSupportExpanded, setAiSupportExpanded] = useState(true);
  const [oauthDone, setOauthDone] = useState(false);
  const [agentSeatDone, setAgentSeatDone] = useState(false);
  const [routingDone, setRoutingDone] = useState(false);

  const allDone = oauthDone && agentSeatDone && routingDone;
  const completedSteps = [oauthDone, agentSeatDone, routingDone].filter(Boolean).length;

  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Zendesk logo */}
        <div className="w-10 h-10 rounded-lg bg-[#03363D] flex items-center justify-center shrink-0">
          <span className="text-white text-[11px] font-bold tracking-tight">Z</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-foreground">Zendesk integration</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
            View protection coverage and return details directly in your support tickets.
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

      {/* Existing sidebar connection */}
      <div className="px-5 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-foreground">Seel Sidebar App</p>
            <p className="text-[10.5px] text-muted-foreground">Connected — protection & return details in tickets</p>
          </div>
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
            Active
          </Badge>
        </div>
      </div>

      {/* AI Support section */}
      <div className="px-5 py-3">
        <button
          onClick={() => setAiSupportExpanded(!aiSupportExpanded)}
          className="w-full flex items-center gap-2.5 group"
        >
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
            allDone ? "bg-emerald-100" : "bg-amber-100"
          )}>
            {allDone ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-600" />
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[12px] font-medium text-foreground">AI Support Access</p>
            <p className="text-[10.5px] text-muted-foreground">
              {allDone ? "Fully configured" : `${completedSteps}/3 steps completed`}
            </p>
          </div>
          {!allDone && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-amber-700 border-amber-300 bg-amber-50">
              Setup needed
            </Badge>
          )}
          {aiSupportExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {aiSupportExpanded && (
          <div className="mt-3 space-y-2.5 pl-7.5">
            {/* Step 1: OAuth */}
            <div className={cn(
              "flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors",
              oauthDone ? "border-emerald-200/60 bg-emerald-50/30" : "border-border bg-white"
            )}>
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
                <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">
                  Allow Seel to read and respond to tickets on behalf of your AI Rep.
                </p>
                {!oauthDone && (
                  <Button
                    size="sm"
                    onClick={() => { setOauthDone(true); toast.success("Zendesk OAuth connected"); }}
                    className="mt-2 h-7 text-[11px] px-3"
                  >
                    <Link2 className="w-3 h-3 mr-1.5" /> Connect Zendesk
                  </Button>
                )}
              </div>
            </div>

            {/* Step 2: Agent Seat */}
            <div className={cn(
              "flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors",
              agentSeatDone ? "border-emerald-200/60 bg-emerald-50/30" :
              !oauthDone ? "border-border/50 bg-muted/20 opacity-60" : "border-border bg-white"
            )}>
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-semibold",
                agentSeatDone ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
              )}>
                {agentSeatDone ? <CheckCircle2 className="w-3 h-3" /> : "2"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[12px] font-medium", agentSeatDone && "text-emerald-800")}>
                  Create an Agent seat for your AI Rep
                </p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">
                  Add a new Agent in Zendesk Admin Center (e.g., "Seel AI Rep"). This lets the AI receive and reply to tickets.
                </p>
                {oauthDone && !agentSeatDone && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open("https://coastalliving.zendesk.com/admin/people/team/members", "_blank")}
                      className="h-7 text-[11px] px-3"
                    >
                      <ExternalLink className="w-3 h-3 mr-1.5" /> Open Zendesk Admin
                    </Button>
                    <button
                      onClick={() => { setAgentSeatDone(true); toast.success("Agent seat confirmed"); }}
                      className="text-[11px] text-primary hover:underline"
                    >
                      I've done this
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Routing */}
            <div className={cn(
              "flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors",
              routingDone ? "border-emerald-200/60 bg-emerald-50/30" :
              !agentSeatDone ? "border-border/50 bg-muted/20 opacity-60" : "border-border bg-white"
            )}>
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
                <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-relaxed">
                  Set up a Trigger in Zendesk to route tickets to your AI Rep. Choose which tickets the AI should handle.
                </p>
                {agentSeatDone && !routingDone && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open("https://coastalliving.zendesk.com/admin/objects-rules/rules/triggers", "_blank")}
                        className="h-7 text-[11px] px-3"
                      >
                        <ExternalLink className="w-3 h-3 mr-1.5" /> Open Triggers
                      </Button>
                      <button
                        onClick={() => { setRoutingDone(true); toast.success("Routing configured"); }}
                        className="text-[11px] text-primary hover:underline"
                      >
                        I've done this
                      </button>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); toast.info("Help doc would open here"); }}
                      className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground hover:text-foreground"
                    >
                      <HelpCircle className="w-3 h-3" /> View setup guide
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* All done message */}
            {allDone && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-[12px] text-emerald-800 font-medium">
                  Zendesk is fully configured for AI Support.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Integrations Page ──────────────────────────────

export default function IntegrationsPage() {
  return (
    <div className="p-6 max-w-[720px]">
      <h1 className="text-[20px] font-bold text-foreground mb-1">Integrations</h1>
      <p className="text-[13px] text-muted-foreground mb-6">Connect your tools to enable AI Support.</p>

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
