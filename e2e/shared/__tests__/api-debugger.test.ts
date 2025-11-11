import { test, expect } from '@playwright/test';
import { APIDebugger } from '../api-debugger';

test.describe('APIDebugger', () => {
  test('extractCourseId handles various response shapes', () => {
    const samples = [
      { id: 'course-1' },
      { course_id: 'course-2' },
      { courseId: 'course-3' },
      { course: { id: 'course-4' } },
      { data: { id: 'course-5' } },
      { data: { course_id: 'course-6' } },
      { data: { course: { id: 'course-7' } } },
    ];

    samples.forEach((payload) => {
      const id = APIDebugger.extractCourseId(payload);
      expect(id).not.toBeNull();
    });
  });

  test('extractError prefers explicit message', () => {
    expect(APIDebugger.extractError({ error: 'Bad Request' })).toBe('Bad Request');
    expect(APIDebugger.extractError({ message: 'Not Found' })).toBe('Not Found');
    expect(APIDebugger.extractError({ error: { message: 'Unauthorized' } })).toBe('Unauthorized');
    expect(APIDebugger.extractError({})).toBeNull();
  });
});
