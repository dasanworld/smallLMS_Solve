"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Assignment } from "@/types/supabase";

interface StatusHistoryItem {
  id: string;
  assignment_id: string;
  status: "draft" | "published" | "closed";
  changed_at: string;
  changed_by: string;
  reason?: string;
}

interface StatusHistoryProps {
  assignmentId: string;
}

export function StatusHistory({ assignmentId }: StatusHistoryProps) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatusHistory = async () => {
      try {
        setLoading(true);
        // In a real implementation, we would fetch from an API endpoint
        // For now, we'll simulate with mock data
        const mockHistory: StatusHistoryItem[] = [
          {
            id: "1",
            assignment_id: assignmentId,
            status: "draft",
            changed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            changed_by: "Instructor User",
            reason: "Initial creation"
          },
          {
            id: "2",
            assignment_id: assignmentId,
            status: "published",
            changed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            changed_by: "Instructor User",
            reason: "Ready for student submissions"
          },
          {
            id: "3",
            assignment_id: assignmentId,
            status: "closed",
            changed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            changed_by: "Instructor User",
            reason: "Deadline passed"
          }
        ];
        
        setHistory(mockHistory);
      } catch (err) {
        setError("Failed to load status history");
        console.error("Error fetching status history:", err);
      } finally {
        setLoading(false);
      }
    };

    // In a real implementation, we would fetch from an API endpoint
    // fetchStatusHistory();
    
    // For now, just set loading to false since we're using mock data
    setLoading(false);
  }, [assignmentId]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary" as const;
      case "published":
        return "default" as const;
      case "closed":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="flex items-start gap-4 pb-3 border-b last:border-0">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-muted p-2">
                    <div className={`w-2 h-2 rounded-full ${item.status === 'published' ? 'bg-green-500' : item.status === 'closed' ? 'bg-red-500' : 'bg-gray-500'}`} />
                  </div>
                  {item.id !== history[history.length - 1].id && (
                    <div className="h-full w-0.5 bg-muted mt-1 flex-grow" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(item.changed_at), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    <span className="font-medium">{item.changed_by}</span> changed status
                    {item.reason && `: ${item.reason}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}