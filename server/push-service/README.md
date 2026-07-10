# Whiskey Vault — Push Service

Zero-dependency Node service that stores devices' Expo push tokens and fans out
remote notifications (price-drop / new-release alerts) through the Expo Push API.

## Run

```bash
ADMIN_TOKEN=change-me node index.js       # :8789, in-memory
ADMIN_TOKEN=change-me TOKENS_FILE=./tokens.jsonl node index.js
node test.js
```

## Endpoints

### `POST /v1/push/register`
`{ "token": "ExponentPushToken[...]", "anonId": "anon-..." }` → `{ "ok": true }`
The app calls this after `notifications.registerForPushToken()` returns a token
(only in an EAS build on a real device).

### `POST /v1/push/send`  *(requires `x-admin-token: <ADMIN_TOKEN>`)*
`{ "title": "...", "body": "...", "data": {...}, "tokens": ["..."] }`
Omit `tokens` to broadcast to every registered device. Returns
`{ "sent", "invalid", "tickets" }` (tickets are the Expo receipts). Chunked to
100 messages/request per Expo's limit. The admin token prevents open-relay abuse.

### `GET /health` → `{ "ok": true, "tokens": <count> }`

## How it fits

1. App (EAS build) mints a token via `registerForPushToken()` and POSTs it to
   `/v1/push/register`.
2. A scheduled job or operator calls `/v1/push/send` — e.g. when the release
   calendar updates or a watched bottle drops in price.
3. Expo delivers to iOS/Android.

Requires an EAS build with push credentials (`eas credentials`) — remote push
does not work in Expo Go. Swap the in-memory map for a real datastore and add
receipt-checking (`/getReceipts`) to prune expired tokens in production.
