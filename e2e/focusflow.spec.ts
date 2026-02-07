import { test, expect } from '@playwright/test';

test.describe('FocusFlow E2E', () => {
  test('landing page loads with FocusFlow title', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1')).toContainText('FocusFlow');
  });

  test('focus score display is visible', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Focus score should be rendered
    await expect(page.getByText('Focus Score')).toBeVisible();
  });

  test('start session button works', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const startBtn = page.getByRole('button', { name: /start/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();
    // After clicking start, should show end button
    await expect(page.getByRole('button', { name: /end/i })).toBeVisible();
  });

  test('session timer increments', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /start/i }).click();
    // Wait for timer to tick
    await page.waitForTimeout(3000);
    const timeText = await page.getByText('Session Time').locator('..').textContent();
    expect(timeText).toBeTruthy();
  });

  test('privacy notice is visible', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.getByText(/not recording/i)).toBeVisible();
  });

  test('end session returns to start state', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /end/i }).click();
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });

  test('backend health check responds', async ({ request }) => {
    const res = await request.get('http://localhost:3001/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
