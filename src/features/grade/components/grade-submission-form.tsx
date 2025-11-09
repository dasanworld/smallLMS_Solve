'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ReloadIcon } from '@radix-ui/react-icons';

// Define the grading form schema
const gradingFormSchema = z.object({
  score: z.number()
    .min(0, '점수는 0 이상이어야 합니다')
    .max(100, '점수는 100을 초과할 수 없습니다'),
  feedback: z.string().min(1, '피드백은 필수입니다'),
  action: z.enum(['grade', 'resubmission_required'])
});

type GradingFormValues = z.infer<typeof gradingFormSchema>;

interface GradeSubmissionFormProps {
  submissionId: string;
  initialScore?: number | null;
  initialFeedback?: string | null;
  initialStatus?: 'submitted' | 'graded' | 'resubmission_required';
  onSubmit?: (data: GradingFormValues) => Promise<void>;
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
      feedback: initialFeedback || '',
      action: initialStatus === 'resubmission_required' ? 'resubmission_required' : 'grade'
    },
  });

  // Handle form submission
  const handleSubmit = async (data: GradingFormValues) => {
    if (onSubmit) {
      await onSubmit(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>처리 방식</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grade" id="grade" />
                    <label htmlFor="grade" className="text-sm font-medium leading-none cursor-pointer">
                      점수 제공
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="resubmission_required" id="resubmission_required" />
                    <label htmlFor="resubmission_required" className="text-sm font-medium leading-none cursor-pointer">
                      재제출 요청
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
                <FormLabel>점수</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="0"
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-slate-500 font-medium">점</span>
                  </div>
                </FormControl>
                <FormDescription>
                  0~100 사이의 점수를 입력하세요
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
              <FormLabel>피드백</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={form.watch('action') === 'grade'
                    ? '학생의 제출물에 대한 피드백을 입력하세요...'
                    : '재제출이 필요한 이유를 설명하세요...'}
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {form.watch('action') === 'grade'
                  ? '학생이 참고할 수 있도록 상세한 피드백을 제공하세요'
                  : '개선이 필요한 부분을 명확하게 설명하세요'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
            {form.watch('action') === 'grade' ? '점수 제공' : '재제출 요청'}
          </Button>
        </div>
      </form>
    </Form>
  );
}