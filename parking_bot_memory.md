# Parking Bot — Confirmed API Reference

## All Endpoints (fully confirmed ✅)

| Step | Method | URL |
|------|--------|-----|
| 1 | POST | `https://ogr-api.offstreet.io/v2/portal/settings/21725/validatePlate` |
| 2 | POST | `https://ogr-api.offstreet.io/v2/portal/settings/21725/code` |
| 3 | POST | `https://ogr-api.offstreet.io/v2/portal/settings/21725/validateStart` |
| 4 | POST | `https://ogr-api.offstreet.io/v2/portal/settings/21725/endDateTimeRanges` |
| 5 | POST | `https://ogr-api.offstreet.io/v2/portal/settings/21725/validateEnd` |
| 6 | POST | `https://ogr-api.offstreet.io/v2/portal/settings/21725/registration` |
| 7 | POST | `https://ogr-api.offstreet.io/v2/portal/registration/{id}/sendParkingConfirmationEmail` |

## Static IDs
- `configId`: 21725
- `locationId`: 3939
- `tenantId`: 30861

## Additional Field IDs
- `17445` → First Name
- `17446` → Last Name
- `17447` → Volunteer Pin Number

## Confirmed Payloads

### registration (step 6) ✅
```json
{
  "additionalFieldValues": [
    { "id": 17445, "label": "First Name",           "value": "Sunny", "additionalField": { "id": 17445 } },
    { "id": 17446, "label": "Last Name",            "value": "Lee",   "additionalField": { "id": 17446 } },
    { "id": 17447, "label": "Volunteer Pin Number", "value": "589522","additionalField": { "id": 17447 } }
  ],
  "code": "589522",
  "configId": 21725,
  "locationId": 3939,
  "tenantId": 30861,
  "timeRaw": {
    "start": "2026-03-11T13:00:00.000Z",
    "end":   "2026-03-12T06:59:00.000Z"
  },
  "vehicle": { "plate": "9JFJ296", "state": "California" }
}
```

### sendParkingConfirmationEmail (step 7) ✅
```json
{ "recipient": "scl0130@gmail.com" }
```
URL uses the registration ID returned from step 6.

## Time Calculations
- **start**: today at 6:00 AM Pacific → `{today}T13:00:00.000Z` (PDT) or `T14:00:00.000Z` (PST)
- **end**: today at 11:59 PM Pacific → `{tomorrow}T06:59:00.000Z` (PDT) or `T07:59:00.000Z` (PST)
- PDT = UTC-7 (mid-March → early November), PST = UTC-8 (rest of year)
