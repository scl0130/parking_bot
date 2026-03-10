const BASE_URL = 'https://ogr-api.offstreet.io';
const CONFIG_ID = 21725;
const LOCATION_ID = 3939;
const TENANT_ID = 30861;

// Field IDs for the "additional information" page
const FIELD_FIRST_NAME    = 17445;
const FIELD_LAST_NAME     = 17446;
const FIELD_VOLUNTEER_PIN = 17447;

// Returns today at 6:00 AM Pacific time as an ISO string
function getTodayAt6AMPacific() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // "YYYY-MM-DD"
  const year = parseInt(dateStr);

  // US DST: spring forward 2nd Sunday of March, fall back 1st Sunday of November
  const march1Dow = new Date(Date.UTC(year, 2, 1)).getUTCDay();
  const springForward = new Date(Date.UTC(year, 2, 8 + (7 - march1Dow) % 7));

  const nov1Dow = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const fallBack = new Date(Date.UTC(year, 10, 1 + (7 - nov1Dow) % 7));

  const utcHour = (now >= springForward && now < fallBack) ? 13 : 14; // 6 AM PDT=13 UTC, PST=14 UTC
  return `${dateStr}T${String(utcHour).padStart(2, '0')}:00:00.000Z`;
}

async function post(endpoint, body) {
  const res = await fetch(
    `${BASE_URL}/v2/portal/settings/${CONFIG_ID}/${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.offstreet.io',
        'Referer': 'https://www.offstreet.io/',
      },
      body: JSON.stringify(body),
    }
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`${endpoint} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : {};
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { firstName, lastName, licensePlate, volunteerPin, email } = req.body;
  const startTime = getTodayAt6AMPacific();

  const base = {
    additionalFieldValues: [],
    code: volunteerPin,
    configId: CONFIG_ID,
    locationId: LOCATION_ID,
    tenantId: TENANT_ID,
    timeRaw: { start: startTime, end: '' },
    vehicle: { plate: licensePlate.toUpperCase(), state: 'California' },
  };

  try {
    // Step 1: Validate license plate
    await post('validatePlate', { ...base, code: '' });

    // Step 2: Validate volunteer code
    await post('code', { configId: CONFIG_ID, code: volunteerPin });

    // Step 3: Validate start time (defaults to 6:00 AM today)
    await post('validateStart', base);

    // Step 4: Check if end time selection is enabled (returns {enabled: false})
    await post('endDateTimeRanges', base);

    // Step 5: Validate end time
    await post('validateEnd', base);

    // TESTING MODE: all validations passed, skipping final register call
    res.json({ ok: true, message: '✅ All checks passed! Ready to park.' });

    // PRODUCTION (uncomment when ready to go live):
    // const result = await post('register', {
    //   ...base,
    //   additionalFieldValues: [
    //     { fieldId: FIELD_FIRST_NAME,    value: firstName },
    //     { fieldId: FIELD_LAST_NAME,     value: lastName },
    //     { fieldId: FIELD_VOLUNTEER_PIN, value: volunteerPin },
    //   ],
    //   ...(email ? { email } : {}),
    // });
    // res.json({ ok: true, message: '✅ Parked! Check your email for confirmation.', result });

  } catch (err) {
    console.error('Parking error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};
