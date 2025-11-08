"use client";

import { useState } from "react";
import Link from "next/link";
import { Submission } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  UpdateIcon,
  FileTextIcon
} from "@radix-ui/react-icons";
import { format } from "date-fns";

interface SubmissionCardProps {
  submission: Submission;
  onStatusChange?: () => void;
}

export function SubmissionCard({ submission, onStatusChange }: SubmissionCardProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus: "pending" | "graded" | "resubmission_required") => {
    if (submission.status === newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/submissions/${submission.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update submission status");
      }

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Error updating submission status:", error);
      alert("Failed to update submission status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  // Determine status badge variant
  const statusVariant = 
    submission.status === "graded" ? "default" :
    submission.status === "resubmission_required" ? "destructive" : "secondary";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">
              {submission.user_id} {/* In a real app, this would be the student's name */}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusVariant}>
                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1).replace('_', ' ')}
              </Badge>
              {submission.grade !== null && (
                <Badge variant="outline">
                  Grade: {submission.grade}%
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
                <Link href={`/submissions/${submission.id}`}>
                  <EyeOpenIcon className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/submissions/${submission.id}/grade`}>
                  <Pencil1Icon className="mr-2 h-4 w-4" />
                  Grade Submission
                </Link>
              </DropdownMenuItem>
              {submission.status !== "graded" && (
                <DropdownMenuItem onClick={() => handleStatusChange("graded")}>
                  <UpdateIcon className="mr-2 h-4 w-4" />
                  Mark as Graded
                </DropdownMenuItem>
              )}
              {submission.status !== "resubmission_required" && (
                <DropdownMenuItem onClick={() => handleStatusChange("resubmission_required")}>
                  <UpdateIcon className="mr-2 h-4 w-4" />
                  Request Resubmission
                </DropdownMenuItem>
              )}
              {submission.status !== "pending" && (
                <DropdownMenuItem onClick={() => handleStatusChange("pending")}>
                  <UpdateIcon className="mr-2 h-4 w-4" />
                  Mark as Pending
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm text-muted-foreground mb-3">
          <p className="line-clamp-2">{submission.content}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          <div>Submitted: {formatDate(submission.submitted_at)}</div>
          {submission.graded_at && (
            <div>Graded: {formatDate(submission.graded_at)}</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
          >
            <Link href={`/submissions/${submission.id}`}>
              <FileTextIcon className="mr-2 h-4 w-4" />
              View Content
            </Link>
          </Button>
          {submission.status !== "graded" && (
            <Button 
              variant="default" 
              size="sm" 
              asChild
            >
              <Link href={`/submissions/${submission.id}/grade`}>
                Grade
              </Link>
            </Button>
          )}
        </div>
        {submission.grade !== null && (
          <div className="text-lg font-semibold">
            {submission.grade}%
          </div>
        )}
      </CardFooter>
    </Card>
  );
}