const BASE_URL = 'https://ogr-api.offstreet.io';
const CONFIG_ID  = 21725;
const LOCATION_ID = 3939;
const TENANT_ID  = 30861;

const FIELD_FIRST_NAME    = 17445;
const FIELD_LAST_NAME     = 17446;
const FIELD_VOLUNTEER_PIN = 17447;

// Returns { startTime, endTime } for today in Pacific time
function getTimes() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // "YYYY-MM-DD"
  const year = parseInt(dateStr.split('-')[0]);

  // US DST: spring forward 2nd Sunday of March, fall back 1st Sunday of November
  const march1Dow = new Date(Date.UTC(year, 2, 1)).getUTCDay();
  const springForward = new Date(Date.UTC(year, 2, 8 + (7 - march1Dow) % 7));
  const nov1Dow = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const fallBack = new Date(Date.UTC(year, 10, 1 + (7 - nov1Dow) % 7));
  const isDST = (now >= springForward && now < fallBack);

  // 6:00 AM Pacific → 13:00 UTC (PDT) or 14:00 UTC (PST)
  const startUTCHour = isDST ? 13 : 14;
  const startTime = `${dateStr}T${String(startUTCHour).padStart(2, '0')}:00:00.000Z`;

  // 11:59 PM Pacific → next calendar day at 06:59 UTC (PDT) or 07:59 UTC (PST)
  const [y, m, d] = dateStr.split('-').map(Number);
  const nextDayStr = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().split('T')[0];
  const endTime = `${nextDayStr}T0${isDST ? 6 : 7}:59:00.000Z`;

  return { startTime, endTime };
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin':  'https://www.offstreet.io',
      'Referer': 'https://www.offstreet.io/',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : {};
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { firstName, lastName, licensePlate, volunteerPin, email } = req.body;
  const { startTime, endTime } = getTimes();

  const base = {
    additionalFieldValues: [],
    code: volunteerPin,
    configId:    CONFIG_ID,
    locationId:  LOCATION_ID,
    tenantId:    TENANT_ID,
    timeRaw:     { start: startTime, end: endTime },
    vehicle:     { plate: licensePlate.toUpperCase(), state: 'California' },
  };

  const settingsBase = `/v2/portal/settings/${CONFIG_ID}`;

  try {
    // Steps 1–5: validation
    await post(`${settingsBase}/validatePlate`,     { ...base, code: '' });
    await post(`${settingsBase}/code`,              { configId: CONFIG_ID, code: volunteerPin });
    await post(`${settingsBase}/validateStart`,     base);
    await post(`${settingsBase}/endDateTimeRanges`, base);
    await post(`${settingsBase}/validateEnd`,       base);

    // Step 6: register
    const registration = await post(`/v2/portal/registration`, {
      ...base,
      additionalFieldValues: [
        { id: FIELD_FIRST_NAME,    label: 'First Name',           value: firstName,    additionalField: { id: FIELD_FIRST_NAME } },
        { id: FIELD_LAST_NAME,     label: 'Last Name',            value: lastName,     additionalField: { id: FIELD_LAST_NAME } },
        { id: FIELD_VOLUNTEER_PIN, label: 'Volunteer Pin Number', value: volunteerPin, additionalField: { id: FIELD_VOLUNTEER_PIN } },
      ],
    });

    // Step 7: send confirmation email using the registration ID
    const confirmationId = registration.confirmation;

    let emailSent = false;
    if (email && confirmationId) {
      await post(`/v2/portal/registration/${confirmationId}/sendParkingConfirmationEmail`, {
        recipient: email,
      });
      emailSent = true;
    }

    const msg = emailSent
      ? '✅ Parked! Confirmation email sent.'
      : '✅ Parked! (No email — add one to your profile to get a confirmation.)';
    res.json({ ok: true, message: msg, registrationId: confirmationId });

  } catch (err) {
    console.error('Parking error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
};
