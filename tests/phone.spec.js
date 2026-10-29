const { test, expect, devices } = require('@playwright/test');

test.use({ ...devices['Pixel 5'] });

test('phone fallback: look-around, Cardboard split screen, and exit work without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/');
  await page.getByRole('button', { name: 'Look around (phone)' }).click();
  await expect(page.getByRole('button', { name: 'Cardboard' })).toBeVisible();

  // Simulate the phone being held up, then turned
  for (const alpha of [0, 40]) {
    await page.evaluate((a) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: a, beta: 90, gamma: 0 })), alpha);
    await page.waitForTimeout(200);
  }

  await page.getByRole('button', { name: 'Cardboard' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Exit' }).click();
  await expect(page.getByRole('button', { name: 'Look around (phone)' })).toBeVisible();
  expect(errors).toEqual([]);
});
