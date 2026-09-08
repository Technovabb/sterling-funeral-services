# Sterling Funeral Services

Static website for Sterling Funeral Services, a funeral home serving families across Barbados.

## Structure

Plain HTML, CSS and JavaScript — no build step, no framework, no backend required.

```
index.html          Home
about.html           About Sterling
services.html        Funeral services
caskets.html          Casket collection
pre-planning.html     Pre-planning
obituaries.html        Obituaries
contact.html          Contact / consultation request
css/styles.css        Shared stylesheet
js/main.js            Mobile menu, contact form, footer year
images/                Site images
```

## Running locally

Open `index.html` directly in a browser, or serve the folder with any static file server, e.g.:

```bash
npx serve .
```

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In the repo settings, enable **Pages** and set the source to the `main` branch, root folder.
3. The site will be published at `https://<username>.github.io/<repo>/`.

## Custom domain

The site is served at **https://www.sterlingfuneralservices.com**.

`CNAME` in the repository root is what tells GitHub Pages the domain. The DNS
records live at Namecheap and are not managed from here — see the domain
section of the handover notes.

Canonical URLs and `og:image` are absolute and hardcode the domain, because
Facebook and WhatsApp ignore a relative `og:image` and would show shared
obituaries with no photograph. If the domain ever changes, update:

- `CNAME`
- the `<link rel="canonical">` and `og:` tags in each root `.html`
- `SITE` at the top of `tools/build-obituaries.js`, then re-run it
