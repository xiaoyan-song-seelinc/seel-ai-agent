/**
 * TicketDetail: Standalone ticket detail page
 */
import { useParams, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TicketDetail() {
  const params = useParams<{ id: string }>();
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tickets">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Ticket #{params.id}</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Ticket detail view — please use the Tickets list page for the full split-panel experience.
      </p>
    </div>
  );
}
