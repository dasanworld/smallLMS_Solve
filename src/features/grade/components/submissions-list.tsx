"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, User } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { SubmissionGradingData } from "../types";

interface SubmissionsListProps {
  submissions: SubmissionGradingData[];
  assignmentId: string;
  courseId: string;
}

export function SubmissionsList({ submissions, assignmentId, courseId }: SubmissionsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions for Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No submissions yet</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div 
                key={submission.id} 
                className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{submission.user_name}</h3>
                    <Badge variant={submission.status === 'graded' ? 'default' : 
                                  submission.status === 'resubmission_required' ? 'destructive' : 'secondary'}>
                      {submission.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {submission.is_late && (
                      <Badge variant="outline" className="border-orange-500 text-orange-700">
                        LATE
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(submission.submitted_at), 'MM/dd HH:mm')}</span>
                    </div>
                    
                    {submission.score !== null && (
                      <span className="font-medium">
                        Score: <span className="text-foreground">{submission.score}%</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {submission.link && (
                    <a 
                      href={submission.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  
                  <Link href={`/submissions/${submission.id}/grade`} passHref>
                    <Button variant="outline" size="sm">
                      Grade
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}