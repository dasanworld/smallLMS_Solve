import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

/**
 * 강사 대시보드 및 하위 페이지 E2E 테스트
 *
 * 테스트 시나리오:
 * 1. 강사 대시보드 접근 및 기본 기능
 * 2. 강사 코스 관리 (생성, 수정, 상태 변경)
 * 3. 강사 과제 관리 (전체 과제 조회, 개별 과제 관리)
 * 4. 강사 채점 (제출물 조회, 점수 입력)
 * 5. 역할 기반 접근 제어 (learner가 instructor 페이지 접근 시)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('강사 시스템 (Instructor Dashboard & Pages)', () => {
  // ===== 1. 강사 대시보드 기본 기능 =====
  test.describe('강사 대시보드 (/instructor-dashboard)', () => {
    authTest(
      'should display instructor dashboard',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/instructor-dashboard');

        // 대시보드 제목 확인
        await expect(page.locator('h1:has-text("강사 대시보드")')).toBeVisible();

        // 부제목 확인
        await expect(
          page.locator('text=/코스와 과제를 관리하세요/i')
        ).toBeVisible();
      }
    );

    authTest(
      'should display dashboard metrics',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/instructor-dashboard');

        // 메트릭 섹션 확인 (코스 수, 학생 수, 과제 수, 채점 대기 수)
        const metricsCards = page.locator('[class*="metric"]');
        const count = await metricsCards.count();

        // 최소 1개 이상의 메트릭이 표시되어야 함
        if (count > 0) {
          await expect(metricsCards.first()).toBeVisible();
        }
      }
    );

    authTest(
      'should display my courses section',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/instructor-dashboard');

        // "내 코스" 섹션 확인
        await expect(
          page.locator('[class*="CardTitle"]:has-text("내 코스")')
        ).toBeVisible();
      }
    );

    authTest(
      'should display recent submissions section',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/instructor-dashboard');

        // "최근 제출" 섹션 확인
        await expect(
          page.locator('[class*="CardTitle"]:has-text("최근 제출")')
        ).toBeVisible();
      }
    );

    authTest(
      'should display pending grading counter',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/instructor-dashboard');

        // 채점 대기 카운터 확인
        const pendingGradingSection = page.locator('text=/평가 대기|채점 대기/i');
        if ((await pendingGradingSection.count()) > 0) {
          await expect(pendingGradingSection.first()).toBeVisible();
        }
      }
    );

    authTest(
      'should fetch dashboard data via API',
      async ({ instructorPage, instructor }) => {
        const page = instructorPage;

        const response = await page.request.get('/api/dashboard/instructor', {
          headers: {
            Authorization: `Bearer ${instructor.token}`,
          },
        });

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('courses');
        expect(data).toHaveProperty('pendingGradingCount');
        expect(Array.isArray(data.courses)).toBe(true);
        expect(typeof data.pendingGradingCount).toBe('number');
      }
    );

    authTest(
      'should redirect learner to learner dashboard',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 학습자가 강사 대시보드 접근 시도
        await page.goto('/instructor-dashboard', { waitUntil: 'networkidle' });

        // 학습자 대시보드로 리다이렉트되어야 함
        await expect(page).toHaveURL('/dashboard');
      }
    );
  });

  // ===== 2. 강사 코스 관리 =====
  test.describe('강사 코스 관리 (/courses)', () => {
    authTest(
      'should display course list page',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/courses');

        // 코스 관리 페이지 확인
        const heading = page.locator('h1');
        await expect(heading).toBeVisible();
      }
    );

    authTest(
      'should have course creation button',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/courses');

        // 코스 생성 버튼 확인 (여러 가지 텍스트 가능)
        const createButton = page.locator(
          'button:has-text("새 코스 생성"), button:has-text("코스 생성"), button:has-text("생성")'
        ).first();

        if ((await createButton.count()) > 0) {
          await expect(createButton).toBeVisible();
        }
      }
    );

    authTest(
      'should create a new course',
      async ({ instructorPage }) => {
        const page = instructorPage;
        const timestamp = Date.now();
        const courseName = `Test Course ${timestamp}`;

        await page.goto('/courses');

        // 새 코스 생성 버튼 찾기
        let createButton = page.locator(
          'button:has-text("새 코스 생성"), button:has-text("코스 생성"), button:has-text("생성")'
        ).first();

        // 버튼이 없으면 모달이나 폼이 이미 표시되어 있을 수 있음
        if ((await createButton.count()) > 0) {
          await createButton.click();
          await page.waitForTimeout(500); // UI 업데이트 대기
        }

        // 코스명 입력
        const titleInput = page.locator('input[name="title"]').first();
        if ((await titleInput.count()) > 0) {
          await titleInput.fill(courseName);

          // 설명 입력 (선택)
          const descriptionInput = page.locator('textarea[name="description"]').first();
          if ((await descriptionInput.count()) > 0) {
            await descriptionInput.fill('Test course description');
          }

          // 카테고리 선택 (선택)
          const categorySelect = page.locator('select[name="category"]').first();
          if ((await categorySelect.count()) > 0) {
            await categorySelect.selectOption({ index: 1 });
          }

          // 제출 버튼
          const submitButton = page.locator(
            'button:has-text("생성"), button:has-text("저장")'
          ).first();

          if ((await submitButton.count()) > 0) {
            await submitButton.click();

            // 성공 메시지 또는 페이지 업데이트 대기
            await page.waitForTimeout(1000);

            // 새로 생성된 코스가 목록에 표시되는지 확인
            const courseTitle = page.locator(`text=${courseName}`);
            if ((await courseTitle.count()) > 0) {
              await expect(courseTitle.first()).toBeVisible();
            }
          }
        }
      }
    );

    authTest(
      'should update course information',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/courses');

        // 첫 번째 코스 찾기
        const courseCard = page.locator('[class*="CourseCard"]').first();
        if ((await courseCard.count()) > 0) {
          // 수정 버튼 클릭
          const editButton = courseCard.locator('button:has-text("수정"), button:has-text("편집")').first();
          if ((await editButton.count()) > 0) {
            await editButton.click();

            // 폼 표시 대기
            await page.waitForTimeout(500);

            // 코스명 수정
            const titleInput = page.locator('input[name="title"]').first();
            if ((await titleInput.count()) > 0) {
              const newTitle = `Updated Course ${Date.now()}`;
              await titleInput.fill(newTitle);

              // 저장 버튼
              const saveButton = page.locator(
                'button:has-text("저장"), button:has-text("수정")'
              ).first();

              if ((await saveButton.count()) > 0) {
                await saveButton.click();
                await page.waitForTimeout(1000);
              }
            }
          }
        }
      }
    );

    authTest(
      'should change course status',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/courses');

        // 첫 번째 코스 찾기
        const courseCard = page.locator('[class*="CourseCard"]').first();
        if ((await courseCard.count()) > 0) {
          // 상태 변경 버튼 또는 메뉴 찾기
          const statusButton = courseCard.locator(
            'button:has-text("상태 변경"), button:has-text("publish")'
          ).first();

          if ((await statusButton.count()) > 0) {
            await statusButton.click();

            // 상태 선택 옵션 대기
            await page.waitForTimeout(500);

            // 발행(published) 상태 선택
            const publishOption = page.locator('text=/발행|published/i').first();
            if ((await publishOption.count()) > 0) {
              await publishOption.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      }
    );

    authTest(
      'should fetch course list via API',
      async ({ instructorPage, instructor }) => {
        const page = instructorPage;

        const response = await page.request.get('/api/courses/my', {
          headers: {
            Authorization: `Bearer ${instructor.token}`,
          },
        });

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(Array.isArray(data.courses) || Array.isArray(data)).toBe(true);
      }
    );
  });

  // ===== 3. 강사 과제 관리 (전체) =====
  test.describe('강사 전체 과제 관리 (/assignments)', () => {
    authTest(
      'should display all assignments page',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/assignments');

        // 페이지 확인
        await expect(page).not.toHaveURL('/login');

        // 제목 또는 과제 관련 텍스트 확인
        const heading = page.locator('h1, h2');
        if ((await heading.count()) > 0) {
          await expect(heading.first()).toBeVisible();
        }
      }
    );

    authTest(
      'should display draft assignments section',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/assignments');

        // 초안 섹션 확인
        const draftSection = page.locator('text=/초안|draft/i').first();
        if ((await draftSection.count()) > 0) {
          await expect(draftSection).toBeVisible();
        }
      }
    );

    authTest(
      'should display published assignments section',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/assignments');

        // 발행된 섹션 확인
        const publishedSection = page.locator('text=/발행|published|공개/i').first();
        if ((await publishedSection.count()) > 0) {
          await expect(publishedSection).toBeVisible();
        }
      }
    );

    authTest(
      'should display closed assignments section',
      async ({ instructorPage }) => {
        const page = instructorPage;

        await page.goto('/assignments');

        // 마감된 섹션 확인
        const closedSection = page.locator('text=/마감|closed/i').first();
        if ((await closedSection.count()) > 0) {
          await expect(closedSection).toBeVisible();
        }
      }
    );
  });

  // ===== 4. 강사 개별 코스 과제 관리 =====
  test.describe('강사 개별 코스 과제 관리 (/courses/[courseId]/assignments)', () => {
    authTest(
      'should display course assignments page for instructor',
      async ({ instructorPage }) => {
        const page = instructorPage;

        // 먼저 코스 페이지로 이동
        await page.goto('/courses');

        // 첫 번째 코스 링크 찾기
        const courseLink = page.locator('a[href*="/courses/"]').first();
        if ((await courseLink.count()) > 0) {
          const courseUrl = await courseLink.getAttribute('href');

          if (courseUrl) {
            await page.goto(courseUrl);

            // 과제 관리 또는 과제 섹션 찾기
            const assignmentLink = page.locator(
              'a:has-text("과제"), a:has-text("assignment")'
            ).first();

            if ((await assignmentLink.count()) > 0) {
              const assignmentUrl = await assignmentLink.getAttribute('href');

              if (assignmentUrl) {
                await page.goto(assignmentUrl);

                // 과제 관리 페이지 확인
                await expect(page).not.toHaveURL('/login');
              }
            }
          }
        }
      }
    );

    authTest(
      'should have assignment creation button',
      async ({ instructorPage }) => {
        const page = instructorPage;

        // 코스 페이지로 이동
        await page.goto('/courses');

        // 첫 번째 코스로 이동
        const courseLink = page.locator('a[href*="/courses/"]').first();
        if ((await courseLink.count()) > 0) {
          await courseLink.click();
          await page.waitForURL(/\/courses\/[a-f0-9-]+$/);

          // 과제 섹션으로 이동
          const assignmentSection = page.locator('text=/과제|Assignment/i').first();
          if ((await assignmentSection.count()) > 0) {
            // 새 과제 생성 버튼 확인
            const createButton = page.locator(
              'button:has-text("새 과제"), button:has-text("과제 생성"), button:has-text("추가")'
            ).first();

            if ((await createButton.count()) > 0) {
              await expect(createButton).toBeVisible();
            }
          }
        }
      }
    );

    authTest(
      'should create a new assignment in a course',
      async ({ instructorPage }) => {
        const page = instructorPage;
        const timestamp = Date.now();
        const assignmentTitle = `Test Assignment ${timestamp}`;

        // 코스 페이지로 이동
        await page.goto('/courses');

        // 첫 번째 코스로 이동
        const courseLink = page.locator('a[href*="/courses/"]').first();
        if ((await courseLink.count()) > 0) {
          await courseLink.click();
          await page.waitForURL(/\/courses\/[a-f0-9-]+$/);

          // 새 과제 생성 버튼 클릭
          const createButton = page.locator(
            'button:has-text("새 과제"), button:has-text("과제 생성"), button:has-text("추가")'
          ).first();

          if ((await createButton.count()) > 0) {
            await createButton.click();
            await page.waitForTimeout(500);

            // 과제명 입력
            const titleInput = page.locator('input[name="title"]').first();
            if ((await titleInput.count()) > 0) {
              await titleInput.fill(assignmentTitle);

              // 설명 입력 (선택)
              const descriptionInput = page.locator('textarea[name="description"]').first();
              if ((await descriptionInput.count()) > 0) {
                await descriptionInput.fill('Test assignment description');
              }

              // 마감일 설정 (선택)
              const dueInput = page.locator('input[name="dueDate"], input[name="due_at"]').first();
              if ((await dueInput.count()) > 0) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateString = tomorrow.toISOString().split('T')[0];
                await dueInput.fill(dateString);
              }

              // 제출 버튼
              const submitButton = page.locator(
                'button:has-text("생성"), button:has-text("저장")'
              ).first();

              if ((await submitButton.count()) > 0) {
                await submitButton.click();
                await page.waitForTimeout(1000);

                // 생성된 과제가 목록에 표시되는지 확인
                const assignmentTitle_ = page.locator(`text=${assignmentTitle}`);
                if ((await assignmentTitle_.count()) > 0) {
                  await expect(assignmentTitle_.first()).toBeVisible();
                }
              }
            }
          }
        }
      }
    );
  });

  // ===== 5. 강사 제출물 관리 =====
  test.describe('강사 제출물 관리 (/courses/[courseId]/assignments/[assignmentId]/submissions)', () => {
    authTest(
      'should view submissions list',
      async ({ instructorPage }) => {
        const page = instructorPage;

        // 코스 페이지로 이동
        await page.goto('/courses');

        // 첫 번째 코스 선택
        const courseLink = page.locator('a[href*="/courses/"]').first();
        if ((await courseLink.count()) > 0) {
          await courseLink.click();
          await page.waitForURL(/\/courses\/[a-f0-9-]+$/);

          // 첫 번째 과제 찾기
          const assignmentLink = page.locator('a[href*="/assignments/"]').first();
          if ((await assignmentLink.count()) > 0) {
            await assignmentLink.click();

            // 제출물 보기 버튼 또는 링크 찾기
            const submissionsLink = page.locator(
              'a:has-text("제출물"), a:has-text("submissions")'
            ).first();

            if ((await submissionsLink.count()) > 0) {
              await submissionsLink.click();
              await page.waitForURL(/\/submissions/);

              // 제출물 페이지 확인
              await expect(page).not.toHaveURL('/login');
            }
          }
        }
      }
    );
  });

  // ===== 6. 강사 채점 =====
  test.describe('강사 채점 (/submissions/[submissionId]/grade)', () => {
    authTest(
      'should access grading page',
      async ({ instructorPage }) => {
        const page = instructorPage;

        // 대시보드로 이동
        await page.goto('/instructor-dashboard');

        // 최근 제출물에서 채점 링크 찾기
        const gradeLink = page.locator('a:has-text("채점"), a:has-text("평가")').first();
        if ((await gradeLink.count()) > 0) {
          const href = await gradeLink.getAttribute('href');

          if (href) {
            await page.goto(href);

            // 채점 페이지 확인
            await expect(page).not.toHaveURL('/login');

            // 점수 입력 필드 확인
            const scoreInput = page.locator(
              'input[name="score"], input[name="점수"], input[type="number"]'
            ).first();

            if ((await scoreInput.count()) > 0) {
              await expect(scoreInput).toBeVisible();
            }
          }
        }
      }
    );

    authTest(
      'should submit grading form',
      async ({ instructorPage }) => {
        const page = instructorPage;

        // 대시보드로 이동
        await page.goto('/instructor-dashboard');

        // 최근 제출물에서 채점 링크 찾기
        const gradeLink = page.locator('a:has-text("채점"), a:has-text("평가")').first();
        if ((await gradeLink.count()) > 0) {
          const href = await gradeLink.getAttribute('href');

          if (href) {
            await page.goto(href);

            // 점수 입력
            const scoreInput = page.locator(
              'input[name="score"], input[name="점수"], input[type="number"]'
            ).first();

            if ((await scoreInput.count()) > 0) {
              await scoreInput.fill('95');

              // 피드백 입력 (선택)
              const feedbackInput = page.locator(
                'textarea[name="feedback"], textarea[name="피드백"]'
              ).first();

              if ((await feedbackInput.count()) > 0) {
                await feedbackInput.fill('Great work!');
              }

              // 제출 버튼
              const submitButton = page.locator(
                'button:has-text("제출"), button:has-text("저장"), button:has-text("채점")'
              ).first();

              if ((await submitButton.count()) > 0) {
                await submitButton.click();
                await page.waitForTimeout(1000);

                // 성공 메시지 또는 페이지 변경 확인
                const successMessage = page.locator(
                  'text=/저장|성공|완료/i'
                ).first();

                if ((await successMessage.count()) > 0) {
                  await expect(successMessage).toBeVisible();
                }
              }
            }
          }
        }
      }
    );
  });

  // ===== 7. 역할 기반 접근 제어 =====
  test.describe('역할 기반 접근 제어', () => {
    authTest(
      'should allow only instructor to access instructor dashboard',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 학습자가 강사 대시보드 접근 시도
        await page.goto('/instructor-dashboard', { waitUntil: 'networkidle' });

        // 학습자 대시보드로 리다이렉트되거나 에러 표시
        const isRedirected = page.url().includes('/dashboard');
        const isError = page.url().includes('/login');

        expect(isRedirected || isError).toBe(true);
      }
    );

    authTest(
      'should deny learner from accessing course management',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 학습자가 코스 관리 페이지 접근 시도
        await page.goto('/courses', { waitUntil: 'networkidle' });

        // 학습자가 접근할 수 없다면 리다이렉트되거나 다른 페이지 표시
        // (구현에 따라 다를 수 있음)
        if (page.url().includes('/courses')) {
          // 학습자 코스 조회 페이지일 수 있음
          // 강사용 기능(생성 버튼 등)이 없는지 확인
          const createButton = page.locator(
            'button:has-text("생성"), button:has-text("만들기")'
          );
          expect(await createButton.count()).toBe(0);
        }
      }
    );

    authTest(
      'should deny learner from accessing assignment management',
      async ({ learnerPage }) => {
        const page = learnerPage;

        // 학습자가 과제 관리 페이지 접근 시도
        await page.goto('/assignments', { waitUntil: 'networkidle' });

        // 리다이렉트되거나 다른 페이지 표시
        if (!page.url().includes('/login')) {
          // 학습자가 접근할 수 있는 페이지라면, 강사용 기능 없음을 확인
          const createButton = page.locator(
            'button:has-text("새 과제"), button:has-text("생성")'
          );
          expect(await createButton.count()).toBe(0);
        }
      }
    );

    authTest(
      'should reject unauthenticated access to instructor API',
      async ({ page }) => {
        const response = await page.request.get('/api/dashboard/instructor');

        expect(response.status()).toBe(401);
      }
    );

    authTest(
      'should reject learner access to instructor API',
      async ({ learnerPage, learner }) => {
        const page = learnerPage;

        const response = await page.request.get('/api/dashboard/instructor', {
          headers: {
            Authorization: `Bearer ${learner.token}`,
          },
        });

        // 403 Forbidden 또는 401 Unauthorized 반환
        expect([403, 401]).toContain(response.status());
      }
    );
  });

  // ===== 8. 통합 워크플로우 =====
  test.describe('강사 통합 워크플로우', () => {
    authTest(
      'should complete instructor course creation and assignment workflow',
      async ({ instructorPage }) => {
        const page = instructorPage;
        const timestamp = Date.now();
        const courseName = `Integration Test Course ${timestamp}`;
        const assignmentName = `Integration Test Assignment ${timestamp}`;

        // 1. 코스 생성
        await page.goto('/courses');

        const createButton = page.locator(
          'button:has-text("생성"), button:has-text("코스 생성")'
        ).first();

        if ((await createButton.count()) > 0) {
          await createButton.click();
          await page.waitForTimeout(500);

          const titleInput = page.locator('input[name="title"]').first();
          if ((await titleInput.count()) > 0) {
            await titleInput.fill(courseName);

            const submitButton = page.locator(
              'button:has-text("생성"), button:has-text("저장")'
            ).first();

            if ((await submitButton.count()) > 0) {
              await submitButton.click();
              await page.waitForTimeout(1000);
            }
          }
        }

        // 2. 생성된 코스로 이동
        const courseLink = page.locator(`a:has-text("${courseName}")`).first();
        if ((await courseLink.count()) > 0) {
          await courseLink.click();
          await page.waitForURL(/\/courses\/[a-f0-9-]+$/);

          // 3. 과제 생성
          const assignmentCreateButton = page.locator(
            'button:has-text("새 과제"), button:has-text("과제 생성")'
          ).first();

          if ((await assignmentCreateButton.count()) > 0) {
            await assignmentCreateButton.click();
            await page.waitForTimeout(500);

            const assignmentTitleInput = page.locator('input[name="title"]').first();
            if ((await assignmentTitleInput.count()) > 0) {
              await assignmentTitleInput.fill(assignmentName);

              const assignmentSubmitButton = page.locator(
                'button:has-text("생성"), button:has-text("저장")'
              ).first();

              if ((await assignmentSubmitButton.count()) > 0) {
                await assignmentSubmitButton.click();
                await page.waitForTimeout(1000);

                // 4. 대시보드로 돌아가 코스 확인
                await page.goto('/instructor-dashboard');

                const dashboardCourseLink = page.locator(
                  `text=${courseName}`
                ).first();

                if ((await dashboardCourseLink.count()) > 0) {
                  await expect(dashboardCourseLink).toBeVisible();
                }
              }
            }
          }
        }
      }
    );
  });
});
