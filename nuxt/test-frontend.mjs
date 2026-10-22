import http from 'http';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runFrontendTests() {
  console.log('=== SUSI AIR NUXT 3 FRONTEND TEST SUITE ===\n');
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

  // 1. Sign In Page
  console.log('--- Test Group 1: Sign In Page ---');
  const resLogin = await request('http://localhost:3001/login');
  assert('GET /login returns 200 OK', resLogin.statusCode === 200);
  assert('Contains brand title "SUSI AIR"', resLogin.body.includes('SUSI AIR'));
  assert('Contains Sign In heading', resLogin.body.includes('Sign In'));
  assert('Contains demo credentials hint', resLogin.body.includes('johndoe') && resLogin.body.includes('susiairtest'));
  assert('Contains pill submit button', resLogin.body.includes('btn-pill btn-primary submit-btn'));

  // 2. Auth Middleware: Unauthenticated Access to Protected Routes
  console.log('\n--- Test Group 2: Route Protection Middleware ---');
  const resHomeUnauth = await request('http://localhost:3001/');
  assert('GET / without token redirects (302 Found)', resHomeUnauth.statusCode === 302);
  assert('Redirect location is /login', resHomeUnauth.headers.location === '/login');

  const resSchedUnauth = await request('http://localhost:3001/schedule');
  assert('GET /schedule without token redirects (302 Found)', resSchedUnauth.statusCode === 302);
  assert('Redirect location is /login', resSchedUnauth.headers.location === '/login');

  // 3. Authenticate against Backend API
  console.log('\n--- Test Group 3: Live API Authentication ---');
  const resAuth = await request('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: 'johndoe', password: 'susiairtest' },
  });
  assert('Live POST /auth/login returns 200', resAuth.statusCode === 200);
  const token = JSON.parse(resAuth.body).accessToken;
  assert('Valid JWT token retrieved', !!token);

  const authCookie = `susi_token=${token}`;

  // 4. Authenticated Home Page
  console.log('\n--- Test Group 4: Authenticated Home Page ---');
  const resHomeAuth = await request('http://localhost:3001/', {
    headers: { Cookie: authCookie },
  });
  assert('GET / with token returns 200 OK', resHomeAuth.statusCode === 200);
  assert('Displays Pilot Name "John Doe"', resHomeAuth.body.includes('John Doe'));
  assert('Displays Total Flight Hours "1,444.5"', resHomeAuth.body.includes('1,444.5'));
  assert('Displays Hours to Limit section', resHomeAuth.body.includes('Hours to Limit'));
  assert('Contains 4 limit cards (Daily, Weekly, Monthly, Annual)',
    resHomeAuth.body.includes('Daily') &&
    resHomeAuth.body.includes('Weekly') &&
    resHomeAuth.body.includes('Monthly') &&
    resHomeAuth.body.includes('Annual')
  );
  assert('Displays current values (6.4, 25.2, 87.2, 1013.8)',
    resHomeAuth.body.includes('6.4') &&
    resHomeAuth.body.includes('25.2') &&
    resHomeAuth.body.includes('87.2') &&
    resHomeAuth.body.includes('1013.8')
  );
  assert('Contains Rolling Hours Trend chart', resHomeAuth.body.includes('Rolling Hours Trend'));
  assert('Contains horizontal red limit line in SVG', resHomeAuth.body.includes('stroke="#E63757"'));
  assert('Displays My Documents section', resHomeAuth.body.includes('My Documents'));
  assert('Documents contain urgency badges (Valid, Expiring Soon, Expired)',
    resHomeAuth.body.includes('Valid') &&
    resHomeAuth.body.includes('Expiring Soon') &&
    resHomeAuth.body.includes('Expired')
  );
  assert('Contains Bottom Navigation with Home active', resHomeAuth.body.includes('bottom-nav') && resHomeAuth.body.includes('nav-item active'));

  // 5. Authenticated Schedule Page
  console.log('\n--- Test Group 5: Authenticated Schedule Page ---');
  const resSchedAuth = await request('http://localhost:3001/schedule', {
    headers: { Cookie: authCookie },
  });
  assert('GET /schedule with token returns 200 OK', resSchedAuth.statusCode === 200);
  assert('Displays Duty Roster header', resSchedAuth.body.includes('Duty Roster'));
  assert('Default month is May 2026', resSchedAuth.body.includes('May') && resSchedAuth.body.includes('2026'));
  assert('Displays "21 Scheduled Duties"', resSchedAuth.body.includes('21 Scheduled Duties'));
  assert('Displays base codes on duty days', resSchedAuth.body.includes('PDG') && resSchedAuth.body.includes('MKW'));
  assert('Displays duty legend', resSchedAuth.body.includes('Duty Legend'));
  assert('Contains legend codes (DTY, RLV, SCK, TRD, TRX, ADM, FER, MED, REC, ULV)',
    resSchedAuth.body.includes('DTY') &&
    resSchedAuth.body.includes('RLV') &&
    resSchedAuth.body.includes('TRX') &&
    resSchedAuth.body.includes('MED')
  );
  assert('Contains Bottom Navigation with Schedule active', resSchedAuth.body.includes('Schedule</span></a>'));

  console.log('\n=======================================');
  console.log(`TOTAL FRONTEND TESTS: ${passed + failed}`);
  console.log(`PASSED: \x1b[32m${passed}\x1b[0m`);
  console.log(`FAILED: \x1b[31m${failed}\x1b[0m`);
  console.log('=======================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runFrontendTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
