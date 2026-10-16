/* Sterling Funeral Services — obituary upload portal (portal/index.html).
 *
 * Sheradan adds, edits or removes an obituary here. The portal changes ONE
 * record in data/obituaries.json (plus the photo) and commits it straight to
 * GitHub; the "Rebuild site" GitHub Action (.github/workflows/rebuild.yml)
 * then runs tools/build-obituaries.js and the pages go live through GitHub
 * Pages. Nothing here generates HTML for the site itself - the build stays
 * the single source of how a page looks.
 *
 * Access is a fine-grained GitHub token limited to this one repository
 * (Contents: read and write). It is kept in this browser's localStorage and
 * sent nowhere but api.github.com - the page's Content-Security-Policy
 * forbids any other destination.
 *
 * Records are written exactly the way they were written by hand: same field
 * names, same key order, same date wording ("Saturday, October 17th, 2026 at
 * 10:00am"), 1-space JSON indentation - so a portal edit diffs cleanly
 * against the hand-made ones. Weekdays are computed, never typed, so the
 * calendar check in the build can't fail on a portal entry.
 */
(function () {
  "use strict";

  var REPO = "Technovabb/sterling-funeral-services";
  var BRANCH = "main";
  var API = "https://api.github.com";
  var KEY_STORE = "sterling-portal-key";
  var DATA_PATH = "data/obituaries.json";
  var IMG_DIR = "images/obituaries";
  var KD34_LIVE = "https://www.youtube.com/@kd34streamingservices42/live";
  var KNOWN_PROVIDERS = ["KD34 Streaming Services", "Sharing Memories Forever", "Eternally Cherished", "The Funeral Company"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  // Field order of a record, as the hand-made ones are written.
  var KEY_ORDER = ["slug", "name", "aka", "age", "address", "occupation", "born", "died", "diedText", "service", "venue", "interment", "family", "source", "flag", "livestream", "serviceNotes", "summary"];

  /* ---------------- small helpers ---------------- */

  function $(sel) { return document.querySelector(sel); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  // Today on this device's own clock (Barbados), not UTC.
  function todayISO() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function ordinal(n) {
    var s = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
    return n + s;
  }
  function weekday(iso) { var p = iso.split("-").map(Number); return DAYS[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()]; }
  // "2026-10-17" -> "Saturday, October 17th, 2026"
  function longDate(iso) { var p = iso.split("-").map(Number); return weekday(iso) + ", " + MONTHS[p[1] - 1] + " " + ordinal(p[2]) + ", " + p[0]; }
  // "14:00" -> "2:00pm"
  function timeText(hhmm) {
    var p = hhmm.split(":").map(Number), h = p[0], m = p[1];
    return (h % 12 === 0 ? 12 : h % 12) + ":" + pad(m) + (h < 12 ? "am" : "pm");
  }
  var MONTH_RE = MONTHS.join("|");
  // Reads both portal wording and the hand-typed variants already in the data:
  // "at 10am", "at 9.30am", "at 4.00PM", "at 12:00 noon".
  var SERVICE_RE = new RegExp("^(?:" + DAYS.join("|") + "),?\\s+(" + MONTH_RE + ")\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})(?:\\s+at\\s+(\\d{1,2})(?:[:.](\\d{2}))?\\s*(am|pm|noon))?\\s*$", "i");
  function parseService(text) {
    var m = String(text || "").trim().match(SERVICE_RE);
    if (!m) return null;
    var month = MONTHS.findIndex(function (x) { return x.toLowerCase() === m[1].toLowerCase(); }) + 1;
    var iso = m[3] + "-" + pad(month) + "-" + pad(+m[2]);
    var time = "";
    if (m[4]) {
      var h = +m[4], min = m[5] ? +m[5] : 0, ap = m[6].toLowerCase();
      if (ap === "pm" && h < 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
      time = pad(h) + ":" + pad(min);
    }
    return { date: iso, time: time };
  }
  function slugify(name) {
    // apostrophes vanish rather than split a name: O'Neal -> oneal, not o-neal
    return String(name).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['‘’]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  // Typographic quotes, as in the rest of the data.
  function curly(s) {
    return String(s)
      .replace(/(^|[\s(\[{—-])'/g, "$1‘").replace(/'/g, "’")
      .replace(/(^|[\s(\[{—-])"/g, "$1“").replace(/"/g, "”");
  }
  function clean(s) { return curly(String(s || "").replace(/\s+/g, " ").trim()); }
  function lines(s) { return String(s || "").split(/\r?\n/).map(clean).filter(Boolean); }
  function ageBetween(born, died) {
    var b = born.split("-").map(Number), d = died.split("-").map(Number);
    var a = d[0] - b[0];
    if (d[1] < b[1] || (d[1] === b[1] && d[2] < b[2])) a--;
    return a;
  }
  function initials(name) {
    return String(name).replace(/\bn[eé]e\b.*$/i, "").split(/\s+/).filter(function (w) { return /^[A-Za-z]/.test(w); })
      .slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join("");
  }
  function utf8FromB64(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }
  function b64FromBytes(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------- GitHub ---------------- */

  var token = null;
  try { token = localStorage.getItem(KEY_STORE); } catch (e) { token = null; }

  function gh(path, opts) {
    opts = opts || {};
    var headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (opts.auth !== false && token) headers.Authorization = "Bearer " + token;
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch(API + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    }).then(function (res) {
      if (res.ok) return res.status === 204 ? null : res.json();
      return res.json().catch(function () { return {}; }).then(function (j) {
        var e = new Error(j.message || res.statusText || "GitHub said no");
        e.status = res.status;
        throw e;
      });
    });
  }

  // The current state of the site: head commit, every record, every photo.
  function readState() {
    return gh("/repos/" + REPO + "/git/ref/heads/" + BRANCH).then(function (ref) {
      var head = ref.object.sha;
      return Promise.all([
        gh("/repos/" + REPO + "/contents/" + DATA_PATH + "?ref=" + head),
        gh("/repos/" + REPO + "/contents/" + IMG_DIR + "?ref=" + head),
      ]).then(function (r) {
        var file = r[0];
        var text = file.content
          ? Promise.resolve(utf8FromB64(file.content))
          : gh("/repos/" + REPO + "/git/blobs/" + file.sha).then(function (b) { return utf8FromB64(b.content); });
        return text.then(function (t) {
          return { head: head, text: t, people: JSON.parse(t), images: r[1].map(function (f) { return f.name; }) };
        });
      });
    });
  }

  /* One commit holding the record change and the photo together, so the
     site never sees one without the other. The record change is re-applied
     to the freshest copy of the data on every attempt, so two people (or the
     nightly rebuild) publishing at once can't overwrite each other. */
  function commitChange(change) {
    var photoBlob = change.photoB64
      ? gh("/repos/" + REPO + "/git/blobs", { method: "POST", body: { content: change.photoB64, encoding: "base64" } }).then(function (b) { return b.sha; })
      : Promise.resolve(null);

    return photoBlob.then(function (photoSha) {
      function attempt(n) {
        return readState().then(function (st) {
          var before = st.text;
          var removePaths = change.apply(st.people, st.images) || [];
          var json = JSON.stringify(st.people, null, 1) + "\n";
          if (json === before && !photoSha && !removePaths.length) return { unchanged: true };
          return Promise.all([
            gh("/repos/" + REPO + "/git/commits/" + st.head),
            gh("/repos/" + REPO + "/git/blobs", { method: "POST", body: { content: json, encoding: "utf-8" } }),
          ]).then(function (r) {
            var tree = [{ path: DATA_PATH, mode: "100644", type: "blob", sha: r[1].sha }];
            var photoPath = photoSha ? IMG_DIR + "/" + change.slug + ".jpg" : null;
            removePaths.forEach(function (p) {
              if (p !== photoPath) tree.push({ path: p, mode: "100644", type: "blob", sha: null });
            });
            if (photoPath) tree.push({ path: photoPath, mode: "100644", type: "blob", sha: photoSha });
            return gh("/repos/" + REPO + "/git/trees", { method: "POST", body: { base_tree: r[0].tree.sha, tree: tree } });
          }).then(function (t) {
            return gh("/repos/" + REPO + "/git/commits", { method: "POST", body: { message: change.message, tree: t.sha, parents: [st.head] } });
          }).then(function (c) {
            return gh("/repos/" + REPO + "/git/refs/heads/" + BRANCH, { method: "PATCH", body: { sha: c.sha, force: false } })
              .then(function () { return { sha: c.sha }; });
          }).catch(function (e) {
            // 422 = someone else published first; start again from their version
            if (e.status === 422 && n < 4) return wait(800 * n).then(function () { return attempt(n + 1); });
            throw e;
          });
        });
      }
      return attempt(1);
    });
  }

  /* ---------------- views ---------------- */

  var state = { people: [], images: [], editing: null };

  function show(name) {
    ["connect", "list", "edit", "done"].forEach(function (v) { $("#view-" + v).hidden = v !== name; });
    $("#signout").hidden = !token;
    window.scrollTo(0, 0);
  }

  function friendlyError(e) {
    if (e.status === 401) return "The access key has expired or been withdrawn. Call Tech Nova for a new one.";
    if (e.status === 403 || e.status === 404) return "This access key can’t make changes to the Sterling website. Call Tech Nova.";
    if (e.status === 409 || e.status === 422) return "Someone else changed the website at the same moment. Please try again.";
    if (!navigator.onLine) return "This device is offline. Check the internet connection and try again.";
    return "Something went wrong (" + (e.message || "unknown error") + "). Nothing was changed. Try again, or call Tech Nova.";
  }

  function needKey(msg) {
    token = null;
    try { localStorage.removeItem(KEY_STORE); } catch (e) { /* private mode */ }
    $("#connect-msg").textContent = msg || "";
    $("#connect-msg").className = "pt-msg err";
    show("connect");
  }

  function loadList(message) {
    $("#loading").hidden = false;
    return readState().then(function (st) {
      state.people = st.people;
      state.images = st.images;
      $("#loading").hidden = true;
      renderList();
      $("#list-msg").textContent = message || "";
      $("#list-msg").className = "pt-msg ok";
      show("list");
    }).catch(function (e) {
      $("#loading").hidden = true;
      if (e.status === 401 || e.status === 404 || e.status === 403) return needKey(friendlyError(e));
      $("#list-msg").textContent = friendlyError(e);
      $("#list-msg").className = "pt-msg err";
      show("list");
    });
  }

  function photoFile(slug) {
    for (var i = 0, ext = [".jpg", ".png", ".webp"]; i < ext.length; i++) {
      if (state.images.indexOf(slug + ext[i]) !== -1) return slug + ext[i];
    }
    return null;
  }

  function serviceISO(p) { var s = parseService(p.service); return s ? s.date : ""; }

  function renderList() {
    var q = $("#search").value.trim().toLowerCase();
    var today = todayISO();
    var rows = state.people.slice().filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) !== -1; });
    // services still to come first, soonest first; then everyone else, most recent passing first
    rows.sort(function (a, b) {
      var sa = serviceISO(a), sb = serviceISO(b), ua = sa >= today, ub = sb >= today;
      if (ua !== ub) return ua ? -1 : 1;
      if (ua) return sa.localeCompare(sb);
      return String(b.died || b.sortDate || "").localeCompare(String(a.died || a.sortDate || ""));
    });
    if (!rows.length) {
      $("#list").innerHTML = '<p class="pt-small">' + (q ? "No obituary matches “" + esc(q) + "”." : "No obituaries yet.") + "</p>";
      return;
    }
    $("#list").innerHTML = rows.map(function (p) {
      var file = photoFile(p.slug), svc = serviceISO(p), upcoming = svc >= today;
      var badges = [];
      if (upcoming) badges.push('<span class="pt-badge up">Upcoming</span>');
      if (upcoming && !p.livestream) badges.push('<span class="pt-badge warn">No livestream link</span>');
      if (p.livestream && /\/live\/?$/.test(p.livestream.url) && !upcoming) badges.push('<span class="pt-badge warn">Swap in the recording</span>');
      if (!file) badges.push('<span class="pt-badge warn">No photo</span>');
      var thumb = file
        ? '<img class="pt-thumb" src="../' + IMG_DIR + "/" + esc(file) + '" alt="" loading="lazy" />'
        : '<span class="pt-thumb mono">' + esc(initials(p.name)) + "</span>";
      return '<div class="pt-row">' + thumb +
        "<div><h3>" + esc(p.name) + "</h3><p>" + (svc ? "Service " + esc(longDate(svc)) : esc(p.service || "")) + "</p>" +
        (badges.length ? '<div class="pt-badges">' + badges.join("") + "</div>" : "") + "</div>" +
        '<button type="button" class="button outline-dark" data-edit="' + esc(p.slug) + '">Edit <span>&#8594;</span></button></div>';
    }).join("");
  }

  /* ---------------- the form ---------------- */

  var F = {};
  ["name", "aka", "born", "died", "age", "occupation", "address", "summary", "svc-date", "svc-time", "venue", "interment", "notes", "ls-provider", "ls-label", "ls-url", "family", "flag"]
    .forEach(function (k) { F[k] = document.getElementById("f-" + k); });

  var original = null; // the record being edited, untouched
  var origService = null; // its service as parsed, so an untouched date keeps its wording
  var ageTouched = false;

  function openEditor(p) {
    original = p ? JSON.parse(JSON.stringify(p)) : null;
    ageTouched = !!(p && p.age && !p.born);
    $("#edit-form").reset();
    resetPhoto();
    $("#edit-eyebrow").textContent = p ? "Editing" : "New obituary";
    $("#edit-title").textContent = p ? p.name : "Add an obituary";
    $("#remove").hidden = !p;
    $("#publish").firstChild.textContent = p ? "Publish the changes " : "Publish to the website ";

    var note = $("#edit-note");
    note.hidden = true;

    if (p) {
      F.name.value = p.name || "";
      F.aka.value = p.aka || "";
      F.born.value = p.born || "";
      F.died.value = p.died || "";
      F.age.value = p.age != null ? p.age : "";
      F.occupation.value = p.occupation || "";
      F.address.value = p.address || "";
      F.summary.value = p.summary || "";
      origService = parseService(p.service);
      F["svc-date"].value = origService ? origService.date : "";
      F["svc-time"].value = origService ? origService.time : "";
      $("#svc-asis").hidden = !!origService;
      $("#svc-asis").textContent = origService ? "" : "Service as written: “" + (p.service || "") + "”. Leave the date empty to keep it exactly as it is.";
      F.venue.value = p.venue || "";
      F.interment.value = p.interment || "";
      F.notes.value = (p.serviceNotes || []).join("\n");
      F.family.value = (p.family || []).join("\n");
      F.flag.value = p.flag || "";
      if (p.livestream) {
        var known = KNOWN_PROVIDERS.indexOf(p.livestream.label) !== -1;
        F["ls-provider"].value = known ? p.livestream.label : "other";
        F["ls-label"].value = known ? "" : p.livestream.label;
        F["ls-url"].value = p.livestream.url || "";
      }
      var file = photoFile(p.slug);
      if (file) {
        $("#current-img").src = "../" + IMG_DIR + "/" + file + "?t=" + Date.now();
        $("#current-photo").hidden = false;
      }
      if (/\/live\/?$/.test((p.livestream || {}).url || "") && serviceISO(p) < todayISO()) {
        note.textContent = "This service has taken place, and the livestream still points at the live page. Paste in the recording’s own link so it can be watched later.";
        note.hidden = false;
      }
    } else {
      origService = null;
      $("#svc-asis").hidden = true;
    }
    syncLivestream();
    refresh();
    show("edit");
  }

  function syncLivestream() {
    var prov = F["ls-provider"].value;
    $("#ls-label-field").hidden = prov !== "other";
    $("#ls-url-field").hidden = !prov;
    var upcoming = F["svc-date"].value && F["svc-date"].value >= todayISO();
    $("#kd34-live").hidden = !(prov === "KD34 Streaming Services" && upcoming && !F["ls-url"].value);
    $("#ls-tip").hidden = !(prov && /\/live\/?$/.test(F["ls-url"].value));
  }

  // Build the record from the form, keeping every field the form doesn't know.
  function recordFromForm() {
    var name = clean(F.name.value);
    var rec = original ? JSON.parse(JSON.stringify(original)) : {};
    rec.slug = original ? original.slug : slugify(name.replace(/\bn[eé]e\b/i, "nee"));
    rec.name = name;

    function set(key, val) { if (val === "" || val == null || (Array.isArray(val) && !val.length)) delete rec[key]; else rec[key] = val; }

    set("aka", clean(F.aka.value));
    set("age", F.age.value === "" ? null : Number(F.age.value));
    set("address", clean(F.address.value));
    set("occupation", clean(F.occupation.value));
    set("born", F.born.value);
    if (F.died.value) {
      rec.died = F.died.value;
      if (!original || original.died !== F.died.value || !original.diedText) rec.diedText = longDate(F.died.value);
    } else if (!original) {
      delete rec.died;
      delete rec.diedText;
    }
    var d = F["svc-date"].value, t = F["svc-time"].value;
    var unchanged = origService && origService.date === d && origService.time === t;
    if (d && !unchanged) rec.service = longDate(d) + (t ? " at " + timeText(t) : "");
    else if (!d && !original) delete rec.service;
    set("venue", clean(F.venue.value));
    set("interment", clean(F.interment.value));
    rec.family = lines(F.family.value);
    if (!original) rec.source = "portal";
    set("flag", clean(F.flag.value));
    var prov = F["ls-provider"].value, url = F["ls-url"].value.trim();
    if (prov && url) set("livestream", { label: prov === "other" ? clean(F["ls-label"].value) || "Livestream" : prov, url: url });
    else delete rec.livestream;
    set("serviceNotes", lines(F.notes.value));
    set("summary", clean(F.summary.value));

    // canonical key order, then anything else the record already carried
    var out = {};
    KEY_ORDER.forEach(function (k) { if (k in rec) out[k] = rec[k]; });
    Object.keys(rec).forEach(function (k) { if (!(k in out)) out[k] = rec[k]; });
    return out;
  }

  function check(rec) {
    var errs = [], warns = [], today = todayISO();
    var svc = parseService(rec.service);
    if (!rec.name) errs.push("Enter the person’s full name.");
    if (!original && !F.died.value) errs.push("Enter the date of passing.");
    if (!rec.service) errs.push("Enter the service date.");
    if (F.died.value && F.died.value > today) errs.push("The date of passing is in the future.");
    if (F.born.value && F.died.value && F.born.value >= F.died.value) errs.push("The date of birth is after the date of passing.");
    if (svc && rec.died && svc.date < rec.died) errs.push("The service date is before the date of passing.");
    if (rec.livestream && !/^https:\/\/\S+\.\S+/.test(rec.livestream.url)) errs.push("The livestream link must be a full web address starting with https://");
    if (F["ls-provider"].value && !F["ls-url"].value.trim()) warns.push("A streaming company is chosen but there’s no link, so no Watch button will show.");
    if (!original && state.people.some(function (p) { return p.slug === rec.slug; })) {
      errs.push("There is already an obituary for " + rec.name + ". Edit that one instead, from the list.");
    }
    if (F.born.value && F.died.value && rec.age != null && Math.abs(ageBetween(F.born.value, F.died.value) - rec.age) > 0) {
      warns.push("The age (" + rec.age + ") doesn’t match the dates, which give " + ageBetween(F.born.value, F.died.value) + ".");
    }
    if (!rec.venue) warns.push("No church or venue is given.");
    if (!rec.family.length) warns.push("No family lines are given.");
    if (!crop.bitmap && !(original && photoFile(original.slug))) warns.push("No photo. A gold monogram will show until one is added.");
    if (svc && svc.date >= today && !rec.livestream) warns.push("The service is upcoming and has no livestream link.");
    return { errs: errs, warns: warns };
  }

  function blurb(p) {
    if (p.summary) return p.summary;
    var bits = [];
    if (p.aka) bits.push("Affectionately known as “" + p.aka + "”");
    if (p.address) bits.push("of " + p.address.replace(/^Formerly of /i, "formerly of "));
    var s = bits.join(" ");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) + "." : "Remembered with love by family and friends.";
  }

  // The same card the Obituaries page shows, drawn with the site's own CSS.
  function renderPreview(rec) {
    var dates = [rec.age ? "Aged " + rec.age : null, rec.diedText ? "Entered rest " + rec.diedText : null].filter(Boolean).join(" &middot; ") ||
      (rec.service ? "Service held " + esc(rec.service) : "");
    var src = crop.bitmap ? crop.previewURL : original && photoFile(original.slug) ? $("#current-img").src : null;
    var img = src
      ? '<span class="obituary-card-image"><img src="' + esc(src) + '" alt="" /></span>'
      : '<span class="obituary-card-image is-placeholder"><span class="monogram">' + esc(initials(rec.name || "?")) + "</span></span>";
    $("#preview").innerHTML = '<article class="obituary-card">' + img +
      '<div class="obituary-card-copy"><p class="obituary-dates">' + dates + "</p><h3>" + esc(rec.name || "Full name") + "</h3><p>" + esc(blurb(rec)) + "</p>" +
      '<div class="obituary-card-actions"><span class="link-arrow">View obituary <span>&#8594;</span></span>' +
      (rec.livestream ? '<span class="button wine card-watch">Watch <span>&#8599;</span></span>' : "") + "</div></div></article>";
  }

  function refresh() {
    // age follows the dates unless it was typed by hand
    if (F.born.value && F.died.value && !ageTouched) F.age.value = ageBetween(F.born.value, F.died.value);
    $("#age-hint").textContent = F.born.value && F.died.value ? "Worked out from the dates." : "";
    var rec = recordFromForm();
    renderPreview(rec);
    var c = check(rec);
    $("#problems").innerHTML =
      (c.errs.length ? '<ul class="errs">' + c.errs.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
      (c.warns.length ? '<ul class="warns">' + c.warns.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "");
    return { rec: rec, check: c };
  }

  /* ---------------- photo crop ---------------- */

  var OUT_W = 800, OUT_H = 1000; // 4:5, the shape of every tile on the site
  var crop = { bitmap: null, scale: 1, min: 1, x: 0, y: 0, previewURL: null };
  var canvas = $("#crop-canvas"), ctx = canvas.getContext("2d");

  function resetPhoto() {
    crop.bitmap = null;
    if (crop.previewURL) URL.revokeObjectURL(crop.previewURL);
    crop.previewURL = null;
    $("#crop").hidden = true;
    $("#current-photo").hidden = true;
    $("#photo-undo").hidden = true;
    $("#photo").value = "";
  }

  function clampCrop() {
    var w = crop.bitmap.width * crop.scale, h = crop.bitmap.height * crop.scale;
    crop.x = Math.min(0, Math.max(canvas.width - w, crop.x));
    crop.y = Math.min(0, Math.max(canvas.height - h, crop.y));
  }

  function drawCrop() {
    ctx.fillStyle = "#67182d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(crop.bitmap, crop.x, crop.y, crop.bitmap.width * crop.scale, crop.bitmap.height * crop.scale);
  }

  var previewTimer = null;
  function updateCropPreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(function () {
      exportCrop(0.8).then(function (blob) {
        if (crop.previewURL) URL.revokeObjectURL(crop.previewURL);
        crop.previewURL = URL.createObjectURL(blob);
        refresh();
      });
    }, 150);
  }

  function exportCrop(quality) {
    var out = document.createElement("canvas");
    out.width = OUT_W;
    out.height = OUT_H;
    var k = OUT_W / canvas.width;
    var o = out.getContext("2d");
    o.imageSmoothingQuality = "high";
    o.drawImage(crop.bitmap, crop.x * k, crop.y * k, crop.bitmap.width * crop.scale * k, crop.bitmap.height * crop.scale * k);
    return new Promise(function (resolve) { out.toBlob(resolve, "image/jpeg", quality || 0.86); });
  }

  function loadPhoto(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { alert("That file isn’t a photo."); return; }
    var opener = window.createImageBitmap ? createImageBitmap(file, { imageOrientation: "from-image" }) : Promise.reject();
    opener.catch(function () {
      // older browsers: decode through an <img>
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    }).then(function (bmp) {
      crop.bitmap = bmp;
      crop.min = Math.max(canvas.width / bmp.width, canvas.height / bmp.height);
      crop.scale = crop.min;
      $("#zoom").value = 1;
      // start centred across, near the top - where a face usually is
      crop.x = (canvas.width - bmp.width * crop.scale) / 2;
      crop.y = (canvas.height - bmp.height * crop.scale) * 0.2;
      clampCrop();
      drawCrop();
      $("#crop").hidden = false;
      $("#current-photo").hidden = true;
      $("#photo-undo").hidden = !(original && photoFile(original.slug));
      updateCropPreview();
    }).catch(function () { alert("That photo couldn’t be opened. Try a JPEG or PNG."); });
  }

  function zoomTo(factor, cx, cy) {
    var old = crop.scale;
    crop.scale = crop.min * Math.min(4, Math.max(1, factor));
    // keep the point under the finger (or the centre) still
    cx = cx == null ? canvas.width / 2 : cx;
    cy = cy == null ? canvas.height / 2 : cy;
    crop.x = cx - (cx - crop.x) * (crop.scale / old);
    crop.y = cy - (cy - crop.y) * (crop.scale / old);
    clampCrop();
    drawCrop();
    updateCropPreview();
  }

  (function wireCropGestures() {
    var pointers = new Map(), last = null, pinch = null;
    function toCanvas(e) {
      var r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
    }
    canvas.addEventListener("pointerdown", function (e) {
      if (!crop.bitmap) return;
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, toCanvas(e));
      last = toCanvas(e);
      if (pointers.size === 2) {
        var pts = Array.from(pointers.values());
        pinch = { d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), z: crop.scale / crop.min };
      }
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!pointers.has(e.pointerId)) return;
      var p = toCanvas(e);
      pointers.set(e.pointerId, p);
      if (pointers.size === 2 && pinch) {
        var pts = Array.from(pointers.values());
        var d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        zoomTo(pinch.z * (d / pinch.d), (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
        $("#zoom").value = crop.scale / crop.min;
        return;
      }
      crop.x += p.x - last.x;
      crop.y += p.y - last.y;
      last = p;
      clampCrop();
      drawCrop();
    });
    function end(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 1) last = Array.from(pointers.values())[0];
      if (!pointers.size) updateCropPreview();
    }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    // arrow keys nudge the photo, for anyone not using a mouse or finger
    canvas.tabIndex = 0;
    canvas.addEventListener("keydown", function (e) {
      if (!crop.bitmap) return;
      var step = e.shiftKey ? 20 : 6, k = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
      if (!k) return;
      e.preventDefault();
      crop.x += k[0];
      crop.y += k[1];
      clampCrop();
      drawCrop();
      updateCropPreview();
    });
  })();

  /* ---------------- publishing ---------------- */

  function confirmDialog(title, bodyHTML, okLabel) {
    var dlg = $("#confirm");
    $("#confirm-title").textContent = title;
    $("#confirm-body").innerHTML = bodyHTML;
    $("#confirm-ok").textContent = okLabel;
    // Esc closes without touching returnValue, so a stale "ok" would publish
    dlg.returnValue = "";
    return new Promise(function (resolve) {
      dlg.addEventListener("close", function onClose() {
        dlg.removeEventListener("close", onClose);
        resolve(dlg.returnValue === "ok");
      });
      dlg.showModal();
    });
  }

  function setStep(id, cls) { $("#step-" + id).className = cls || ""; }

  /* After the commit: wait for the "Rebuild site" run of that commit, then
     for the page itself to change on the live site. Read-only and without the
     key - the repository is public. */
  function followToLive(sha, slug, mode, beforeHTML, pageChanges) {
    var pageURL = "../obituaries/" + slug + ".html";
    setStep("save", "done");
    setStep("build", "doing");
    var started = Date.now();
    function pollBuild() {
      return gh("/repos/" + REPO + "/actions/runs?head_sha=" + sha + "&per_page=5", { auth: false }).then(function (r) {
        var run = (r.workflow_runs || []).find(function (w) { return w.name === "Rebuild site"; });
        if (run && run.status === "completed") return run.conclusion;
        if (Date.now() - started > 6 * 60 * 1000) return "slow";
        return wait(8000).then(pollBuild);
      }).catch(function () {
        if (Date.now() - started > 6 * 60 * 1000) return "slow";
        return wait(10000).then(pollBuild);
      });
    }
    function pollLive() {
      return fetch(pageURL + "?check=" + Date.now(), { cache: "no-store" }).then(function (res) {
        if (mode === "remove") return res.status === 404;
        if (!res.ok) return false;
        return res.text().then(function (t) { return mode === "add" || t !== beforeHTML; });
      }).catch(function () { return false; }).then(function (live) {
        if (live) return true;
        if (Date.now() - started > 8 * 60 * 1000) return false;
        return wait(8000).then(pollLive);
      });
    }
    return pollBuild().then(function (result) {
      if (result === "failure" || result === "cancelled") {
        setStep("build", "failed");
        $("#done-msg").textContent = "Your change is saved, but the pages didn’t rebuild. GitHub has emailed Tech Nova about it; nothing on the website has broken.";
        $("#done-msg").className = "pt-msg err";
        return;
      }
      if (result === "slow") {
        $("#done-msg").textContent = "Your change is saved. The pages are taking longer than usual to build; check the website again in a few minutes.";
        $("#done-msg").className = "pt-msg";
        return;
      }
      setStep("build", "done");
      setStep("live", "doing");
      // e.g. only the private note changed: the public page stays the same
      var check = pageChanges === false ? Promise.resolve(true) : pollLive();
      return check.then(function (live) {
        if (live) {
          setStep("live", "done");
          $("#done-eyebrow").textContent = "Done";
          $("#done-title").textContent = mode === "remove" ? "Removed from the website" : "It’s on the website";
          $("#done-msg").textContent = mode === "remove" ? "" : "If you had the page open already, reload it to see the change.";
          $("#done-msg").className = "pt-msg ok";
        } else {
          $("#done-msg").textContent = "Saved and built. It’s taking longer than usual to appear; check the page again in a few minutes.";
          $("#done-msg").className = "pt-msg";
        }
      });
    });
  }

  function publish(mode, rec, photoB64) {
    var slug = rec.slug;
    var verb = mode === "add" ? "Add" : mode === "remove" ? "Remove" : "Update";
    $("#done-eyebrow").textContent = "Publishing";
    $("#done-title").textContent = mode === "remove" ? "Removing " + rec.name : "Publishing " + rec.name;
    $("#done-msg").textContent = "";
    $("#view-page").hidden = true;
    ["save", "build", "live"].forEach(function (s) { setStep(s, ""); });
    setStep("save", "doing");
    show("done");

    var pageURL = "../obituaries/" + slug + ".html";
    var before = mode === "edit"
      ? fetch(pageURL + "?check=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).catch(function () { return ""; })
      : Promise.resolve("");

    return before.then(function (beforeHTML) {
      return commitChange({
        slug: slug,
        photoB64: photoB64,
        message: verb + " obituary: " + rec.name + "\n\nPublished from the upload portal.",
        apply: function (people, images) {
          var i = people.findIndex(function (p) { return p.slug === slug; });
          var drop = [];
          if (mode === "remove") {
            if (i !== -1) people.splice(i, 1);
            [".jpg", ".png", ".webp"].forEach(function (ext) { if (images.indexOf(slug + ext) !== -1) drop.push(IMG_DIR + "/" + slug + ext); });
          } else {
            if (i === -1) people.unshift(rec);
            else people[i] = rec;
            // a new photo is always .jpg; an older .png or .webp would win otherwise on some pages
            if (photoB64) [".png", ".webp"].forEach(function (ext) { if (images.indexOf(slug + ext) !== -1) drop.push(IMG_DIR + "/" + slug + ext); });
          }
          return drop;
        },
      }).then(function (res) {
        if (res.unchanged) {
          ["save", "build", "live"].forEach(function (s) { setStep(s, "done"); });
          $("#done-eyebrow").textContent = "Nothing to do";
          $("#done-title").textContent = "No changes to publish";
          $("#done-msg").textContent = "The website already shows exactly this.";
          return;
        }
        if (mode !== "remove") {
          $("#view-page").href = pageURL;
          $("#view-page").hidden = false;
        }
        // the note for Tech Nova is never rendered, so changing only that changes no page
        var strip = function (r) { var c = JSON.parse(JSON.stringify(r || {})); delete c.flag; return JSON.stringify(c); };
        var pageChanges = mode !== "edit" || !!photoB64 || strip(rec) !== strip(original);
        return followToLive(res.sha, slug, mode, beforeHTML, pageChanges);
      });
    }).catch(function (e) {
      setStep("save", "failed");
      $("#done-eyebrow").textContent = "Not published";
      $("#done-title").textContent = "That didn’t go through";
      $("#done-msg").textContent = friendlyError(e);
      $("#done-msg").className = "pt-msg err";
      if (e.status === 401) setTimeout(function () { needKey(friendlyError(e)); }, 4000);
    });
  }

  /* ---------------- wiring ---------------- */

  $("#connect-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var key = $("#key").value.trim();
    var msg = $("#connect-msg");
    if (!key) { msg.textContent = "Paste the access key first."; msg.className = "pt-msg err"; return; }
    msg.textContent = "Checking…";
    msg.className = "pt-msg";
    token = key;
    gh("/repos/" + REPO + "/contents/" + DATA_PATH + "?ref=" + BRANCH).then(function () {
      try { localStorage.setItem(KEY_STORE, key); } catch (err) { /* private mode: works until the tab closes */ }
      $("#key").value = "";
      msg.textContent = "";
      loadList("This device is connected.");
    }).catch(function (err) {
      token = null;
      msg.textContent = err.status === 401 ? "That key isn’t valid. Check it was copied in full, or ask Tech Nova for a new one." : friendlyError(err);
      msg.className = "pt-msg err";
    });
  });

  $("#signout").addEventListener("click", function () {
    if (!confirm("Sign this device out of the portal? You’ll need the access key to connect it again.")) return;
    needKey("");
    $("#connect-msg").textContent = "This device is signed out.";
    $("#connect-msg").className = "pt-msg ok";
  });

  $("#search").addEventListener("input", renderList);
  $("#add-new").addEventListener("click", function () { openEditor(null); });
  $("#list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-edit]");
    if (!b) return;
    var p = state.people.find(function (x) { return x.slug === b.getAttribute("data-edit"); });
    if (p) openEditor(p);
  });
  document.addEventListener("click", function (e) {
    var g = e.target.closest("[data-go]");
    if (!g) return;
    if (g.getAttribute("data-go") === "list") {
      if (!$("#view-edit").hidden && !confirm("Leave without publishing? What you typed here will be lost.")) return;
      loadList();
    }
  });

  $("#edit-form").addEventListener("input", function (e) {
    if (e.target === F.age) ageTouched = F.age.value !== "";
    if (e.target === F["ls-provider"] || e.target === F["ls-url"] || e.target === F["svc-date"]) syncLivestream();
    if (e.target.id === "zoom") { zoomTo(Number(e.target.value)); return; }
    if (e.target.id === "photo") return;
    refresh();
  });
  $("#edit-form").addEventListener("change", function (e) {
    if (e.target.id === "photo") loadPhoto(e.target.files[0]);
    if (e.target === F["ls-provider"]) { syncLivestream(); refresh(); }
  });
  $("#kd34-live").addEventListener("click", function () {
    F["ls-url"].value = KD34_LIVE;
    syncLivestream();
    refresh();
  });
  $("#photo-undo").addEventListener("click", function () {
    resetPhoto();
    if (original && photoFile(original.slug)) $("#current-photo").hidden = false;
    refresh();
  });

  $("#edit-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var r = refresh();
    if (r.check.errs.length) {
      $("#problems").scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    var rec = r.rec;
    var body = "<p><strong>" + esc(rec.name) + "</strong><br/>" + esc(rec.service || "") + (rec.venue ? "<br/>" + esc(rec.venue) : "") + "</p>" +
      (r.check.warns.length ? "<p>Before you publish, note:</p><ul>" + r.check.warns.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>" : "") +
      "<p>It will be live on the website in about two minutes.</p>";
    confirmDialog(original ? "Publish these changes?" : "Publish this obituary?", body, "Publish").then(function (ok) {
      if (!ok) return;
      var photo = crop.bitmap
        ? exportCrop(0.86).then(function (blob) { return blob.arrayBuffer(); }).then(function (buf) { return b64FromBytes(new Uint8Array(buf)); })
        : Promise.resolve(null);
      photo.then(function (b64) { publish(original ? "edit" : "add", rec, b64); });
    });
  });

  $("#remove").addEventListener("click", function () {
    if (!original) return;
    confirmDialog(
      "Remove " + original.name + "?",
      "<p>The obituary page, its photo and its card will come off the website within about two minutes.</p><p>Tech Nova can restore it from the website’s history if this is a mistake.</p>",
      "Remove it"
    ).then(function (ok) { if (ok) publish("remove", original, null); });
  });

  window.addEventListener("beforeunload", function (e) {
    if (!$("#view-edit").hidden) { e.preventDefault(); e.returnValue = ""; }
  });

  if (token) loadList(); else show("connect");
})();
