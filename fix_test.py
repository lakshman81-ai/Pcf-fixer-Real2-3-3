with open('playwright-check.spec.cjs', 'r') as f:
    c = f.read()
c = c.replace("await page.locator('select')", "await page.locator('select.h-7')")
with open('playwright-check.spec.cjs', 'w') as f:
    f.write(c)
