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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define the grading form schema
const gradingFormSchema = z.object({
  score: z.number()
    .min(0, "Score must be at least 0")
    .max(100, "Score cannot exceed 100"),
  feedback: z.string().min(1, "Feedback is required"),
  action: z.enum(['grade', 'resubmission_required'])
});

type GradingFormValues = z.infer<typeof gradingFormSchema>;

interface GradeSubmissionFormProps {
  submissionId: string;
  initialScore?: number | null;
  initialFeedback?: string | null;
  initialStatus?: 'submitted' | 'graded' | 'resubmission_required';
  onSubmit: (data: GradingFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function GradeSubmissionForm({
  submissionId,
  initialScore,
  initialFeedback,
  initialStatus = 'submitted',
  onSubmit,
  isSubmitting = false
}: GradeSubmissionFormProps) {
  // Initialize the form with react-hook-form
  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingFormSchema),
    defaultValues: {
      score: initialScore || 0,
      feedback: initialFeedback || "",
      action: initialStatus === 'resubmission_required' ? 'resubmission_required' : 'grade'
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
          name="action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grade" id="grade" />
                    <label htmlFor="grade" className="text-sm font-medium leading-none">
                      Grade Submission
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="resubmission_required" id="resubmission_required" />
                    <label htmlFor="resubmission_required" className="text-sm font-medium leading-none">
                      Request Resubmission
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch('action') === 'grade' && (
          <FormField
            control={form.control}
            name="score"
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
        )}

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
                {form.watch('action') === 'grade' 
                  ? "Provide feedback for the student's submission" 
                  : "Provide feedback explaining why resubmission is required"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          {form.watch('action') === 'grade' ? 'Submit Grade' : 'Request Resubmission'}
        </Button>
      </form>
    </Form>
  );
}