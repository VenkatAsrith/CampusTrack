#!/usr/bin/env node
/**
 * CampusTrack Native High-Performance Node.js Load Generator
 * 
 * Built specifically for CampusTrack 2,300 Students Arrival Spike Testing.
 * Zero external dependencies - runs on any machine with Node.js 18+.
 * 
 * Usage:
 *   node load-tests/run-node-load-test.mjs
 * Or with custom parameters:
 *   node load-tests/run-node-load-test.mjs --url=http://localhost:5000 --rps=192 --duration=60
 * Or for Render cloud baseline:
 *   node load-tests/run-node-load-test.mjs --url=https://campustrack-g3n6.onrender.com --rps=50 --duration=30
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, val] = arg.replace(/^--/, '').split('=');
  acc[key] = val;
  return acc;
}, {});

const BASE_URL = (args.url || process.env.BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
const TARGET_RPS = parseInt(args.rps || '192', 10);
const DURATION_SECONDS = parseInt(args.duration || '60', 10);
const CONCURRENCY = parseInt(args.concurrency || '40', 10); // Concurrent worker pipelines

console.log('================================================================');
console.log('🚀 CAMPUSTRACK HIGH-CONCURRENCY NATIVE LOAD TEST HARNESS');
console.log('================================================================');
console.log(`🎯 Target API Base URL:  ${BASE_URL}`);
console.log(`⚡ Target Request Rate:  ${TARGET_RPS} requests/sec`);
console.log(`⏱️  Spike Duration:       ${DURATION_SECONDS} seconds`);
console.log(`📦 Expected Requests:    ~${TARGET_RPS * DURATION_SECONDS} total requests`);
console.log(`👥 Worker Pipelines:     ${CONCURRENCY} concurrent keep-alive streams`);
console.log('================================================================\n');

// Real-world endpoints simulated during a 2,300 student announcement rush
const ENDPOINTS = [
  { path: '/api/v1/health', weight: 2, name: 'Liveness / Health' },
  { path: '/api/v1/announcements?limit=10', weight: 4, name: 'Announcements Feed' },
  { path: '/api/v1/announcements?isPlacementDrive=true', weight: 3, name: 'Active Drives' },
  { path: '/api/v1/announcements', weight: 2, name: 'General Announcements' },
  { path: '/api/v1/announcements?search=software', weight: 1, name: 'Search Query' },
];

function pickEndpoint() {
  const totalWeight = ENDPOINTS.reduce((sum, ep) => sum + ep.weight, 0);
  let rnd = Math.random() * totalWeight;
  for (const ep of ENDPOINTS) {
    if (rnd < ep.weight) return ep;
    rnd -= ep.weight;
  }
  return ENDPOINTS[0];
}

// Keep-alive agent for maximum HTTP throughput
const isHttps = BASE_URL.startsWith('https');
const agent = isHttps
  ? new https.Agent({ keepAlive: true, maxSockets: 200, timeout: 15000 })
  : new http.Agent({ keepAlive: true, maxSockets: 200, timeout: 15000 });

// Telemetry state
const latencies = [];
let totalSent = 0;
let totalCompleted = 0;
let statusCodes = {};
let networkErrors = 0;
let testStartTime = 0;

async function sendRequest(endpoint) {
  const fullUrl = `${BASE_URL}${endpoint.path}`;
  const startTime = process.hrtime.bigint();
  try {
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CampusTrack-LoadTest-Runner/1.0',
      },
      signal: AbortSignal.timeout(15000),
    });
    await res.text().catch(() => ''); // Drain body
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1e6;
    latencies.push(durationMs);
    statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;
    totalCompleted++;
    return { ok: res.ok, durationMs };
  } catch (err) {
    networkErrors++;
    totalCompleted++;
    return { ok: false, error: err.message };
  }
}

// Percentile calculation helper
function getPercentile(arr, p) {
  if (arr.length === 0) return 0;
  const idx = Math.floor((p / 100) * arr.length);
  return arr[Math.min(idx, arr.length - 1)];
}

async function run() {
  testStartTime = Date.now();
  const testEndTime = testStartTime + DURATION_SECONDS * 1000;
  
  // Rate scheduler
  const intervalMs = 1000 / TARGET_RPS;
  let nextScheduledTime = Date.now();

  // Progress ticker every second
  const progressTimer = setInterval(() => {
    const elapsedSec = Math.max(1, Math.floor((Date.now() - testStartTime) / 1000));
    const currentRps = (totalCompleted / elapsedSec).toFixed(1);
    const successCount = Object.keys(statusCodes)
      .filter((c) => parseInt(c, 10) >= 200 && parseInt(c, 10) < 400)
      .reduce((sum, c) => sum + statusCodes[c], 0);
    const failCount = totalCompleted - successCount;
    const progressPct = Math.min(100, Math.round((elapsedSec / DURATION_SECONDS) * 100));

    process.stdout.write(
      `\r[${progressPct}%] Time: ${elapsedSec}/${DURATION_SECONDS}s | Completed: ${totalCompleted} | Actual RPS: ${currentRps} | OK: ${successCount} | Failed: ${failCount}`
    );
  }, 1000);

  // Producer-Consumer loop
  const requestQueue = [];

  while (Date.now() < testEndTime) {
    const now = Date.now();
    if (now >= nextScheduledTime) {
      totalSent++;
      const ep = pickEndpoint();
      const p = sendRequest(ep);
      requestQueue.push(p);
      nextScheduledTime += intervalMs;
    } else {
      const waitTime = Math.max(1, Math.min(10, nextScheduledTime - now));
      await new Promise((r) => setTimeout(r, waitTime));
    }

    // Garbage clean resolved promises
    if (requestQueue.length > 500) {
      await Promise.race(requestQueue);
    }
  }

  // Wait for in-flight requests to complete
  await Promise.allSettled(requestQueue);
  clearInterval(progressTimer);

  const totalTimeSec = (Date.now() - testStartTime) / 1000;
  latencies.sort((a, b) => a - b);

  const successCount = Object.keys(statusCodes)
    .filter((c) => parseInt(c, 10) >= 200 && parseInt(c, 10) < 400)
    .reduce((sum, c) => sum + statusCodes[c], 0);
  const failureRatePct = (( (totalCompleted - successCount) / Math.max(1, totalCompleted) ) * 100).toFixed(2);
  const actualRps = (totalCompleted / totalTimeSec).toFixed(1);

  const p50 = getPercentile(latencies, 50).toFixed(1);
  const p90 = getPercentile(latencies, 90).toFixed(1);
  const p95 = getPercentile(latencies, 95).toFixed(1);
  const p99 = getPercentile(latencies, 99).toFixed(1);
  const minLatency = latencies.length > 0 ? latencies[0].toFixed(1) : 0;
  const maxLatency = latencies.length > 0 ? latencies[latencies.length - 1].toFixed(1) : 0;

  console.log('\n\n================================================================');
  console.log('📊 CAMPUSTRACK LOAD TEST RESULTS');
  console.log('================================================================');
  console.log(`⏱️  Duration:             ${totalTimeSec.toFixed(2)} seconds`);
  console.log(`📨 Requests Dispatched:   ${totalSent}`);
  console.log(`✅ Requests Completed:    ${totalCompleted}`);
  console.log(`⚡ Sustained Throughput:  ${actualRps} req/sec`);
  console.log(`❌ Network / Drop Errors: ${networkErrors}`);
  console.log(`📉 Failure Rate:          ${failureRatePct}%`);
  console.log('\n--- Status Code Distribution ---');
  for (const [code, count] of Object.entries(statusCodes)) {
    console.log(`   HTTP ${code}: ${count} (${((count / totalCompleted) * 100).toFixed(1)}%)`);
  }

  console.log('\n--- Latency Breakdown (Response Times) ---');
  console.log(`   Min:   ${minLatency} ms`);
  console.log(`   P50:   ${p50} ms  (Median)`);
  console.log(`   P90:   ${p90} ms`);
  console.log(`   P95:   ${p95} ms  ${parseFloat(p95) < 1000 ? '✅ (Target: < 1000ms)' : '❌ (> 1000ms)'}`);
  console.log(`   P99:   ${p99} ms  ${parseFloat(p99) < 2500 ? '✅ (Target: < 2500ms)' : '❌ (> 2500ms)'}`);
  console.log(`   Max:   ${maxLatency} ms`);

  console.log('\n================================================================');
  console.log('🏁 ARCHITECTURAL ACCEPTANCE EVALUATION:');
  
  const passedLatency = parseFloat(p95) < 1000;
  const passedErrorRate = parseFloat(failureRatePct) < 1.0;
  const passedThroughput = parseFloat(actualRps) >= TARGET_RPS * 0.85;

  if (passedLatency && passedErrorRate && passedThroughput) {
    console.log('🎉 PASSED! The API sustained the 2,300 students arrival spike!');
    console.log('   - P95 latency is under 1,000ms');
    console.log('   - Failure rate is under 1.0%');
    console.log('   - Database and caching handled high-concurrency cleanly.');
  } else {
    console.log('⚠️ FAILED / BOTTLENECK DETECTED:');
    if (!passedLatency) console.log(`   ❌ P95 Latency (${p95}ms) exceeded 1,000ms threshold.`);
    if (!passedErrorRate) console.log(`   ❌ Failure rate (${failureRatePct}%) exceeded 1.0% threshold (HTTP 429 / 5xx / timeouts).`);
    if (!passedThroughput) console.log(`   ❌ Achieved throughput (${actualRps} req/s) fell below expected capacity.`);
  }
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
