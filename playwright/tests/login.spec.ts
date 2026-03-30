import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { config, validateCredentials } from '../utils/config';

test.describe('Envizom Login — UI Rendering', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('should display login page with all elements', async () => {
    await loginPage.expectPageLoaded();
    await expect(loginPage.logo).toBeVisible();
    await expect(loginPage.termsCheckbox).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('should show "Welcome Back!" heading', async () => {
    await expect(loginPage.welcomeHeading).toHaveText('Welcome Back!');
  });

  test('should show correct subtitle text', async () => {
    await expect(loginPage.subtitle).toHaveText('Log In to your account to continue');
  });

  test('should have email field with correct placeholder', async () => {
    await expect(loginPage.emailInput).toHaveAttribute('placeholder', 'Email ID');
  });

  test('should have password field with correct placeholder', async () => {
    await expect(loginPage.passwordInput).toHaveAttribute('placeholder', 'Password');
  });
});


test.describe('Envizom Login — Button State', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('login button should be disabled when form is empty', async () => {
    await loginPage.expectLoginButtonDisabled();
  });

  test('login button should be disabled with only email filled', async () => {
    await loginPage.fillEmail('test@example.com');
    await loginPage.expectLoginButtonDisabled();
  });

  test('login button should be disabled with only password filled', async () => {
    await loginPage.fillPassword('somepassword');
    await loginPage.expectLoginButtonDisabled();
  });

  test('login button should be disabled without accepting terms', async () => {
    await loginPage.fillEmail('test@example.com');
    await loginPage.fillPassword('somepassword');
    await loginPage.expectLoginButtonDisabled();
  });

  test('login button should become enabled when form is fully valid', async () => {
    await loginPage.fillEmail('test@example.com');
    await loginPage.fillPassword('somepassword');
    await loginPage.acceptTerms();
    await loginPage.expectLoginButtonEnabled();
  });
});


test.describe('Envizom Login — Form Validation', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('should show email validation error for invalid email format', async () => {
    await loginPage.fillEmail('invalid-email');
    await loginPage.passwordInput.click();
    await loginPage.expectEmailError();
  });

  test('should show required error when email is cleared', async () => {
    await loginPage.fillEmail('test@example.com');
    await loginPage.emailInput.clear();
    await loginPage.passwordInput.click();
    await loginPage.expectEmailError();
  });

  test('should show required error when password is cleared', async () => {
    await loginPage.fillPassword('somepassword');
    await loginPage.passwordInput.clear();
    await loginPage.emailInput.click();
    await loginPage.expectPasswordError();
  });
});


test.describe('Envizom Login — Password Toggle', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('password should be hidden by default', async () => {
    await loginPage.fillPassword('secret123');
    await loginPage.expectPasswordHidden();
  });

  test('should show password when eye icon is clicked', async () => {
    await loginPage.fillPassword('secret123');
    await loginPage.togglePasswordVisibility();
    await loginPage.expectPasswordVisible();
  });

  test('should hide password again on second click', async () => {
    await loginPage.fillPassword('secret123');
    await loginPage.togglePasswordVisibility();
    await loginPage.expectPasswordVisible();
    await loginPage.togglePasswordVisibility();
    await loginPage.expectPasswordHidden();
  });
});


test.describe('Envizom Login — Terms & Conditions', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('terms checkbox should be unchecked by default', async () => {
    await expect(loginPage.termsCheckboxInput).not.toBeChecked();
  });

  test('should check terms when clicked', async () => {
    await loginPage.acceptTerms();
    await expect(loginPage.termsCheckboxInput).toBeChecked();
  });

  test('should uncheck terms on second click', async () => {
    await loginPage.acceptTerms();
    await expect(loginPage.termsCheckboxInput).toBeChecked();
    await loginPage.acceptTerms();
    await expect(loginPage.termsCheckboxInput).not.toBeChecked();
  });
});


test.describe('Envizom Login — Successful Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('should login and redirect to dashboard with valid credentials', async () => {
    validateCredentials();
    await loginPage.login(config.email, config.password);
    await expect(loginPage.page).toHaveURL(/dashboard/);
  });

  test('should call POST /users/login/v2 API on login', async ({ page }) => {
    validateCredentials();

    // Intercept the login API call
    const loginApiPromise = page.waitForResponse(
      (response) => response.url().includes('/users/login/v2') && response.request().method() === 'POST'
    );

    await loginPage.login(config.email, config.password);

    const loginResponse = await loginApiPromise;
    expect(loginResponse.status()).toBe(200);
  });

  test('login API should return a valid token', async ({ page }) => {
    validateCredentials();

    const loginApiPromise = page.waitForResponse(
      (response) => response.url().includes('/users/login/v2')
    );

    await loginPage.login(config.email, config.password);

    const loginResponse = await loginApiPromise;
    const body = await loginResponse.json();
    expect(body).toBeTruthy();

    // Check that some form of token is returned
    const hasToken = body.token || body.accessToken || body.access_token;
    expect(hasToken, 'Login response should contain a token').toBeTruthy();
  });

  test('login API should respond within 5 seconds', async ({ page }) => {
    validateCredentials();

    const startTime = Date.now();
    const loginApiPromise = page.waitForResponse(
      (response) => response.url().includes('/users/login/v2')
    );

    await loginPage.login(config.email, config.password);

    await loginApiPromise;
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(5000);
  });
});


test.describe('Envizom Login — Failed Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('should show error for completely wrong credentials', async ({ page }) => {
    await loginPage.fillEmail('wrong@email.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.acceptTerms();
    await loginPage.clickLogin();

    const errorMessage = page.locator(
      'mat-snack-bar-container, .error-message, .toast-error, snack-bar-container, .mat-mdc-snack-bar-container'
    );
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should show error for valid email but wrong password', async () => {
    validateCredentials();

    await loginPage.fillEmail(config.email);
    await loginPage.fillPassword('wrongpassword123!');
    await loginPage.acceptTerms();
    await loginPage.clickLogin();

    const errorMessage = loginPage.page.locator(
      'mat-snack-bar-container, .error-message, .toast-error, .mat-mdc-snack-bar-container'
    );
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should stay on login page after failed login', async () => {
    await loginPage.fillEmail('wrong@email.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.acceptTerms();
    await loginPage.clickLogin();

    // Wait a moment for any redirect attempt
    await loginPage.page.waitForTimeout(3000);

    // Should still be on login page, NOT redirected
    await expect(loginPage.welcomeHeading).toBeVisible();
  });

  test('login API should return non-200 for wrong credentials', async ({ page }) => {
    const loginApiPromise = page.waitForResponse(
      (response) => response.url().includes('/users/login/v2')
    );

    await loginPage.fillEmail('wrong@email.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.acceptTerms();
    await loginPage.clickLogin();

    const loginResponse = await loginApiPromise;
    expect(loginResponse.status()).not.toBe(200);
  });
});


test.describe('Envizom Login — Forgot Password', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('forgot password link should be visible', async () => {
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('should trigger forgot password flow on click', async ({ page }) => {
    await loginPage.clickForgotPassword();

    // Wait for either: a new page/dialog, or the login form to change
    await page.waitForTimeout(2000);

    // Check if a dialog appeared or the form changed
    const dialogOrNewForm = page.locator(
      'mat-dialog-container, .forgot-password-form, input[placeholder*="email" i]'
    );
    const urlChanged = !page.url().endsWith('/') && !page.url().includes('login');

    // At least one of these should be true
    const hasChange = (await dialogOrNewForm.count()) > 0 || urlChanged;
    expect(hasChange, 'Forgot password should trigger a visible change').toBeTruthy();
  });
});
