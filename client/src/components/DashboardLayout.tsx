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
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

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
  { label: "AI Support", href: "/", icon: Bot },
];

const customizeNav: NavItem[] = [
  { label: "Widgets", href: "/widgets-placeholder", icon: LayoutGrid, disabled: true },
  { label: "Notifications", href: "/notifications-placeholder", icon: Bell, disabled: true },
];

/* AI Support internal tabs */
const aiTabs = [
  { label: "Communication", href: "/communication" },
  { label: "Playbook", href: "/playbook" },
  { label: "Performance", href: "/performance" },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div
        onClick={() => toast.info(`${item.label} — not part of this prototype`)}
        className="flex items-center gap-2.5 px-3 py-[5px] rounded-lg text-[13px] cursor-default text-muted-foreground/40"
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
                seel-test-alexsong
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">
                .myshopify.com
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
            <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
              Customize
            </p>
            <nav className="space-y-0.5 mt-0.5">
              {customizeNav.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
              ))}
            </nav>
          </div>
        </ScrollArea>

        {/* Bottom: demo links */}
        <div className="px-2 pb-2 space-y-0.5 border-t border-border pt-2">
          <Link href="/zendesk">
            <div className="flex items-center gap-2 px-3 py-[5px] rounded-lg text-[11px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/50 transition-colors cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Zendesk Sidebar</span>
            </div>
          </Link>
          <div className="flex items-center gap-2 px-3 py-[5px] rounded-lg text-[11px] text-muted-foreground/30">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Help</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* AI Support module header with internal tabs */}
        {isAISupport && (
          <div className="shrink-0 bg-white border-b border-border">
            <div className="px-6 pt-4 pb-0">
              <h1 className="text-[18px] font-bold text-foreground leading-tight">AI Support</h1>
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
        )}

        {/* Page content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
