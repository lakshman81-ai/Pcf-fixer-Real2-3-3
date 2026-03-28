const { test, expect } = require('@playwright/test');

test('Check Rendering After CA Fix', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await page.waitForTimeout(2000);
  await page.click('text=3D Topology');
  await page.waitForTimeout(1000);

  // Click VIEW tab to expose the select dropdown
  await page.click('button:has-text("VIEW")');
  await page.waitForTimeout(500);

  const select = await page.locator('select.h-7');

  await select.selectOption({ label: 'By Type' });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'playwright-toolbar4.png' });
});
