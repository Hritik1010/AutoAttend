## AutoAttend

### Local Development

1. Install dependencies
```
npm install
```

2. Apply D1 migrations (run `--local` when developing locally, omit it to target the remote database)
```
npx wrangler d1 migrations apply autoattend-db --local
```

3. Configure authentication (optional)

The Worker ships with a built-in admin account (`Admin` / `Pass@123`) and does **not** require any external Mocha services or API keys. If you choose to override credentials or add other settings, place them in `.dev.vars` and read them inside the Worker.

4. Start the dev server (Vite + Cloudflare Worker)
```
npm run dev
```

### ESP32 Integration

The ESP32 scanner posts detections directly to the Worker API.

- Endpoint: `POST /api/esp32/detect`
- Content-Type: `application/json`
- Body:

```
// Check-in (default)
{
	"hex_value": "<ASCII-HEX of employee identifier>"
}

// Explicit checkout
{
	"hex_value": "<ASCII-HEX of employee identifier>",
	"action": "checkout"
}
```

Notes:
- `action` is optional and defaults to `checkin` if omitted.
- The server dedupes repeating events of the same type within 60 seconds and returns `{ success: true, deduped: true }`.
- Stats consider someone “present” if they have a check-in with no later checkout on the same day.

### Environment Notes

- No third-party auth secrets are required out of the box.
- If you introduce additional configuration (e.g., custom credentials, OTA signing keys), add them to `.dev.vars` for local dev and `wrangler secret put` when deploying.
