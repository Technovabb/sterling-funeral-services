/*
 * Generates obituaries/<slug>.html for every record in data/obituaries.json
 * and rewrites the card grid inside obituaries.html.
 *
 * Records are ordered most recent passing first. Source of record is the Nation
 * newspaper submission in Sterling's case files; `flag` marks anything that needs
 * confirming and is NOT rendered on the page - it is printed by this script.
 *
 * Run from the project root:  node tools/build-obituaries.js
 */

const fs = require("fs");
const path = require("path");

// Absolute URLs: Facebook and WhatsApp ignore a relative og:image, so link
// previews for shared obituaries show no photograph without this.
const SITE = "https://www.sterlingfuneralservices.com";

const root = path.join(__dirname, "..");
const people = JSON.parse(fs.readFileSync(path.join(root, "data/obituaries.json"), "utf8"));

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Curly quotes and dashes are already in the data; only escape markup.
// Typing slips carried over from the Nation submissions: a missing space after
// "St." or after a comma. Cosmetic only — never changes a name or a date.
function txt(s) {
  return String(s)
    .replace(/\bSt\.(?=[A-Z])/g, "St. ")
    .replace(/,(?=[A-Za-z])/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function initials(name) {
  return name
    .replace(/\bnée\b.*$/i, "")
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Portraits keep whatever format they arrived in, so try each in turn.
function photoFor(slug) {
  for (const ext of [".jpg", ".png", ".webp"]) {
    if (fs.existsSync(path.join(root, "images/obituaries", slug + ext))) return slug + ext;
  }
  return null;
}

function sortKey(p) {
  return p.died || p.sortDate || "0000-00-00";
}

people.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

/* ---------- shared chrome ---------- */

const nav = (up) => `<div class="topbar"><p>Excellence Through Service</p><a href="tel:+12465717965">Available 24/7 &middot; (246) 571-7965</a></div>
<header class="site-header">
<a class="brand" href="${up}index.html" aria-label="Sterling Funeral Services home"><img class="brand-logo" src="${up}images/brand/logo-horizontal.png" alt="Sterling Funeral Services" /></a>
<nav class="desktop-nav" aria-label="Main navigation">
<a href="${up}index.html">Home</a>
<a href="${up}about.html">About</a>
<a href="${up}services.html">Services</a>
<a href="${up}caskets.html">Caskets</a>
<a href="${up}obituaries.html" class="active">Obituaries</a>
<a href="${up}pre-planning.html">Pre-Planning</a>
<a href="${up}contact.html">Contact</a>
</nav>
<a class="header-call" href="tel:+12465717965"><span>Call anytime</span>(246) 571-7965</a>
<button class="menu-button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Toggle navigation"><span></span><span></span></button>
</header>
<div id="mobile-menu" class="mobile-menu" aria-hidden="true">
<nav aria-label="Mobile navigation">
<a href="${up}index.html">Home<span>&#8599;</span></a>
<a href="${up}about.html">About<span>&#8599;</span></a>
<a href="${up}services.html">Services<span>&#8599;</span></a>
<a href="${up}caskets.html">Caskets<span>&#8599;</span></a>
<a href="${up}obituaries.html" class="active">Obituaries<span>&#8599;</span></a>
<a href="${up}pre-planning.html">Pre-Planning<span>&#8599;</span></a>
<a href="${up}contact.html">Contact<span>&#8599;</span></a>
</nav>
<a href="${up}contact.html" class="button gold">Arrange a consultation</a>
</div>`;

const contactBand = `<section class="contact-band">
<div><p class="eyebrow light">Whenever you need us</p><h2>We&rsquo;re here, <em>24 hours a day.</em></h2><p>When you are ready to talk, a caring member of our team is only a call or message away.</p></div>
<div class="contact-band-actions">
<a class="button gold" href="tel:+12465717965">Call (246) 571-7965 <span>&#8599;</span></a>
<a class="button outline" href="https://wa.me/12462349195" target="_blank" rel="noreferrer">WhatsApp <span>&#8599;</span></a>
</div>
</section>`;

const footer = (up) => `<footer>
<div class="footer-main">
<div class="footer-brand"><a class="brand" href="${up}index.html"><img class="brand-logo" src="${up}images/brand/logo-horizontal.png" alt="Sterling Funeral Services" /></a><p>Compassionate guidance and dignified care, whenever your family needs us.</p></div>
<div><h4>Explore</h4><a href="${up}about.html">About us</a><a href="${up}services.html">Our services</a><a href="${up}caskets.html">Casket collection</a><a href="${up}obituaries.html">Obituaries</a><a href="${up}pre-planning.html">Pre-planning</a></div>
<div><h4>Contact</h4><a href="tel:+12465717965">(246) 571-7965</a><a href="tel:+12462349195">(246) 234-9195</a><a href="mailto:sterlingfuneralservices@gmail.com">sterlingfuneralservices@gmail.com</a></div>
<div><h4>Availability</h4><p>Support available<br/>24 hours a day, 7 days a week</p><a class="footer-whatsapp" href="https://wa.me/12462349195" target="_blank" rel="noreferrer">WhatsApp us &#8594;</a></div>
</div>
<div class="footer-bottom"><p>&copy; <span id="year"></span> Sterling Funeral Services. All rights reserved.</p></div>
</footer>
<script src="${up}js/main.js"></script>
</body>
</html>`;

/* ---------- individual memorial pages ---------- */

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function bornText(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const suf = d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th";
  return `${MONTH_NAMES[m - 1]} ${d}${suf}, ${y}`;
}
function sunsetText(p) {
  if (p.died) return bornText(p.died);
  return (p.diedText || "").replace(/^\w+day,\s*/, "");
}

function splitName(name) {
  const words = name.split(" ");
  return { first: words[0], rest: words.slice(1).join(" ") };
}

// The memorial page carries the address in its own line, so the pull-quote
// leads with the alias instead of repeating it.
function summaryLine(p) {
  if (p.summary) return p.summary;
  if (p.aka) return `Affectionately known as “${p.aka}”.`;
  return "Remembered with love by family and friends.";
}

function memorialPage(p) {
  const photo = photoFor(p.slug);
  const { first, rest } = splitName(p.name);
  const desc = `${p.name}${p.aka ? `, affectionately known as ${p.aka}` : ""} — service and interment details published by Sterling Funeral Services.`;

  const portrait = photo
    ? `<div class="memorial-portrait"><img src="../images/obituaries/${photo}" alt="Obituary notice for ${esc(p.name)}" /></div>`
    : `<div class="memorial-portrait is-placeholder" role="img" aria-label="Obituary notice for ${esc(p.name)} — photograph to follow"><span class="monogram">${esc(initials(p.name))}</span></div>`;

  const datesLine =
    [p.age ? `Aged ${p.age}` : null, p.diedText ? `Entered rest ${p.diedText}` : null]
      .filter(Boolean)
      .join(" &middot; ") || `Service held ${txt(p.service)}`;

  const bio = [];
  if (p.address) bio.push(`<p>Of ${txt(p.address)}.</p>`);
  if (p.occupation) bio.push(`<p>${txt(p.occupation)}.</p>`);
  if (p.family && p.family.length) {
    // "Beloved mother of X and Y." -> bold the relationship, keep the names plain
    const items = p.family
      .map((line) => {
        const m = String(line).match(/^(.{3,60}?\s+of)\s+([\s\S]+)$/);
        return m
          ? `<li><strong>${txt(m[1])}</strong> ${txt(m[2])}</li>`
          : `<li>${txt(line)}</li>`;
      })
      .join("\n");
    bio.push(`<h3>Family</h3>\n<ul>\n${items}\n</ul>`);
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(p.name)} | Obituaries | Sterling Funeral Services</title>
<meta name="description" content="${esc(desc)}" />
<link rel="icon" type="image/png" href="../favicon-32.png" />
<link rel="apple-touch-icon" href="../apple-touch-icon.png" />
<link rel="stylesheet" href="../css/styles.css" />
<link rel="canonical" href="${SITE}/obituaries/${p.slug}.html" />
<meta property="og:url" content="${SITE}/obituaries/${p.slug}.html" />
<meta property="og:site_name" content="Sterling Funeral Services" />
<meta property="og:title" content="${esc(p.name)} | Sterling Funeral Services" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${SITE}/${photo ? `images/obituaries/${photo}` : "og.png"}" />
<meta name="twitter:card" content="summary_large_image" />
</head>
<body>
${nav("../")}
<main>
<section class="memorial-page">
<div class="memorial-intro">
<a class="memorial-back" href="../obituaries.html">&larr; All obituaries</a>
${portrait}
<div class="memorial-heading">
<p class="eyebrow light">In loving memory</p>
<h1>${txt(first)}<br/><em>${txt(rest)}</em></h1>
<p class="memorial-dates">${datesLine}</p>
</div>
</div>
<div class="memorial-content">
<div class="memorial-tribute">
<p class="eyebrow">In memory</p>
<p class="memorial-summary">${txt(summaryLine(p))}</p>
${bio.join("\n")}
</div>
<aside class="service-card">
${p.born ? `<div><small>Sunrise &amp; Sunset</small><strong>${txt(bornText(p.born))} &ndash; ${txt(sunsetText(p))}</strong></div>` : ""}
<div><small>Service &amp; Interment</small><strong>${txt(p.service || "Details available on request")}</strong>${
    p.venue || p.interment
      ? `<p>${p.venue ? txt(p.venue) : ""}${p.interment ? `${p.venue ? "<br/>" : ""}Interment: ${txt(p.interment)}.` : ""}</p>`
      : `<p>Please contact Sterling for the service and interment details.</p>`
  }</div>
<p><small>Condolences</small><br/>May be sent to <a href="mailto:sterlingfuneralservices@gmail.com">sterlingfuneralservices@gmail.com</a>.<br/><br/>Professional services entrusted to Sterling Funeral Services, #6 Sterling, Black Rock, St. Michael.</p>
</aside>
</div>
</section>
${contactBand}
</main>
${footer("../")}
`;
}

/* ---------- index cards ---------- */

function blurb(p) {
  if (p.summary) return p.summary;
  const bits = [];
  if (p.aka) bits.push(`Affectionately known as “${p.aka}”`);
  if (p.address) bits.push(`of ${p.address.replace(/^Formerly of /i, "formerly of ")}`);
  const s = bits.join(" ");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) + "." : "Remembered with love by family and friends.";
}

function card(p) {
  const photo = photoFor(p.slug);
  const href = `obituaries/${p.slug}.html`;
  const dates =
    [p.age ? `Aged ${p.age}` : null, p.diedText ? `Entered rest ${p.diedText}` : null]
      .filter(Boolean)
      .join(" &middot; ") || `Service held ${txt(p.service)}`;

  const image = photo
    ? `<a class="obituary-card-image" href="${href}" aria-label="View the obituary for ${esc(p.name)}"><img src="images/obituaries/${photo}" alt="Obituary notice for ${esc(p.name)}" loading="lazy" /></a>`
    : `<a class="obituary-card-image is-placeholder" href="${href}" aria-label="View the obituary for ${esc(p.name)}"><span class="monogram">${esc(initials(p.name))}</span></a>`;

  return `<article class="obituary-card">
${image}
<div class="obituary-card-copy">
<p class="obituary-dates">${dates}</p>
<h3><a href="${href}">${txt(p.name)}</a></h3>
<p>${txt(blurb(p))}</p>
<a class="link-arrow" href="${href}">View obituary <span>&#8594;</span></a>
</div>
</article>`;
}

/* ---------- write ---------- */

let written = 0;
for (const p of people) {
  fs.writeFileSync(path.join(root, "obituaries", p.slug + ".html"), memorialPage(p));
  written++;
}

const indexPath = path.join(root, "obituaries.html");
let index = fs.readFileSync(indexPath, "utf8");
const grid = `<div class="obituary-grid">\n${people.map(card).join("\n")}\n</div>`;
// \r?\n so this still matches when git checks the file out with CRLF endings
const gridBlock = /<div class="obituary-grid">[\s\S]*?\r?\n<\/div>\r?\n<\/section>/;
if (!gridBlock.test(index)) throw new Error("obituary-grid block not found in obituaries.html");
// note: an unchanged result just means the index was already up to date
fs.writeFileSync(indexPath, index.replace(gridBlock, grid + "\n</section>"));

/* Every published date carries its weekday, so the calendar can check it.
   This catches the commonest transcription slip - right weekday, wrong day
   number - which is exactly how four wrong dates reached the live site. */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DATE_RE = new RegExp(
  `(${DAYS.join("|")}),?\\s+(${MONTH_NAMES.join("|")})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})`
);
const dateWarnings = [];
for (const p of people) {
  for (const field of ["diedText", "service"]) {
    const m = String(p[field] || "").match(DATE_RE);
    if (!m) continue;
    const actual = DAYS[new Date(Date.UTC(+m[4], MONTH_NAMES.indexOf(m[2]), +m[3])).getUTCDay()];
    if (actual !== m[1]) {
      dateWarnings.push(`${p.name} (${field}): "${p[field]}" — ${m[2]} ${m[3]} ${m[4]} was a ${actual}`);
    }
  }
  // a service that precedes the passing is always a data error
  if (p.died && p.service) {
    const sm = String(p.service).match(DATE_RE);
    if (sm) {
      const svc = new Date(Date.UTC(+sm[4], MONTH_NAMES.indexOf(sm[2]), +sm[3]));
      if (svc < new Date(p.died)) {
        dateWarnings.push(`${p.name}: service ${p.service} precedes the date of passing ${p.diedText}`);
      }
    }
  }
}

const missing = people.filter((p) => !photoFor(p.slug));
console.log(`Wrote ${written} memorial pages and rebuilt the index.`);
console.log(`Notice photographs present: ${people.length - missing.length}/${people.length}`);
if (missing.length) {
  console.log(`Awaiting images/obituaries/<slug>.jpg for ${missing.length}:`);
  console.log(missing.map((p) => "  " + p.slug).join("\n"));
}
/* ---------- sitemap ----------
   Families search for a person by name. Without a sitemap Google has to find
   56 obituary pages by crawling alone; with one it is told about them
   directly. Regenerated on every build so it never goes stale. */
const ROOT_PAGES = [
  ["", 1.0],
  ["obituaries.html", 0.9],
  ["services.html", 0.8],
  ["caskets.html", 0.8],
  ["pre-planning.html", 0.7],
  ["about.html", 0.7],
  ["contact.html", 0.7],
];
const iso = (f) => {
  try { return fs.statSync(path.join(root, f)).mtime.toISOString().slice(0, 10); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
};
const urls = [
  ...ROOT_PAGES.map(([f, pri]) => ({ loc: `${SITE}/${f}`, mod: iso(f || "index.html"), pri })),
  ...people.map((p) => ({
    loc: `${SITE}/obituaries/${p.slug}.html`,
    mod: iso(`obituaries/${p.slug}.html`),
    pri: 0.6,
  })),
];
fs.writeFileSync(
  path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `<url><loc>${u.loc}</loc><lastmod>${u.mod}</lastmod><priority>${u.pri.toFixed(1)}</priority></url>`)
      .join("\n") +
    `\n</urlset>\n`
);
fs.writeFileSync(
  path.join(root, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`
);
console.log(`Sitemap: ${urls.length} URLs.`);

if (dateWarnings.length) {
  console.log(`\n!! ${dateWarnings.length} date(s) do not match the calendar:`);
  dateWarnings.forEach((w) => console.log(`  ${w}`));
} else {
  console.log("Every weekday-bearing date agrees with the calendar.");
}

const flagged = people.filter((p) => p.flag);
if (flagged.length) {
  console.log(`\n${flagged.length} record(s) need confirming before publishing:`);
  flagged.forEach((p) => console.log(`  ${p.name}: ${p.flag}`));
}
