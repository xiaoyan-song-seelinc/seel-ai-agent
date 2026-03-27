/* ── DashboardLayout ──────────────────────────────────────────
   Light, modern sidebar + white content area
   AOS-inspired: white sidebar, subtle borders, compact nav
   ──────────────────────────────────────────────────────────── */

import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Inbox,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TOPICS, AGENT_MODE } from "@/lib/mock-data";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Inbox;
  badge?: number;
  matchPaths?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Inbox",
    href: "/inbox",
    icon: Inbox,
    badge: TOPICS.filter((t) => t.status === "unread").length,
    matchPaths: ["/inbox"],
  },
  {
    label: "Conversation",
    href: "/conversation",
    icon: MessageCircle,
    matchPaths: ["/conversation", "/"],
  },
  {
    label: "Performance",
    href: "/performance",
    icon: BarChart3,
    matchPaths: ["/performance"],
  },
  {
    label: "Playbook",
    href: "/playbook",
    icon: BookOpen,
    matchPaths: ["/playbook"],
  },
];

function AgentStatusDot({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    production: "bg-emerald-400",
    shadow: "bg-amber-400",
    off: "bg-gray-300",
  };
  return <span className={cn("w-1.5 h-1.5 rounded-full inline-block", colors[mode] || "bg-gray-300")} />;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isOnboarding = location.startsWith("/onboarding");
  const isZendesk = location.startsWith("/zendesk");

  if (isOnboarding || isZendesk) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col h-full bg-white border-r border-border transition-all duration-200 ease-out",
          collapsed ? "w-[56px]" : "w-[200px]"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-3.5 h-11 border-b border-border shrink-0">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          {!collapsed && (
            <span className="text-[13px] font-semibold text-foreground">Seel AI</span>
          )}
        </div>

        {/* Agent status */}
        <div className={cn("px-3 py-2.5 border-b border-border", collapsed && "px-2")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center py-0.5">
                  <AgentStatusDot mode={AGENT_MODE} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span className="capitalize">Alex — {AGENT_MODE}</span>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-foreground">Alex</span>
                  <AgentStatusDot mode={AGENT_MODE} />
                </div>
                <span className="text-[10px] text-muted-foreground capitalize">{AGENT_MODE}</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-1.5 px-1.5 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchPaths?.some((p) =>
              p === "/" ? location === "/" : location.startsWith(p)
            );
            const Icon = item.icon;

            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center justify-center w-full h-8 rounded-md transition-all relative",
                        isActive
                          ? "bg-primary/8 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.badge && item.badge > 0 && (
                        <span className="absolute top-1 right-2.5 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                  {item.badge ? ` (${item.badge})` : ""}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-2.5 h-8 rounded-md transition-all",
                    isActive
                      ? "bg-primary/8 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[12px] font-medium flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="h-4 min-w-4 px-1 text-[10px] font-medium bg-primary/10 text-primary rounded flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Demo links */}
        <div className="px-1.5 pb-1 space-y-0.5">
          <Link href="/zendesk">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 h-7 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-all",
                collapsed && "justify-center px-0"
              )}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {!collapsed && <span className="text-[10px]">Zendesk Sidebar</span>}
            </div>
          </Link>
          <Link href="/onboarding">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 h-7 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-all",
                collapsed && "justify-center px-0"
              )}
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              {!collapsed && <span className="text-[10px]">Onboarding</span>}
            </div>
          </Link>
        </div>

        {/* Collapse toggle */}
        <div className="px-1.5 pb-2 pt-0.5 border-t border-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full h-7 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent transition-all"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
