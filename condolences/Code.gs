/**
 * Sterling Funeral Services — live condolences.
 *
 * The obituary pages read and post condolences through this script, which
 * keeps them in the Google Sheet it is attached to and emails each new one to
 * Sterling. A posted message appears on the website straight away.
 *
 * To take a message down, change its "Show on website" cell to  no  (or delete
 * the row). The website catches up within a minute.
 *
 * Deploy: from the Sheet, Extensions → Apps Script, paste this in, Save, then
 * Deploy → New deployment → type Web app → Execute as: Me, Who has access:
 * Anyone → Deploy, and allow access. Copy the Web app URL (ends in /exec)
 * into js/live-config.js. See SETUP.md.
 *
 * After editing this script, publish the change with Deploy → Manage
 * deployments → (pencil) → Version: New version → Deploy, so the /exec
 * address stays the same.
 */

var NOTIFY = 'sterlingfuneralservices@gmail.com';
var SHEET_NAME = 'Condolences';
var HEADERS = ['Posted', 'For', 'Page', 'From', 'Relationship', 'Email', 'Message', 'Show on website'];
var COL = { posted: 0, person: 1, slug: 2, name: 3, relationship: 4, email: 5, message: 6, show: 7 };
var CACHE_SECONDS = 60;

/* GET ?slug=<page>  →  { ok: true, items: [{ name, relationship, message, posted }] }, newest first */
function doGet(e) {
  var slug = String((e && e.parameter && e.parameter.slug) || '').trim();
  if (!slug) return respond({ ok: true, note: 'Sterling condolences are running.' });
  if (!/^[a-z0-9-]{3,100}$/.test(slug)) return respond({ ok: false, error: 'bad page' });

  var cache = CacheService.getScriptCache();
  var hit = cache.get('c:' + slug);
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);

  var items = rows()
    .filter(function (r) {
      return String(r[COL.slug]) === slug && !/^\s*(no|n|hide|hidden|false)\s*$/i.test(String(r[COL.show]));
    })
    .map(function (r) {
      return {
        name: String(r[COL.name]),
        relationship: String(r[COL.relationship] || ''),
        message: String(r[COL.message]),
        posted: r[COL.posted] instanceof Date ? r[COL.posted].toISOString() : String(r[COL.posted])
      };
    })
    .reverse();

  var out = JSON.stringify({ ok: true, items: items });
  cache.put('c:' + slug, out, CACHE_SECONDS);
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

/* POST a JSON body { slug, person, name, relationship, email, message, website } */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var p = {};
    try { p = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { p = (e && e.parameter) || {}; }

    var row = {
      slug: String(p.slug || '').trim(),
      person: String(p.person || '').trim().slice(0, 150),
      name: String(p.name || '').trim(),
      relationship: String(p.relationship || '').trim(),
      email: String(p.email || '').trim(),
      message: String(p.message || '').trim()
    };

    // Honeypot: real people never fill the hidden field. Pretend it worked.
    if (String(p.website || '').length) return respond({ ok: true });

    if (!/^[a-z0-9-]{3,100}$/.test(row.slug)) return respond({ ok: false, error: 'bad page' });
    if (!row.name || !row.message) return respond({ ok: false, error: 'required' });
    if (row.name.length > 80 || row.relationship.length > 80 || row.email.length > 200 ||
        row.message.length < 2 || row.message.length > 2000) {
      return respond({ ok: false, error: 'length' });
    }
    // Links are the signature of spam; a condolence never needs one.
    var all = row.name + ' ' + row.relationship + ' ' + row.message;
    if (/(https?:|:\/\/|www\.|\.(com|net|org|ru|xyz|top|info)\b)/i.test(all)) {
      return respond({ ok: false, error: 'links' });
    }

    lock.waitLock(10000);
    var existing = rows();
    var now = new Date();
    var recent = existing.filter(function (r) {
      return String(r[COL.slug]) === row.slug && r[COL.posted] instanceof Date && now - r[COL.posted] < 10 * 60 * 1000;
    });
    // The same message twice is a double-tap, not a second condolence.
    if (existing.some(function (r) { return String(r[COL.slug]) === row.slug && String(r[COL.message]) === row.message; })) {
      return respond({ ok: false, error: 'duplicate' });
    }
    // A flood on one page in ten minutes is an attack, not mourners.
    if (recent.length >= 15) return respond({ ok: false, error: 'too many' });

    sheet().appendRow([now, row.person, row.slug, row.name, row.relationship, row.email, row.message, 'yes']);
    CacheService.getScriptCache().remove('c:' + row.slug);
    lock.releaseLock();

    try { notify(row); } catch (mailErr) { /* the message is already saved and showing */ }
    return respond({ ok: true });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setColumnWidth(COL.message + 1, 420);
  }
  return sh;
}

function rows() {
  var sh = sheet();
  var n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, HEADERS.length).getValues();
}

function notify(row) {
  var url = 'https://www.sterlingfuneralservices.com/obituaries/' + row.slug + '.html';
  var body = [
    'A condolence has been posted on the Sterling website. It is already showing on the page.',
    '',
    'For:          ' + (row.person || row.slug),
    'From:         ' + row.name,
    'Relationship: ' + (row.relationship || '—'),
    'Email:        ' + (row.email || '—'),
    '',
    '--- message ---',
    row.message,
    '',
    '---',
    'Page: ' + url,
    'To take it down, open the Condolences sheet and set "Show on website" to  no  on its row.'
  ].join('\n');

  MailApp.sendEmail({
    to: NOTIFY,
    subject: 'Condolence for ' + (row.person || 'a Sterling family'),
    body: body,
    replyTo: row.email || undefined
  });
}

/* Run once from the editor (select setup ▸ Run) to create the sheet and grant permissions. */
function setup() {
  sheet();
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
