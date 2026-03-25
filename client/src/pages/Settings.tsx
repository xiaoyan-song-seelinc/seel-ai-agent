/**
 * Settings: Platform configuration, integrations, and team management
 */
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Plug,
  Users,
  Bell,
  Shield,
  Globe,
  Key,
  Database,
  Mail,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const integrations = [
  { name: "Zendesk", category: "Ticketing", status: "connected" as const, icon: "Z" },
  { name: "Shopify", category: "Ecommerce", status: "connected" as const, icon: "S" },
  { name: "Gorgias", category: "Ticketing", status: "available" as const, icon: "G" },
  { name: "Freshdesk", category: "Ticketing", status: "available" as const, icon: "F" },
  { name: "WooCommerce", category: "Ecommerce", status: "available" as const, icon: "W" },
  { name: "Slack", category: "Notification", status: "available" as const, icon: "S" },
];

const teamMembers = [
  { name: "CX Manager", email: "cx@seel.com", role: "Admin", status: "active" },
  { name: "Support Lead", email: "lead@seel.com", role: "Manager", status: "active" },
  { name: "QA Analyst", email: "qa@seel.com", role: "Viewer", status: "active" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function Settings() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform configuration, integrations, and team management</p>
      </motion.div>

      <Tabs defaultValue="integrations">
        <TabsList className="bg-muted">
          <TabsTrigger value="integrations" className="gap-1.5"><Plug className="w-3.5 h-3.5" /> Integrations</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Team</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="w-3.5 h-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="general" className="gap-1.5"><SettingsIcon className="w-3.5 h-3.5" /> General</TabsTrigger>
        </TabsList>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-4">
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {integrations.map((int) => (
              <Card key={int.name} className="shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      int.status === "connected" ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {int.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{int.name}</p>
                        <Badge variant="outline" className="text-[9px]">{int.category}</Badge>
                      </div>
                      <div className="mt-2">
                        {int.status === "connected" ? (
                          <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200 gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Connected
                          </Badge>
                        ) : (
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => toast(`Connecting to ${int.name}...`)}>
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="mt-4">
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Team Members</CardTitle>
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => toast("Invite member dialog coming soon")}>
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {teamMembers.map((member) => (
                    <div key={member.email} className="flex items-center gap-4 px-6 py-3.5">
                      <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-teal-700">{member.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Guardrail Triggers", desc: "Get notified when a guardrail is triggered", icon: Shield, enabled: true },
                  { label: "Agent Escalations", desc: "Notifications when agents escalate to human", icon: Users, enabled: true },
                  { label: "CSAT Alerts", desc: "Alert when CSAT drops below threshold", icon: Bell, enabled: true },
                  { label: "Daily Performance Report", desc: "Daily summary of agent performance", icon: Mail, enabled: false },
                  { label: "New Ticket Notifications", desc: "Real-time notifications for new tickets", icon: MessageSquare, enabled: false },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <pref.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <Label className="text-sm">{pref.label}</Label>
                        <p className="text-[10px] text-muted-foreground">{pref.desc}</p>
                      </div>
                    </div>
                    <Switch defaultChecked={pref.enabled} onCheckedChange={() => toast("Preference updated")} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* General */}
        <TabsContent value="general" className="mt-4">
          <motion.div variants={itemVariants} className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Platform Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Company Name</Label>
                  <input className="w-full mt-1.5 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" defaultValue="Seel Inc." />
                </div>
                <div>
                  <Label className="text-sm">Default Language</Label>
                  <select className="w-full mt-1.5 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="en">English</option>
                    <option value="zh">Chinese</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Timezone</Label>
                  <select className="w-full mt-1.5 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="utc-8">Pacific Time (UTC-8)</option>
                    <option value="utc-5">Eastern Time (UTC-5)</option>
                    <option value="utc+8">China Standard Time (UTC+8)</option>
                  </select>
                </div>
                <div className="pt-2">
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => toast("Settings saved!")}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm">API Key</Label>
                  <div className="flex gap-2 mt-1.5">
                    <input className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono focus:outline-none" value="sk-seel-****-****-****-a8f2" readOnly />
                    <Button variant="outline" size="sm" onClick={() => toast("API key copied!")}>Copy</Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Webhook URL</Label>
                  <input className="w-full mt-1.5 px-3 py-2 bg-muted rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" defaultValue="https://api.seel.com/webhooks/agent" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
