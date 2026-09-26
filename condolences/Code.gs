/**
 * Sterling Funeral Services — condolence receiver.
 *
 * Receives a condolence from an obituary page, emails it to Sterling and
 * appends it to a Google Sheet. Nothing here publishes to the website: the
 * point is that Sheradan receives every message so he can pass them all to
 * the family, and chooses which ones also appear on the page.
 *
 * Deploy: Extensions → Apps Script from the Sheet, paste this in, then
 * Deploy → New deployment → Web app → Execute as **Me**, Access
 * **Anyone**. See SETUP.md.
 */

var NOTIFY = 'sterlingfuneralservices@gmail.com';
var SHEET_NAME = 'Condolences';

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    var name = String(p.name || '').trim();
    var message = String(p.message || '').trim();
    if (!name || !message) {
      return respond({ ok: false, error: 'Name and message are required.' });
    }

    // Light abuse guards. The form is public, so keep it boring to attack.
    if (message.length > 4000 || name.length > 120) {
      return respond({ ok: false, error: 'Too long.' });
    }
    if (String(p.website || '').length) {
      // honeypot: real people never fill a hidden field
      return respond({ ok: true });
    }

    var row = {
      received: new Date(),
      person: String(p.person || '').trim(),
      slug: String(p.slug || '').trim(),
      name: name,
      relationship: String(p.relationship || '').trim(),
      email: String(p.email || '').trim(),
      message: message,
      published: 'no'
    };

    appendRow(row);
    notify(row);

    return respond({ ok: true });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  }
}

function doGet() {
  return respond({ ok: true, note: 'Sterling condolence receiver is running.' });
}

function appendRow(row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet
      .appendRow(['Received', 'For', 'Slug', 'From', 'Relationship', 'Email', 'Message', 'Published?'])
      .setFrozenRows(1);
  }
  sheet.appendRow([
    row.received,
    row.person,
    row.slug,
    row.name,
    row.relationship,
    row.email,
    row.message,
    row.published
  ]);
}

function notify(row) {
  var subject = 'Condolence for ' + (row.person || 'a Sterling family');
  var body = [
    'A condolence has been left on the Sterling website.',
    '',
    'For:          ' + row.person,
    'From:         ' + row.name,
    'Relationship: ' + (row.relationship || '—'),
    'Email:        ' + (row.email || '—'),
    '',
    '--- message ---',
    row.message,
    '',
    '---',
    'Pass this to the family.',
    'To publish it on the website, add it to data/condolences.json under "' + row.slug + '"',
    'and re-run: node tools/build-obituaries.js'
  ].join('\n');

  MailApp.sendEmail({
    to: NOTIFY,
    subject: subject,
    body: body,
    replyTo: row.email || undefined
  });
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
