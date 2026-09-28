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

/* Condolence form. Posts to a Google Apps Script web app which emails Sterling
   and logs to a Sheet; approved messages are added to data/condolences.json by
   hand and appear on the next build. Until the script is deployed, SCRIPT_URL
   is empty and we fall back to a pre-filled email so no message is ever lost. */
document.addEventListener("DOMContentLoaded", function () {
  var CONDOLENCE_SCRIPT_URL = "";

  var form = document.querySelector(".condolence-form");
  if (!form) return;

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
    var message = (data.get("message") || "").toString().trim();
    if (!name || !message) return;

    function done() {
      form.classList.add("is-sent");
      form.innerHTML = '<p class="eyebrow">Thank you</p><p>' + thanks + "</p>";
      form.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    if (!CONDOLENCE_SCRIPT_URL) {
      // not deployed yet - hand the message to the visitor's mail app instead
      var body = [
        subject,
        "",
        "From: " + name,
        "Relationship: " + (data.get("relationship") || "not given"),
        "Email: " + (data.get("email") || "not given"),
        "",
        message,
      ].join("\n");
      window.location.href =
        "mailto:sterlingfuneralservices@gmail.com?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);
      if (note) note.textContent = "Your email app should now be open with the message ready to send.";
      return;
    }

    if (button) { button.disabled = true; button.textContent = "Sending…"; }
    data.append("person", person);
    data.append("slug", form.getAttribute("data-slug") || "");
    fetch(CONDOLENCE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams(data),
    })
      .then(done)
      .catch(function () {
        if (button) { button.disabled = false; button.textContent = "Send your message"; }
        if (note) note.textContent = "That did not send. Please try again, or email sterlingfuneralservices@gmail.com.";
      });
  });
});
