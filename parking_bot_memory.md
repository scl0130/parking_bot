# Parking Bot — API Notes

## Known API Endpoints
All calls are `POST` to `https://ogr-api.offstreet.io/v2/portal/settings/21725/{action}`

| Step | Endpoint | Notes |
|------|----------|-------|
| 1 | `validatePlate` | Validates license plate |
| 2 | `code` | Validates volunteer PIN |
| 3 | `validateStart` | Validates start time (6:00 AM Pacific) |
| 4 | `endDateTimeRanges` | Always returns `{"enabled": false}` |
| 5 | `validateEnd` | Validates end time |
| 6 | `register` | **GUESSED** — submits the registration |

## Static IDs (from __data.json)
- `configId`: 21725
- `locationId`: 3939
- `tenantId`: 30861

## Additional Field IDs (from __data.json)
- `17445` → First Name
- `17446` → Last Name
- `17447` → Volunteer Pin Number

## Known Payloads

### validatePlate
```json
{
  "additionalFieldValues": [],
  "code": "",
  "configId": 21725,
  "locationId": 3939,
  "tenantId": 30861,
  "timeRaw": { "start": "2026-03-10T13:00:46.551Z", "end": "" },
  "vehicle": { "plate": "9JFJ296", "state": "California" }
}
```

### code
```json
{
  "configId": 21725,
  "code": "589522"
}
```

### validateStart
```json
{
  "additionalFieldValues": [],
  "code": "589522",
  "configId": 21725,
  "locationId": 3939,
  "tenantId": 30861,
  "timeRaw": { "start": "2026-03-10T18:16:00.000Z", "end": "" },
  "vehicle": { "plate": "9JFJ296", "state": "California" }
}
```

### validateEnd
```json
{
  "additionalFieldValues": [],
  "code": "589522",
  "configId": 21725,
  "locationId": 3939,
  "tenantId": 30861,
  "timeRaw": { "start": "2026-03-10T13:00:00.000Z", "end": "" },
  "vehicle": { "plate": "9JFJ296", "state": "California" }
}
```

### register (GUESSED — not confirmed yet)
```json
{
  "additionalFieldValues": [
    { "fieldId": 17445, "value": "Sunny" },
    { "fieldId": 17446, "value": "Lee" },
    { "fieldId": 17447, "value": "589522" }
  ],
  "code": "589522",
  "configId": 21725,
  "locationId": 3939,
  "tenantId": 30861,
  "timeRaw": { "start": "2026-03-10T13:00:00.000Z", "end": "" },
  "vehicle": { "plate": "9JFJ296", "state": "California" },
  "email": "scl0130@gmail.com"
}
```

## What Still Needs Verification
- **The `register` endpoint name** — could be `/register`, `/create`, `/park`, or `/submit`
- **The `register` payload format** — specifically whether `additionalFieldValues` with field IDs 17445/17446/17447 is correct
- **`timeRaw.start`** — currently set to today at 6:00 AM Pacific. Need to confirm this is correct or if it should be "now"

## TODO When Testing
When you do the actual parking registration, open DevTools → Network → Fetch/XHR and capture:
1. The `register` request — **URL** and **Payload** tabs
2. The `register` **Response** tab (to see what a successful registration looks like)

Paste those here so we can confirm or fix the implementation.
