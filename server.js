const express = require('express');
const { chromium } = require('playwright');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Try multiple selectors to fill an input field
async function tryFill(page, hints, value) {
  // Try by placeholder text
  for (const hint of hints) {
    try {
      const el = page.getByPlaceholder(hint, { exact: false });
      if (await el.count() > 0) {
        await el.first().fill(value);
        console.log(`  Filled via placeholder "${hint}"`);
        return;
      }
    } catch {}

    // Try by label text
    try {
      const el = page.getByLabel(hint, { exact: false });
      if (await el.count() > 0) {
        await el.first().fill(value);
        console.log(`  Filled via label "${hint}"`);
        return;
      }
    } catch {}
  }

  // Last resort: fill first visible text input
  const inputs = page.locator('input[type="text"], input:not([type])');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const el = inputs.nth(i);
    if (await el.isVisible()) {
      await el.fill(value);
      console.log(`  Filled via fallback input #${i}`);
      return;
    }
  }

  throw new Error(`Could not find input for hints: ${hints.join(', ')}`);
}

async function clickButton(page, labels) {
  for (const label of labels) {
    try {
      const btn = page.getByRole('button', { name: new RegExp(label, 'i') });
      if (await btn.count() > 0) {
        await btn.first().click();
        console.log(`  Clicked button "${label}"`);
        await page.waitForTimeout(1500);
        return;
      }
    } catch {}
  }
  throw new Error(`Could not find button: ${labels.join(', ')}`);
}

app.post('/automate', async (req, res) => {
  const profile = req.body;
  console.log(`\n🚀 Starting automation for: ${profile.name}`);

  // Respond immediately so the UI doesn't wait
  res.json({ ok: true });

  const browser = await chromium.launch({ headless: false, slowMo: 400, channel: 'chrome' });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    console.log('📍 Navigating to offstreet.io...');
    await page.goto('https://www.offstreet.io/location/GNH76OUM');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // ── Step 1: License Plate ─────────────────────────────────────
    console.log('\n📋 Step 1: License Plate');
    await tryFill(page,
      ['license', 'plate', 'License Plate', 'vehicle', 'Plate Number'],
      profile.licensePlate
    );
    await clickButton(page, ['next', 'continue', 'proceed']);

    // ── Step 2: Code (volunteer pin) ──────────────────────────────
    console.log('\n🔑 Step 2: Code');
    await tryFill(page,
      ['code', 'Code', 'volunteer code', 'access code', 'pin'],
      profile.volunteerPin
    );
    await clickButton(page, ['next', 'continue', 'proceed']);

    // ── Step 3: Date (keep default, just click Next) ───────────────
    console.log('\n📅 Step 3: Date (keeping default)');
    await clickButton(page, ['next', 'continue', 'proceed']);

    // ── Step 4: First name, Last name, Volunteer PIN ───────────────
    console.log('\n👤 Step 4: Name + PIN');

    // Try to fill first name specifically before last name
    try {
      await tryFill(page,
        ['first name', 'first', 'First Name', 'given name'],
        profile.firstName
      );
    } catch {
      // If "tryFill first" fails, try filling all visible inputs in order
      const inputs = page.locator('input[type="text"], input:not([type])');
      const count = await inputs.count();
      const visible = [];
      for (let i = 0; i < count; i++) {
        if (await inputs.nth(i).isVisible()) visible.push(inputs.nth(i));
      }
      if (visible.length >= 1) await visible[0].fill(profile.firstName);
      if (visible.length >= 2) await visible[1].fill(profile.lastName);
      if (visible.length >= 3) await visible[2].fill(profile.volunteerPin);
      console.log('  Filled name/pin via positional inputs');
      goto_email: {
        if (profile.email) {
          try {
            const emailInput = page.locator('input[type="email"]');
            if (await emailInput.count() > 0) await emailInput.first().fill(profile.email);
          } catch {}
        }
        await clickButton(page, ['park', 'submit', 'confirm', 'register']);
        console.log('\n✅ All done! Check the browser window.');
        break goto_email;
      }
      return;
    }

    await tryFill(page,
      ['last name', 'last', 'Last Name', 'surname', 'family name'],
      profile.lastName
    );

    await tryFill(page,
      ['pin', 'volunteer pin', 'Volunteer Pin', 'volunteer number', 'code'],
      profile.volunteerPin
    );

    // ── Optional: Email ────────────────────────────────────────────
    if (profile.email) {
      try {
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.count() > 0) {
          await emailInput.first().fill(profile.email);
          console.log('\n📧 Email filled');
        }
      } catch { console.log('  (Email field not found, skipping)'); }
    }

    // ── Click Park ─────────────────────────────────────────────────
    console.log('\n🅿️  Clicking Park!');
    await clickButton(page, ['park', 'Park', 'submit', 'confirm', 'register']);

    console.log('\n✅ Done! Check the browser window for confirmation.');

  } catch (err) {
    console.error('\n❌ Automation error:', err.message);
    console.log('The browser stays open — you can finish manually.');
    // Don't close browser on error so user can finish by hand
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🅿️  Parking Bot is ready!`);
  console.log(`   Open: http://localhost:${PORT}\n`);
});
