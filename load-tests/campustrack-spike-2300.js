/**
 * CampusTrack: 2,300 Students Arrival Spike Load Test (k6)
 * 
 * Target Scenario:
 * - 2,300 students arriving over 60 seconds
 * - 5 API calls per student (Health, Announcements List, Placement Drives, Search/Filter, Detail View)
 * - Total requests: ~11,500 requests
 * - Average arrival rate: 192 requests/second sustained
 * 
 * How to run:
 *   k6 run --env BASE_URL=http://localhost:5000 load-tests/campustrack-spike-2300.js
 * Or against production:
 *   k6 run --env BASE_URL=https://campustrack-g3n6.onrender.com load-tests/campustrack-spike-2300.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');
const announcementTrend = new Trend('announcements_duration');
const healthTrend = new Trend('health_duration');

export const options = {
  scenarios: {
    // Exact Open Workload Arrival Model: 192 requests/second for 60 seconds
    student_arrival_spike: {
      executor: 'constant-arrival-rate',
      rate: 192,               // 192 requests per second
      timeUnit: '1s',          // measured per 1 second
      duration: '60s',         // 60 seconds spike duration
      preAllocatedVUs: 100,    // Initial VU pool
      maxVUs: 600,             // Scalable VU ceiling for high in-flight requests
    },
  },
  thresholds: {
    // Acceptance criteria from CampusTrack architecture:
    // 1. Error rate must be under 1%
    http_req_failed: ['rate<0.01'],
    // 2. 95% of ordinary requests should complete under 1,000ms (1 second)
    http_req_duration: ['p(95)<1000'],
    // 3. 99% of requests should complete under 2,500ms
    'http_req_duration{expected_response:true}': ['p(99)<2500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Endpoints weighted realistically for students loading the portal
const ENDPOINTS = [
  { path: '/api/v1/health', weight: 2, name: 'Liveness Check' },
  { path: '/api/v1/announcements?limit=10', weight: 4, name: 'Announcements Feed' },
  { path: '/api/v1/announcements?isPlacementDrive=true', weight: 3, name: 'Active Placement Drives' },
  { path: '/api/v1/announcements', weight: 2, name: 'General Announcements' },
  { path: '/api/v1/announcements?search=software', weight: 1, name: 'Search Query' },
];

function getRandomEndpoint() {
  const totalWeight = ENDPOINTS.reduce((sum, ep) => sum + ep.weight, 0);
  let random = Math.random() * totalWeight;
  for (const ep of ENDPOINTS) {
    if (random < ep.weight) return ep;
    random -= ep.weight;
  }
  return ENDPOINTS[0];
}

export default function () {
  const ep = getRandomEndpoint();
  const url = `${BASE_URL}${ep.path}`;

  const params = {
    headers: {
      'User-Agent': 'CampusTrack-LoadTest-k6/1.0',
      'Accept': 'application/json',
    },
    tags: { name: ep.name },
  };

  const response = http.get(url, params);

  const isOk = check(response, {
    'status is 200': (r) => r.status === 200,
    'has valid response body': (r) => r.body && r.body.length > 0,
    'response under 1500ms': (r) => r.timings.duration < 1500,
  });

  if (isOk) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
  }

  // Small client think time jitter (50ms - 150ms)
  sleep(0.05 + Math.random() * 0.1);
}
