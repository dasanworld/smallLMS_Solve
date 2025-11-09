'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAssignmentSubmissionMutation } from '../hooks/useAssignmentSubmissionMutation';
import { AssignmentSubmissionRequest } from '../lib/dto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

interface SubmissionPolicy {
  allow_text_submission: boolean;
  allow_link_submission: boolean;
  allow_file_submission: boolean;
  max_file_size?: number;
  allowed_file_types?: string[];
}

interface AssignmentSubmissionFormProps {
  assignmentId: string;
  submissionPolicy: SubmissionPolicy;
}

const AssignmentSubmissionForm: React.FC<AssignmentSubmissionFormProps> = ({ 
  assignmentId, 
  submissionPolicy 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mutation = useAssignmentSubmissionMutation();

  // Define the form schema based on submission policy
  const formSchema = z.object({
    content: submissionPolicy.allow_text_submission 
      ? z.string().min(1, 'Content is required') 
      : z.string().optional(),
    link: submissionPolicy.allow_link_submission 
      ? z.string().url('Please enter a valid URL').optional().or(z.literal(''))
      : z.string().optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  // Initialize the form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      link: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const submissionData: AssignmentSubmissionRequest = {
        content: data.content || '',
        link: data.link || null,
      };

      await mutation.mutateAsync(
        { assignmentId, submissionData },
        {
          onSuccess: () => {
            toast.success('Assignment submitted successfully!');
            form.reset();
          },
          onError: (error) => {
            toast.error(`Submission failed: ${error.message}`);
          },
        }
      );
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while submitting the assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Assignment</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {submissionPolicy.allow_text_submission && (
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your assignment content here..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {submissionPolicy.allow_link_submission && (
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/your-work"
                      type="url"
                      {...field}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting || mutation.isPending}
          >
            {isSubmitting || mutation.isPending ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AssignmentSubmissionForm;