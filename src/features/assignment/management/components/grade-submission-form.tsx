"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReloadIcon } from "@radix-ui/react-icons";

// Define the grading form schema
const gradingFormSchema = z.object({
  grade: z.number()
    .min(0, "Grade must be at least 0")
    .max(100, "Grade cannot exceed 100"),
  feedback: z.string().optional(),
});

type GradingFormValues = z.infer<typeof gradingFormSchema>;

interface GradeSubmissionFormProps {
  submissionId: string;
  initialGrade?: number;
  initialFeedback?: string;
  onSubmit: (data: GradingFormValues) => Promise<void>;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

export function GradeSubmissionForm({ 
  submissionId, 
  initialGrade, 
  initialFeedback, 
  onSubmit, 
  isSubmitting = false,
  submitButtonText = "Submit Grade"
}: GradeSubmissionFormProps) {
  // Initialize the form with react-hook-form
  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingFormSchema),
    defaultValues: {
      grade: initialGrade || 0,
      feedback: initialFeedback || "",
    },
  });

  // Handle form submission
  const handleSubmit = async (data: GradingFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grade (%)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </FormControl>
              <FormDescription>
                Enter the grade as a percentage (0-100)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide feedback for the student..." 
                  rows={4} 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Optional feedback for the student
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}