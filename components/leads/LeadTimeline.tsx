import { MessageCircle, Clock, CheckCircle2, PlusCircle, Bot, User } from "lucide-react";
import type { TimelineEvent } from "@/services/timeline";

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return `Today at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function EventIcon({ event }: { event: TimelineEvent }) {
  const icons: Record<string, React.ReactNode> = {
    message: event.metadata?.role === "user"
      ? <User className="h-4 w-4 text-zinc-400" />
      : <Bot className="h-4 w-4 text-emerald-400" />,
    follow_up: event.metadata?.completed
      ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      : <Clock className="h-4 w-4 text-amber-400" />,
    lead_created: <PlusCircle className="h-4 w-4 text-blue-400" />,
  };
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
      {icons[event.type] || <MessageCircle className="h-4 w-4 text-zinc-400" />}
    </div>
  );
}

export function LeadTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={event.id} className="relative flex gap-4 pb-6">
          {i < events.length - 1 && (
            <div className="absolute left-4 top-8 bottom-0 w-px bg-zinc-800" />
          )}
          <EventIcon event={event} />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-zinc-100">{event.title}</p>
              <span className="shrink-0 text-xs text-zinc-500">{formatDate(event.timestamp)}</span>
            </div>
            <p className="mt-0.5 text-sm text-zinc-400 line-clamp-2">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
