"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReloadIcon } from "@radix-ui/react-icons";

interface BulkSubmissionActionsProps {
  submissionIds: string[];
  onBulkUpdate: (action: string, submissionIds: string[]) => Promise<void>;
}

export function BulkSubmissionActions({ 
  submissionIds, 
  onBulkUpdate 
}: BulkSubmissionActionsProps) {
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelectAll = () => {
    if (selectedSubmissions.length === submissionIds.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions([...submissionIds]);
    }
  };

  const toggleSelectSubmission = (id: string) => {
    if (selectedSubmissions.includes(id)) {
      setSelectedSubmissions(selectedSubmissions.filter(subId => subId !== id));
    } else {
      setSelectedSubmissions([...selectedSubmissions, id]);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedSubmissions.length === 0) return;
    
    setIsProcessing(true);
    try {
      await onBulkUpdate(bulkAction, selectedSubmissions);
      // Clear selections after successful action
      setSelectedSubmissions([]);
    } catch (error) {
      console.error("Bulk action failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isAllSelected = selectedSubmissions.length > 0 && selectedSubmissions.length === submissionIds.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Submission Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={toggleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select all ({submissionIds.length} total)
            </label>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {submissionIds.map((id) => (
              <div key={id} className="flex items-center space-x-2">
                <Checkbox
                  id={`sub-${id}`}
                  checked={selectedSubmissions.includes(id)}
                  onCheckedChange={() => toggleSelectSubmission(id)}
                />
                <label htmlFor={`sub-${id}`} className="text-sm">
                  {id.substring(0, 8)}...
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select bulk action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mark-graded">Mark as Graded</SelectItem>
                <SelectItem value="request-resubmission">Request Resubmission</SelectItem>
                <SelectItem value="mark-pending">Mark as Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleBulkAction}
              disabled={isProcessing || selectedSubmissions.length === 0 || !bulkAction}
            >
              {isProcessing ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Apply to ${selectedSubmissions.length} submission(s)`
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}