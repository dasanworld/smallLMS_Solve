import { Badge } from "@/components/ui/badge";

interface AssignmentStatusBadgeProps {
  status: "draft" | "published" | "closed";
}

export function AssignmentStatusBadge({ status }: AssignmentStatusBadgeProps) {
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

  return (
    <Badge variant={config.variant}>
      {config.text}
    </Badge>
  );
}