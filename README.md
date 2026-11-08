# Student Activity Scheduler

Static form hosted on GitHub Pages. Submissions are saved to a Google Sheet through a small Google Apps Script web app.

## One-time backend setup

1. Create a new Google Sheet.
2. Rename (or add) a tab called **AllowedIDs** and paste all valid 9-digit student IDs into column A (one per row). Format column A as plain text so leading zeros are kept. If this tab is empty or missing, any 9-digit ID is accepted.
3. In the Sheet: **Extensions → Apps Script**. Replace the contents of `Code.gs` with [`apps-script/Code.gs`](apps-script/Code.gs) and save.
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Authorize when prompted, then copy the **Web app URL**.
6. In `index.html`, set `SUBMIT_URL` to that URL, commit and push. GitHub Pages will update.

Responses appear in a **Responses** tab (created on first submission): one row per student, with the latest submission replacing any earlier one.

If you later change `Code.gs`, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.
