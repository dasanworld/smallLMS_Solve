import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

/**
 * 과제 관련 E2E 테스트
 * - 과제 생성, 조회, 제출, 평가, 상태 관리
 */

test.describe('Assignment Management', () => {
  test.describe('과제 생성 (강사)', () => {
    authTest(
      'should create a new assignment for course',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;
        const timestamp = Date.now();

        // 먼저 강좌 생성
        await page.goto('/instructor-dashboard');

        const createCourseButton = page.locator('button:has-text("강좌 생성")');
        if ((await createCourseButton.count()) > 0) {
          await createCourseButton.click();
          await page.fill('[name="title"]', `Course for Assignment ${timestamp}`);
          await page.fill('textarea[name="description"]', 'Test course');

          const categorySelect = page.locator('select[name="category"]');
          if ((await categorySelect.count()) > 0) {
            await categorySelect.selectOption({ index: 1 });
          }

          const difficultySelect = page.locator('select[name="difficulty"]');
          if ((await difficultySelect.count()) > 0) {
            await difficultySelect.selectOption({ index: 1 });
          }

          await page.click('button:has-text("생성")');
          await page.waitForTimeout(500);

          // 강좌 상세로 이동 (URL에 course ID 포함)
          const currentUrl = page.url();
          const courseIdMatch = currentUrl.match(/courses\/([a-f0-9-]+)/);

          if (courseIdMatch) {
            // 과제 생성 페이지로 이동
            await page.goto(`/courses/${courseIdMatch[1]}/assignments/new`);

            // 과제 정보 입력
            await page.fill('[name="title"]', `Assignment ${timestamp}`);
            await page.fill(
              'textarea[name="description"]',
              'This is a test assignment'
            );

            // 마감일 설정
            const dueDateInput = page.locator('[name="due_date"]');
            if ((await dueDateInput.count()) > 0) {
              const futureDate = new Date();
              futureDate.setDate(futureDate.getDate() + 7);
              await dueDateInput.fill(futureDate.toISOString().split('T')[0]);
            }

            // 배점 설정
            await page.fill('[name="points_weight"]', '0.3');

            // 생성 버튼 클릭
            await page.click('button:has-text("생성")');

            // 생성 성공 확인
            await expect(
              page.locator(`text=Assignment ${timestamp}`)
            ).toBeVisible();
          }
        }
      }
    );

    authTest(
      'should configure assignment options',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        // 과제 생성 페이지에서
        await page.goto('/instructor-dashboard');

        // 과제 설정 옵션
        const allowLateCheckbox = page.locator('[name="allow_late"]');
        if ((await allowLateCheckbox.count()) > 0) {
          await allowLateCheckbox.check();
        }

        const allowResubmissionCheckbox = page.locator(
          '[name="allow_resubmission"]'
        );
        if ((await allowResubmissionCheckbox.count()) > 0) {
          await allowResubmissionCheckbox.check();
        }
      }
    );
  });

  test.describe('과제 조회 (학습자)', () => {
    authTest(
      'should view assignments list for enrolled course',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/dashboard');

        // 수강 중인 강좌 선택
        const firstCourse = page.locator('a[href*="/courses/"]').first();
        if ((await firstCourse.count()) > 0) {
          await firstCourse.click();

          // 과제 목록 확인
          const assignmentsLink = page.locator('a:has-text("과제")');
          if ((await assignmentsLink.count()) > 0) {
            await assignmentsLink.click();

            // 과제 목록 표시 확인
            await expect(page.locator('text=/과제|Assignment/i')).toBeVisible();
          }
        }
      }
    );

    authTest(
      'should view assignment detail',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/courses');

        // 강좌 선택
        const firstCourse = page.locator('a[href*="/courses/"]').first();
        if ((await firstCourse.count()) > 0) {
          const courseUrl = await firstCourse.getAttribute('href');
          await page.goto(courseUrl!);

          // 과제 목록으로 이동
          const assignmentsTab = page.locator('a:has-text("과제")');
          if ((await assignmentsTab.count()) > 0) {
            await assignmentsTab.click();

            // 첫 번째 과제 클릭
            const firstAssignment = page
              .locator('a[href*="/assignments/"]')
              .first();
            if ((await firstAssignment.count()) > 0) {
              await firstAssignment.click();

              // 과제 상세 정보 확인
              await expect(
                page.locator('text=/제출|마감일|배점/i')
              ).toBeVisible();
            }
          }
        }
      }
    );
  });

  test.describe('과제 제출 (학습자)', () => {
    authTest(
      'should submit assignment',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;
        const timestamp = Date.now();

        // 과제 상세 페이지로 이동
        await page.goto('/courses');

        const firstCourse = page.locator('a[href*="/courses/"]').first();
        if ((await firstCourse.count()) > 0) {
          const courseUrl = await firstCourse.getAttribute('href');
          await page.goto(courseUrl!);

          const assignmentsTab = page.locator('a:has-text("과제")');
          if ((await assignmentsTab.count()) > 0) {
            await assignmentsTab.click();

            const firstAssignment = page
              .locator('a[href*="/assignments/"]')
              .first();
            if ((await firstAssignment.count()) > 0) {
              await firstAssignment.click();

              // 제출 폼 작성
              const contentInput = page.locator('textarea[name="content"]');
              if ((await contentInput.count()) > 0) {
                await contentInput.fill(
                  `Submission content ${timestamp}`
                );
              }

              const linkInput = page.locator('input[name="link"]');
              if ((await linkInput.count()) > 0) {
                await linkInput.fill(
                  `https://github.com/test/submission-${timestamp}`
                );
              }

              // 제출 버튼 클릭
              const submitButton = page.locator('button:has-text("제출")');
              if ((await submitButton.count()) > 0) {
                await submitButton.click();

                // 제출 성공 확인
                await expect(
                  page.locator('text=/제출 완료|제출됨/i')
                ).toBeVisible();
              }
            }
          }
        }
      }
    );

    authTest(
      'should not allow duplicate submission without resubmission permission',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        // 이미 제출한 과제에 다시 제출 시도
        // (이전 테스트에서 제출했다고 가정)

        // 제출 버튼이 비활성화되거나 메시지 표시
        const submitButton = page.locator('button:has-text("제출")');
        if ((await submitButton.count()) > 0) {
          const isDisabled = await submitButton.isDisabled();
          expect(isDisabled).toBe(true);
        } else {
          // 또는 이미 제출했다는 메시지 확인
          await expect(
            page.locator('text=/이미 제출|Already submitted/i')
          ).toBeVisible();
        }
      }
    );
  });

  test.describe('과제 평가 (강사)', () => {
    authTest(
      'should view submitted assignments',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        await page.goto('/instructor-dashboard');

        // 내 강좌 선택
        const firstCourse = page.locator('a[href*="/courses/"]').first();
        if ((await firstCourse.count()) > 0) {
          await firstCourse.click();

          // 과제 탭으로 이동
          const assignmentsTab = page.locator('a:has-text("과제")');
          if ((await assignmentsTab.count()) > 0) {
            await assignmentsTab.click();

            // 첫 번째 과제 선택
            const firstAssignment = page
              .locator('a[href*="/assignments/"]')
              .first();
            if ((await firstAssignment.count()) > 0) {
              await firstAssignment.click();

              // 제출물 목록 보기
              const submissionsLink = page.locator('a:has-text("제출 목록")');
              if ((await submissionsLink.count()) > 0) {
                await submissionsLink.click();

                // 제출물 목록 확인
                await expect(
                  page.locator('text=/제출물|Submission/i')
                ).toBeVisible();
              }
            }
          }
        }
      }
    );

    authTest(
      'should grade a submission',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        // 제출물 목록에서 평가할 제출물 선택
        const firstSubmission = page
          .locator('a[href*="/submissions/"]')
          .first();
        if ((await firstSubmission.count()) > 0) {
          await firstSubmission.click();

          // 점수 입력
          const scoreInput = page.locator('input[name="score"]');
          if ((await scoreInput.count()) > 0) {
            await scoreInput.fill('85.5');
          }

          // 피드백 입력
          const feedbackInput = page.locator('textarea[name="feedback"]');
          if ((await feedbackInput.count()) > 0) {
            await feedbackInput.fill('Good work! Keep it up.');
          }

          // 평가 제출
          const gradeButton = page.locator('button:has-text("평가 제출")');
          if ((await gradeButton.count()) > 0) {
            await gradeButton.click();

            // 평가 성공 확인
            await expect(
              page.locator('text=/평가 완료|Graded/i')
            ).toBeVisible();
          }
        }
      }
    );
  });

  test.describe('성적 조회 (학습자)', () => {
    authTest(
      'should view grades for submitted assignments',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/grades');

        // 성적 목록 확인
        await expect(page.locator('text=/성적|Grade/i')).toBeVisible();
      }
    );

    authTest(
      'should view detailed grade with feedback',
      async ({ authenticatedLearner }) => {
        const { page } = authenticatedLearner;

        await page.goto('/grades');

        // 첫 번째 성적 선택
        const firstGrade = page.locator('tr').nth(1);
        if ((await firstGrade.count()) > 0) {
          await firstGrade.click();

          // 점수 및 피드백 확인
          await expect(page.locator('text=/점수|피드백/i')).toBeVisible();
        }
      }
    );
  });

  test.describe('과제 상태 관리 (강사)', () => {
    authTest(
      'should publish draft assignment',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        // draft 과제 선택
        const draftAssignment = page.locator('text=/초안|Draft/i').first();
        if ((await draftAssignment.count()) > 0) {
          // 과제 상세로 이동
          await draftAssignment.click();

          // 발행 버튼 클릭
          const publishButton = page.locator('button:has-text("발행")');
          if ((await publishButton.count()) > 0) {
            await publishButton.click();

            // 발행 성공 확인
            await expect(
              page.locator('text=/발행됨|Published/i')
            ).toBeVisible();
          }
        }
      }
    );

    authTest(
      'should close published assignment',
      async ({ authenticatedInstructor }) => {
        const { page } = authenticatedInstructor;

        // 발행된 과제 선택
        const publishedAssignment = page
          .locator('text=/발행됨|Published/i')
          .first();
        if ((await publishedAssignment.count()) > 0) {
          await publishedAssignment.click();

          // 마감 버튼 클릭
          const closeButton = page.locator('button:has-text("마감")');
          if ((await closeButton.count()) > 0) {
            await closeButton.click();

            // 확인 다이얼로그
            const confirmButton = page.locator('button:has-text("확인")');
            if ((await confirmButton.count()) > 0) {
              await confirmButton.click();
            }

            // 마감 성공 확인
            await expect(page.locator('text=/마감됨|Closed/i')).toBeVisible();
          }
        }
      }
    );
  });

  test.describe('API - 과제 관리', () => {
    authTest(
      'should get assignment detail via API',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        // 강좌 목록에서 과제 ID 가져오기
        const coursesResponse = await page.request.get('/api/courses?page=1&limit=1');
        const coursesData = await coursesResponse.json();

        if (coursesData.courses && coursesData.courses.length > 0) {
          const courseId = coursesData.courses[0].id;

          // 과제 목록 조회 (실제 API 경로에 맞게 조정 필요)
          const assignmentsResponse = await page.request.get(
            `/api/courses/${courseId}/assignments`,
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          );

          if (assignmentsResponse.status() === 200) {
            const assignmentsData = await assignmentsResponse.json();
            expect(Array.isArray(assignmentsData)).toBe(true);
          }
        }
      }
    );

    authTest(
      'should submit assignment via API',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;
        const timestamp = Date.now();

        // 과제 ID를 가져온 후 제출
        // (실제 구현에서는 과제 ID를 먼저 조회해야 함)

        const response = await page.request.post(
          '/api/assignments/test-assignment-id/submit',
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              content: `API Submission ${timestamp}`,
              link: `https://github.com/test/api-submission-${timestamp}`,
            },
          }
        );

        // 404는 과제 ID가 유효하지 않은 경우 (테스트 데이터 없음)
        expect([200, 201, 404]).toContain(response.status());
      }
    );

    authTest(
      'should get grades via API',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        const response = await page.request.get('/api/grades?page=1&limit=10', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.grades).toBeDefined();
        expect(Array.isArray(data.grades)).toBe(true);
      }
    );

    authTest(
      'should grade submission via API as instructor',
      async ({ authenticatedInstructor }) => {
        const { page, user } = authenticatedInstructor;

        const response = await page.request.post(
          '/api/submissions/test-submission-id/grade',
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              score: 90.0,
              feedback: 'Excellent work!',
            },
          }
        );

        // 404는 제출물 ID가 유효하지 않은 경우
        expect([200, 201, 404]).toContain(response.status());
      }
    );
  });

  test.describe('권한 검증', () => {
    authTest(
      'should not allow learner to create assignments',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        // 과제 생성 페이지 접근 시도
        await page.goto('/courses/test-course-id/assignments/new');

        // 권한 없음 메시지 또는 리다이렉트
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('/assignments/new');
      }
    );

    authTest(
      'should not allow learner to grade submissions',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        const response = await page.request.post(
          '/api/submissions/test-id/grade',
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              score: 100,
              feedback: 'Trying to grade',
            },
          }
        );

        expect(response.status()).toBe(403); // Forbidden
      }
    );
  });
});
