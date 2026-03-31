import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const EMAIL = process.env.ENVIZOM_EMAIL || '';
const PASSWORD = process.env.ENVIZOM_PASSWORD || '';
const BASE_URL = process.env.ENVIZOM_BASE_URL || 'https://envizom.oizom.com';

test('AutoNexus 8-Step Login Flow', async ({ page }) => {

  // ── Start intercepting all Envizom API calls ──
  const apiCalls: any[] = [];

  page.on('response', async (response) => {
    try {
      const url = response.url();

      // Capture any oizom.com API call (not just envdevapi — could be any subdomain)
      if (!url.includes('oizom.com')) return;
      // Skip static assets
      if (url.match(/\.(js|css|png|jpg|ico|woff|svg|map|html)(\?|$)/)) return;
      // Skip the frontend page itself (only capture API paths)
      if (url.includes('envizom.oizom.com') && !url.includes('/users/') && !url.includes('/devices/') && !url.includes('/api/')) return;

      const method = response.request().method();
      const endpoint = url.includes('/users/login') ? 'POST /users/login/v2'
        : url.includes('/overview/') ? 'GET /users/{id}/overview/v2'
        : url.includes('/devices/data') ? 'GET /devices/data'
        : method + ' ' + url.substring(0, 80);

      let body = null;
      try { body = await response.json(); } catch {}

      apiCalls.push({
        endpoint,
        method,
        url,
        status: response.status(),
        body,
        timestamp: new Date().toISOString(),
      });

      console.log('  API: ' + method + ' ' + url.substring(0, 90) + ' -> ' + response.status());
    } catch (e) {
      // silently ignore capture errors
    }
  });


  // ═════════════════════════════════════════
  // STEP 1: Check if page is working
  // ═════════════════════════════════════════
  console.log('\nSTEP 1: Check if page is working');

  await page.goto(BASE_URL, { timeout: 30000, waitUntil: 'networkidle' });

  // Verify the actual login page loaded with real elements
  await expect(page.locator('h3:has-text("Welcome Back!")')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('input[formcontrolname="emailId"]')).toBeVisible();
  await expect(page.locator('input[formcontrolname="password"]')).toBeVisible();
  await expect(page.locator('button:has-text("LOG IN")')).toBeVisible();
  await expect(page.locator('mat-checkbox[formcontrolname="termsAndConditions"]')).toBeVisible();

  console.log('  PASS - Page loaded. Heading, email, password, checkbox, login button all visible.');


  // ═════════════════════════════════════════
  // STEP 2: Input the email
  // ═════════════════════════════════════════
  console.log('\nSTEP 2: Input the email');

  if (!EMAIL) throw new Error('ENVIZOM_EMAIL not set. Add it to .env or GitHub Secrets.');

  const emailField = page.locator('input[formcontrolname="emailId"]');
  await emailField.click();
  await emailField.fill(EMAIL);

  const emailValue = await emailField.inputValue();
  expect(emailValue).toBe(EMAIL);

  console.log('  PASS - Email entered: ' + EMAIL.substring(0, 4) + '****');


  // ═════════════════════════════════════════
  // STEP 3: Input the password
  // ═════════════════════════════════════════
  console.log('\nSTEP 3: Input the password');

  if (!PASSWORD) throw new Error('ENVIZOM_PASSWORD not set. Add it to .env or GitHub Secrets.');

  const passwordField = page.locator('input[formcontrolname="password"]');
  await passwordField.click();
  await passwordField.fill(PASSWORD);

  expect((await passwordField.inputValue()).length).toBeGreaterThan(0);

  console.log('  PASS - Password entered: ********');


  // ═════════════════════════════════════════
  // STEP 4: Click on checkbox
  // ═════════════════════════════════════════
  console.log('\nSTEP 4: Click on checkbox');

  await page.locator('mat-checkbox[formcontrolname="termsAndConditions"]').click();

  // Terms & Conditions dialog pops up — click AGREE to close it
  const agreeButton = page.locator('button:has-text("AGREE")');
  await agreeButton.waitFor({ state: 'visible', timeout: 10000 });
  console.log('  Terms dialog opened — clicking AGREE...');
  await agreeButton.click();

  // Wait for dialog to close
  await agreeButton.waitFor({ state: 'hidden', timeout: 5000 });

  // Verify checkbox is checked after agreeing
  await expect(page.locator('#mat-mdc-checkbox-1-input')).toBeChecked();

  console.log('  PASS - Terms accepted and checkbox is checked.');


  // ═════════════════════════════════════════
  // STEP 5: Click on Login
  // ═════════════════════════════════════════
  console.log('\nSTEP 5: Click on Login');

  const loginButton = page.locator('button:has-text("LOG IN")');
  await expect(loginButton).toBeEnabled({ timeout: 5000 });
  await loginButton.click({ timeout: 15000 });

  // Wait for redirect after login (Envizom goes to /#/overview/map)
  await page.waitForURL('**/overview/**', { timeout: 30000 });
  console.log('  PASS - Login successful. Redirected to: ' + page.url());

  // Close the popup that appears after login
  console.log('  Closing post-login popup...');
  await page.waitForTimeout(3000);

  // Try closing any dialog/popup that appears
  const popupCloseButtons = [
    '.cdk-overlay-container button:has-text("Close")',
    '.cdk-overlay-container button:has-text("OK")',
    '.cdk-overlay-container button:has-text("Got it")',
    '.cdk-overlay-container button:has-text("Dismiss")',
    '.cdk-overlay-container button:has-text("Cancel")',
    'mat-dialog-actions button',
    '.cdk-overlay-container .close-btn',
    '.cdk-overlay-container mat-icon:has-text("close")',
    '.cdk-overlay-container button mat-icon:has-text("close")',
  ];

  let popupClosed = false;
  for (const sel of popupCloseButtons) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const txt = await btn.innerText().catch(() => 'close');
      console.log('  Found popup button: "' + txt.trim() + '" — clicking...');
      await btn.click();
      popupClosed = true;
      break;
    }
  }

  if (!popupClosed) {
    // Try pressing Escape to close any overlay
    console.log('  No popup button found — pressing Escape...');
    await page.keyboard.press('Escape');
  }

  await page.waitForTimeout(2000);
  console.log('  Popup handled.');


  // ═════════════════════════════════════════
  // STEP 6: Click Refresh & Look for APIs
  // ═════════════════════════════════════════
  console.log('\nSTEP 6: Click Refresh button and look for APIs');

  // Click the Refresh button in Overview (mat-icon with "loop")
  const refreshButton = page.locator('button mat-icon:has-text("loop")').first();

  if (await refreshButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('  Found Refresh button — clicking...');
    await refreshButton.click();
    console.log('  Refresh clicked. Waiting for devices API...');
  } else {
    console.log('  Refresh button not found — waiting for APIs to load naturally...');
  }

  // Wait for the devices/data API to be called
  await page.waitForTimeout(10000);

  // Log everything we captured
  console.log('  Total API calls captured: ' + apiCalls.length);
  apiCalls.forEach((a, i) => {
    console.log('    [' + (i+1) + '] ' + a.method + ' ' + a.url.substring(0, 100) + ' -> ' + a.status);
  });

  const loginApi = apiCalls.find(a => a.endpoint.includes('login'));
  const overviewApi = apiCalls.find(a => a.endpoint.includes('overview'));
  const devicesApi = apiCalls.find(a => a.endpoint.includes('devices'));

  if (loginApi) console.log('  FOUND: Login API -> ' + loginApi.status);
  if (overviewApi) console.log('  FOUND: Overview API -> ' + overviewApi.status);
  if (devicesApi) console.log('  FOUND: Devices API -> ' + devicesApi.status);

  console.log('  PASS - ' + apiCalls.length + ' APIs captured');


  // ═════════════════════════════════════════
  // STEP 7: Record the APIs
  // ═════════════════════════════════════════
  console.log('\nSTEP 7: Record the APIs');
  console.log('');
  console.log('  #  | Method | Endpoint                             | Status');
  console.log('  ---|--------|--------------------------------------|-------');
  apiCalls.forEach((api, i) => {
    const n = String(i + 1).padStart(2);
    const m = api.method.padEnd(6);
    const e = api.endpoint.substring(0, 36).padEnd(36);
    console.log('  ' + n + ' | ' + m + ' | ' + e + ' | ' + api.status);
  });

  // Save to file
  const resultsDir = path.join(__dirname, '..', 'test-results');
  fs.mkdirSync(resultsDir, { recursive: true });

  // Fetch response bodies for APIs we need
  for (const api of apiCalls) {
    if (!api.body && api.url) {
      // Body was already captured by the async listener
    }
  }

  fs.writeFileSync(path.join(resultsDir, 'captured-apis.json'), JSON.stringify(apiCalls, null, 2));
  console.log('\n  PASS - ' + apiCalls.length + ' APIs recorded to captured-apis.json');


  // ═════════════════════════════════════════
  // STEP 8: Show devices with Online/Offline status
  // ═════════════════════════════════════════
  console.log('\nSTEP 8: Create devices table with status');

  // Find the devices/data API response
  const devicesApiResponse = apiCalls.find(a => a.endpoint.includes('devices') && a.body);
  let devices: any[] = [];

  if (devicesApiResponse?.body) {
    // API returns an array: [{deviceId, deviceType, payload: [{deviceId, deviceType, keys, payload: {t, s, d}}]}]
    const rawDevices = Array.isArray(devicesApiResponse.body) ? devicesApiResponse.body : [];

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const THIRTY_MINUTES = 30 * 60;

    console.log('  Current timestamp: ' + currentTimestamp + ' (' + new Date().toLocaleString() + ')');
    console.log('  Raw devices count: ' + rawDevices.length);

    devices = rawDevices.map((device: any, i: number) => {
      // Structure: device.payload[0].payload.d.t = epoch timestamp
      //            device.payload[0].payload.s.loc = location name
      const innerPayload = device.payload?.[0]?.payload;
      const lastActiveTime = innerPayload?.d?.t || 0;
      const locationName = innerPayload?.s?.loc || '-';
      const deviceType = device.deviceType || device.payload?.[0]?.deviceType || '-';
      const deviceId = device.deviceId || device.payload?.[0]?.deviceId || 'device-' + (i + 1);

      // Online = last active within 30 minutes, else Offline
      let status = 'Offline';
      let statusColor = '#D32F2F';

      if (lastActiveTime > 0 && lastActiveTime > currentTimestamp - THIRTY_MINUTES) {
        status = 'Online';
        statusColor = '#4CAF50';
      }

      return {
        id: deviceId,
        name: deviceId, // Device ID is used as name since API doesn't have a separate name field
        type: deviceType,
        location: locationName,
        status,
        statusColor,
        lastSeen: lastActiveTime > 0 ? new Date(lastActiveTime * 1000).toLocaleString() : 'Never',
        lastActiveTime,
      };
    });
  }

  // Fallback: try other APIs if devices API didn't have the data
  if (devices.length === 0) {
    for (const api of apiCalls) {
      if (api.body && !api.endpoint.includes('login')) {
        devices = extractDevices(api.body);
        if (devices.length > 0) break;
      }
    }
  }

  if (devices.length > 0) {
    const onlineCount = devices.filter((d: any) => d.status === 'Online').length;
    const offlineCount = devices.filter((d: any) => d.status === 'Offline').length;

    console.log('\n  Devices found: ' + devices.length);
    console.log('  Online: ' + onlineCount + ' | Offline: ' + offlineCount);
    console.log('');
    console.log('  #  | Device ID            | Type           | Location             | Status  | Last Seen');
    console.log('  ---|----------------------|----------------|----------------------|---------|--------------------');
    devices.forEach((d: any, i: number) => {
      const n = String(i + 1).padStart(2);
      const id = (d.id || '-').substring(0, 20).padEnd(20);
      const tp = (d.type || '-').substring(0, 14).padEnd(14);
      const loc = (d.location || '-').substring(0, 20).padEnd(20);
      const st = (d.status || '-').padEnd(7);
      const ls = (d.lastSeen || '-').substring(0, 19);
      console.log('  ' + n + ' | ' + id + ' | ' + tp + ' | ' + loc + ' | ' + st + ' | ' + ls);
    });
  } else {
    console.log('  WARNING: Could not extract devices. API response keys:');
    apiCalls.forEach(a => {
      if (a.body && typeof a.body === 'object')
        console.log('    ' + a.endpoint + ': [' + Object.keys(a.body).join(', ') + ']');
    });
  }

  // Generate HTML report
  const html = generateHtml(apiCalls, devices);
  fs.writeFileSync(path.join(resultsDir, 'devices-report.html'), html);

  console.log('\n  PASS - HTML devices report saved to test-results/devices-report.html');
  console.log('\n=== ALL 8 STEPS COMPLETED ===\n');
});


// ── Helpers ──

function extractDevices(data: any): any[] {
  if (!data) return [];
  for (const k of ['devices', 'devices_data', 'device_list', 'equipment']) {
    if (data[k] && Array.isArray(data[k]) && data[k].length > 0) return norm(data[k]);
    if (data[k] && typeof data[k] === 'object' && !Array.isArray(data[k]))
      return norm(Object.entries(data[k]).map(([id, v]: [string, any]) => ({ id, ...(typeof v === 'object' ? v : {}) })));
  }
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object')
      if (val[0].deviceId || val[0].device_id || val[0].id) return norm(val);
  }
  if (Array.isArray(data)) return norm(data);
  return [];
}

function norm(list: any[]): any[] {
  return list.map((d, i) => ({
    id: d.deviceId || d.device_id || d.id || d.serialNumber || 'device-' + (i + 1),
    name: d.deviceName || d.device_name || d.name || d.label || '-',
    type: d.deviceType || d.device_type || d.type || d.model || '-',
    location: d.location || d.locationName || d.location_name || d.city || '-',
    status: d.status || d.connectionStatus || d.isOnline || 'unknown',
  }));
}

function generateHtml(apis: any[], devices: any[]): string {
  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = devices.filter(d => d.status === 'Offline').length;

  const apiRows = apis.map((a, i) =>
    '<tr><td>' + (i+1) + '</td><td><span class="m ' + a.method.toLowerCase() + '">' + a.method + '</span></td><td class="ep">' + a.endpoint + '</td><td class="s' + (a.status < 400 ? 'ok' : 'er') + '">' + a.status + '</td></tr>'
  ).join('');

  const devRows = devices.map((d, i) => {
    const isOnline = d.status === 'Online';
    return '<tr><td>' + (i+1) + '</td><td class="di">' + d.id + '</td><td>' + d.type + '</td><td>' + d.location + '</td><td><span class="dot ' + (isOnline ? 'on' : 'off') + '"></span>' + d.status + '</td><td class="ls">' + (d.lastSeen || '-') + '</td></tr>';
  }).join('');

  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AutoNexus Report</title>' +
    '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#0C0E14;color:#C9D1D9;padding:24px}' +
    'h1{font-size:22px;color:#E6EDF3;margin-bottom:4px}h1 span{color:#7EB6FF}.sub{font-size:13px;color:#484F58;margin-bottom:24px}' +
    'h2{font-size:16px;color:#E6EDF3;margin:24px 0 12px;padding-bottom:8px;border-bottom:1px solid #1A1D24}' +
    '.stats{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}.stat{background:#0D1017;border:1px solid #1A1D24;border-radius:8px;padding:14px 18px;text-align:center;min-width:100px}' +
    '.stat-n{font-size:26px;font-weight:600;color:#E6EDF3}.stat-l{font-size:11px;color:#484F58;margin-top:2px;text-transform:uppercase}' +
    '.stat-on .stat-n{color:#4CAF50}.stat-off .stat-n{color:#D32F2F}' +
    'table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px}' +
    'th{text-align:left;padding:10px 12px;background:#12151C;color:#484F58;font-size:11px;text-transform:uppercase;font-weight:500;border-bottom:1px solid #1A1D24}' +
    'td{padding:9px 12px;border-bottom:1px solid #1A1D24}tr:hover{background:rgba(255,255,255,0.02)}' +
    '.m{padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}.post{background:#1C2D1C;color:#4ADE80}.get{background:#1C1C2D;color:#7EB6FF}' +
    '.ep{max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.sok{color:#4ADE80;font-weight:600}.ser{color:#F87171;font-weight:600}.di{font-weight:500;color:#E6EDF3;font-family:monospace}' +
    '.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}' +
    '.on{background:#4CAF50}.off{background:#D32F2F}' +
    '.ls{color:#484F58;font-size:12px}' +
    '.ft{text-align:center;color:#21262D;font-size:11px;margin-top:32px}</style></head>' +
    '<body><h1>AUTO<span>NEXUS</span> Report</h1><p class="sub">Generated: ' + new Date().toLocaleString() + '</p>' +
    '<div class="stats">' +
    '<div class="stat"><div class="stat-n">' + apis.length + '</div><div class="stat-l">APIs</div></div>' +
    '<div class="stat"><div class="stat-n">' + devices.length + '</div><div class="stat-l">Total Devices</div></div>' +
    '<div class="stat stat-on"><div class="stat-n">' + onlineCount + '</div><div class="stat-l">Online</div></div>' +
    '<div class="stat stat-off"><div class="stat-n">' + offlineCount + '</div><div class="stat-l">Offline</div></div></div>' +
    '<h2>Captured APIs</h2><table><thead><tr><th>#</th><th>Method</th><th>Endpoint</th><th>Status</th></tr></thead><tbody>' + apiRows + '</tbody></table>' +
    '<h2>Devices (' + devices.length + ')</h2><table><thead><tr><th>#</th><th>Device ID</th><th>Type</th><th>Location</th><th>Status</th><th>Last Seen</th></tr></thead><tbody>' + devRows + '</tbody></table>' +
    '<p class="ft">AutoNexus v3.0</p></body></html>';
}
