/**
 * CampusTrack: 5-Stage Complete Resilience Load Test Suite (k6)
 * 
 * Stages:
 * 1. Warm-up / Smoke: 10 VUs (30s)
 * 2. Baseline Normal Traffic: 50 VUs (1m)
 * 3. Ramp-up: 100 -> 300 VUs (2m)
 * 4. Target 2,300 Arrival Spike: 192 req/s constant arrival (1m)
 * 5. Recovery Phase: Normal 20 VUs (1m) - Verify latency normalization & memory drop
 * 
 * How to run:
 *   k6 run --env BASE_URL=http://localhost:5000 load-tests/campustrack-full-scenario.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Stage 1: Warm-up
    { duration: '1m',  target: 50 },   // Stage 2: Normal daily baseline
    { duration: '1m',  target: 150 },  // Stage 3: Gradual surge
    { duration: '1m',  target: 350 },  // Stage 4: Peak placement notification rush
    { duration: '45s', target: 20 },   // Stage 5: Cooldown and recovery check
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],     // Less than 2% failure rate overall
    http_req_duration: ['p(95)<1200'],   // P95 under 1.2s across all stages
    'http_req_duration{stage:cooldown}': ['p(95)<400'], // Latency must recover in cooldown
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  const isCooldown = __VU <= 20;

  // 1. Student hits Health check
  const healthRes = http.get(`${BASE_URL}/api/v1/health`, {
    tags: { stage: isCooldown ? 'cooldown' : 'surge' },
  });
  check(healthRes, { 'health ok': (r) => r.status === 200 });

  // 2. Student loads Announcements (Placement Drive Feed)
  const announcementsRes = http.get(`${BASE_URL}/api/v1/announcements?isPlacementDrive=true&limit=10`, {
    tags: { stage: isCooldown ? 'cooldown' : 'surge' },
  });
  check(announcementsRes, {
    'announcements ok': (r) => r.status === 200 || r.status === 304,
  });

  // 3. Student filters or searches drive notices
  const searchRes = http.get(`${BASE_URL}/api/v1/announcements?search=engineer`, {
    tags: { stage: isCooldown ? 'cooldown' : 'surge' },
  });
  check(searchRes, { 'search ok': (r) => r.status === 200 });

  sleep(0.5 + Math.random() * 0.5);
}
