/* ── DashboardLayout ──────────────────────────────────────────
   Shopify-style global left nav + AI Support module with internal tabs
   ──────────────────────────────────────────────────────────── */

import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart3,
  ShoppingCart,
  AlertCircle,
  ShieldCheck,
  Puzzle,
  Star,
  Bot,
  LayoutGrid,
  Bell,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
  disabled?: boolean;
}

const mainNav: NavItem[] = [
  { label: "Home", href: "/home-placeholder", icon: Home, disabled: true },
  { label: "Analytics", href: "/analytics-placeholder", icon: BarChart3, disabled: true },
  { label: "Orders", href: "/orders-placeholder", icon: ShoppingCart, disabled: true },
  { label: "Issues", href: "/issues-placeholder", icon: AlertCircle, disabled: true },
  { label: "Protection", href: "/protection-placeholder", icon: ShieldCheck, disabled: true },
  { label: "Integrations", href: "/integrations", icon: Puzzle },
  { label: "Reviews", href: "/reviews-placeholder", icon: Star, disabled: true },
  { label: "AI support", href: "/", icon: Bot },
];

const customizeNav: NavItem[] = [
  { label: "Widgets", href: "/widgets-placeholder", icon: LayoutGrid, disabled: true },
  { label: "Notifications", href: "/notifications-placeholder", icon: Bell, disabled: true },
];

/* AI Support internal tabs */
const aiTabs = [
  { label: "Agents", href: "/communication" },
  { label: "Playbook", href: "/playbook" },
  { label: "Performance", href: "/performance" },
];

/* Performance sub-tabs (second-level nav) */
const perfSubTabs = [
  { label: "Dashboard", href: "/performance" },
  { label: "Conversations", href: "/performance/conversations" },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div
        className="flex items-center gap-2.5 px-3 py-[5px] rounded-lg text-[13px] cursor-default text-muted-foreground/40 select-none"
      >
        <Icon className="w-[15px] h-[15px] shrink-0" />
        <span>{item.label}</span>
      </div>
    );
  }

  return (
    <Link href={item.href}>
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-[5px] rounded-lg text-[13px] transition-colors cursor-pointer",
          isActive
            ? "bg-primary/8 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
      >
        <Icon className="w-[15px] h-[15px] shrink-0" />
        <span>{item.label}</span>
      </div>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  // Zendesk sidebar is standalone — no layout
  if (location.startsWith("/zendesk")) {
    return <>{children}</>;
  }

  const isActive = (href: string) => {
    if (href === "/") {
      return (
        location === "/" ||
        location.startsWith("/communication") ||
        location.startsWith("/playbook") ||
        location.startsWith("/performance")
      );
    }
    return location.startsWith(href);
  };

  // Determine if we're inside the AI Support module
  const isAISupport =
    location === "/" ||
    location.startsWith("/communication") ||
    location.startsWith("/playbook") ||
    location.startsWith("/performance");

  // Which AI tab is active?
  const activeAITab = (() => {
    if (location.startsWith("/playbook")) return "/playbook";
    if (location.startsWith("/performance")) return "/performance";
    return "/communication"; // default (includes "/" and "/communication")
  })();

  const isPerformance = location.startsWith("/performance");
  const activePerfTab = (() => {
    if (location === "/performance/conversations") return "/performance/conversations";
    return "/performance";
  })();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left sidebar — Shopify-style global nav */}
      <aside className="w-[200px] shrink-0 border-r border-border bg-[#fafafa] flex flex-col">
        {/* Store header */}
        <div className="px-3 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold">S</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-foreground truncate leading-tight">
                alexsong.myshopify.com
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-0.5">
            {mainNav.map((item) => (
              <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
            ))}
          </nav>

          <div className="px-2 mt-4">
            <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground/50 tracking-wider">
              Customize
            </p>
            <nav className="space-y-0.5 mt-0.5">
              {customizeNav.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
              ))}
            </nav>
          </div>
        </ScrollArea>

        {/* Bottom spacer */}
        <div className="px-2 pb-2 border-t border-border pt-2" />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* AI Support module header with internal tabs */}
        {isAISupport && (
          <>
            <div className="shrink-0 bg-white border-b border-border">
              <div className="px-6 pt-4 pb-0">
                <h1 className="text-[18px] font-bold text-foreground leading-tight">AI support</h1>
                {/* Tab bar */}
                <div className="flex items-center gap-1 mt-3 -mb-px">
                  {aiTabs.map((tab) => (
                    <Link key={tab.href} href={tab.href}>
                      <button
                        className={cn(
                          "px-3 pb-2.5 text-[13px] font-medium transition-colors relative",
                          activeAITab === tab.href
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab.label}
                        {activeAITab === tab.href && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                        )}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance second-level nav */}
            {isPerformance && (
              <div className="shrink-0 bg-white border-b border-border">
                <div className="px-6 flex items-center gap-1 -mb-px">
                  {perfSubTabs.map((tab) => (
                    <Link key={tab.href} href={tab.href}>
                      <button
                        className={cn(
                          "px-3 py-2 text-[12px] font-medium transition-colors relative",
                          activePerfTab === tab.href
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab.label}
                        {activePerfTab === tab.href && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
                        )}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Page content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
