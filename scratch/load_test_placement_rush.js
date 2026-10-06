import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================================================
// CampusTrack — 2,000 Concurrent User Placement Drive Rush Load Test (k6)
// ============================================================================
// Simulates 2,000 students simultaneously hitting the placement announcement
// endpoint when a major drive (e.g. Amazon, TCS, Infosys) is published.
//
// Target Success Metrics:
// 1. P95 Latency < 500 ms
// 2. HTTP Error Rate < 1.0 %
// ============================================================================

export const options = {
  stages: [
    { duration: '30s', target: 50 },    // Warm-up: Ramp up to 50 students
    { duration: '1m',  target: 250 },   // Normal load: 250 students
    { duration: '1m',  target: 500 },   // Medium spike: 500 students
    { duration: '1m',  target: 1000 },  // High rush: 1,000 students
    { duration: '2m',  target: 2000 },  // Peak placement drive announcement rush: 2,000 concurrent students
    { duration: '1m',  target: 500 },   // Scale down recovery
    { duration: '30s', target: 0 },     // Cool down
  ],
  thresholds: {
    // 95% of requests must complete below 500ms
    http_req_duration: ['p(95)<500', 'p(99)<1200'],
    // HTTP failure rate must stay below 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000/api/v1';

export default function () {
  // Step 1: Healthcheck ping
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Step 2: High-concurrency Placement Drive Feed Read (leveraging in-memory cache)
  const drivesRes = http.get(`${BASE_URL}/announcements?isPlacementDrive=true`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'CampusTrack-LoadTester/1.0',
    },
  });

  check(drivesRes, {
    'placement drives status is 200': (r) => r.status === 200,
    'cache header present': (r) => r.headers['X-Cache'] !== undefined,
    'response under 500ms': (r) => r.timings.duration < 500,
  });

  // Step 3: Check roll number intelligence endpoint (Student verification)
  const sampleRolls = ['23SS1A0535', '24SS5A0501', '23SS1A0412', '24SS5A0201'];
  const roll = sampleRolls[Math.floor(Math.random() * sampleRolls.length)];
  const rollRes = http.get(`${BASE_URL}/auth/check-roll/${roll}`);

  check(rollRes, {
    'roll check status is 200': (r) => r.status === 200,
    'roll recognized': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data?.parsed?.isValidFormat === true;
      } catch {
        return false;
      }
    },
  });

  // Human think time simulation between 1 to 2 seconds
  sleep(Math.random() * 1.5 + 0.5);
}
