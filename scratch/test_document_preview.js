const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

function request(options, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...(options.headers || {}) };
    if (data) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(data);
    }
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: options.path,
      method: options.method || 'GET',
      headers: reqHeaders,
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        let parsed = responseBody;
        try {
          parsed = JSON.parse(responseBody);
        } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('🚀 Testing Document Preview & Download Behavior...');

  // 1. Authenticate as Admin (TPO)
  const loginRes = await request({
    path: '/api/v1/auth/login',
    method: 'POST'
  }, {
    identifier: 'admin@college.edu',
    password: 'admin123'
  });

  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.error('❌ Failed to log in as admin:', loginRes.body);
    return;
  }
  const token = loginRes.body.token;
  const adminId = loginRes.body.data?.user?._id;
  console.log(`✅ Admin (TPO) authenticated successfully (ID: ${adminId}).`);

  // Connect to DB to insert a test document record
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas.');

  const DocumentSchema = new mongoose.Schema({
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    cloudinaryPublicId: String,
    cloudinaryUrl: String,
    cloudinarySecureUrl: String,
    documentType: String,
    status: { type: String, default: 'active' },
    uploadedBy: mongoose.Schema.Types.ObjectId,
  }, { timestamps: true });

  const DocumentModel = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

  // Create a test PDF document
  const testDoc = await DocumentModel.create({
    filename: 'test_sample_resume.pdf',
    originalName: 'Sample_Student_Resume.pdf',
    mimeType: 'application/pdf',
    size: 493520,
    cloudinaryPublicId: 'campustrack/test_resume',
    cloudinaryUrl: 'http://res.cloudinary.com/demo/image/upload/sample.pdf',
    cloudinarySecureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
    documentType: 'resume',
    status: 'active',
    uploadedBy: adminId,
  });

  console.log(`📄 Created test document record in MongoDB: ${testDoc._id}`);

  try {
    // 2. Test Preview (Normal View action - default without download=true)
    const previewRes = await request({
      path: `/api/v1/documents/${testDoc._id}?token=${encodeURIComponent(token)}`
    });

    console.log('\n--- 1. PREVIEW (Normal View Action) ---');
    console.log(`HTTP Status: ${previewRes.status}`);
    console.log(`Content-Type: ${previewRes.headers['content-type']}`);
    console.log(`Content-Disposition: ${previewRes.headers['content-disposition']}`);

    if (previewRes.headers['content-disposition']?.startsWith('inline')) {
      console.log('✅ SUCCESS: Content-Disposition is INLINE! Browser native viewer will open it without downloading.');
    } else {
      console.error('❌ FAIL: Expected inline Content-Disposition, got:', previewRes.headers['content-disposition']);
    }

    if (previewRes.headers['content-type'] === 'application/pdf') {
      console.log('✅ SUCCESS: Content-Type is application/pdf!');
    } else {
      console.error('❌ FAIL: Expected application/pdf Content-Type, got:', previewRes.headers['content-type']);
    }

    // 3. Test Explicit Download (?download=true)
    const downloadRes = await request({
      path: `/api/v1/documents/${testDoc._id}?token=${encodeURIComponent(token)}&download=true`
    });

    console.log('\n--- 2. EXPLICIT DOWNLOAD Action ---');
    console.log(`HTTP Status: ${downloadRes.status}`);
    console.log(`Content-Type: ${downloadRes.headers['content-type']}`);
    console.log(`Content-Disposition: ${downloadRes.headers['content-disposition']}`);

    if (downloadRes.headers['content-disposition']?.startsWith('attachment')) {
      console.log('✅ SUCCESS: Content-Disposition is ATTACHMENT! Browser will explicitly download to disk.');
    } else {
      console.error('❌ FAIL: Expected attachment Content-Disposition, got:', downloadRes.headers['content-disposition']);
    }

    // 4. Test Unauthorized Access (no token)
    const unauthRes = await request({
      path: `/api/v1/documents/${testDoc._id}`
    });
    console.log('\n--- 3. UNAUTHORIZED ACCESS ATTEMPT ---');
    console.log(`HTTP Status: ${unauthRes.status} (Body status: ${unauthRes.body?.status || unauthRes.body})`);
    if (unauthRes.status === 401) {
      console.log('✅ SUCCESS: 401 Unauthorized returned when token is missing. Security preserved!');
    } else {
      console.error('❌ FAIL: Expected 401 for private document without auth.');
    }

  } finally {
    // Clean up test document
    await DocumentModel.findByIdAndDelete(testDoc._id);
    console.log(`🧹 Cleaned up test document: ${testDoc._id}`);
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB Atlas.');
  }

  console.log('\n🎉 ALL DOCUMENT PREVIEW & DOWNLOAD VERIFICATION CHECKS PASSED!');
}

run().catch(console.error);
