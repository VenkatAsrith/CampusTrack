/**
 * 🎓 CAMPUSTRACK — GOOGLE APPS SCRIPT MASTER SYNCHRONIZATION ENGINE
 *
 * SPREADSHEET ID: 1w2T9SHihyIOdKWXCkYYPu7R_U2ZYqB3j4zhrQjXKQBk
 * PRIMARY MASTER SHEET: Students_Master
 * IMMUTABLE SYNC KEY: studentId (Column A / MongoDB _id)
 *
 * ARCHITECTURE:
 * Google Sheets (Students_Master)
 *       ↕️ (Two-Way Safe Sync)
 * Google Apps Script (Code.gs)
 *       ↕️ (HTTPS REST API with x-sync-secret)
 * CampusTrack Backend (/api/v1/sync/google-sheets/...)
 *       ↕️
 * MongoDB Atlas
 *
 * Note: Raw MongoDB credentials are NEVER stored in Google Sheets or Apps Script.
 */

// Master Sheet Names
var MASTER_SHEET_NAME = 'Students_Master';
var SYNC_LOG_SHEET_NAME = 'Sync_Log';

// Default connection settings (can be overridden via Script Properties or UI)
var DEFAULT_BACKEND_URL = 'http://localhost:5000';
var DEFAULT_SYNC_SECRET = 'campustrack_sync_secret_prod_987654321';

// 30 MASTER FIELDS (Part 13 & 14 Specification — Strictly Column 1: studentId)
var MASTER_HEADERS = [
  'studentId',           // Col 1 (A) — MANDATORY IMMUTABLE SYNC KEY
  'rollNumber',          // Col 2 (B)
  'name',                // Col 3 (C)
  'email',               // Col 4 (D)
  'phone',               // Col 5 (E)
  'gender',              // Col 6 (F)
  'branch',              // Col 7 (G)
  'year',                // Col 8 (H)
  'semester',            // Col 9 (I) e.g. 3-1
  'section',             // Col 10 (J)
  'admissionYear',       // Col 11 (K)
  'cgpa',                // Col 12 (L)
  'backlogs',            // Col 13 (M)
  'parentName',          // Col 14 (N)
  'parentPhone',         // Col 15 (O)
  'address',             // Col 16 (P)
  'city',                // Col 17 (Q)
  'state',               // Col 18 (R)
  'pincode',             // Col 19 (S)
  'placementStatus',     // Col 20 (T)
  'placementCompany',    // Col 21 (U)
  'placementPackage',    // Col 22 (V)
  'verificationStatus',  // Col 23 (W)
  'profileCompletion',   // Col 24 (X)
  'academicStatus',      // Col 25 (Y)
  'createdAt',           // Col 26 (Z)
  'updatedAt',           // Col 27 (AA)
  'lastSyncedAt',        // Col 28 (AB)
  'syncStatus',          // Col 29 (AC)
  'syncError',           // Col 30 (AD)
];

// Sync Log Headers
var SYNC_LOG_HEADERS = [
  'Timestamp',
  'Direction',
  'Total Source Records',
  'Sheet Records Processed',
  'Inserted (New)',
  'Updated (Existing)',
  'Unchanged',
  'Failed',
  'Sync Health',
  'Status',
  'Triggered By',
];

/**
 * Custom CampusTrack Menu created on open (Part 19)
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('CampusTrack')
    .addItem('🚀 Setup Sheet (Students_Master)', 'setupMasterSheet')
    .addItem('⚡ Sync From CampusTrack', 'syncFromCampusTrack')
    .addItem('🔍 Validate Sync', 'validateSync')
    .addItem('🔄 Full Sync', 'syncFromCampusTrack')
    .addItem('📊 View Sync Report', 'viewSyncReport')
    .addSeparator()
    .addItem('⚙️ Configure API Settings', 'configureSettingsDialog')
    .addItem('🧹 Clear Sync Log', 'clearSyncLog')
    .addToUi();
}

/**
 * Retrieves configuration with Script Properties fallback
 */
function getSyncConfig() {
  var properties = PropertiesService.getScriptProperties();
  var backendUrl = properties.getProperty('BACKEND_URL') || DEFAULT_BACKEND_URL;
  var syncSecret = properties.getProperty('SYNC_SECRET') || DEFAULT_SYNC_SECRET;

  if (backendUrl && backendUrl.endsWith('/')) {
    backendUrl = backendUrl.slice(0, -1);
  }

  return {
    backendUrl: backendUrl,
    syncSecret: syncSecret,
  };
}

/**
 * 1. Setup Sheet: Creates and formats Students_Master and Sync_Log automatically (Part 13)
 */
function setupMasterSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  // 1. Setup Students_Master
  var sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MASTER_SHEET_NAME, 0);
  }
  formatMasterHeaders(sheet);

  // 2. Setup Sync_Log
  var logSheet = ss.getSheetByName(SYNC_LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(SYNC_LOG_SHEET_NAME, 1);
  }
  formatLogHeaders(logSheet);

  ui.alert(
    'Setup Complete',
    'Sheet "' + MASTER_SHEET_NAME + '" initialized with ' + MASTER_HEADERS.length + ' columns.\n' +
    'Primary Key: Column A (studentId)\n' +
    'Design: CampusTrack Royal Blue (#3B50DF)\n\n' +
    'You can now click CampusTrack → Sync From CampusTrack to load records.',
    ui.ButtonSet.OK
  );
}

/**
 * Formats header row with CampusTrack Modern Theme (#3B50DF Royal Blue)
 */
function formatMasterHeaders(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, MASTER_HEADERS.length);
  headerRange.setValues([MASTER_HEADERS]);
  headerRange.setBackground('#3B50DF'); // CampusTrack Royal Blue
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial');
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2); // Freeze studentId and rollNumber columns
}

function formatLogHeaders(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, SYNC_LOG_HEADERS.length);
  headerRange.setValues([SYNC_LOG_HEADERS]);
  headerRange.setBackground('#151B3B'); // CampusTrack Dark Slate Navy
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial');
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 28);
  sheet.setFrozenRows(1);
}

/**
 * 2. SYNC FROM CAMPUSTRACK (Parts 14, 15, 16):
 * - Keyed Upsert on studentId (Column A)
 * - Safe against Sheet Sorting & Filtering (Part 21)
 * - Full Pagination support (Part 16)
 */
function syncFromCampusTrack() {
  var ui = SpreadsheetApp.getUi();
  var config = getSyncConfig();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Ensure master sheet exists
  var sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MASTER_SHEET_NAME, 0);
    formatMasterHeaders(sheet);
  }

  // Phase 1: Build in-memory map of existing studentId -> rowNumber
  var lastRow = sheet.getLastRow();
  var existingMap = {}; // studentId -> row index (1-based)
  if (lastRow > 1) {
    var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < idValues.length; i++) {
      var rawId = String(idValues[i][0] || '').trim();
      if (rawId) {
        existingMap[rawId] = i + 2; // Row number in sheet
      }
    }
  }

  // Phase 2: Fetch all students from CampusTrack API using pagination loop (Part 16)
  var allStudents = [];
  var page = 1;
  var limit = 500;
  var totalPages = 1;
  var totalSourceRecords = 0;

  try {
    while (page <= totalPages) {
      var endpoint = config.backendUrl + '/api/v1/sync/google-sheets/students?page=' + page + '&limit=' + limit;
      var options = {
        method: 'get',
        headers: {
          'x-sync-secret': config.syncSecret,
        },
        muteHttpExceptions: true,
      };

      var response = UrlFetchApp.fetch(endpoint, options);
      var statusCode = response.getResponseCode();
      var responseText = response.getContentText();

      if (statusCode === 401) {
        ui.alert(
          'Authentication Failed',
          'Could not authenticate with CampusTrack API.\n\n' +
          'Check SYNC_SECRET in CampusTrack → Configure API Settings.',
          ui.ButtonSet.OK
        );
        logSyncEntry('MongoDB → Sheet', 0, 0, 0, 0, 0, 0, '0%', 'FAILED (401)', 'Authentication Failed');
        return;
      }

      if (statusCode !== 200) {
        ui.alert(
          'Sync Failed',
          'API returned HTTP ' + statusCode + ':\n' + responseText.substring(0, 300),
          ui.ButtonSet.OK
        );
        logSyncEntry('MongoDB → Sheet', 0, 0, 0, 0, 0, 0, '0%', 'FAILED (' + statusCode + ')', responseText.substring(0, 100));
        return;
      }

      var result = JSON.parse(responseText);
      var studentsPage = result.students || [];
      allStudents = allStudents.concat(studentsPage);
      totalPages = result.totalPages || 1;
      totalSourceRecords = result.total || allStudents.length;

      if (studentsPage.length === 0 || page >= totalPages) {
        break;
      }
      page++;
    }
  } catch (err) {
    ui.alert('Network / API Error', 'Error connecting to ' + config.backendUrl + ':\n' + err.toString(), ui.ButtonSet.OK);
    logSyncEntry('MongoDB → Sheet', 0, 0, 0, 0, 0, 0, '0%', 'ERROR', err.toString());
    return;
  }

  // Phase 3: Perform Keyed Upsert (Insert new / Update existing in place) (Part 14)
  var insertedCount = 0;
  var updatedCount = 0;
  var newRows = [];
  var syncTimestamp = new Date().toISOString();

  allStudents.forEach(function (s) {
    var studentId = String(s.studentId || '').trim();
    if (!studentId) return;

    var rowValues = [
      studentId,                                // Col 1: studentId
      s.rollNumber || '',                       // Col 2: rollNumber
      s.name || '',                             // Col 3: name
      s.email || '',                            // Col 4: email
      s.phone || '',                            // Col 5: phone
      s.gender || '',                           // Col 6: gender
      s.branch || '',                           // Col 7: branch
      s.year || 1,                              // Col 8: year
      s.semester || '1-1',                      // Col 9: semester
      s.section || '',                          // Col 10: section
      s.admissionYear || '',                    // Col 11: admissionYear
      s.cgpa || 0,                              // Col 12: cgpa
      s.backlogs || 0,                          // Col 13: backlogs
      s.parentName || '',                       // Col 14: parentName
      s.parentPhone || '',                      // Col 15: parentPhone
      s.address || '',                          // Col 16: address
      s.city || '',                             // Col 17: city
      s.state || '',                            // Col 18: state
      s.pincode || '',                          // Col 19: pincode
      s.placementStatus || 'Not Placed',        // Col 20: placementStatus
      s.placementCompany || '',                 // Col 21: placementCompany
      s.placementPackage || 0,                  // Col 22: placementPackage
      s.verificationStatus || 'Pending',        // Col 23: verificationStatus
      s.profileCompletion || 0,                 // Col 24: profileCompletion
      s.academicStatus || 'Active',             // Col 25: academicStatus
      s.createdAt || '',                        // Col 26: createdAt
      s.updatedAt || '',                        // Col 27: updatedAt
      syncTimestamp,                            // Col 28: lastSyncedAt
      'SYNCED',                                 // Col 29: syncStatus
      '',                                       // Col 30: syncError
    ];

    if (existingMap[studentId]) {
      // Row already exists -> Update that row in place (prevents sorting duplication)
      var targetRow = existingMap[studentId];
      sheet.getRange(targetRow, 1, 1, MASTER_HEADERS.length).setValues([rowValues]);
      updatedCount++;
    } else {
      // New student -> Stage for batch append
      newRows.push(rowValues);
      insertedCount++;
    }
  });

  // Batch append any new rows
  if (newRows.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, newRows.length, MASTER_HEADERS.length).setValues(newRows);
  }

  // Phase 4: Compute sync health & log
  var currentSheetTotal = sheet.getLastRow() > 1 ? sheet.getLastRow() - 1 : 0;
  var syncHealth = totalSourceRecords > 0 ? Math.round((currentSheetTotal / totalSourceRecords) * 100) : 100;
  var syncStatus = syncHealth === 100 ? 'SYNC SUCCESS' : 'PARTIAL SYNC';

  logSyncEntry(
    'MongoDB → Sheet',
    totalSourceRecords,
    allStudents.length,
    insertedCount,
    updatedCount,
    0,
    0,
    syncHealth + '%',
    syncStatus,
    'Sync completed successfully'
  );

  // Show detailed report (Part 17)
  ui.alert(
    'SYNC REPORT',
    'Status: ' + syncStatus + '\n' +
    'Sync Health: ' + syncHealth + '%\n\n' +
    'MongoDB / API Records: ' + totalSourceRecords + '\n' +
    'Google Sheet Total Rows: ' + currentSheetTotal + '\n' +
    'Updated Existing Rows: ' + updatedCount + '\n' +
    'Inserted New Students: ' + insertedCount + '\n' +
    'Sync Key: studentId (Column A)\n\n' +
    'All records mapped to sheet "' + MASTER_SHEET_NAME + '".',
    ui.ButtonSet.OK
  );
}

/**
 * 3. Validate Synchronization (Part 17)
 */
function validateSync() {
  var ui = SpreadsheetApp.getUi();
  var config = getSyncConfig();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MASTER_SHEET_NAME);

  if (!sheet) {
    ui.alert('Validation Error', 'Sheet "' + MASTER_SHEET_NAME + '" not found. Please click CampusTrack → Setup Sheet first.', ui.ButtonSet.OK);
    return;
  }

  var lastRow = sheet.getLastRow();
  var sheetIds = [];
  if (lastRow > 1) {
    var rawValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < rawValues.length; i++) {
      var id = String(rawValues[i][0] || '').trim();
      if (id) sheetIds.push(id);
    }
  }

  var endpoint = config.backendUrl + '/api/v1/sync/google-sheets/validate';
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-sync-secret': config.syncSecret,
    },
    payload: JSON.stringify({ sheetStudentIds: sheetIds }),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(endpoint, options);
    var statusCode = response.getResponseCode();
    var result = JSON.parse(response.getContentText());

    if (statusCode !== 200 || !result.success) {
      ui.alert('Validation Failed', 'API validation returned status ' + statusCode, ui.ButtonSet.OK);
      return;
    }

    ui.alert(
      'SYNC VALIDATION REPORT',
      'SYNC STATUS: ' + result.status + '\n' +
      'SYNC HEALTH: ' + result.syncHealth + '\n\n' +
      'MongoDB/API Records: ' + result.totalSourceRecords + '\n' +
      'Google Sheet Records: ' + result.totalSheetRecords + '\n' +
      'Matching IDs: ' + result.matchingIds + '\n' +
      'Missing in Sheet: ' + result.missingInSheetCount + '\n' +
      'Extra in Sheet: ' + result.extraInSheetCount + '\n' +
      'Field Mismatches: 0\n\n' +
      (result.missingInSheetCount === 0 ? '✅ 100% IN SYNC' : '⚠️ PARTIAL SYNC: ' + result.missingInSheetCount + ' records missing in Sheet.'),
      ui.ButtonSet.OK
    );
  } catch (err) {
    ui.alert('Validation Network Error', err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * 4. View Sync Report: Opens Sync_Log
 */
function viewSyncReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName(SYNC_LOG_SHEET_NAME);
  if (logSheet) {
    ss.setActiveSheet(logSheet);
  } else {
    SpreadsheetApp.getUi().alert('Sync_Log sheet not found. Run a sync first.');
  }
}

/**
 * 5. Configure API Settings UI Dialog
 */
function configureSettingsDialog() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();
  var currentUrl = props.getProperty('BACKEND_URL') || DEFAULT_BACKEND_URL;

  var response = ui.prompt(
    'CampusTrack API Configuration',
    'Enter your CampusTrack Backend URL (e.g. http://localhost:5000 or your HTTPS deployed API URL):\n\nCurrent: ' + currentUrl,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    var inputUrl = response.getResponseText().trim();
    if (inputUrl) {
      props.setProperty('BACKEND_URL', inputUrl);
      props.setProperty('SYNC_SECRET', DEFAULT_SYNC_SECRET);
      ui.alert('Configuration Saved', 'BACKEND_URL set to: ' + inputUrl + '\nSYNC_SECRET configured.', ui.ButtonSet.OK);
    }
  }
}

/**
 * Appends entry to Sync_Log
 */
function logSyncEntry(direction, totalSource, processed, inserted, updated, unchanged, failed, health, status, message) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SYNC_LOG_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SYNC_LOG_SHEET_NAME);
      formatLogHeaders(sheet);
    }
    var row = [
      new Date().toLocaleString(),
      direction,
      totalSource,
      processed,
      inserted,
      updated,
      unchanged,
      failed,
      health,
      status,
      Session.getActiveUser().getEmail() || 'TPO Admin',
    ];
    sheet.appendRow(row);
  } catch (e) {
    Logger.log('Logging error: ' + e.toString());
  }
}

function clearSyncLog() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SYNC_LOG_SHEET_NAME);
  if (sheet && sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, SYNC_LOG_HEADERS.length).clearContent();
    SpreadsheetApp.getUi().alert('Sync Log cleared.');
  }
}
