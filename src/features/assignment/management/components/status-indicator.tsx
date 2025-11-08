"use client";

import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface StatusIndicatorProps {
  status: "draft" | "published" | "closed";
  publishedAt?: string | null;
  closedAt?: string | null;
  dueDate?: string | null;
}

export function StatusIndicator({ status, publishedAt, closedAt, dueDate }: StatusIndicatorProps) {
  const statusConfig = {
    draft: {
      text: "Draft",
      variant: "secondary" as const,
    },
    published: {
      text: "Published",
      variant: "default" as const,
    },
    closed: {
      text: "Closed",
      variant: "destructive" as const,
    },
  };

  const config = statusConfig[status];

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  return (
    <div className="space-y-1">
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
      <div className="text-xs text-muted-foreground mt-1">
        {status === "published" && publishedAt && (
          <div>Published: {formatDate(publishedAt)}</div>
        )}
        {status === "closed" && closedAt && (
          <div>Closed: {formatDate(closedAt)}</div>
        )}
        {dueDate && (
          <div>Due: {formatDate(dueDate)}</div>
        )}
      </div>
    </div>
  );
}