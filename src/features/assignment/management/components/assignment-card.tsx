"use client";

import { useState } from "react";
import Link from "next/link";
import { Assignment } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignmentStatusBadge } from "./status-badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  DotsHorizontalIcon, 
  Pencil1Icon, 
  EyeOpenIcon, 
  TrashIcon,
  UpdateIcon
} from "@radix-ui/react-icons";
import { format } from "date-fns";

interface AssignmentCardProps {
  assignment: Assignment;
  onStatusChange?: () => void;
}

export function AssignmentCard({ assignment, onStatusChange }: AssignmentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/assignments/${assignment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to delete assignment");
      }

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: "draft" | "published" | "closed") => {
    if (assignment.status === newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update assignment status");
      }

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Error updating assignment status:", error);
      alert("Failed to update assignment status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{assignment.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <AssignmentStatusBadge status={assignment.status as "draft" | "published" | "closed"} />
              {assignment.points_weight && (
                <Badge variant="secondary">
                  {assignment.points_weight * 100}% of grade
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/courses/${assignment.course_id}/assignments/${assignment.id}/edit`}>
                  <Pencil1Icon className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/assignments/${assignment.id}`}>
                  <EyeOpenIcon className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {assignment.status === "draft" && (
                <DropdownMenuItem onClick={() => handleStatusChange("published")}>
                  <UpdateIcon className="mr-2 h-4 w-4" />
                  Publish
                </DropdownMenuItem>
              )}
              {assignment.status === "published" && (
                <DropdownMenuItem onClick={() => handleStatusChange("closed")}>
                  <UpdateIcon className="mr-2 h-4 w-4" />
                  Close
                </DropdownMenuItem>
              )}
              {assignment.status === "published" && (
                <DropdownMenuItem onClick={() => handleStatusChange("draft")}>
                  <UpdateIcon className="mr-2 h-4 w-4" />
                  Unpublish
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={isDeleting || isUpdatingStatus}
                className="text-destructive focus:text-destructive"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {assignment.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {assignment.description}
          </p>
        )}
        <div className="mt-3 text-sm">
          <div className="flex items-center text-muted-foreground">
            <span>Due: {assignment.due_date ? formatDate(assignment.due_date) : "No due date"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
          >
            <Link href={`/courses/${assignment.course_id}/assignments/${assignment.id}/submissions`}>
              View Submissions
            </Link>
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {assignment.updated_at ? `Updated: ${formatDate(assignment.updated_at)}` : ""}
        </div>
      </CardFooter>
    </Card>
  );
}