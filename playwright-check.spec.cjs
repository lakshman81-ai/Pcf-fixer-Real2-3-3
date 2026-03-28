const { test, expect } = require('@playwright/test');

test('Check Draw Canvas button', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // In the App.jsx we saw "3D Topology New" button
  // <button onClick={() => setActiveTab('canvas')}
  const tabs = await page.locator('button');
  for (let i = 0; i < await tabs.count(); i++) {
     const text = await tabs.nth(i).textContent();
     if (text && text.includes('3D Topology')) {
        await tabs.nth(i).click();
        break;
     }
  }

  await page.waitForTimeout(2000);

  // The Draw Canvas button is labeled 'Draw Canvas' in the toolbar ribbon
  // Try to click it directly
  const buttons = await page.locator('button');
  for (let i = 0; i < await buttons.count(); i++) {
     const text = await buttons.nth(i).textContent();
     if (text && text.includes('Draw Canvas')) {
        await buttons.nth(i).click();
        break;
     }
  }

  await page.waitForTimeout(2000);

  // Take a screenshot to verify it opened
  await page.screenshot({ path: 'playwright-drawcanvas.png' });
});
