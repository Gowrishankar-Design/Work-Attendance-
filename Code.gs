/**
 * Hype Strategies — Attendance Tracker backend
 *
 * This script turns a Google Sheet into a tiny API for the attendance
 * website. Paste this whole file into the Apps Script editor attached
 * to your Google Sheet (Extensions → Apps Script), then deploy it as
 * a Web App. Full steps are in README.md.
 *
 * It creates one row per employee per day, with columns:
 * Date | Name | Email | Login Time | Logout Time | Work Update | Status | Last Updated
 */

const SHEET_NAME = 'Attendance';

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Date', 'Name', 'Email', 'Login Time', 'Logout Time', 'Work Update', 'Status', 'Last Updated']);
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, 8, 150);
    sheet.getRange('F1:F').setWrap(true);
  }
  sheet.getRange('A2:A').setNumberFormat('@'); // keep Date column as plain text
  return sheet;
}

// Normalizes a Date column value to "yyyy-MM-dd" text, whether Sheets
// stored it as a real Date object (common auto-conversion) or as plain text.
function normalizeDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value).trim();
}

// Returns the 1-indexed row number for a given employee + date, or -1.
function findTodayRow_(sheet, email, date) {
  const data = sheet.getDataRange().getValues();
  const targetDate = String(date).trim();
  const targetEmail = String(email).toLowerCase().trim();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase().trim() === targetEmail
        && normalizeDate_(data[i][0]) === targetDate) {
      return i + 1;
    }
  }
  return -1;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handles GET requests.
 * ?action=status&email=...&date=YYYY-MM-DD  → returns today's record for that employee, if any.
 */
function doGet(e) {
  const sheet = getSheet_();
  const params = e.parameter || {};

  if (params.action === 'status' && params.email && params.date) {
    const rowIndex = findTodayRow_(sheet, params.email, params.date);
    if (rowIndex === -1) {
      return jsonOut_({ found: false });
    }
    const row = sheet.getRange(rowIndex, 1, 1, 8).getValues()[0];
    return jsonOut_({
      found: true,
      date: row[0],
      name: row[1],
      email: row[2],
      loginTime: row[3],
      logoutTime: row[4],
      workUpdate: row[5],
      status: row[6]
    });
  }

  return jsonOut_({ ok: true, message: 'Hype Strategies attendance API is running.', version: 'v2-datefix' });
}

/**
 * Handles POST requests. Body is JSON:
 * { action: 'login',  name, email, date, time }
 * { action: 'logout', name, email, date, time, workUpdate }
 */
function doPost(e) {
  const sheet = getSheet_();
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut_({ ok: false, error: 'Malformed request.' });
  }

  const action = body.action;
  const date = body.date;
  const email = body.email;

  if (!action || !date || !email) {
    return jsonOut_({ ok: false, error: 'Missing required fields.' });
  }

  if (action === 'login') {
    const existingRow = findTodayRow_(sheet, email, date);
    if (existingRow !== -1) {
      return jsonOut_({ ok: false, error: 'Already clocked in today.' });
    }
    sheet.appendRow([date, body.name, email, body.time, '', '', 'Clocked in', new Date()]);
    return jsonOut_({ ok: true });
  }

  if (action === 'logout') {
    const existingRow = findTodayRow_(sheet, email, date);
    if (existingRow === -1) {
      // No login on record for today — log it anyway so nothing is lost.
      sheet.appendRow([date, body.name, email, '(not recorded)', body.time, body.workUpdate || '', 'Clocked out', new Date()]);
      return jsonOut_({ ok: true, note: 'No login was on record for today; logged the clock-out anyway.' });
    }
    sheet.getRange(existingRow, 5).setValue(body.time);           // Logout Time
    sheet.getRange(existingRow, 6).setValue(body.workUpdate || ''); // Work Update
    sheet.getRange(existingRow, 7).setValue('Clocked out');        // Status
    sheet.getRange(existingRow, 8).setValue(new Date());           // Last Updated
    return jsonOut_({ ok: true });
  }

  return jsonOut_({ ok: false, error: 'Unknown action: ' + action });
}
