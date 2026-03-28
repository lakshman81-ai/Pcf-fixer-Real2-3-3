const { test, expect } = require('@playwright/test');

test('Check Rendering After CA Fix', async ({ page }) => {
  await page.goto('http://localhost:5173');

  await page.waitForTimeout(2000);

  // Try to click either "3D Topology" or "3D Topology New"
  try {
    await page.click('text=3D Topology New', { timeout: 2000 });
  } catch(e) {
    try {
      await page.click('text=3D Topology', { timeout: 2000 });
    } catch(e) {}
  }

  await page.waitForTimeout(1000);

  // The new UI uses the Ribbon Toolbar for View settings
  try {
    await page.click('button:has-text("VIEW")', { timeout: 2000 });
    await page.waitForTimeout(500);

    // Look for the color select combobox
    const selects = page.locator('select');
    if (await selects.count() > 0) {
      // Find the one that has "By Type" or similar
      const select = selects.filter({ hasText: 'By Type' });
      if (await select.count() > 0) {
         await select.first().selectOption({ label: 'By Spool' }); // Just select something else to verify it works
      }
    }
  } catch(e) {}

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'playwright-toolbar4.png' });
});
