"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, ReloadIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Assignment } from "@/types/supabase";

// Define the form schema
const assignmentFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  due_date: z.string().datetime({ message: "Due date must be a valid datetime" }),
  points_weight: z.number()
    .min(0, "Points weight must be at least 0")
    .max(1, "Points weight cannot exceed 1 (100%)")
    .step(0.01, "Points weight must be in increments of 0.01"),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
  allow_late: z.boolean().default(false),
  allow_resubmission: z.boolean().default(false),
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

interface AssignmentFormProps {
  courseId: string;
  initialData?: Partial<Assignment>;
  onSubmit: (data: AssignmentFormValues) => Promise<void>;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

export function AssignmentForm({ 
  courseId, 
  initialData, 
  onSubmit, 
  isSubmitting = false,
  submitButtonText = "Save Assignment"
}: AssignmentFormProps) {
  const [availableWeight, setAvailableWeight] = useState<number>(1);
  const [totalWeight, setTotalWeight] = useState<number>(0);

  // Initialize the form with react-hook-form
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      due_date: initialData?.due_date || "",
      points_weight: initialData?.points_weight || 0,
      status: (initialData?.status as "draft" | "published" | "closed") || "draft",
      allow_late: initialData?.allow_late || false,
      allow_resubmission: initialData?.allow_resubmission || false,
    },
  });

  // Calculate available weight when the form loads or changes
  useEffect(() => {
    const fetchCourseAssignments = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/assignments`);
        if (!response.ok) {
          throw new Error("Failed to fetch course assignments");
        }
        
        const data = await response.json();
        const currentAssignmentWeight = initialData?.points_weight || 0;
        
        // Calculate total weight of other assignments (excluding current one if editing)
        const otherAssignmentsWeight = data.assignments
          .filter((a: Assignment) => a.id !== initialData?.id)
          .reduce((sum: number, a: Assignment) => sum + (a.points_weight || 0), 0);
        
        const calculatedTotalWeight = otherAssignmentsWeight + currentAssignmentWeight;
        const calculatedAvailableWeight = 1 - otherAssignmentsWeight;
        
        setTotalWeight(calculatedTotalWeight);
        setAvailableWeight(calculatedAvailableWeight);
      } catch (error) {
        console.error("Error fetching course assignments:", error);
      }
    };

    fetchCourseAssignments();
  }, [courseId, initialData]);

  // Handle form submission
  const handleSubmit = async (data: AssignmentFormValues) => {
    await onSubmit(data);
  };

  // Calculate the percentage representation of points_weight
  const weightPercentage = (form.watch("points_weight") || 0) * 100;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Assignment title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the assignment requirements..." 
                  rows={4} 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Provide detailed instructions for the assignment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? date.toISOString() : "")}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  The deadline for this assignment
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="points_weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points Weight (%)</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="0"
                      value={field.value ? field.value * 100 : ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) / 100)}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </FormControl>
                <FormDescription>
                  Percentage of total course grade ({availableWeight * 100}% available)
                </FormDescription>
                <FormMessage />
                
                {/* Visual representation of weight */}
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Weight: {weightPercentage}%</span>
                    <span>Total: {totalWeight * 100}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(totalWeight * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="allow_late"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Allow Late Submissions
                    </FormLabel>
                    <FormDescription>
                      Students can submit after the due date
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allow_resubmission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Allow Resubmission
                    </FormLabel>
                    <FormDescription>
                      Students can resubmit their work
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}