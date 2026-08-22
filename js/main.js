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
        src: img.getAttribute("src"),
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
    var lbCounter = lightbox.querySelector(".lightbox-counter");
    var currentIndex = 0;

    function showCasket(index) {
      currentIndex = (index + caskets.length) % caskets.length;
      var c = caskets[currentIndex];
      lbImg.setAttribute("src", c.src);
      lbImg.setAttribute("alt", c.alt);
      lbName.textContent = c.name;
      lbDetail.textContent = c.detail;
      lbWa.setAttribute("href", c.wa);
      lbCounter.textContent = (currentIndex + 1) + " / " + caskets.length;
    }

    function openLightbox(index) {
      showCasket(index);
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
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
    lightbox.querySelector(".lightbox-prev").addEventListener("click", function () {
      showCasket(currentIndex - 1);
    });
    lightbox.querySelector(".lightbox-next").addEventListener("click", function () {
      showCasket(currentIndex + 1);
    });

    document.addEventListener("keydown", function (event) {
      if (!lightbox.classList.contains("open")) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showCasket(currentIndex - 1);
      if (event.key === "ArrowRight") showCasket(currentIndex + 1);
    });
  }
});
