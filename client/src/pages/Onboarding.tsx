/**
 * Onboarding: Step-by-step wizard for setting up a new AI Agent
 * 5 steps: Connect Ticketing → Connect Ecommerce → Upload SOP → Configure Agent → Readiness Audit
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  ShoppingCart,
  FileText,
  Settings,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plug,
  Upload,
  Bot,
  ClipboardCheck,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Connect Ticketing", icon: Ticket, desc: "Link your helpdesk platform" },
  { id: 2, title: "Connect Ecommerce", icon: ShoppingCart, desc: "Link your store platform" },
  { id: 3, title: "Upload SOP", icon: FileText, desc: "Import your support procedures" },
  { id: 4, title: "Configure Agent", icon: Settings, desc: "Set behavior and permissions" },
  { id: 5, title: "Readiness Audit", icon: ClipboardCheck, desc: "Verify agent is ready" },
];

const integrations = {
  ticketing: [
    { name: "Zendesk", connected: true, logo: "Z" },
    { name: "Gorgias", connected: false, logo: "G" },
    { name: "Freshdesk", connected: false, logo: "F" },
    { name: "Intercom", connected: false, logo: "I" },
  ],
  ecommerce: [
    { name: "Shopify", connected: true, logo: "S" },
    { name: "WooCommerce", connected: false, logo: "W" },
    { name: "BigCommerce", connected: false, logo: "B" },
    { name: "Magento", connected: false, logo: "M" },
  ],
};

const auditChecks = [
  { item: "Ticketing system connected", status: "pass" as const },
  { item: "Ecommerce platform connected", status: "pass" as const },
  { item: "At least 1 SOP document uploaded", status: "pass" as const },
  { item: "Refund limit configured", status: "pass" as const },
  { item: "Escalation rules defined", status: "pass" as const },
  { item: "Response templates reviewed", status: "warning" as const },
  { item: "Shadow mode test completed", status: "pending" as const },
  { item: "CX Manager approval", status: "pending" as const },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Onboarding</h1>
        <p className="text-muted-foreground text-sm mt-1">Set up a new AI agent in 5 simple steps</p>
      </div>

      {/* Progress Steps */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    step.id < currentStep
                      ? "bg-teal-500 text-white"
                      : step.id === currentStep
                      ? "bg-teal-100 text-teal-700 ring-2 ring-teal-500"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {step.id < currentStep ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${step.id === currentStep ? "text-teal-700" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${step.id < currentStep ? "bg-teal-500" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-1.5" />
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Connect Your Ticketing System</CardTitle>
                <p className="text-xs text-muted-foreground">Select and connect your helpdesk platform so the agent can read and respond to tickets.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {integrations.ticketing.map((int) => (
                    <button
                      key={int.name}
                      className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                        int.connected ? "border-teal-500 bg-teal-50" : "border-border hover:border-teal-300"
                      }`}
                      onClick={() => toast(int.connected ? `${int.name} is already connected` : `Connecting to ${int.name}...`)}
                    >
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg font-bold ${
                        int.connected ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {int.logo}
                      </div>
                      <p className="text-sm font-medium">{int.name}</p>
                      {int.connected && (
                        <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200 mt-1">Connected</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Connect Your Ecommerce Platform</CardTitle>
                <p className="text-xs text-muted-foreground">Link your store so the agent can access order data, process refunds, and manage shipping.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {integrations.ecommerce.map((int) => (
                    <button
                      key={int.name}
                      className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                        int.connected ? "border-teal-500 bg-teal-50" : "border-border hover:border-teal-300"
                      }`}
                      onClick={() => toast(int.connected ? `${int.name} is already connected` : `Connecting to ${int.name}...`)}
                    >
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg font-bold ${
                        int.connected ? "bg-teal-500 text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {int.logo}
                      </div>
                      <p className="text-sm font-medium">{int.name}</p>
                      {int.connected && (
                        <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200 mt-1">Connected</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Upload SOP Documents</CardTitle>
                <p className="text-xs text-muted-foreground">Upload your standard operating procedures. AI will parse them into structured rules.</p>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base font-semibold mb-1">Drag & Drop SOP Files</h3>
                  <p className="text-sm text-muted-foreground mb-4">PDF, DOCX, TXT supported · Max 10MB</p>
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => toast("File picker coming soon")}>
                    Choose Files
                  </Button>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-teal-50">
                  <p className="text-xs text-teal-800 font-medium mb-1">AI will automatically extract:</p>
                  <div className="flex gap-4 text-xs text-teal-700">
                    <span>Prompt Rules</span>
                    <span>Guardrails</span>
                    <span>Action Workflows</span>
                    <span>Escalation Triggers</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Configure Agent Behavior</CardTitle>
                <p className="text-xs text-muted-foreground">Set the agent's strategy, limits, and permissions.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm">Agent Name</Label>
                      <input className="w-full mt-1.5 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" defaultValue="Agent Gamma" />
                    </div>
                    <div>
                      <Label className="text-sm">Strategy</Label>
                      <select className="w-full mt-1.5 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="conservative">Conservative</option>
                        <option value="balanced">Balanced</option>
                        <option value="aggressive">Aggressive</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-sm">Refund Limit</Label>
                      <input type="number" className="w-full mt-1.5 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" defaultValue={100} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <Label className="text-sm">Store Credit First</Label>
                        <p className="text-[10px] text-muted-foreground">Offer credit before cash refund</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <Label className="text-sm">Auto-Escalate Negative Sentiment</Label>
                        <p className="text-[10px] text-muted-foreground">Transfer when customer is upset</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <Label className="text-sm">Shadow Mode</Label>
                        <p className="text-[10px] text-muted-foreground">Start in observation mode</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Readiness Audit</CardTitle>
                <p className="text-xs text-muted-foreground">Verify all requirements are met before the agent goes live.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      {check.status === "pass" && <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />}
                      {check.status === "warning" && <div className="w-4 h-4 rounded-full bg-amber-400 shrink-0" />}
                      {check.status === "pending" && <div className="w-4 h-4 rounded-full bg-gray-300 shrink-0" />}
                      <span className="text-sm flex-1">{check.item}</span>
                      <Badge variant="outline" className={`text-[9px] ${
                        check.status === "pass" ? "bg-teal-50 text-teal-700 border-teal-200" :
                        check.status === "warning" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-gray-50 text-gray-500 border-gray-200"
                      }`}>
                        {check.status === "pass" ? "Passed" : check.status === "warning" ? "Review" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-lg bg-teal-50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-teal-800">Readiness Score: 75%</p>
                    <p className="text-xs text-teal-600">Complete remaining items to deploy agent</p>
                  </div>
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => toast("Agent deployment initiated!")}>
                    <Bot className="w-4 h-4 mr-2" /> Deploy Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        <span className="text-xs text-muted-foreground">Step {currentStep} of {steps.length}</span>
        <Button
          onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
          disabled={currentStep === steps.length}
          className="gap-1.5 bg-teal-600 hover:bg-teal-700"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
