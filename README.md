# Hype Strategies — Attendance Tracker

A one-page attendance tool: employees select their name, clock in in the
morning, and clock out in the evening with a short work update. Every entry
lands live in a Google Sheet, which HR can open, filter, or download as an
Excel file (`.xlsx`) at any time.

**No traditional backend or database to host.** The website is a single
static HTML file (works on GitHub Pages, Netlify, or any web host). The
"backend" is a free Google Apps Script attached to a Google Sheet — Google
runs and hosts that part for you.

```
hype-strategies/
├── index.html   ← the website (deploy this)
├── Code.gs      ← paste into Google Apps Script (not deployed as a website)
└── README.md    ← this file
```

---

## 1. Connect the Google Sheet (do this first)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new
   sheet. Name it something like **"Hype Strategies — Attendance"**.
2. In the sheet, go to **Extensions → Apps Script**.
3. Delete any placeholder code in the editor, then paste in the entire
   contents of `Code.gs` from this project.
4. Click the **Save** icon (or `Ctrl/Cmd + S`).
5. Click **Deploy → New deployment**.
6. Next to "Select type," click the gear icon and choose **Web app**.
7. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
   *(If your company uses Google Workspace, you can instead choose
   "Anyone within [your domain]" — see the security note below.)*
8. Click **Deploy**, then **Authorize access** and approve the permissions
   Google asks for (this is your own script, running under your own
   account — the warning screen is normal for personal Apps Script projects).
9. Copy the **Web app URL** it gives you. It looks like:
   `https://script.google.com/macros/s/XXXXXXXXXXXX/exec`

A sheet tab named **Attendance** will be created automatically the first
time someone clocks in — you don't need to add headers yourself.

> **Important:** if you edit `Code.gs` later, changes won't go live until
> you create a new version: **Deploy → Manage deployments → Edit (pencil
> icon) → Version: New version → Deploy**.

---

## 2. Connect the website to the sheet

Open `index.html` in any text editor and find the `CONFIG` block near the
top of the `<script>` section:

```js
const CONFIG = {
  APPS_SCRIPT_URL: "PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE",
  WORKDAY_START_HOUR: 9,
  WORKDAY_END_HOUR: 19,
  MIN_UPDATE_LENGTH: 15
};
```

- Paste the Web App URL from step 1 into `APPS_SCRIPT_URL`.
- That's the only line you need to touch. Employees type their own name
  and work email each time — there's no roster to maintain.

Save the file.

---

## 3. Deploy the website

Any static host works. Two easy options:

**GitHub Pages**
1. Create a new GitHub repository and upload `index.html` to it.
2. Go to **Settings → Pages**, set the source branch to `main` and the
   folder to `/ (root)`, then save.
3. GitHub gives you a live URL within a minute or two.

**Netlify**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the folder containing `index.html` onto the page.
3. Netlify gives you a live URL immediately, and lets you add a custom
   domain later.

That's it — no build step, no server to manage.

---

## 4. How HR views the data

- Open the Google Sheet any time — new rows appear within a second or two
  of an employee clocking in or out.
- To get an Excel file: **File → Download → Microsoft Excel (.xlsx)**.
- Filter, sort, or pivot the **Attendance** tab like any normal spreadsheet
  (e.g. filter by date range, or by employee, or flag missing logouts).

Columns: `Date, Name, Email, Login Time, Logout Time, Work Update, Status,
Last Updated`.

---

## 5. Notes on how it works

- Each employee gets one row per day. Clocking in creates the row; clocking
  out later that day fills in the rest of it (found by matching email +
  date), rather than creating a duplicate row.
- Employees type their name and work email each visit (the site remembers
  their own last entry in their own browser, for convenience only — it
  doesn't share that between devices or people).
- The site checks the sheet (not just the browser) once a valid name and
  email are entered, so it works correctly even if someone clocks in on
  one device and clocks out on another.
- A work update is required (minimum 15 characters, adjustable in
  `CONFIG.MIN_UPDATE_LENGTH`) before a clock-out is accepted.
- There's no login/password system — anyone with the site link can type
  any name and email. This keeps things simple for a small team, but see
  the security note below if you want it locked down.

---

## 6. Security note (optional, recommended as you grow)

This setup trusts whoever has the site link. For a small trusted team
that's usually fine. If you want more control:

- If your company uses **Google Workspace**, redeploy the Apps Script with
  **"Who has access: Anyone within [your domain]"** instead of "Anyone" —
  this restricts submissions to people signed into a company Google
  account (you'd combine this with Google Sign-In on the front end, which
  is a further step beyond this starter project).
- Alternatively, put the site behind your existing company VPN or intranet
  rather than a public URL.

---

## 7. Troubleshooting

- **"This site isn't connected to a spreadsheet yet" banner** — you
  haven't pasted a real URL into `CONFIG.APPS_SCRIPT_URL` yet, or it still
  contains `PASTE_YOUR`.
- **Clock in/out does nothing / network error toast** — double-check the
  Web App is deployed with "Who has access: Anyone," and that you copied
  the full URL ending in `/exec` (not `/dev`).
- **Changes to Code.gs don't seem to apply** — you need to deploy a new
  version (see the note at the end of step 1), not just save the script.
