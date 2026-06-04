# WA Notify — API Documentation

## Overview

WA Notify exposes a public HTTP API for sending WhatsApp messages. All send requests are **fire-and-forget**: the server enqueues the message and returns immediately without waiting for WhatsApp delivery. Delivery status is reported asynchronously via webhook callbacks.

---

## Authentication

All public API requests require a secret key, provided via:

| Method | Example |
|--------|---------|
| Header | `x-secret-key: YOUR_SECRET` |
| Body field | `"secret": "YOUR_SECRET"` |

The secret key is the **Application Public Secret**, found in Application → Settings.

---

## Endpoints

### 1. Send Message — Application (Load Balanced)

Selects an available enabled client automatically. Retries with another client if one fails. Skips clients currently in cooldown.

```
POST /public/wa/v1/applications/{applicationId}/send
```

**Headers**

```
Content-Type: application/json
x-secret-key: {Application Public Secret}
```

**Request Body**

```json
{
  "phone": "081266235940",
  "message": "Hello World",
  "priority": "low",
  "mediaUrl": "https://example.com/image.jpg",
  "mediaType": "image",
  "caption": "Optional caption",
  "filename": "document.pdf"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | Yes* | Recipient phone number. Accepts `08xx`, `628xx`, or `+628xx`. *Either `phone` or `jid` required, not both |
| `jid` | string | Yes* | Raw WhatsApp JID (e.g. `628xx@s.whatsapp.net`). Use instead of `phone` for group or non-phone JIDs |
| `message` | string | Yes* | Message text. *Required if `mediaUrl` is not provided |
| `priority` | string | No | `low` (default), `medium`, or `high` |
| `mediaUrl` | string | No | Publicly accessible URL of the media file to send |
| `mediaType` | string | No | `image`, `video`, `audio`, `ptt` (voice note), or `document`. Defaults to `image` |
| `caption` | string | No | Caption text shown below image or video. If omitted, `message` is used as caption |
| `filename` | string | No | Filename shown for document attachments (e.g. `report.pdf`) |

**Sending text only**
```json
{ "phone": "081266235940", "message": "Hello!" }
```

**Sending image with caption**
```json
{ "phone": "081266235940", "mediaUrl": "https://example.com/promo.jpg", "mediaType": "image", "caption": "Promo hari ini!" }
```

**Sending PDF document**
```json
{ "phone": "081266235940", "mediaUrl": "https://example.com/invoice.pdf", "mediaType": "document", "filename": "invoice.pdf" }
```

**Sending voice note**
```json
{ "phone": "081266235940", "mediaUrl": "https://example.com/audio.ogg", "mediaType": "ptt" }
```

**Response — Success (200)**

```json
{
  "ok": true,
  "usedClient": "747ce81b-fa42-45de-8fe4-2de621472c49",
  "id": "cmnjp91qv000dkn48rf15suyr",
  "messageUuid": "af127b25-4ef2-45db-93fa-50d54425fa5d"
}
```

| Field | Description |
|-------|-------------|
| `id` | Internal message tracking ID |
| `messageUuid` | Unique message identifier — use this to correlate webhook status callbacks |
| `usedClient` | ID of the client that was selected |

**Response — Error (400)**

```json
{
  "ok": false,
  "error": "Phone number is not registered on WhatsApp",
  "attempts": [{ "clientId": "...", "ok": false, "code": "recipient_not_found" }],
  "id": "cmnjp..."
}
```

**Response — Error (503)**

```json
{
  "ok": false,
  "error": "all clients are in cooldown",
  "id": "cmnjp..."
}
```

---

## Webhooks

### Per-Message Callback (`callbackUrl`)

If `callbackUrl` was provided in the send request, WA Notify will POST to it whenever the message status changes.

**Payload**

```json
{
  "event": "status_update",
  "id": "cmnjp91qv000dkn48rf15suyr",
  "messageUuid": "af127b25-4ef2-45db-93fa-50d54425fa5d",
  "status": "delivered",
  "to": "6281266235940",
  "timestamp": 1700000000000
}
```

| Field | Description |
|-------|-------------|
| `id` | Internal message tracking ID |
| `messageUuid` | Matches `messageUuid` from the send response |
| `status` | Current delivery status (see table below) |

| `status` | Meaning |
|----------|---------|
| `pending` | Enqueued, not yet sent to WhatsApp |
| `sent` | Accepted by WhatsApp server |
| `delivered` | Delivered to recipient's device |
| `read` | Read by recipient |
| `failed` | Delivery failed |

### Application Webhook (`webhookUrl`)

Configure a global webhook URL in Application → Settings to receive all events for that application.

**Event: `incoming_message`**

```json
{
  "event": "incoming_message",
  "clientId": "747ce81b-fa42-45de-8fe4-2de621472c49",
  "from": "6281266235940",
  "message": "Hello!",
  "timestamp": 1700000000000
}
```

**Event: `status_update`**

Same payload as per-message callback above (fires for all messages in the application). Use `messageUuid` to correlate with the original send response.

**Event: `connection_update`**

```json
{
  "event": "connection_update",
  "clientId": "747ce81b-fa42-45de-8fe4-2de621472c49",
  "status": "connected",
  "phone": "6281266235940",
  "timestamp": 1700000000000
}
```

> Webhook delivery is fire-and-forget with a 10-second timeout. Your endpoint must return 2xx. Failed deliveries are not retried.

---

## Phone Number Format

The API accepts Indonesian phone numbers in any common format:

| Input | Normalized |
|-------|-----------|
| `081266235940` | `6281266235940@s.whatsapp.net` |
| `6281266235940` | `6281266235940@s.whatsapp.net` |
| `+6281266235940` | `6281266235940@s.whatsapp.net` |

---

## Error Codes

| HTTP | `error` | Meaning |
|------|---------|---------|
| 400 | `phone or jid required` | Missing recipient field |
| 400 | `provide phone or jid, not both` | Conflicting recipient fields |
| 400 | `message or mediaUrl required` | Missing message content |
| 400 | `Phone number is not registered on WhatsApp` | Recipient has no WhatsApp account |
| 401 | `unauthorized` | Invalid or missing secret key |
| 503 | `all clients are in cooldown` | No available clients for this application |
| 502 | `WhatsApp client is not connected` | Client disconnected from WhatsApp |
| 504 | `Client service timeout` | Internal service did not respond in time |

---

## Example — cURL

**Application endpoint:**
```bash
curl -X POST https://your-panel.com/public/wa/v1/applications/{applicationId}/send \
  -H "Content-Type: application/json" \
  -H "x-secret-key: YOUR_APP_SECRET" \
  -d '{
    "phone": "081266235940",
    "message": "Hello from WA Notify",
    "priority": "high"
  }'
```

