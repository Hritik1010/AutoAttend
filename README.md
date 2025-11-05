## AutoAttend

This app was created using https://getmocha.com.
Need help or want to join the community? Join our [Discord](https://discord.gg/shDEGBSe2d).

### Local Development

1) Install dependencies
```
npm install
```

2) Apply local D1 migrations (first time or after schema changes)
```
npx wrangler d1 migrations apply 019a4ead-1cfb-71c4-914c-dc2317d59ceb --local
```

3) Configure local env for the Worker (optional but required for login)

Create a `.dev.vars` file in the project root (already scaffolded) and set:
```
MOCHA_USERS_SERVICE_API_URL=<your-mocha-users-service-url>
MOCHA_USERS_SERVICE_API_KEY=<your-api-key>
```

4) Start the dev server (Vite + Cloudflare Worker)
```
npm run dev
```

- App: http://localhost:5173/ (or the next available port)
- API is served from the same origin under `/api/*` by the Worker

### Notes

- If login shows "Unauthorized" or the console logs an OAuth error, you need to provide the
	`MOCHA_USERS_SERVICE_API_URL` and `MOCHA_USERS_SERVICE_API_KEY` values in `.dev.vars`.
- The Worker uses a local D1 database. Ensure migrations are applied before hitting data endpoints.
