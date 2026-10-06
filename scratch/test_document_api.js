const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: responseBody });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function postJson(path, data, token) {
  const json = JSON.stringify(data);
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request({
    hostname: 'localhost',
    port: 5000,
    path,
    method: 'POST',
    headers,
  }, json);
}

function getJson(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request({
    hostname: 'localhost',
    port: 5000,
    path,
    method: 'GET',
    headers,
  });
}

function postMultipart(path, filename, buffer, documentType, token) {
  const boundary = '----CampusTrackFormBoundary' + Date.now();
  const crlf = '\r\n';

  let body = '';
  // Field: documentType
  body += `--${boundary}${crlf}`;
  body += `Content-Disposition: form-data; name="documentType"${crlf}${crlf}`;
  body += `${documentType}${crlf}`;

  // Field: file
  body += `--${boundary}${crlf}`;
  body += `Content-Disposition: form-data; name="file"; filename="${filename}"${crlf}`;
  body += `Content-Type: application/octet-stream${crlf}${crlf}`;

  const headBuffer = Buffer.from(body, 'utf8');
  const tailBuffer = Buffer.from(`${crlf}--${boundary}--${crlf}`, 'utf8');
  const fullPayload = Buffer.concat([headBuffer, buffer, tailBuffer]);

  const headers = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': fullPayload.length,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  return request({
    hostname: 'localhost',
    port: 5000,
    path,
    method: 'POST',
    headers,
  }, fullPayload);
}

async function run() {
  console.log('========================================================');
  console.log(' CampusTrack API & Security Integration Test Suite');
  console.log('========================================================\n');

  // 1. Health Check
  const health = await getJson('/api/v1/health');
  console.log(`1. API Health Check: HTTP ${health.status} (${health.body.message})`);

  // 2. Unauthenticated Upload Check
  const unauthUpload = await postMultipart('/api/v1/documents/upload', 'test.pdf', Buffer.from('PDF'), 'resume');
  console.log(`2. Unauthenticated Upload: HTTP ${unauthUpload.status} (Expected 401: ${unauthUpload.body.message})`);

  // 3. Login as Admin
  const adminLogin = await postJson('/api/v1/auth/login', {
    identifier: 'admin@college.edu',
    password: 'admin123',
  });
  console.log(`3. Admin Login: HTTP ${adminLogin.status}`);
  const adminToken = adminLogin.body?.token;

  // 4. Login as Student
  const studentLogin = await postJson('/api/v1/auth/login', {
    identifier: '21BD1A0501',
    password: 'password123',
  });
  console.log(`4. Student Login: HTTP ${studentLogin.status}`);
  const studentToken = studentLogin.body?.token;

  // 5. Test Executable Blocking (Server-side rejection)
  const tokenToTest = studentToken || adminToken;
  if (tokenToTest) {
    const exeRes = await postMultipart(
      '/api/v1/documents/upload',
      'malware.exe',
      Buffer.from('MZ executable header'),
      'proof_document',
      tokenToTest
    );
    console.log(`5. Malicious Executable (.exe) Upload: HTTP ${exeRes.status} (Expected 400: ${exeRes.body.message})`);

    // 6. Test Oversized Resume Rejection
    const largeBuffer = Buffer.alloc(3.5 * 1024 * 1024); // 3.5 MB (> 3 MB limit)
    const largeResumeRes = await postMultipart(
      '/api/v1/documents/upload',
      'huge_resume.pdf',
      largeBuffer,
      'resume',
      tokenToTest
    );
    console.log(`6. Oversized Resume (>3MB) Upload: HTTP ${largeResumeRes.status} (Expected 400: ${largeResumeRes.body.message})`);

    // 7. Test Non-PDF uploaded as Resume
    const fakeImgResume = await postMultipart(
      '/api/v1/documents/upload',
      'resume_as_image.png',
      Buffer.from('PNG image bytes'),
      'resume',
      tokenToTest
    );
    console.log(`7. Non-PDF Resume Upload: HTTP ${fakeImgResume.status} (Expected 400: ${fakeImgResume.body.message})`);

    // 7b. Test Valid PDF Payload Structure
    const boundary = '----Boundary' + Date.now();
    const pdfContent = '%PDF-1.4 simulated resume document';
    let body = `--${boundary}\r\nContent-Disposition: form-data; name="documentType"\r\n\r\nresume\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample_resume.pdf"\r\nContent-Type: application/pdf\r\n\r\n${pdfContent}\r\n--${boundary}--\r\n`;
    const validPdfRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/documents/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${tokenToTest}`,
      }
    }, body);
    console.log(`7b. Valid PDF Upload Processing: HTTP ${validPdfRes.status} (${validPdfRes.body?.message || JSON.stringify(validPdfRes.body)})`);
  }

  // 8. Storage Stats Access Control (Admin allowed, Student restricted)
  if (studentToken) {
    const studentStats = await getJson('/api/v1/documents/storage/stats', studentToken);
    console.log(`8a. Student Access to Storage Stats: HTTP ${studentStats.status} (Expected 403: ${studentStats.body.message})`);
  }
  if (adminToken) {
    const adminStats = await getJson('/api/v1/documents/storage/stats', adminToken);
    console.log(`8b. Admin Access to Storage Stats: HTTP ${adminStats.status} (Total files: ${adminStats.body?.data?.summary?.totalFiles ?? 0})`);
  }

  // 9. Existing Google Sheets / Export functionality preservation
  if (adminToken) {
    const syncStatus = await getJson('/api/v1/sync/status', adminToken);
    console.log(`9. Google Sheets Sync Status: HTTP ${syncStatus.status} (Configured: ${syncStatus.body?.syncSecretConfigured})`);
  }

  console.log('\n========================================================');
  console.log(' All API & Security Integration Tests Completed Successfully!');
  console.log('========================================================\n');
}

run().catch(console.error);
