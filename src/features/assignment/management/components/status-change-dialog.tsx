"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ReloadIcon } from "@radix-ui/react-icons";

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: "draft" | "published" | "closed") => void;
  assignmentTitle: string;
  newStatus: "draft" | "published" | "closed";
  currentStatus: "draft" | "published" | "closed";
  isLoading?: boolean;
  validationWarnings?: string[];
}

export function StatusChangeDialog({
  isOpen,
  onClose,
  onConfirm,
  assignmentTitle,
  newStatus,
  currentStatus,
  isLoading = false,
  validationWarnings = [],
}: StatusChangeDialogProps) {
  const [selectedStatus] = useState<"draft" | "published" | "closed">(newStatus);

  const getStatusChangeMessage = () => {
    switch (newStatus) {
      case "published":
        return `Publish "${assignmentTitle}"?`;
      case "closed":
        return `Close "${assignmentTitle}"?`;
      case "draft":
        return `Unpublish "${assignmentTitle}"?`;
      default:
        return `Change status of "${assignmentTitle}"?`;
    }
  };

  const getStatusChangeDescription = () => {
    switch (newStatus) {
      case "published":
        return "The assignment will become visible to enrolled learners. Learners will be able to view the assignment details and submit if the deadline has not passed.";
      case "closed":
        return "Learners will no longer be able to submit to this assignment. Instructors can still view and grade existing submissions.";
      case "draft":
        return "The assignment will become hidden from learners. Any existing submissions will still be accessible to instructors.";
      default:
        return "";
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedStatus);
  };

  const getDialogTitle = () => {
    switch (newStatus) {
      case "published":
        return "Publish Assignment";
      case "closed":
        return "Close Assignment";
      case "draft":
        return "Unpublish Assignment";
      default:
        return "Change Assignment Status";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getStatusChangeMessage()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            {getStatusChangeDescription()}
          </p>
          
          {validationWarnings.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-5 space-y-1">
                  {validationWarnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}