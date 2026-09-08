# EV Assistant Service — REST API Reference

EV runs as a small HTTP service (FastAPI) on port **8200**.

| Context        | Base URL                 |
| -------------- | ------------------------ |
| Host (Windows) | `http://localhost:8200`  |
| Docker         | `http://ev-service:8200` |

Start it with:

```powershell
python -m server.app        # or run_server.bat
docker compose up -d        # containerised
```

---

## Endpoints

| Method | Path                                        | Purpose                                         |
| ------ | ------------------------------------------- | ----------------------------------------------- |
| `GET`  | `/health`                                   | Liveness check (no model load)                  |
| `POST` | `/chat`                                     | One-shot: full reply in a single JSON body      |
| `POST` | `/chat/stream`                              | SSE streaming (POST variant)                    |
| `GET`  | `/chat/stream?text=...&conversation_id=...` | SSE streaming, EventSource-friendly             |
| `POST` | `/chat/{conversation_id}/confirm`           | Commit/cancel a pending write                   |
| `POST` | `/reset/{conversation_id}`                  | Clear LLM history + pending write for a session |

---

## `GET /health`

Response `200`:

```json
{
  "status": "ok",
  "timestamp": "2026-09-06 15:02:14"
}
```

Does not load the LLM — useful for container healthchecks.

---

## `POST /chat`

### Request

```json
{
  "text": "any recommendations?",
  "conversation_id": "abc123"
}
```

| Field             | Type   | Notes                                                                                                     |
| ----------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `text`            | string | Required, 1–4000 chars                                                                                    |
| `conversation_id` | string | Optional, defaults to `"default"`, max 128 chars. Isolates LLM history + pending writes per conversation. |

### Response `200` — normal reply

```json
{
  "reply": "We have a few budget categories getting close to their limits...",
  "pending_write": null
}
```

### Response `200` — write needs confirmation

EV never mutates FinTrack data without confirmation. Instead of executing, it
returns the parsed intent as `pending_write`:

```json
{
  "reply": "I understood: add expense of $50 for groceries to Checking. Is that correct, and should I do it?",
  "pending_write": {
    "id": "16bdeed9-7081-40fb-98f6-ae5ef2d31ed1",
    "action": "finance_create_expense",
    "echo": "add expense of $50 for groceries to Checking",
    "text": "add expense of 50 for groceries"
  }
}
```

`pending_write` fields:

| Field    | Type   | Notes                                          |
| -------- | ------ | ---------------------------------------------- |
| `id`     | string | UUID of the pending write (used by `/confirm`) |
| `action` | string | Identifier of the write action                 |
| `echo`   | string | Human-readable summary of what EV parsed       |
| `text`   | string | Original user text that triggered it           |

To execute, confirm (next chat turn `"yes"`/`"no"` on the same
`conversation_id`, or `POST /chat/{id}/confirm`).

---

## `GET /chat/stream` / `POST /chat/stream` (SSE)

Streams the reply **token-by-token as it is generated** — the client renders a
live response instead of waiting for the full text.

**GET** (EventSource-compatible):

```
GET /chat/stream?text=hello&conversation_id=abc123
```

**POST** (for long messages / custom headers):

```
POST /chat/stream
Content-Type: application/json

{"text": "hello", "conversation_id": "abc123"}
```

Response is `text/event-stream`. Each event is a `data: <json>` line terminated
by a blank line:

```jsonc
// type = "token" — one chunk as it is generated
data: {"type":"token","text":"We"}
data: {"type":"token","text":" have"}
data: {"type":"token","text":" a"}
...

// type = "reply" — canonical full reply, plus any pending confirm
data: {"type":"reply","text":"We have a few budget categories that are getting close to their limits...","pending_write":null}

// writes: pending_write is populated + the prompt is the reply
data: {"type":"reply","text":"I understood: add expense of $50 for groceries to Checking. Is that correct, and should I do it?","pending_write":{"id":"…","action":"finance_create_expense","echo":"add expense of $50 for groceries to Checking","text":"add expense of 50 for groceries"}}

// type = "error" — the turn failed (e.g. FinTrack auth)
data: {"type":"error","text":"FinTrack authentication failed — refresh the token"}

// type = "done" — stream finished, close the connection
data: {"type":"done","done":true}
```

Event `type` values:

| Type    | Payload                 | Meaning                                                       |
| ------- | ----------------------- | ------------------------------------------------------------- |
| `token` | `text`                  | Append this chunk to the visible reply                        |
| `reply` | `text`, `pending_write` | Final canonical reply; may carry a confirmation prompt        |
| `error` | `text`                  | Failure (no `reply`/`done` will follow after the error event) |
| `done`  | —                       | Stream complete; close the connection                         |

The stream is held open for the duration of generation; tokens are flushed as
soon as the model produces them (first-token latency is a few tokens, not the
full response time).

---

## `POST /chat/{conversation_id}/confirm`

Commits or cancels the pending write for a conversation.

### Request

```json
{ "accepted": true }
```

### Response `200`

```json
{ "reply": "Done — I added the expense.", "pending_write": null }
```

Cancelled (`"accepted": false`):

```json
{ "reply": "Okay, cancelling that.", "pending_write": null }
```

### Response `404`

```json
{ "detail": "No pending action for this conversation" }
```

Equivalent to sending `"yes"` / `"no"` as the next `/chat` (or `/chat/stream`)
turn on the same `conversation_id`.

---

## `POST /reset/{conversation_id}`

Clears the LLM conversation history and any pending write for the session.

### Response `200`

```json
{ "status": "ok" }
```

---

## Example flows

### 1. Plain conversation (recommendation read)

```powershell
# one-shot
curl.exe -X POST http://localhost:8200/chat -H "Content-Type: application/json" `
  -d '{"text":"any recommendations?","conversation_id":"demo"}'

# streaming — tokens arrive incrementally
curl.exe -N "http://localhost:8200/chat/stream?text=hello&conversation_id=demo"
```

### 2. Confirmed write

```powershell
# 1. intent -> pending_write
curl.exe -X POST http://localhost:8200/chat -H "Content-Type: application/json" `
  -d '{"text":"add expense of 50 for groceries","conversation_id":"demo"}'

# 2a. confirm via chat turn
curl.exe -X POST http://localhost:8200/chat -H "Content-Type: application/json" `
  -d '{"text":"yes","conversation_id":"demo"}'

# 2b. or confirm explicitly
curl.exe -X POST http://localhost:8200/chat/demo/confirm -H "Content-Type: application/json" `
  -d '{"accepted":true}'
```

---

## Notes

- **Concurrency:** the service serialises model inference with a single global
  lock (llama.cpp runs one generation at a time). A stream holds the lock until
  its `done` event.
- **FinTrack auth:** read/writes to FinTrack use the stored Cloudflare Access
  JWT (`fintrack_token.json`). A stale token produces `type:"error"` /
  `pending_write: null` with "FinTrack authentication failed — refresh the token".
  Refresh with `python scripts/set_fintrack_token.py <jwt>`.
- **Server-safe only:** on the chat/service channel EV only runs
  `server_safe` actions (finance, reads); local computer-control actions (music,
  windows, apps) stay confined to the local voice app.
