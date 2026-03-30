# AutoNexus

Test automation for [Envizom](https://envizom.oizom.com) — runs a real browser, logs into the platform, captures all API calls, and generates a devices report.

## The 8-Step Test

| Step | What it does |
|------|-------------|
| 1 | Opens `envizom.oizom.com` in a real browser, verifies the login page loads |
| 2 | Types the email into the email field |
| 3 | Types the password into the password field |
| 4 | Clicks the Terms & Conditions checkbox |
| 5 | Clicks the LOG IN button, waits for redirect to dashboard |
| 6 | Intercepts all API calls to `envdevapi.oizom.com` (login, overview, devices) |
| 7 | Records every API — method, endpoint, status — saves to `captured-apis.json` |
| 8 | Extracts devices from API responses, generates an HTML report with the devices table |

## Quick Start

```bash
cd playwright
npm install
npx playwright install
cp .env.example .env     # Add your credentials
npm test                 # Run the 8-step test
```

## Output

After the test runs, you get:

- `test-results/devices-report.html` — Full HTML report with API table + devices table
- `test-results/captured-apis.json` — Raw API responses
- Console output with step-by-step logs and ASCII tables

## GitHub Actions

Tests run automatically on every push. Add these secrets in **Settings → Secrets → Actions**:

| Secret | Value |
|--------|-------|
| `ENVIZOM_BASE_URL` | `https://envizom.oizom.com` |
| `ENVIZOM_EMAIL` | your login email |
| `ENVIZOM_PASSWORD` | your login password |

After the workflow runs, download the **devices-report** artifact from the Actions tab.

## Project Structure

```
AutoNexus/
├── .github/workflows/
│   └── login-tests.yml         # GitHub Actions workflow
├── playwright/
│   ├── tests/
│   │   └── login-flow.spec.ts  # The 8-step test
│   ├── playwright.config.ts
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

Built by [Vrushang2512](https://github.com/Vrushang2512)
