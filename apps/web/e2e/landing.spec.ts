import { test, expect } from '@playwright/test';

test.describe('Landing & auth', () => {
  test('landing page renders hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('MetroAI')).toBeVisible();
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('link', { name: '가입하기' })).toBeVisible();
  });

  test('login form requires fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await page.getByLabel('이메일').fill('not-an-email');
    await page.getByLabel('비밀번호').fill('x');
    // HTML5 email validation should prevent submission with an invalid email.
    const button = page.getByRole('button', { name: '로그인' });
    await button.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('register page renders all required fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: '사업장 가입' })).toBeVisible();
    await expect(page.getByLabel('사업장 이름')).toBeVisible();
    await expect(page.getByLabel('이메일')).toBeVisible();
    await expect(page.getByLabel(/휴대폰/)).toBeVisible();
    await expect(page.getByLabel(/비밀번호/)).toBeVisible();
  });
});
