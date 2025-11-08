"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { SubmissionGradingData } from "../types";

interface SubmissionDetailsProps {
  submission: SubmissionGradingData;
}

export function SubmissionDetails({ submission }: SubmissionDetailsProps) {
  const isLate = submission.is_late;
  const status = submission.status;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Submission Details</CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium">{submission.user_name}</span>
              <Badge variant={status === 'graded' ? 'default' : 
                            status === 'resubmission_required' ? 'destructive' : 'secondary'}>
                {status.replace('_', ' ').toUpperCase()}
              </Badge>
              {isLate && (
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  LATE
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Student</p>
              <p className="text-sm">{submission.user_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Assignment</p>
              <p className="text-sm">{submission.assignment_title}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Submitted At</p>
              <p className="text-sm">{format(new Date(submission.submitted_at), 'yyyy-MM-dd HH:mm')}</p>
              {isLate && (
                <p className="text-xs text-orange-600 mt-1">This submission was submitted after the deadline</p>
              )}
            </div>
          </div>

          {submission.link && (
            <div className="flex items-start gap-2">
              <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Submission Link</p>
                <a 
                  href={submission.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {submission.link}
                </a>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Submission Content</p>
            <div className="p-3 bg-muted rounded-md max-h-60 overflow-y-auto">
              <p className="whitespace-pre-wrap">{submission.content}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}