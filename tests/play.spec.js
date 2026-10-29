const { test, expect, devices } = require('@playwright/test');

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

const position = (page) => page.evaluate(() => ({ x: __game.human.position.x, z: __game.human.position.z }));

test('PC: WASD moves the blue-haired character, who stays on stage', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Play as blue hair' }).click();
  await expect(page.getByRole('button', { name: 'Exit' })).toBeVisible();

  const start = await position(page);
  await page.keyboard.down('KeyW'); // forward = toward the crowd (+z)
  await expect.poll(async () => (await position(page)).z, { timeout: 30000 }).toBeGreaterThan(start.z + 0.5);
  await page.keyboard.up('KeyW');

  // Walk well past the stage edge: the player must be stopped by the bounds
  await page.keyboard.down('KeyW');
  await expect.poll(async () => (await position(page)).z, { timeout: 45000 }).toBeGreaterThan(-9.8);
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyW');
  expect((await position(page)).z).toBeLessThanOrEqual(-9.5);

  await page.getByRole('button', { name: 'Exit' }).click();
  await expect(page.getByRole('button', { name: 'Play as blue hair' })).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('phone', () => {
  const { defaultBrowserType, ...pixel } = devices['Pixel 5']; // browser type can't change inside a describe group
  test.use(pixel);

  test('joystick moves the character', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Play as blue hair' }).click();

    const start = await position(page);
    // Push the stick all the way up (forward), using synthetic pointer events on the joystick
    await page.evaluate(() => {
      const stick = document.querySelector('div[style*="border-radius: 50%"]');
      const r = stick.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const fire = (type, target, cy) => target.dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: x, clientY: cy, bubbles: true }));
      fire('pointerdown', stick, y);
      fire('pointermove', stick, y - 60);
    });
    await expect.poll(async () => (await position(page)).z, { timeout: 45000 }).toBeGreaterThan(start.z + 0.5);
    expect(errors).toEqual([]);
  });
});
