const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== SUSI AIR NESTJS API TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(desc, condition, details = '') {
    if (condition) {
      console.log(`\x1b[32m✔ PASS\x1b[0m: ${desc}`);
      passed++;
    } else {
      console.error(`\x1b[31m✘ FAIL\x1b[0m: ${desc}`);
      if (details) console.error('  Details:', details);
      failed++;
    }
  }

  // 1. Auth Login: Invalid credentials
  console.log('--- Test Group 1: Auth & Login ---');
  const resBadLogin = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { username: 'johndoe', password: 'wrongpassword' },
  );
  assert('POST /auth/login with wrong password returns 401', resBadLogin.statusCode === 401);
  assert(
    'Error response matches consistent exception filter structure',
    resBadLogin.data.statusCode === 401 &&
      resBadLogin.data.error === 'Unauthorized' &&
      resBadLogin.data.timestamp &&
      resBadLogin.data.path === '/auth/login',
    resBadLogin.data,
  );

  // 2. Auth Login: ValidationPipe error
  const resEmptyLogin = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {},
  );
  assert('POST /auth/login with empty body returns 400 Validation Error', resEmptyLogin.statusCode === 400);

  // 3. Auth Login: Valid credentials
  const resLogin = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { username: 'johndoe', password: 'susiairtest' },
  );
  assert('POST /auth/login with valid credentials returns 200', resLogin.statusCode === 200);
  assert('Response contains accessToken', !!resLogin.data.accessToken);
  assert('Response contains pilot info', resLogin.data.pilot?.username === 'johndoe' && resLogin.data.pilot?.totalFlightHours === 1444.5);

  const token = resLogin.data.accessToken;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 4. Pilot Me: Without Auth
  console.log('\n--- Test Group 2: Pilot Endpoint & Auth Guard ---');
  const resPilotUnauth = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/pilot/me',
    method: 'GET',
  });
  assert('GET /pilot/me without token returns 401', resPilotUnauth.statusCode === 401);

  // 5. Pilot Me: With Auth
  const resPilot = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/pilot/me',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /pilot/me with token returns 200', resPilot.statusCode === 200);
  assert('Pilot name is John Doe and total flight hours is 1444.5', resPilot.data.name === 'John Doe' && resPilot.data.totalFlightHours === 1444.5);
  assert('Pilot profile includes avatarUrl', !!resPilot.data.avatarUrl);

  // 6. Flight Hours: Validation
  console.log('\n--- Test Group 3: Flight Hours Range Queries ---');
  const resFhInvalidDate = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours?from=invalid-date&to=2026-05-15',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /flight-hours with invalid date format returns 400', resFhInvalidDate.statusCode === 400);

  const resFhInverted = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours?from=2026-05-20&to=2026-05-10',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /flight-hours with from > to returns 400', resFhInverted.statusCode === 400);

  // 7. Flight Hours: Standard Range (2026-05-10 to 2026-05-15)
  const resFhRange = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours?from=2026-05-10&to=2026-05-15',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /flight-hours 2026-05-10 to 2026-05-15 returns 200', resFhRange.statusCode === 200);
  assert('Returns exactly 6 days', resFhRange.data.count === 6 && resFhRange.data.data.length === 6);
  assert('May 15 hours is 6.4', resFhRange.data.data.find(d => d.date === '2026-05-15')?.hours === 6.4);

  // 8. Flight Hours: Dates Before Dataset Starts (Dataset starts 2024-12-27)
  const resFhBefore = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours?from=2024-12-25&to=2024-12-28',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /flight-hours before dataset starts returns 200 with 0h for missing days', resFhBefore.statusCode === 200);
  assert('Dates before 2024-12-27 have 0.0 hours', resFhBefore.data.data.find(d => d.date === '2024-12-25')?.hours === 0);
  assert('Date 2024-12-27 has 5.7 hours', resFhBefore.data.data.find(d => d.date === '2024-12-27')?.hours === 5.7);

  // 9. Flight Hours: Future Dates (Beyond 2026-05-31)
  const resFhFuture = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours?from=2026-06-01&to=2026-06-03',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /flight-hours for future dates returns 200 with 0.0 hours', resFhFuture.statusCode === 200 && resFhFuture.data.data.every(d => d.hours === 0));

  // 10. Flight Hours Summary: 4 Limit Cards & 1w Chart
  console.log('\n--- Test Group 4: Flight Hours Summary & Limit Cards ---');
  const resSummary1w = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours/summary?range=1w',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /flight-hours/summary?range=1w returns 200', resSummary1w.statusCode === 200);

  const limits = resSummary1w.data.limits;
  assert('Limit Card Daily: limit 8, current 6.4, remaining 1.6', limits?.daily?.limit === 8 && limits?.daily?.current === 6.4 && limits?.daily?.remaining === 1.6);
  assert('Limit Card Weekly: limit 40, current 25.2, remaining 14.8', limits?.weekly?.limit === 40 && limits?.weekly?.current === 25.2 && limits?.weekly?.remaining === 14.8);
  assert('Limit Card Monthly: limit 100, current 87.2, remaining 12.8', limits?.monthly?.limit === 100 && limits?.monthly?.current === 87.2 && limits?.monthly?.remaining === 12.8);
  assert('Limit Card Annual: limit 1050, current 1013.8, remaining 36.2', limits?.annual?.limit === 1050 && limits?.annual?.current === 1013.8 && limits?.annual?.remaining === 36.2);

  const chart = resSummary1w.data.chart;
  assert('Chart has 15 points (7 before, today, 7 after)', chart?.data?.length === 15);
  assert('Chart start date is 2026-05-08 and end date is 2026-05-22', chart?.data[0]?.date === '2026-05-08' && chart?.data[14]?.date === '2026-05-22');
  assert('Today is in the middle at index 7 with isToday: true', chart?.data[7]?.date === '2026-05-15' && chart?.data[7]?.isToday === true);
  assert('Chart limit is 40 and yMax is 45 for 1w toggle', chart?.limit === 40 && chart?.yMax === 45);

  // 11. Chart toggles: 1m, 3m, 6m, 1y
  const resSummary1m = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours/summary?range=1m',
    method: 'GET',
    headers: authHeaders,
  });
  assert('Toggle 1m: limit 100, yMax 125, windowDays 30', resSummary1m.data.chart?.limit === 100 && resSummary1m.data.chart?.yMax === 125 && resSummary1m.data.chart?.windowDays === 30);

  const resSummary3m = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours/summary?range=3m',
    method: 'GET',
    headers: authHeaders,
  });
  assert('Toggle 3m: limit 300, yMax 325, windowDays 90', resSummary3m.data.chart?.limit === 300 && resSummary3m.data.chart?.yMax === 325 && resSummary3m.data.chart?.windowDays === 90);

  const resSummary6m = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours/summary?range=6m',
    method: 'GET',
    headers: authHeaders,
  });
  assert('Toggle 6m: limit 600, yMax 625, windowDays 180', resSummary6m.data.chart?.limit === 600 && resSummary6m.data.chart?.yMax === 625 && resSummary6m.data.chart?.windowDays === 180);

  const resSummary1y = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours/summary?range=1y',
    method: 'GET',
    headers: authHeaders,
  });
  assert('Toggle 1y: limit 1050, yMax 1200, windowDays 365', resSummary1y.data.chart?.limit === 1050 && resSummary1y.data.chart?.yMax === 1200 && resSummary1y.data.chart?.windowDays === 365);

  // 12. Invalid range toggle
  const resSummaryBadRange = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/flight-hours/summary?range=2w',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /flight-hours/summary?range=2w returns 400 Validation Error', resSummaryBadRange.statusCode === 400);

  // 13. Documents Endpoint: Urgency Status Badges
  console.log('\n--- Test Group 5: Documents & Urgency Status Badges ---');
  const resDocs = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/documents',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /documents returns 200', resDocs.statusCode === 200);
  assert('Documents count is 5', resDocs.data.documents?.length === 5);

  const secClearance = resDocs.data.documents.find(d => d.id === 'doc_security');
  assert('Security Clearance is expired (expiry: 2026-05-01, -14 days remaining)', secClearance?.status === 'expired' && secClearance?.daysRemaining === -14 && secClearance?.badge?.variant === 'danger');

  const medLicense = resDocs.data.documents.find(d => d.id === 'doc_medical');
  assert('Medical is expiring soon (expiry: 2026-06-11, 27 days remaining)', medLicense?.status === 'expiring_soon' && medLicense?.daysRemaining === 27 && medLicense?.badge?.variant === 'warning');

  const indoLicense = resDocs.data.documents.find(d => d.id === 'doc_license');
  assert('License is expiring soon (expiry: 2026-05-29, 14 days remaining)', indoLicense?.status === 'expiring_soon' && indoLicense?.daysRemaining === 14 && indoLicense?.badge?.variant === 'warning');

  const recurrent = resDocs.data.documents.find(d => d.id === 'doc_recurrent');
  assert('Recurrent is valid (>30 days)', recurrent?.status === 'valid' && recurrent?.daysRemaining > 30 && recurrent?.badge?.variant === 'success');

  // 14. Schedules Endpoint
  console.log('\n--- Test Group 6: Schedules Endpoint ---');
  const resSchedMay = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/schedules?year=2026&month=05',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /schedules?year=2026&month=05 returns 200', resSchedMay.statusCode === 200);
  assert('May 2026 returns exactly 21 schedules', resSchedMay.data.count === 21 && resSchedMay.data.schedules?.length === 21);
  assert('Response contains legend and fieldGuide', Array.isArray(resSchedMay.data.legend) && typeof resSchedMay.data.fieldGuide === 'object');

  // Single digit month test
  const resSchedApr = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/schedules?year=2026&month=4',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /schedules?year=2026&month=4 normalizes month and returns 17 schedules', resSchedApr.statusCode === 200 && resSchedApr.data.count === 17 && resSchedApr.data.month === '04');

  // Invalid query parameter test
  const resSchedBad = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/schedules?year=2026&month=13',
    method: 'GET',
    headers: authHeaders,
  });
  assert('GET /schedules?year=2026&month=13 returns 400 Validation Error', resSchedBad.statusCode === 400);

  console.log('\n=======================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: \x1b[32m${passed}\x1b[0m`);
  console.log(`FAILED: \x1b[31m${failed}\x1b[0m`);
  console.log('=======================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
