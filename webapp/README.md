# AutoNexus

Test automation for [Envizom](https://envizom.oizom.com) — two ways to run: a **web dashboard** you open in your browser, or **Playwright** running in GitHub Actions.

## Option 1: Web Dashboard (Recommended)

A webpage where you enter email/password, type `do login`, and see all results live.

```bash
cd webapp
npm install
npm start
```

Open **http://localhost:3000** → enter credentials → type `do login`

## Option 2: Playwright in GitHub Actions

Runs a real browser in the cloud on every push.

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
├── webapp/                         # Web Dashboard
│   ├── server.js                   # Express server (proxies API calls)
│   ├── public/
│   │   └── index.html              # Frontend with prompt, steps, device table
│   └── package.json
│
├── playwright/                     # GitHub Actions tests
│   ├── tests/
│   │   └── login-flow.spec.ts      # 8-step Playwright test
│   ├── playwright.config.ts
│   ├── package.json
│   └── .env.example
│
├── .github/workflows/
│   └── login-tests.yml             # GitHub Actions workflow
├── .gitignore
└── README.md
```

Built by [Vrushang2512](https://github.com/Vrushang2512)
