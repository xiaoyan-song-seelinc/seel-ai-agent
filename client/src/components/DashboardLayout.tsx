/**
 * DashboardLayout: Virtual Office style sidebar navigation
 * Design: Dark sidebar with teal accents, warm gray content area
 * Typography: DM Sans for headings, clean hierarchy
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Bot,
  Ticket,
  MessageSquare,
  BookOpen,
  Shield,
  Eye,
  Rocket,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Bot, label: "Agents", path: "/agents" },
  { icon: Ticket, label: "Tickets", path: "/tickets" },
  { icon: MessageSquare, label: "Conversations", path: "/conversations" },
  { icon: BookOpen, label: "Knowledge Base", path: "/knowledge" },
  { icon: Shield, label: "Guardrails", path: "/guardrails" },
  { icon: Eye, label: "Watchtower", path: "/watchtower" },
  { icon: Rocket, label: "Onboarding", path: "/onboarding" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shrink-0"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <span className="font-bold text-base tracking-tight">Seel AI</span>
                  <span className="text-xs text-sidebar-foreground/60 block -mt-0.5">Support Agent</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== "/" && location.startsWith(item.path));
            
            const linkContent = (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "text-teal-400")} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-[3px] h-6 bg-teal-400 rounded-r-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="relative">{linkContent}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.path} className="relative">{linkContent}</div>;
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tickets, agents, knowledge..."
                className="pl-9 pr-4 py-2 w-80 bg-muted rounded-lg text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-[18px] h-[18px] text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-teal-700">CX</span>
              </div>
              <div className="text-sm">
                <p className="font-medium leading-none">CX Manager</p>
                <p className="text-xs text-muted-foreground mt-0.5">Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
