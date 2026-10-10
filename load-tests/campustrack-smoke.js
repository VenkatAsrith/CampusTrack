/**
 * CampusTrack: Stage 1 Smoke Test (k6)
 * 
 * Target: 5–10 Virtual Users (VUs) for 30 seconds
 * Purpose: Verify that the API, database connectivity, and endpoints respond with 200 OK
 * 
 * How to run:
 *   k6 run --env BASE_URL=http://localhost:5000 load-tests/campustrack-smoke.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate==0'], // Zero failures allowed in smoke test
    http_req_duration: ['p(95)<400'], // 95% under 400ms under light load
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health returns healthy': (r) => JSON.parse(r.body).status === 'healthy',
  });

  // 2. Readiness check
  const readyRes = http.get(`${BASE_URL}/api/v1/ready`);
  check(readyRes, {
    'ready status 200': (r) => r.status === 200,
  });

  // 3. Announcements Feed
  const announcementsRes = http.get(`${BASE_URL}/api/v1/announcements?limit=5`);
  check(announcementsRes, {
    'announcements status 200': (r) => r.status === 200,
    'announcements returns json': (r) => r.headers['Content-Type']?.includes('application/json'),
  });

  sleep(1);
}
