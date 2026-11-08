/**
 * Backend for the Student Activity Scheduler.
 * Bound to a Google Sheet with two tabs:
 *   - "AllowedIDs": column A = valid 9-digit student IDs (one per row, no header needed)
 *   - "Responses":  created automatically on first submission
 *
 * Resubmitting with the same ID overwrites that student's row.
 */

// Set to true to accept submissions, false to close the survey.
// After changing, redeploy: Deploy -> Manage deployments -> Edit -> New version.
const ACCEPTING_RESPONSES = false;

const ACTIVITY_COLUMNS = [
  'Design Quiz',
  'Implementation Quiz',
  'Maintenance Quiz',
  'Lab Exercise',
  'Lab Exam'
];

function doPost(e) {
  if (!ACCEPTING_RESPONSES) {
    return json_({ ok: false, error: 'This survey is now closed and no longer accepting responses.' });
  }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse(e.postData.contents);
    const studentId = String(data.studentId || '').trim();
    const selections = data.selections || {};

    if (!/^\d{9}$/.test(studentId)) {
      return json_({ ok: false, error: 'Student ID must be exactly 9 digits.' });
    }
    for (const name of ACTIVITY_COLUMNS) {
      if (!selections[name] || typeof selections[name] !== 'string') {
        return json_({ ok: false, error: 'Missing selection for ' + name + '.' });
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Check the ID against the allowed list (skipped if the tab is missing/empty)
    const allowedSheet = ss.getSheetByName('AllowedIDs');
    if (allowedSheet && allowedSheet.getLastRow() > 0) {
      const allowed = allowedSheet
        .getRange(1, 1, allowedSheet.getLastRow(), 1)
        .getValues()
        .map(r => String(r[0]).trim());
      if (allowed.indexOf(studentId) === -1) {
        return json_({ ok: false, error: 'This Student ID is not on the registered list.' });
      }
    }

    let sheet = ss.getSheetByName('Responses');
    if (!sheet) {
      sheet = ss.insertSheet('Responses');
      sheet.appendRow(['Student ID', 'Last Updated'].concat(ACTIVITY_COLUMNS));
      sheet.setFrozenRows(1);
      // Keep IDs as plain text so leading zeros survive
      sheet.getRange('A:A').setNumberFormat('@');
    }

    const row = [studentId, new Date()].concat(ACTIVITY_COLUMNS.map(n => selections[n]));

    // Upsert by ID
    let targetRow = -1;
    const last = sheet.getLastRow();
    if (last > 1) {
      const ids = sheet.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0]).trim());
      const idx = ids.indexOf(studentId);
      if (idx !== -1) targetRow = idx + 2;
    }
    if (targetRow === -1) targetRow = last + 1;
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'Server error. Please try again.' });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, message: 'Scheduler endpoint is running.' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
