document.addEventListener("DOMContentLoaded", function () {
  var menuButton = document.querySelector(".menu-button");
  var mobileMenu = document.getElementById("mobile-menu");

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileMenu.setAttribute("aria-hidden", isOpen ? "false" : "true");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      });
    });
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(contactForm);
      var message = [
        "Hello Sterling Funeral Services, I would like to request a consultation.",
        "Name: " + (data.get("name") || ""),
        "Phone: " + (data.get("phone") || ""),
        "Preferred contact: " + (data.get("preference") || ""),
        "How can you help: " + (data.get("message") || ""),
      ].join("\n");
      window.open("https://wa.me/12462349195?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
    });
  }

  var casketGrid = document.querySelector(".casket-grid");
  var lightbox = document.getElementById("casket-lightbox");
  if (casketGrid && lightbox) {
    var cards = Array.prototype.slice.call(casketGrid.querySelectorAll(".casket-card"));
    var caskets = cards.map(function (card) {
      var img = card.querySelector(".casket-image img");
      return {
        images: card.getAttribute("data-images").split("|"),
        alt: img.getAttribute("alt"),
        name: card.querySelector("h3").textContent,
        detail: card.querySelector(".casket-info p").textContent,
        wa: card.querySelector(".casket-info a").getAttribute("href"),
      };
    });

    var lbImg = lightbox.querySelector(".lightbox-image img");
    var lbName = lightbox.querySelector(".lightbox-name");
    var lbDetail = lightbox.querySelector(".lightbox-detail");
    var lbWa = lightbox.querySelector(".lightbox-wa");
    var lbPrev = lightbox.querySelector(".lightbox-prev");
    var lbNext = lightbox.querySelector(".lightbox-next");
    var lbCounter = lightbox.querySelector(".lightbox-counter");
    var currentCasket = 0;
    var currentPhoto = 0;

    function showPhoto() {
      var c = caskets[currentCasket];
      lbImg.setAttribute("src", c.images[currentPhoto]);
      lbImg.setAttribute("alt", c.alt);
      var multi = c.images.length > 1;
      lbPrev.style.display = multi ? "" : "none";
      lbNext.style.display = multi ? "" : "none";
      lbCounter.style.display = multi ? "" : "none";
      if (multi) lbCounter.textContent = (currentPhoto + 1) + " / " + c.images.length;
    }

    function openLightbox(index) {
      currentCasket = index;
      currentPhoto = 0;
      var c = caskets[currentCasket];
      lbName.textContent = c.name;
      lbDetail.textContent = c.detail;
      lbWa.setAttribute("href", c.wa);
      showPhoto();
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function prevPhoto() {
      var c = caskets[currentCasket];
      currentPhoto = (currentPhoto - 1 + c.images.length) % c.images.length;
      showPhoto();
    }

    function nextPhoto() {
      var c = caskets[currentCasket];
      currentPhoto = (currentPhoto + 1) % c.images.length;
      showPhoto();
    }

    cards.forEach(function (card, index) {
      var imgWrap = card.querySelector(".casket-image");
      imgWrap.setAttribute("role", "button");
      imgWrap.setAttribute("tabindex", "0");
      imgWrap.setAttribute("aria-label", "View larger image of " + caskets[index].name);
      imgWrap.addEventListener("click", function () {
        openLightbox(index);
      });
      imgWrap.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openLightbox(index);
        }
      });
    });

    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-backdrop").addEventListener("click", closeLightbox);
    lbPrev.addEventListener("click", prevPhoto);
    lbNext.addEventListener("click", nextPhoto);

    document.addEventListener("keydown", function (event) {
      if (!lightbox.classList.contains("open")) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") prevPhoto();
      if (event.key === "ArrowRight") nextPhoto();
    });
  }
});

/* Condolence form, and the testimonial form that reuses it.

   Condolences go straight onto the page. They are stored in a Google Sheet
   in Sterling's own account by the Apps Script in condolences/Code.gs, which
   turns away spam (links, floods, double posts), emails each new message to
   Sterling, and serves the page's messages back to every visitor. Sterling
   takes one down by setting "Show on website" to no in the Sheet. The
   hand-added messages in data/condolences.json are built into the page and
   show beneath the live ones.

   Testimonials are not published automatically: they are only emailed, and
   reach the page once copied into data/testimonials.json by hand.

   If the request fails for any reason the message is NOT lost - we fall back
   to opening the visitor's mail app with everything filled in. That fallback
   is the whole reason this is worth doing over a plain mailto: on a phone,
   mailto is a jarring hand-off, and on a machine with no mail client
   configured it does nothing at all. */
document.addEventListener("DOMContentLoaded", function () {
  var CONDOLENCE_ENDPOINT = "https://formsubmit.co/ajax/sterlingfuneralservices@gmail.com";
  // From js/live-config.js, loaded only on obituary pages. While it is
  // absent or empty, condolences fall back to email-only.
  var cfg = window.STERLING_LIVE || {};
  var LIVE_URL = cfg.url || "";

  var form = document.querySelector(".condolence-form");
  if (!form) return;

  var slug = form.getAttribute("data-slug") || "";
  var live = !!LIVE_URL && !form.getAttribute("data-kind");

  var section = form.closest(".condolence-inner") || form.parentNode;
  function listEl() {
    var list = section.querySelector(".condolence-list");
    if (!list) {
      list = document.createElement("ul");
      list.className = "condolence-list";
      var empty = section.querySelector(".condolence-empty");
      if (empty) empty.parentNode.replaceChild(list, empty);
      else section.insertBefore(list, form);
    }
    return list;
  }
  // textContent throughout: visitors' words are never parsed as HTML.
  function renderItem(c, prepend) {
    var li = document.createElement("li");
    li.className = "condolence-live";
    var q = document.createElement("blockquote");
    q.textContent = c.message;
    var by = document.createElement("p");
    by.className = "condolence-by";
    by.textContent = c.name;
    if (c.relationship) {
      var span = document.createElement("span");
      span.textContent = "· " + c.relationship;
      by.appendChild(document.createTextNode(" "));
      by.appendChild(span);
    }
    li.appendChild(q);
    li.appendChild(by);
    var list = listEl();
    if (prepend) list.insertBefore(li, list.firstChild);
    else list.appendChild(li);
  }

  if (live) {
    fetch(LIVE_URL + "?slug=" + encodeURIComponent(slug))
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (body) {
        var rows = (body && body.items) || [];
        // newest first, above the hand-added messages; walk backwards so
        // each prepend keeps that order
        for (var i = rows.length - 1; i >= 0; i--) renderItem(rows[i], true);
      })
      .catch(function () {});
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var person = form.getAttribute("data-person") || "";
    var note = form.querySelector(".form-note");
    var button = form.querySelector("button[type=submit]");
    // The testimonials page reuses this form, so the wording is not hardcoded:
    // "Condolence for Sterling Funeral Services" would be the wrong subject.
    var kind = form.getAttribute("data-kind") || "Condolence";
    var subject = kind + " for " + person;
    var thanks =
      form.getAttribute("data-thanks") ||
      "Your message has been sent to Sterling, who will pass it to the family. " +
        "It will appear on this page once they have read it.";

    var name = (data.get("name") || "").toString().trim();
    var relationship = (data.get("relationship") || "").toString().trim();
    var email = (data.get("email") || "").toString().trim();
    var message = (data.get("message") || "").toString().trim();
    if (!name || !message) return;

    function done(text) {
      form.classList.add("is-sent");
      form.innerHTML = '<p class="eyebrow">Thank you</p><p>' + (text || thanks) + "</p>";
      form.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    // Honeypot. A bot fills it, a person never sees it: accept and drop.
    if ((data.get("website") || "").toString().trim()) {
      done();
      return;
    }

    function fallbackToMail() {
      var body = [
        subject,
        "",
        "From: " + name,
        "Relationship: " + (relationship || "not given"),
        "Email: " + (email || "not given"),
        "",
        message,
      ].join("\n");
      window.location.href =
        "mailto:sterlingfuneralservices@gmail.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
      if (note) note.textContent = "Your email app should now be open with the message ready to send.";
    }

    function sendEmail() {
      return fetch(CONDOLENCE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: name,
          relationship: relationship,
          email: email,
          message: message,
          // which page it came from
          person: person,
          slug: slug,
          _subject: subject,
          _template: "table",
          _captcha: "false",
        }),
      })
        // FormSubmit answers 200 OK even when it has NOT delivered - an
        // unactivated address comes back as {"success":"false"}. Checking only
        // the status code told families their condolence had been sent when it
        // had gone nowhere, so the body is what decides.
        .then(function (r) {
          if (!r.ok) throw new Error("http " + r.status);
          return r.json().then(
            function (body) {
              if (String(body && body.success) !== "true") {
                throw new Error(String((body && body.message) || "not delivered"));
              }
            },
            function () {
              // no JSON back: assume the worst
              throw new Error("unreadable response");
            }
          );
        });
    }

    var label = button ? button.innerHTML : "";
    if (button) { button.disabled = true; button.textContent = live ? "Posting…" : "Sending…"; }
    function reset() {
      if (button) { button.disabled = false; button.innerHTML = label; }
    }

    if (!live) {
      sendEmail().then(function () { done(); }, function () { reset(); fallbackToMail(); });
      return;
    }

    // text/plain keeps this a "simple" request: Apps Script cannot answer the
    // CORS preflight that application/json would trigger. The script parses
    // the body as JSON either way, and emails Sterling itself.
    fetch(LIVE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        slug: slug,
        person: person,
        name: name,
        relationship: relationship,
        email: email,
        message: message,
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.json().then(
          function (body) {
            if (!body || body.ok !== true) throw new Error(String((body && body.error) || "not saved"));
          },
          function () { throw new Error("unreadable response"); }
        );
      })
      .then(
        function () {
          renderItem({ name: name, relationship: relationship, message: message }, true);
          done("Your message is now on this page, and Sterling will pass it to the family.");
        },
        function (err) {
          reset();
          var why = String(err && err.message);
          // The script's spam checks: tell the visitor what to change
          // rather than dumping them into their mail app.
          if (/^links$/.test(why)) {
            if (note) note.textContent = "Please remove any web addresses from your message and try again.";
          } else if (/duplicate/.test(why)) {
            done("Your message is already on this page. Thank you.");
          } else if (/too many/.test(why)) {
            if (note) note.textContent = "Many messages have just been posted on this page. Please try again in a few minutes.";
          } else if (/length/.test(why)) {
            if (note) note.textContent = "Please keep your name under 80 characters and your message under 2,000.";
          } else {
            fallbackToMail();
          }
        }
      );
  });
});
