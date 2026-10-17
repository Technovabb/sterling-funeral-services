# Sterling Funeral Services website — instructions for AI assistants

These rules apply to any assistant working on this site: ChatGPT (Codex), which
reads this file as `AGENTS.md`, and Claude, which reads it through `CLAUDE.md`.

This is the public website of Sterling Funeral Services, a funeral home in
Barbados: https://www.sterlingfuneralservices.com. It is plain HTML, CSS and
JavaScript served by GitHub Pages from the `main` branch of this repository.
It is maintained by Tech Nova (Juwan Prescod) for Sterling.

## Who you are working for

The person asking is usually **Sheradan Lewis, Sterling's funeral director**,
not a developer. Talk to him in plain words: no file names, commands or jargon
unless he asks. Say what will change on the website and what visitors will see.
When you open a pull request, write its title and description for him: one
or two sentences on what changes on the site, and a link to the page.

Families read this site at the worst moment of their lives. A wrong name,
date or service time is a serious error. **Before publishing anything about a
person, repeat the name, the date of passing and the service date and time
back to him and check them.**

## How the site is built

Most pages are generated. **Never edit these by hand** — change the data and
rebuild:

| Generated file | Comes from |
| --- | --- |
| `obituaries/*.html` (one per person), the grid in `obituaries.html` | `data/obituaries.json` |
| `livestreams.html` (the "Funerals" page), the "Upcoming funerals" band in `index.html` | the `service` and `livestream` fields in `data/obituaries.json` |
| `testimonials.html` | `data/testimonials.json` |
| `sitemap.xml`, `robots.txt`, the `?v=` stamps on every image/CSS/JS link | the build |

Rebuild with `node tools/build-obituaries.js` (no npm install needed) and read
its output: it checks every weekday against the calendar and lists records
with a `flag` (a note for Tech Nova that is never shown on the site). The
GitHub Action in `.github/workflows/rebuild.yml` also rebuilds on every push
to `main` and every night, so a change merged without rebuilding still goes
live correctly — but always rebuild yourself so you can check the output.

The hand-written pages (`index.html` outside the upcoming markers, `about`,
`services`, `caskets`, `pre-planning`, `contact`) are edited directly. The
navigation is duplicated in each of them and in `NAV_ITEMS` in the build
script; change all of them together.

## Obituaries

Sheradan normally adds and edits obituaries himself in the **upload portal**,
https://www.sterlingfuneralservices.com/portal/ (code: `portal/index.html`,
`js/portal.js`, `css/portal.css`). Use it as the reference for what a record
looks like. If you add one by hand, match the existing records exactly:

- `slug`: lower-case name, hyphens, accents and apostrophes removed
  (`grahame-king-nee-gibbs`). Never change an existing slug — links to it are
  shared on Facebook and WhatsApp.
- `died` as `YYYY-MM-DD`, and `diedText` as `Thursday, September 17th, 2026`.
- `service` as `Saturday, October 17th, 2026 at 10:00am`. **Compute the
  weekday from the date; never type it.**
- `family`: one relationship per line, as in the newspaper notice.
- `serviceNotes`: viewing times, flower deliveries, mourning colours.
- `livestream`: `{ "label": "KD34 Streaming Services", "url": "…" }`. Before a
  service, KD34's live page (`https://www.youtube.com/@kd34streamingservices42/live`)
  is fine; afterwards replace it with the recording's own address. **Open
  every livestream link and follow it to the video** before publishing — a
  printed link has been wrong before.
- JSON is written with `JSON.stringify(records, null, 1)` plus a final newline.

**Photos** go in `images/obituaries/<slug>.jpg`, cropped to a **4:5**
head-and-shoulders portrait (800×1000 is ideal). A full-length or group photo
must be cropped so the face is about the size of the others. If the photo
shows other people, crop them out.

## Things that must never be published

- **Identity documents, death certificates, medical certificates, notices of
  death, warrants to bury, hospital letters, bills or receipts** — even if one
  is sent as "the photo". Sterling's case files contain all of these. Only
  obituary text, hymn-sheet details and portraits of the person are
  publishable. If you are unsure what an image is, ask.
- Anything a family has not agreed to. Condolences and testimonials are
  published word for word, only as written by the family, never invented,
  shortened or "improved".

## Condolences and testimonials

- Condolences on obituary pages post live through a Google Sheet in Sterling's
  own Google account (`condolences/Code.gs`, `js/live-config.js`). To hide one,
  Sheradan sets "Show on website" to `no` in the Sheet — no code change.
  Messages from cards or emails can be added by hand to
  `data/condolences.json`. Details: `condolences/SETUP.md`.
- Testimonials: add to `entries` in `data/testimonials.json`, word for word,
  with how the family signed it in `from`. Blank lines in `message` become
  paragraphs.

## Check before you finish

1. `node tools/build-obituaries.js` runs cleanly and says every weekday agrees
   with the calendar.
2. Open the changed page in a browser if you can, on a phone width too.
3. Tell Sheradan in a sentence what changed, and that it will be live about
   two minutes after the change is merged.

Anything about the domain, DNS, email, GitHub settings or portal access keys
belongs to Tech Nova: say so rather than changing it.
