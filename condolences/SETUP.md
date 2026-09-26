# Condolences — how it works and how to finish setting it up

Families can leave a message on any obituary page. Every message reaches
Sheradan; he passes them all to the family, and chooses which ones also appear
on the website.

Nothing a visitor writes is published automatically. That is deliberate — an
open comment box on a grieving family's page attracts spam, and occasionally
worse.

## The flow

1. A visitor fills in the form on an obituary page.
2. The form posts to a Google Apps Script web app.
3. The script **emails Sterling** and **appends a row to a Google Sheet**.
4. Sheradan passes the message to the family.
5. To publish it, the message is copied into `data/condolences.json` and the
   site is rebuilt.

Until step 2 is set up, the form falls back to opening the visitor's email app
with the message pre-filled, so **no message is ever lost**.

## Setting up the Apps Script (about ten minutes, once)

1. Create a Google Sheet — call it *Sterling condolences*.
2. In that Sheet: **Extensions → Apps Script**.
3. Delete the placeholder code, paste in everything from `Code.gs`, and save.
4. **Deploy → New deployment → Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
5. Authorise when prompted (it will warn the app is unverified — that is normal
   for your own script).
6. Copy the **web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy.../exec`
7. Paste it into `js/main.js`, into the empty `CONDOLENCE_SCRIPT_URL`:

   ```js
   var CONDOLENCE_SCRIPT_URL = "https://script.google.com/macros/s/AKfy.../exec";
   ```

8. Commit and push. The form then posts silently instead of opening an email.

Test it once from the live site and check both the email and the Sheet.

## Publishing a message

Open `data/condolences.json` and add the message under that person's slug — the
slug is the filename of their page, so `obituaries/naomi-dyall.html` is
`naomi-dyall`:

```json
{
  "naomi-dyall": [
    {
      "name": "Marcia Alleyne",
      "relationship": "Neighbour",
      "date": "2026-09-26",
      "message": "Miss Olga was kind to every child on the street."
    }
  ]
}
```

Then rebuild:

```bash
node tools/build-obituaries.js
```

Delete the `_readme` and `_example` keys once there are real entries — the build
ignores any key starting with an underscore, so they are harmless either way.

`date` is not displayed; it is there so you can see when a message arrived.

## Things worth knowing

- **Check what you publish.** The Sheet keeps everything; the website shows only
  what is copied across. That is the whole safeguard, so do not automate it.
- The form carries a hidden honeypot field. Bots fill it, people do not, and
  anything that fills it is silently accepted and dropped.
- Messages over 4,000 characters are rejected.
- A visitor's email address is optional and is **never shown on the page** — it
  only reaches Sterling, so the family can reply.
- Every page also offers a private route: an email link that publishes nothing.
