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

/* Approved condolences only, keyed by slug. Everything a visitor submits goes
   to Sterling by email and to a Google Sheet; a message reaches the page only
   once it has been copied into this file. Keys beginning with "_" are notes. */
const condolences = JSON.parse(fs.readFileSync(path.join(root, "data/condolences.json"), "utf8"));

/* Thank-you messages from families Sterling has served. Same rule as the
   condolences: it reaches the page only once it has been copied in here. */
const testimonials = JSON.parse(fs.readFileSync(path.join(root, "data/testimonials.json"), "utf8"));

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

/* One list, used for both the desktop and the mobile nav. Keeping it in a
   single place is deliberate: the Livestreams link was once added to the
   desktop nav and missed in the mobile one, and the page it was missing from
   was the only page where "Obituasries" carried class="active", so the usual
   search-and-replace skipped it. `current` is the page's own file name. */
const NAV_ITEMS = [
  ["index.html", "Home"],
  ["about.html", "About"],
  ["services.html", "Services"],
  ["caskets.html", "Caskets"],
  ["obituaries.html", "Obituaries"],
  // Label, not filename: someone looking for the time of a funeral would never
  // think to click "Livestreams". The file name stays put so no link breaks.
  ["livestreams.html", "Funerals"],
  ["testimonials.html", "Testimonials"],
  ["pre-planning.html", "Pre-Planning"],
  ["contact.html", "Contact"],
];

const navLinks = (up, current, arrow) =>
  NAV_ITEMS.map(
    ([href, label]) =>
      `<a href="${up}${href}"${href === current ? ' class="active"' : ""}>${label}${arrow ? "<span>&#8599;</span>" : ""}</a>`
  ).join("\n");

const nav = (up, current = "obituaries.html") => `<div class="topbar"><p>Excellence Through Service</p><a href="tel:+12465717965">Available 24/7 &middot; (246) 571-7965</a></div>
<header class="site-header">
<a class="brand" href="${up}index.html" aria-label="Sterling Funeral Services home"><img class="brand-logo" src="${up}images/brand/logo-horizontal.png" alt="Sterling Funeral Services" /></a>
<nav class="desktop-nav" aria-label="Main navigation">
${navLinks(up, current, false)}
</nav>
<a class="header-call" href="tel:+12465717965"><span>Call anytime</span>(246) 571-7965</a>
<button class="menu-button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Toggle navigation"><span></span><span></span></button>
</header>
<div id="mobile-menu" class="mobile-menu" aria-hidden="true">
<nav aria-label="Mobile navigation">
${navLinks(up, current, true)}
</nav>
<a href="${up}contact.html" class="button gold">Arrange a consultation</a>
</div>`;

const contactBand = `<section class="contact-band">
<div><p class="eyebrow light">Excellence Through Service</p><h2>We&rsquo;re here, <em>24 hours a day.</em></h2><p>When you are ready to talk, a caring member of our team is only a call or message away.</p></div>
<div class="contact-band-actions">
<a class="button gold" href="tel:+12465717965">Call (246) 571-7965 <span>&#8599;</span></a>
<a class="button outline" href="https://wa.me/12462349195" target="_blank" rel="noreferrer">WhatsApp <span>&#8599;</span></a>
</div>
</section>`;

const footer = (up) => `<footer>
<div class="footer-main">
<div class="footer-brand"><a class="brand" href="${up}index.html"><img class="brand-logo" src="${up}images/brand/logo-horizontal.png" alt="Sterling Funeral Services" /></a><p>Compassionate guidance and dignified care, whenever your family needs us.</p></div>
<div><h4>Explore</h4><a href="${up}about.html">About us</a><a href="${up}services.html">Our services</a><a href="${up}caskets.html">Casket collection</a><a href="${up}obituaries.html">Obituaries</a><a href="${up}livestreams.html">Funerals</a><a href="${up}testimonials.html">Testimonials</a><a href="${up}pre-planning.html">Pre-planning</a></div>
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

/* The guestbook. Two routes out, because the client wants every message to
   reach the family even when it is not published: the form posts to Sterling,
   and a private link writes to them directly without going near the page. */
function condolenceSection(p) {
  const approved = Array.isArray(condolences[p.slug]) ? condolences[p.slug] : [];
  const first = splitName(p.name).first;

  const list = approved.length
    ? `<ul class="condolence-list">\n${approved
        .map(
          (c) => `<li>
<blockquote>${txt(c.message)}</blockquote>
<p class="condolence-by">${txt(c.name)}${c.relationship ? ` <span>&middot; ${txt(c.relationship)}</span>` : ""}</p>
</li>`
        )
        .join("\n")}\n</ul>`
    : `<p class="condolence-empty">No messages have been published yet. Yours would be the first.</p>`;

  const subject = encodeURIComponent(`Condolence for ${p.name}`);

  return `<section class="condolences">
<div class="condolence-inner">
<p class="eyebrow">Condolences</p>
<h2>Leave a message<br/><em>for the family.</em></h2>
<p class="condolence-lede">Every message is passed to ${txt(first)}&rsquo;s family. Sterling reads each one before it appears here, so please allow a little time.</p>
${list}
<form class="condolence-form" data-person="${esc(p.name)}" data-slug="${esc(p.slug)}">
<div class="field-row">
<div class="field"><label for="c-name">Your name</label><input id="c-name" name="name" required /></div>
<div class="field"><label for="c-relationship">How did you know ${txt(first)}? <span class="opt">(optional)</span></label><input id="c-relationship" name="relationship" placeholder="Friend, neighbour, colleague&hellip;" /></div>
</div>
<div class="field"><label for="c-email">Your email <span class="opt">(optional &mdash; so the family can reply)</span></label><input id="c-email" name="email" type="email" /></div>
<div class="field"><label for="c-message">Your message</label><textarea id="c-message" name="message" rows="5" required></textarea></div>
<div class="hp" aria-hidden="true"><label for="c-website">Leave this empty</label><input id="c-website" name="website" tabindex="-1" autocomplete="off" /></div>
<button class="button wine" type="submit">Send your message <span>&#8599;</span></button>
<p class="form-note" role="status">Your message goes to Sterling, who will pass it to the family. It appears on this page only once they have read it.</p>
</form>
<p class="condolence-private">Would you rather write privately? <a href="mailto:sterlingfuneralservices@gmail.com?subject=${subject}">Email the family through Sterling</a> and nothing is published.</p>
</div>
</section>`;
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
  }${
    Array.isArray(p.serviceNotes) && p.serviceNotes.length
      ? `<p>${p.serviceNotes.map((note) => txt(note)).join("<br/>")}</p>`
      : ""
  }</div>
${
    // A real button, as on the Funerals page. It used to be a text link
    // reading only the streaming company's name, which nobody took for "watch".
    p.livestream
      ? `<div class="memorial-watch"><small>Watch the service</small><a class="button wine service-watch" href="${esc(p.livestream.url)}" target="_blank" rel="noreferrer">Watch now <span>&#8599;</span></a><p class="memorial-watch-via">Streamed by ${txt(p.livestream.label)}</p></div>`
      : ""
  }
<p><small>Condolences</small><br/>May be sent to <a href="mailto:sterlingfuneralservices@gmail.com">sterlingfuneralservices@gmail.com</a>.<br/><br/>Professional services entrusted to Sterling Funeral Services, #6 Sterling, Black Rock, St. Michael.</p>
</aside>
</div>
</section>
${condolenceSection(p)}
${contactBand}
</main>
${footer("../")}
`;
}

/* ---------- services & livestreams page ----------
   Two audiences: people trying to attend something that has not happened yet,
   and people who missed a service and want to watch it back. Upcoming first,
   because someone checking on the morning of a funeral needs it immediately. */
function serviceDateISO(p) {
  const m = String(p.service || "").match(
    new RegExp(`(${MONTH_NAMES.join("|")})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})`)
  );
  if (!m) return null;
  return `${m[3]}-${String(MONTH_NAMES.indexOf(m[1]) + 1).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`;
}

function servicesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const dated = people.map((p) => ({ p, iso: serviceDateISO(p) }));

  const upcoming = dated
    .filter((x) => x.iso && x.iso >= today)
    .sort((a, b) => a.iso.localeCompare(b.iso));
  const watchable = dated
    .filter((x) => x.p.livestream && !(x.iso && x.iso >= today))
    .sort((a, b) => String(b.iso || "").localeCompare(String(a.iso || "")));

  const row = (x) => {
    const p = x.p;
    const photo = photoFor(p.slug);
    return `<article class="service-row">
<a class="service-face" href="obituaries/${p.slug}.html" aria-label="View the obituary for ${esc(p.name)}">${
      photo
        ? `<img src="images/obituaries/${photo}" alt="" loading="lazy" />`
        : `<span class="monogram small">${esc(initials(p.name))}</span>`
    }</a>
<div class="service-detail">
<h3><a href="obituaries/${p.slug}.html">${txt(p.name)}</a></h3>
<p class="service-when">${txt(p.service || "Details available on request")}</p>
${p.venue ? `<p class="service-where">${txt(p.venue)}</p>` : ""}
</div>
${
  p.livestream
    ? `<a class="button wine service-watch" href="${esc(p.livestream.url)}" target="_blank" rel="noreferrer">Watch <span>&#8599;</span></a>`
    : `<span class="service-nostream">No livestream</span>`
}
</article>`;
  };

  const section = (title, lede, rows, empty) =>
    `<div class="service-block">
<h2>${title}</h2>
<p class="lead-note">${lede}</p>
${rows.length ? rows.map(row).join("\n") : `<p class="condolence-empty">${empty}</p>`}
</div>`;

  const desc =
    "Upcoming funeral services arranged by Sterling Funeral Services, and livestream links for services families can watch from anywhere.";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Services &amp; Livestreams | Sterling Funeral Services</title>
<meta name="description" content="${esc(desc)}" />
<link rel="icon" type="image/png" href="favicon-32.png" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="stylesheet" href="css/styles.css" />
<link rel="canonical" href="${SITE}/livestreams.html" />
<meta property="og:url" content="${SITE}/livestreams.html" />
<meta property="og:site_name" content="Sterling Funeral Services" />
<meta property="og:title" content="Services &amp; Livestreams | Sterling Funeral Services" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />
</head>
<body>
${nav("", "livestreams.html")}
<main>
<section class="page-hero">
<div class="page-hero-image" style="background-image:url('images/gallery/procession-walk.jpg');background-position:center 15%"></div>
<div class="page-hero-shade"></div>
<div class="page-hero-content">
<p class="eyebrow light">Services &amp; Livestreams</p>
<h1>Be there,<br/><em>wherever you are.</em></h1>
<p>Service details for the families in our care, and livestream links for those who cannot be with us in person.</p>
</div>
</section>
<section class="page-body services-page">
${section(
  "Upcoming services",
  "Services still to come. Times are as published in the notice — please arrive a little early.",
  upcoming,
  "There are no services scheduled at the moment. Please contact Sterling if you are expecting details."
)}
${section(
  "Watch a service",
  "Services that have taken place and were streamed. Links are provided by the streaming service and may not stay available indefinitely.",
  watchable,
  "No streamed services are listed yet."
)}
</section>
${contactBand}
</main>
${footer("")}
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
<div class="obituary-card-actions">
<a class="link-arrow" href="${href}">View obituary <span>&#8594;</span></a>${
    p.livestream
      ? `\n<a class="button wine card-watch" href="${esc(p.livestream.url)}" target="_blank" rel="noreferrer" aria-label="Watch the service for ${esc(p.name)}">Watch <span>&#8599;</span></a>`
      : ""
  }
</div>
</div>
</article>`;
}

/* ---------- upcoming funerals, on the home page ----------
   Someone who has heard a death announced on the radio comes to the home page
   wanting one thing: the day and the time. This puts it above everything else.
   When nothing is upcoming the band is omitted entirely rather than rendered
   empty - a permanently empty "Upcoming funerals" heading reads as neglect. */
function upcomingBlock() {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = people
    .map((p) => ({ p, iso: serviceDateISO(p) }))
    .filter((x) => x.iso && x.iso >= today)
    .sort((a, b) => a.iso.localeCompare(b.iso));

  if (!upcoming.length) return "";

  const row = ({ p }) => `<article class="upcoming-row">
<div><h3><a href="obituaries/${p.slug}.html">${txt(p.name)}</a></h3>
<p class="upcoming-when">${txt(p.service)}</p>
${p.venue ? `<p class="upcoming-where">${txt(p.venue)}</p>` : ""}</div>
${p.livestream ? `<a class="button wine card-watch" href="${esc(p.livestream.url)}" target="_blank" rel="noreferrer" aria-label="Watch the service for ${esc(p.name)} live">Watch live <span>&#8599;</span></a>` : ""}
</article>`;

  return `<section class="section upcoming-home" aria-label="Upcoming funerals">
<div class="copy-block">
<p class="eyebrow">Upcoming funerals</p>
<h2>Services<br/><em>still to come.</em></h2>
</div>
<div class="upcoming-list">
${upcoming.map(row).join("\n")}
</div>
<a class="link-arrow" href="livestreams.html">All services and livestreams <span>&#8594;</span></a>
</section>`;
}

/* ---------- testimonials ----------
   Words families sent Sterling afterwards. Nothing here is generated or
   paraphrased: an entry exists only because a family wrote it and agreed to
   it being shown. The page works with an empty list, because an honest
   invitation reads better than an invented quote. */
function testimonialsPage() {
  const entries = Array.isArray(testimonials.entries) ? testimonials.entries : [];

  const quote = (t) => {
    const attrib = [t.about ? txt(t.about) : null, t.date ? txt(t.date) : null]
      .filter(Boolean)
      .join(" &middot; ");
    // A thank-you note is often several paragraphs. Without this they run
    // together into one slab, which is unreadable at this length.
    const paras = String(t.message)
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `<p>${txt(s)}</p>`)
      .join("\n");

    return `<li>
<blockquote>${paras}</blockquote>
<p class="condolence-by">${txt(t.from)}${attrib ? ` <span>&middot; ${attrib}</span>` : ""}</p>
</li>`;
  };

  const list = entries.length
    ? `<ul class="condolence-list testimonial-list">\n${entries.map(quote).join("\n")}\n</ul>`
    : `<p class="condolence-empty">We are gathering messages from the families we have served. If Sterling cared for someone you love, yours would be the first.</p>`;

  const desc =
    "What families across Barbados say about the care they received from Sterling Funeral Services.";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Testimonials | Sterling Funeral Services</title>
<meta name="description" content="${esc(desc)}" />
<link rel="icon" type="image/png" href="favicon-32.png" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="stylesheet" href="css/styles.css" />
<link rel="canonical" href="${SITE}/testimonials.html" />
<meta property="og:url" content="${SITE}/testimonials.html" />
<meta property="og:site_name" content="Sterling Funeral Services" />
<meta property="og:title" content="Testimonials | Sterling Funeral Services" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta name="twitter:card" content="summary_large_image" />
</head>
<body>
${nav("", "testimonials.html")}
<main>
<section class="page-hero">
<div class="page-hero-image" style="background-image:url('images/gallery/floral-tribute.jpg');background-position:center 45%"></div>
<div class="page-hero-shade"></div>
<div class="page-hero-content">
<p class="eyebrow light">Testimonials</p>
<h1>In the words<br/><em>of the families we serve.</em></h1>
<p>Excellence through service is not a line we wrote for ourselves. These are messages from families Sterling has cared for.</p>
</div>
</section>
<section class="page-body testimonials-page">
<div class="condolence-inner">
<p class="eyebrow">Thank you notes</p>
<h2>Messages from<br/><em>families we have served.</em></h2>
${list}
<form class="condolence-form testimonial-form" data-person="Sterling Funeral Services" data-slug="testimonials" data-kind="Testimonial" data-thanks="Thank you for taking the time to write to us. Sterling will read your message, and will ask you first if we would like to show it on this page.">
<p class="eyebrow">Share your experience</p>
<p class="condolence-lede">If Sterling cared for someone you love, we would be grateful to hear how we did &mdash; the difficult parts as well as the kind ones. Nothing appears on this page unless you are happy for it to.</p>
<div class="field-row">
<div class="field"><label for="c-name">Your name</label><input id="c-name" name="name" required /></div>
<div class="field"><label for="c-relationship">Who were we caring for? <span class="opt">(optional)</span></label><input id="c-relationship" name="relationship" placeholder="My mother, Brenda&hellip;" /></div>
</div>
<div class="field"><label for="c-email">Your email <span class="opt">(optional &mdash; so we can reply)</span></label><input id="c-email" name="email" type="email" /></div>
<div class="field"><label for="c-message">Your message</label><textarea id="c-message" name="message" rows="5" required></textarea></div>
<div class="hp" aria-hidden="true"><label for="c-website">Leave this empty</label><input id="c-website" name="website" tabindex="-1" autocomplete="off" /></div>
<button class="button wine" type="submit">Send your message <span>&#8599;</span></button>
<p class="form-note" role="status">Your message goes to Sterling. We will ask before showing it here.</p>
</form>
<p class="condolence-private">You can also write to us directly at <a href="mailto:sterlingfuneralservices@gmail.com?subject=${encodeURIComponent("A message for Sterling")}">sterlingfuneralservices@gmail.com</a>.</p>
</div>
</section>
${contactBand}
</main>
${footer("")}
`;
}

/* ---------- write ---------- */

let written = 0;
for (const p of people) {
  fs.writeFileSync(path.join(root, "obituaries", p.slug + ".html"), memorialPage(p));
  written++;
}

fs.writeFileSync(path.join(root, "livestreams.html"), servicesPage());
fs.writeFileSync(path.join(root, "testimonials.html"), testimonialsPage());

/* Home page: replace whatever sits between the markers. Regex is anchored on
   HTML comments so the rest of the hand-written page is never touched. */
const homePath = path.join(root, "index.html");
let home = fs.readFileSync(homePath, "utf8");
const homeBlock = /<!-- upcoming:start -->[\s\S]*?<!-- upcoming:end -->/;
if (!homeBlock.test(home)) throw new Error("upcoming markers not found in index.html");
fs.writeFileSync(
  homePath,
  home.replace(homeBlock, "<!-- upcoming:start -->" + upcomingBlock() + "<!-- upcoming:end -->")
);

const indexPath = path.join(root, "obituaries.html");
let index = fs.readFileSync(indexPath, "utf8");
const grid = `<div class="obituary-grid">\n${people.map(card).join("\n")}\n</div>`;
// \r?\n so this still matches when git checks the file out with CRLF endings
const gridBlock = /<div class="obituary-grid">[\s\S]*?\r?\n<\/div>\r?\n<\/section>/;
if (!gridBlock.test(index)) throw new Error("obituary-grid block not found in obituaries.html");
// note: an unchanged result just means the index was already up to date
fs.writeFileSync(indexPath, index.replace(gridBlock, grid + "\n</section>"));

/* ---------- fingerprint local assets ----------
   GitHub Pages sends every file with max-age=600 and we cannot change that,
   so a replaced photo kept showing the old picture for up to ten minutes -
   longer from GitHub's own cache - even after a refresh. Every reference to a
   local image, the stylesheet and the script gets ?v=<first 8 of an md5 of
   the file>. Change the file and its address changes, so the new one is
   fetched at once; leave it alone and the address, and the cache, stay put.
   Runs over every page, hand-written ones included, and is idempotent: an
   existing ?v= is replaced, never stacked. Run the build after changing ANY
   photo, even one on a hand-written page such as caskets.html. */
const crypto = require("crypto");
const hashCache = new Map();
function fingerprint(rel) {
  if (!hashCache.has(rel)) {
    const abs = path.join(root, rel);
    hashCache.set(
      rel,
      fs.existsSync(abs) ? crypto.createHash("md5").update(fs.readFileSync(abs)).digest("hex").slice(0, 8) : null
    );
  }
  return hashCache.get(rel);
}
// The path always starts at images/, css/ or js/ - whatever precedes it
// ("../", the site URL) is left untouched. It must end at a quote, pipe
// (data-images lists), bracket or whitespace, so partial names never match.
const ASSET = /\b((?:images\/[\w\-\/.]+?\.(?:jpe?g|png|webp|gif|svg))|css\/styles\.css|js\/main\.js)(?:\?v=[0-9a-f]{8})?(?=["'|)\s])/g;
const stamp = (text) =>
  text.replace(ASSET, (whole, rel) => {
    const v = fingerprint(rel);
    return v ? `${rel}?v=${v}` : rel;
  });

// The stylesheet first: its own fingerprint must reflect its stamped content.
{
  const cssPath = path.join(root, "css/styles.css");
  const css = fs.readFileSync(cssPath, "utf8");
  const cssOut = css.replace(/url\((['"]?)\.\.\/((?:images)\/[^'")?]+)(?:\?v=[0-9a-f]{8})?\1\)/g, (m, q, rel) => {
    const v = fingerprint(rel);
    return v ? `url(${q}../${rel}?v=${v}${q})` : m;
  });
  if (cssOut !== css) fs.writeFileSync(cssPath, cssOut);
  hashCache.delete("css/styles.css");
}

let stamped = 0;
const pages = [
  ...fs.readdirSync(root).filter((f) => f.endsWith(".html")),
  ...fs.readdirSync(path.join(root, "obituaries")).filter((f) => f.endsWith(".html")).map((f) => "obituaries/" + f),
];
for (const rel of pages) {
  const abs = path.join(root, rel);
  const html = fs.readFileSync(abs, "utf8");
  const out = stamp(html);
  if (out !== html) {
    fs.writeFileSync(abs, out);
    stamped++;
  }
}
console.log(`Fingerprinted asset links on all ${pages.length} pages.`);

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
  ["livestreams.html", 0.9],
  ["testimonials.html", 0.8],
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
