import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // ── Form fields (using formcontrolname — stable in Angular) ──
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly termsCheckbox: Locator;
  readonly termsCheckboxInput: Locator;
  readonly loginButton: Locator;

  // ── Other interactive elements ──
  readonly forgotPasswordLink: Locator;
  readonly passwordToggle: Locator;

  // ── Visual elements ──
  readonly logo: Locator;
  readonly welcomeHeading: Locator;
  readonly subtitle: Locator;

  // ── Validation errors ──
  readonly emailError: Locator;
  readonly passwordError: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form fields
    this.emailInput = page.locator('input[formcontrolname="emailId"]');
    this.passwordInput = page.locator('input[formcontrolname="password"]');
    this.termsCheckbox = page.locator('mat-checkbox[formcontrolname="termsAndConditions"]');
    this.termsCheckboxInput = page.locator('#mat-mdc-checkbox-1-input');
    this.loginButton = page.locator('button:has-text("LOG IN")');

    // Interactive elements
    this.forgotPasswordLink = page.locator('p:has-text("Forgot Password?")');
    this.passwordToggle = page.locator(
      'mat-icon:has-text("visibility_off"), mat-icon:has-text("visibility")'
    );

    // Visual elements
    this.logo = page.locator('img.logo');
    this.welcomeHeading = page.locator('h3:has-text("Welcome Back!")');
    this.subtitle = page.locator('span:has-text("Log In to your account to continue")');

    // Validation errors (Angular Material error hints)
    this.emailError = page.locator(
      'mat-form-field:has(input[formcontrolname="emailId"]) mat-error'
    );
    this.passwordError = page.locator(
      'mat-form-field:has(input[formcontrolname="password"]) mat-error'
    );
  }

  // ── Actions ──

  async navigate() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async fillEmail(email: string) {
    await this.emailInput.click();
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.click();
    await this.passwordInput.fill(password);
  }

  async acceptTerms() {
    await this.termsCheckbox.click();
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async togglePasswordVisibility() {
    await this.passwordToggle.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.acceptTerms();
    await expect(this.loginButton).toBeEnabled({ timeout: 5000 });
    await this.clickLogin();
    await this.page.waitForURL('**/dashboard/**', { timeout: 30000 });
  }

  // ── Assertions ──

  async expectPageLoaded() {
    await expect(this.welcomeHeading).toBeVisible();
    await expect(this.subtitle).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectLoginButtonDisabled() {
    await expect(this.loginButton).toBeDisabled();
  }

  async expectLoginButtonEnabled() {
    await expect(this.loginButton).toBeEnabled();
  }

  async expectEmailError() {
    await expect(this.emailError).toBeVisible();
  }

  async expectPasswordError() {
    await expect(this.passwordError).toBeVisible();
  }

  async expectPasswordHidden() {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  async expectPasswordVisible() {
    await expect(this.passwordInput).toHaveAttribute('type', 'text');
  }
}
