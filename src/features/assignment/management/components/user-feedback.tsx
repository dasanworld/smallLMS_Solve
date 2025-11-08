"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, InfoCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";

type FeedbackType = "success" | "error" | "warning" | "info";

interface UserFeedbackProps {
  message: string;
  type: FeedbackType;
  duration?: number; // Auto-hide after duration (in ms), 0 means don't auto-hide
  onClose?: () => void;
}

export function UserFeedback({ message, type, duration = 5000, onClose }: UserFeedbackProps) {
  const [visible, setVisible] = useState(true);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4" />,
    error: <CrossCircledIcon className="h-4 w-4" />,
    warning: <InfoCircledIcon className="h-4 w-4" />,
    info: <InfoCircledIcon className="h-4 w-4" />,
  };

  const variants = {
    success: "border-green-200 bg-green-50 text-green-700",
    error: "border-destructive/50 bg-destructive/10 text-destructive",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <Alert className={variants[type]}>
      {type === "error" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        icons[type]
      )}
      <AlertTitle>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </AlertTitle>
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  );
}

// Hook to manage global feedback state
export function useUserFeedback() {
  const [feedback, setFeedback] = useState<{ id: number; message: string; type: FeedbackType }[]>([]);

  const addFeedback = (message: string, type: FeedbackType) => {
    const id = Date.now();
    setFeedback((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setFeedback((prev) => prev.filter((f) => f.id !== id));
    }, 5000);
  };

  const removeFeedback = (id: number) => {
    setFeedback((prev) => prev.filter((f) => f.id !== id));
  };

  return { feedback, addFeedback, removeFeedback };
}