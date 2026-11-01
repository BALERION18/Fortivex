# FORTIVEX — GitHub Intelligence & Security Cockpit

An evidence-based, zero-execution security and intelligence dashboard for GitHub repositories.

FORTIVEX inspects repositories using recursive Git trees and in-memory static analysis to detect exposed credentials, map architectural routes, and evaluate project health without ever cloning or executing untrusted code on your host.

---

## Key Features

- **Zero-Execution Code Analysis**: Evaluates repository file hierarchies and manifests via the GitHub API without running untrusted scripts.
- **Dual-Mode Secret Scanner**: Identifies 30+ credential types using regex signatures and Shannon entropy thresholds to minimize false positives.
- **Architectural Discovery**: Detects framework routes (Express, FastAPI) and data models from syntax without speculation.
- **Setup Doctor**: Evaluates configuration hygiene against automated tests, CI workflows, dependency lockfiles, licenses, and environment templates.
- **Continuous Integration Telemetry**: Analyzes workflow run history and build pass/fail rates.
- **Sanitized PDF Audit Export**: Generates executive reports with a fail-closed binary buffer audit to prevent secret leakage.

---

## Architecture

FORTIVEX is structured as a monorepo:

- `backend/`: Node.js Express API providing GitHub proxying, code intelligence, secret scanning, and PDF generation.
- `frontend/`: React 18 single-page application built with Vite and Tailwind CSS.
- `.github/workflows/ci.yml`: Automated CI pipeline running linting, tests, production builds, and container verification.
- `docker-compose.yml`: Multi-container orchestration with dependency healthchecks.

---

## Quick Start

### 1. Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 10 or higher
- **Docker & Docker Compose** (optional, for containerized run)

### 2. Environment Configuration

Copy the example environment template:

```bash
cp .env.example .env
```

Edit `.env` to configure your settings (see `.env.example` for reference).

### 3. Local Installation & Development

Install monorepo dependencies:

```bash
npm install
npm run dev
```

The frontend will be accessible at `http://localhost:5173` and the backend API at `http://localhost:5000`.

### 4. Running via Docker Compose

To build and start both the backend and frontend containers with automated health checks:

```bash
docker compose up --build
```

The application will be served at `http://localhost:3000`.

---

## Automated Testing

Run the comprehensive test suite across both frontend and backend:

```bash
npm test
```

Or run tests individually:

```bash
npm run test:backend
npm run test:frontend
```

---

## Production Build

To build the frontend production distribution:

```bash
npm run build:frontend
```

To run the production backend service:

```bash
npm run start:backend
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
