# 🛡️ CampusTrack: 2,300 Students Arrival Spike Load Testing Guide

## 1. The Scenario & The Math

When a major placement drive announcement is broadcast at JNTUH UCE Sulthanpur:
- **Arriving Students**: 2,300 students
- **Arrival Window**: 60 seconds (1 minute)
- **API Calls per Student**: ~5 calls (Auth ping, Announcements feed, Placement drives, Dashboard stats, Filter query)
- **Total Requests**: 2,300 × 5 = **11,500 requests**
- **Average Arrival Rate**: 2,300 / 60 = **38.3 students / second**
- **Average API Request Rate**: 11,500 / 60 = **191.7 requests / second (~192 req/s)**

### Why 192 req/s is dangerous on a single free backend:
The in-flight requests that the backend must juggle at any given millisecond depend on **response time**:
$$\text{In-Flight Requests} = \text{Arrival Rate (req/s)} \times \text{Average Latency (seconds)}$$

| Average Response Time | In-Flight Concurrent Requests | Single Render Free Instance Risk |
| :--- | :--- | :--- |
| **50 ms** (Cached) | ~10 in-flight | ✅ Very safe, event loop stays idle |
| **100 ms** (Optimized) | ~19 in-flight | ✅ Handled comfortably |
| **250 ms** | ~48 in-flight | ⚠️ Connection pool starts queuing |
| **500 ms** | ~96 in-flight | 🚨 Node.js event loop lag spikes |
| **1,000 ms (1s)** | **192 in-flight** | 💥 Single CPU saturates, timeouts begin |
| **3,000 ms (3s)** | **576 in-flight** | 🛑 Out of Memory (OOM) or 504 Gateway Timeout |

---

## 2. Recommended 3-Tier Free-First Architecture

```
[ 2,300 Students (Mobile / Laptops) ]
                │
                ▼
  ┌──────────────────────────────┐
  │  Layer 1: Cloudflare Pages   │  <-- Free, Unlimited Bandwidth CDN
  │  (React HTML, CSS, JS, SVG)  │      ZERO traffic hits backend for assets!
  └──────────────┬───────────────┘
                 │ (Only JSON API Calls: 192 req/s)
                 ▼
  ┌──────────────────────────────┐
  │  Layer 2: Express API        │  <-- Single Node / Render Free
  │  - 20s Announcement In-Mem   │      *Eliminates 95% of MongoDB queries*
  │    Cache (announcementsCtrl) │      *Compound Indexes for fast scans*
  └──────────────┬───────────────┘
                 │
                 ▼
  ┌──────────────────────────────┐
  │  Layer 3: MongoDB Atlas M0   │  <-- 500 connections max, 512MB storage
  │  + Cloudinary CDN            │      Preserved with 10-50 connection pool
  └──────────────────────────────┘
```

---

## 3. How to Run the Load Tests

You have **two execution options**:

### Option A: Native Node.js Runner (No External Tools Required)
We built a dedicated zero-dependency runner in `load-tests/run-node-load-test.mjs`.

#### Step 1: Quick Smoke Test (10 req/s, 15 seconds)
```bash
node load-tests/run-node-load-test.mjs --url=http://localhost:5000 --rps=10 --duration=15
```

#### Step 2: Baseline Load Test (50 req/s, 30 seconds)
```bash
node load-tests/run-node-load-test.mjs --url=http://localhost:5000 --rps=50 --duration=30
```

#### Step 3: Target 2,300 Students Arrival Spike (192 req/s, 60 seconds)
```bash
node load-tests/run-node-load-test.mjs --url=http://localhost:5000 --rps=192 --duration=60
```

#### Step 4: Test Cloud Staging (Render Free)
```bash
node load-tests/run-node-load-test.mjs --url=https://campustrack-g3n6.onrender.com --rps=50 --duration=30
```

---

### Option B: Grafana k6 (Standard Industry Load Tester)

The all-in-one script [`campustrack-load-test.js`](campustrack-load-test.js) includes all scenarios and automatically outputs an HTML report (`load-tests/report.html`):

```bash
# 1. Target 2,300 Students Arrival Spike (192 req/s for 60s)
k6 run load-tests/campustrack-load-test.js

# 2. Test against Render Staging / Production
k6 run -e BASE_URL=https://campustrack-g3n6.onrender.com load-tests/campustrack-load-test.js

# 3. Select a specific scenario (smoke, baseline, spike_2300, lifecycle)
k6 run -e SCENARIO=smoke load-tests/campustrack-load-test.js
k6 run -e SCENARIO=baseline load-tests/campustrack-load-test.js
k6 run -e SCENARIO=lifecycle load-tests/campustrack-load-test.js

# 4. Run via Docker (if k6 is not installed on your host machine)
docker run --rm -i --net=host -v ${PWD}/load-tests:/scripts grafana/k6 run /scripts/campustrack-load-test.js
```

---

## 4. How to Interpret Results (Engineering Acceptance Criteria)

| Metric | Target | Status | Meaning |
| :--- | :--- | :---: | :--- |
| **P95 Latency** | **< 1,000 ms** | 🎯 Pass | 95% of student requests returned in under 1 second |
| **P99 Latency** | **< 2,500 ms** | 🎯 Pass | Extreme tail latency remains bounded |
| **HTTP Failure Rate** | **< 1.0 %** | 🎯 Pass | Less than 1 out of 100 requests returned errors (5xx/timeouts) |
| **HTTP 429 Rate** | **0% for legit traffic** | ⚠️ Watch | If students get 429, campus NAT rate limits must be adjusted |
| **Throughput** | **≥ 165 req/s** | 🎯 Pass | The test generator successfully sustained ~192 req/s |

---

## 5. Critical Bottlenecks & Built-in CampusTrack Protections

1. **In-Memory Placement Cache**:
   In `server/src/controllers/announcementsController.ts`, announcements are cached for 20 seconds in a memory map (`announcementCache`).
   When 2,300 students hit the announcements endpoint within 60 seconds, **only ~3 database queries** are made to MongoDB Atlas; the remaining 11,497 requests are served from RAM in ~2ms.

2. **Campus Wi-Fi NAT / Single-IP Hazard**:
   If 2,300 students are on the college Wi-Fi at UCE Sulthanpur, all of them appear to Render/server as a **single public IP address**.
   If `RATE_LIMIT_GLOBAL_MAX` is set to 1000 requests per 15 minutes, student #201 will receive HTTP 429 (`RATE_LIMITED`).
   - In production, set `RATE_LIMIT_GLOBAL_MAX=20000` or configure reverse proxy IP headers (`app.set('trust proxy', 1)`).

3. **MongoDB Connection Pool**:
   In `server/src/config/db.ts`, Mongoose is configured with `minPoolSize: 10` and `maxPoolSize: 50`.
   This prevents opening thousands of individual TCP connections to Atlas, which would breach free-tier M0 connection ceilings (max 500 connections).
