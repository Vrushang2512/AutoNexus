# AutoNexus

Test automation platform for [Envizom](https://envizom.oizom.com) — Oizom's environmental monitoring software.

## What's Inside

### 1. AutoNexus Dashboard (`/dashboard`)
A web-based test console with a prompt interface. Type `do login` and it runs **9 live API tests** against Envizom's backend, then displays all devices in the account.

**Features:**
- Prompt-driven command interface
- Login API validation (status, token, userId, response time)
- Negative tests (wrong password, empty email)
- Overview API fetch with device discovery
- Devices table with search, filter (online/offline), and status indicators

**Commands:**
| Command | Action |
|---------|--------|
| `do login` | Run all login tests + fetch devices |
| `clear` | Reset results |
| `help` | Show commands |

### 2. Playwright Tests (`/playwright`)
28 automated browser tests covering the entire Envizom login page using Playwright + TypeScript.

**Test Suites:**
| Suite | Tests | Coverage |
|-------|-------|----------|
| UI Rendering | 5 | Headings, placeholders, element visibility |
| Button State | 5 | Disabled/enabled based on form validity |
| Form Validation | 3 | Email format, required field errors |
| Password Toggle | 3 | Show/hide password via eye icon |
| Terms & Conditions | 3 | Checkbox check/uncheck |
| Successful Auth | 4 | Login, redirect, API 200, token, speed |
| Failed Auth | 4 | Error messages, wrong credentials |
| Forgot Password | 2 | Link visibility, triggers flow |

## Quick Start

### Playwright Tests
```bash
cd playwright
npm install
npx playwright install
cp .env.example .env          # Add your credentials
npm test                      # Run all 28 tests
npm run test:headed           # Watch tests in browser
npm run test:debug            # Step-through debug mode
```

### AutoNexus Dashboard
The `dashboard/autonexus.jsx` is a React component. You can run it in any React environment or use it as a Claude Artifact.

## Project Structure

```
AutoNexus/
├── README.md
├── .gitignore
│
├── dashboard/
│   └── autonexus.jsx              # Web-based test console (React)
│
└── playwright/
    ├── package.json               # Dependencies & scripts
    ├── playwright.config.ts       # Browser & SPA settings
    ├── .env.example               # Credential template
    │
    ├── pages/
    │   └── LoginPage.ts           # Page Object (Angular Material selectors)
    │
    ├── tests/
    │   └── login.spec.ts          # 28 test cases, 8 suites
    │
    └── utils/
        └── config.ts              # .env loader & validator
```

## API Endpoints Tested

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users/login/v2` | POST | Authentication |
| `/users/{id}/overview/v2` | GET | User profile, devices, modules |
| `/devices/data` | GET | Latest sensor readings |

## Tech Stack

- **Test Framework:** Playwright + TypeScript
- **Target App:** Angular 16+ with Angular Material
- **Dashboard:** React (JSX)
- **CI/CD Ready:** GitHub Actions compatible

## Roadmap

- [x] Login page automation
- [x] Login API validation
- [x] Device discovery
- [ ] Dashboard tests
- [ ] Reports & download tests
- [ ] Analytics & heatmap tests
- [ ] Data equivalence (API vs UI)
- [ ] Visual regression testing
- [ ] CI/CD pipeline (GitHub Actions)

## Author

Built for Envizom by [Vrushang2512](https://github.com/Vrushang2512)
