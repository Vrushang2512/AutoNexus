import { test, expect } from '@playwright/test';

test('check if Envizom login page loads', async ({ page }) => {
  // Step 1: Just navigate to the page
  console.log('Navigating to Envizom...');
  await page.goto('https://envizom.oizom.com', { timeout: 30000 });
  
  // Step 2: Take a screenshot to see what loaded
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('Screenshot saved as debug-screenshot.png');

  // Step 3: Print the page title
  const title = await page.title();
  console.log('Page title:', title);

  // Step 4: Print the current URL
  console.log('Current URL:', page.url());

  // Step 5: Wait a bit for Angular to render
  await page.waitForTimeout(5000);

  // Step 6: Check what's on the page
  const bodyText = await page.locator('body').innerText();
  console.log('Page text (first 500 chars):', bodyText.substring(0, 500));

  // Step 7: Take another screenshot after waiting
  await page.screenshot({ path: 'debug-screenshot-after-wait.png', fullPage: true });
  console.log('Second screenshot saved');

  // Step 8: Check if our selectors exist
  const emailField = page.locator('input[formcontrolname="emailId"]');
  const emailCount = await emailField.count();
  console.log('Email fields found:', emailCount);

  const passwordField = page.locator('input[formcontrolname="password"]');
  const passwordCount = await passwordField.count();
  console.log('Password fields found:', passwordCount);

  const loginButton = page.locator('button:has-text("LOG IN")');
  const buttonCount = await loginButton.count();
  console.log('Login buttons found:', buttonCount);

  const welcomeHeading = page.locator('h3');
  const headingCount = await welcomeHeading.count();
  console.log('H3 headings found:', headingCount);
  if (headingCount > 0) {
    const headingText = await welcomeHeading.first().innerText();
    console.log('First H3 text:', headingText);
  }

  // This test always passes — it's just for diagnostics
  expect(true).toBe(true);
});
