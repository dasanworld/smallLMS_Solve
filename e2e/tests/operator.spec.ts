import { test, expect } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';

/**
 * 운영자 관련 E2E 테스트
 * - 카테고리 관리, 난이도 관리, 신고 처리
 */

test.describe('Operator Management', () => {
  test.describe('카테고리 관리', () => {
    authTest(
      'should view categories list',
      async ({ authenticatedOperator }) => {
        const { page } = authenticatedOperator;

        // 운영자 대시보드 또는 카테고리 관리 페이지로 이동
        await page.goto('/operator-dashboard');

        const categoriesLink = page.locator('a:has-text("카테고리")');
        if ((await categoriesLink.count()) > 0) {
          await categoriesLink.click();

          // 카테고리 목록 확인
          await expect(page.locator('text=/카테고리|Category/i')).toBeVisible();
        }
      }
    );

    authTest(
      'should create new category',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;
        const timestamp = Date.now();

        const response = await page.request.post('/api/metadata/categories', {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            name: `Test Category ${timestamp}`,
            description: 'Test category description',
          },
        });

        expect(response.status()).toBe(201);

        const data = await response.json();
        expect(data.category).toBeDefined();
        expect(data.category.name).toBe(`Test Category ${timestamp}`);
      }
    );

    authTest(
      'should update existing category',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;

        // 먼저 카테고리 생성
        const timestamp = Date.now();
        const createResponse = await page.request.post(
          '/api/metadata/categories',
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              name: `Category to Update ${timestamp}`,
              description: 'Original description',
            },
          }
        );

        const createData = await createResponse.json();
        const categoryId = createData.category.id;

        // 카테고리 수정
        const updateResponse = await page.request.put(
          `/api/metadata/categories/${categoryId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              name: `Updated Category ${timestamp}`,
              description: 'Updated description',
            },
          }
        );

        expect(updateResponse.status()).toBe(200);

        const updateData = await updateResponse.json();
        expect(updateData.category.name).toBe(`Updated Category ${timestamp}`);
      }
    );

    authTest(
      'should delete category',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;

        // 먼저 카테고리 생성
        const timestamp = Date.now();
        const createResponse = await page.request.post(
          '/api/metadata/categories',
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              name: `Category to Delete ${timestamp}`,
              description: 'Will be deleted',
            },
          }
        );

        const createData = await createResponse.json();
        const categoryId = createData.category.id;

        // 카테고리 삭제
        const deleteResponse = await page.request.delete(
          `/api/metadata/categories/${categoryId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        expect(deleteResponse.status()).toBe(200);
      }
    );

    authTest(
      'should toggle category active status',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;

        // 카테고리 생성
        const timestamp = Date.now();
        const createResponse = await page.request.post(
          '/api/metadata/categories',
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              name: `Category Active Test ${timestamp}`,
              description: 'Testing active status',
            },
          }
        );

        const createData = await createResponse.json();
        const categoryId = createData.category.id;

        // 비활성화
        const updateResponse = await page.request.put(
          `/api/metadata/categories/${categoryId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              is_active: false,
            },
          }
        );

        expect(updateResponse.status()).toBe(200);

        const updateData = await updateResponse.json();
        expect(updateData.category.is_active).toBe(false);
      }
    );
  });

  test.describe('난이도 관리', () => {
    authTest(
      'should view difficulties list',
      async ({ authenticatedOperator }) => {
        const { page } = authenticatedOperator;

        await page.goto('/operator-dashboard');

        const difficultiesLink = page.locator('a:has-text("난이도")');
        if ((await difficultiesLink.count()) > 0) {
          await difficultiesLink.click();

          // 난이도 목록 확인
          await expect(page.locator('text=/난이도|Difficulty/i')).toBeVisible();
        }
      }
    );

    authTest(
      'should create new difficulty',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;
        const timestamp = Date.now();

        const response = await page.request.post('/api/metadata/difficulties', {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            name: `Test Difficulty ${timestamp}`,
            description: 'Test difficulty description',
            sort_order: 99,
          },
        });

        expect(response.status()).toBe(201);

        const data = await response.json();
        expect(data.difficulty).toBeDefined();
        expect(data.difficulty.name).toBe(`Test Difficulty ${timestamp}`);
      }
    );

    authTest(
      'should update difficulty with sort order',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;
        const timestamp = Date.now();

        // 난이도 생성
        const createResponse = await page.request.post(
          '/api/metadata/difficulties',
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              name: `Difficulty Sort Test ${timestamp}`,
              description: 'Test',
              sort_order: 10,
            },
          }
        );

        const createData = await createResponse.json();
        const difficultyId = createData.difficulty.id;

        // 정렬 순서 변경
        const updateResponse = await page.request.put(
          `/api/metadata/difficulties/${difficultyId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              sort_order: 5,
            },
          }
        );

        expect(updateResponse.status()).toBe(200);

        const updateData = await updateResponse.json();
        expect(updateData.difficulty.sort_order).toBe(5);
      }
    );

    authTest(
      'should delete difficulty',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;
        const timestamp = Date.now();

        // 난이도 생성
        const createResponse = await page.request.post(
          '/api/metadata/difficulties',
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            data: {
              name: `Difficulty to Delete ${timestamp}`,
              description: 'Will be deleted',
              sort_order: 99,
            },
          }
        );

        const createData = await createResponse.json();
        const difficultyId = createData.difficulty.id;

        // 삭제
        const deleteResponse = await page.request.delete(
          `/api/metadata/difficulties/${difficultyId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        expect(deleteResponse.status()).toBe(200);
      }
    );
  });

  test.describe('신고 관리', () => {
    authTest(
      'should view reports list',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;

        const response = await page.request.get('/api/reports?page=1&limit=10', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.reports).toBeDefined();
        expect(Array.isArray(data.reports)).toBe(true);
      }
    );

    authTest(
      'should view report detail',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;

        // 신고 목록 조회
        const listResponse = await page.request.get('/api/reports?page=1&limit=1', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const listData = await listResponse.json();

        if (listData.reports && listData.reports.length > 0) {
          const reportId = listData.reports[0].id;

          // 신고 상세 조회
          const detailResponse = await page.request.get(`/api/reports/${reportId}`, {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });

          expect(detailResponse.status()).toBe(200);

          const detailData = await detailResponse.json();
          expect(detailData.report).toBeDefined();
        }
      }
    );

    authTest(
      'should update report status',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;

        // 신고 목록에서 첫 번째 신고 가져오기
        const listResponse = await page.request.get('/api/reports?page=1&limit=1', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const listData = await listResponse.json();

        if (listData.reports && listData.reports.length > 0) {
          const reportId = listData.reports[0].id;

          // 신고 상태 변경
          const updateResponse = await page.request.patch(
            `/api/reports/${reportId}/status`,
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
              },
              data: {
                status: 'investigating',
              },
            }
          );

          expect(updateResponse.status()).toBe(200);

          const updateData = await updateResponse.json();
          expect(updateData.report.status).toBe('investigating');
        }
      }
    );

    authTest(
      'should process report action',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;

        // 신고 목록 조회
        const listResponse = await page.request.get('/api/reports?page=1&limit=1', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const listData = await listResponse.json();

        if (listData.reports && listData.reports.length > 0) {
          const reportId = listData.reports[0].id;

          // 신고 처리
          const actionResponse = await page.request.post(
            `/api/reports/${reportId}/action`,
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
              },
              data: {
                action: 'warning',
                note: 'User has been warned',
              },
            }
          );

          expect([200, 201]).toContain(actionResponse.status());
        }
      }
    );

    authTest(
      'should resolve report',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;

        const listResponse = await page.request.get('/api/reports?page=1&limit=1', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const listData = await listResponse.json();

        if (listData.reports && listData.reports.length > 0) {
          const reportId = listData.reports[0].id;

          // 신고 해결
          const resolveResponse = await page.request.patch(
            `/api/reports/${reportId}/status`,
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
              },
              data: {
                status: 'resolved',
              },
            }
          );

          expect(resolveResponse.status()).toBe(200);

          const resolveData = await resolveResponse.json();
          expect(resolveData.report.status).toBe('resolved');
        }
      }
    );

    authTest(
      'should filter reports by status',
      async ({ authenticatedOperator }) => {
        const { page, user } = authenticatedOperator;

        const response = await page.request.get(
          '/api/reports?page=1&limit=10&status=received',
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.reports).toBeDefined();
      }
    );
  });

  test.describe('메타데이터 조회 (공개)', () => {
    test('should get active categories and difficulties', async ({ page }) => {
      const response = await page.request.get('/api/metadata/active');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.categories).toBeDefined();
      expect(Array.isArray(data.categories)).toBe(true);
      expect(data.difficulties).toBeDefined();
      expect(Array.isArray(data.difficulties)).toBe(true);
    });

    test('should only return active categories', async ({ page }) => {
      const response = await page.request.get('/api/metadata/active');
      const data = await response.json();

      // 모든 카테고리가 활성화 상태인지 확인
      if (data.categories && data.categories.length > 0) {
        data.categories.forEach((category: any) => {
          expect(category.is_active).toBe(true);
        });
      }
    });

    test('should only return active difficulties', async ({ page }) => {
      const response = await page.request.get('/api/metadata/active');
      const data = await response.json();

      // 모든 난이도가 활성화 상태인지 확인
      if (data.difficulties && data.difficulties.length > 0) {
        data.difficulties.forEach((difficulty: any) => {
          expect(difficulty.is_active).toBe(true);
        });
      }
    });
  });

  test.describe('권한 검증', () => {
    authTest(
      'should not allow learner to manage categories',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        const response = await page.request.post('/api/metadata/categories', {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            name: 'Unauthorized Category',
            description: 'Should fail',
          },
        });

        expect(response.status()).toBe(403); // Forbidden
      }
    );

    authTest(
      'should not allow instructor to manage categories',
      async ({ authenticatedInstructor }) => {
        const { page, user } = authenticatedInstructor;

        const response = await page.request.post('/api/metadata/categories', {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            name: 'Unauthorized Category',
            description: 'Should fail',
          },
        });

        expect(response.status()).toBe(403); // Forbidden
      }
    );

    authTest(
      'should not allow learner to view reports',
      async ({ authenticatedLearner }) => {
        const { page, user } = authenticatedLearner;

        const response = await page.request.get('/api/reports', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        expect(response.status()).toBe(403); // Forbidden
      }
    );

    authTest(
      'should not allow instructor to manage reports',
      async ({ authenticatedInstructor }) => {
        const { page, user } = authenticatedInstructor;

        const response = await page.request.get('/api/reports', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        expect(response.status()).toBe(403); // Forbidden
      }
    );
  });

  test.describe('운영자 대시보드', () => {
    authTest(
      'should display operator dashboard',
      async ({ authenticatedOperator }) => {
        const { page } = authenticatedOperator;

        await page.goto('/operator-dashboard');

        // 운영자 대시보드 확인
        await expect(
          page.locator('text=/운영자|Operator|관리/i')
        ).toBeVisible();
      }
    );

    authTest(
      'should show system statistics',
      async ({ authenticatedOperator }) => {
        const { page } = authenticatedOperator;

        await page.goto('/operator-dashboard');

        // 시스템 통계 확인 (사용자 수, 강좌 수, 신고 수 등)
        const statsSection = page.locator('text=/통계|사용자|강좌|신고/i');
        if ((await statsSection.count()) > 0) {
          await expect(statsSection.first()).toBeVisible();
        }
      }
    );

    authTest(
      'should navigate to metadata management',
      async ({ authenticatedOperator }) => {
        const { page } = authenticatedOperator;

        await page.goto('/operator-dashboard');

        // 카테고리 관리 링크
        const categoriesLink = page.locator('a:has-text("카테고리")');
        if ((await categoriesLink.count()) > 0) {
          await categoriesLink.click();
          await page.waitForTimeout(500);
        }
      }
    );

    authTest(
      'should navigate to reports management',
      async ({ authenticatedOperator }) => {
        const { page } = authenticatedOperator;

        await page.goto('/operator-dashboard');

        // 신고 관리 링크
        const reportsLink = page.locator('a:has-text("신고")');
        if ((await reportsLink.count()) > 0) {
          await reportsLink.click();
          await page.waitForTimeout(500);
        }
      }
    );
  });
});
