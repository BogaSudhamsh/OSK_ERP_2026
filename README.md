
# OSK Granite ERP 2026

Frontend ERP application for OSK Granite built with Vite, React, and TypeScript.

## Requirements

- Node.js 20+
- npm 10+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set the values you want to use.

3. Start the development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` starts the Vite development server
- `npm run dev:api` starts the standalone Gemini proxy server
- `npm run build` builds the production bundle
- `npm run typecheck` runs the TypeScript checker

## Backend Status

- The previous Firebase integration and seed/setup files have been removed.
- `src/app/services/firebase.ts` is now a disconnected compatibility stub.
- The Gemini proxy is available through `server/gemini-proxy.mjs` for local/server-side use.

## Gemini

- Set `GEMINI_API_KEY` in `.env` for local development.
- Use `npm run dev:api` if you want to run the proxy separately from the frontend dev server.
  